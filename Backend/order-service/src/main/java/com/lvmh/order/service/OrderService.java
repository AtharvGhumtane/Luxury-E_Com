package com.lvmh.order.service;

import com.lvmh.order.client.InventoryClient;
import com.lvmh.order.dto.*;
import com.lvmh.order.event.OrderCreatedEvent;
import com.lvmh.order.kafka.OrderEventProducer;
import com.lvmh.order.model.Order;
import com.lvmh.order.model.OrderItem;
import com.lvmh.order.model.OrderStatus;
import com.lvmh.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final InventoryClient inventoryClient;
    private final OrderEventProducer eventProducer;

    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(UUID userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to this user");
        }
        return mapToResponse(order);
    }

    /**
     * Place order — Saga Entry Point:
     * 1. Read cart from Redis
     * 2. Validate cart is not empty
     * 3. [Sync OpenFeign] Check stock for each item
     * 4. Persist order (PENDING status)
     * 5. Clear cart
     * 6. [Async Kafka] Publish order.created → Inventory reserves stock, Payment initiates
     */
    @Transactional
    public OrderResponse placeOrder(UUID userId, String email, PlaceOrderRequest request) {
        List<CartItem> cartItems = cartService.getCartItems(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        // Step 3: Synchronous stock check via OpenFeign
        for (CartItem item : cartItems) {
            StockCheckResponse stockCheck = inventoryClient.checkAvailability(
                    item.getProductId(), item.getQuantity());
            if (!stockCheck.isAvailable()) {
                throw new IllegalArgumentException(
                        "Insufficient stock for product: " + item.getProductId() +
                        " (requested: " + item.getQuantity() +
                        ", available: " + stockCheck.getAvailableQuantity() + ")");
            }
        }

        // Step 4: Persist order
        BigDecimal totalAmount = cartItems.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = Order.builder()
                .userId(userId)
                .userEmail(email)
                .status(OrderStatus.PENDING)
                .totalAmount(totalAmount)
                .shippingStreet(request.getShippingStreet())
                .shippingCity(request.getShippingCity())
                .shippingCountry(request.getShippingCountry())
                .shippingPostalCode(request.getShippingPostalCode())
                .notes(request.getNotes())
                .build();

        List<OrderItem> orderItems = cartItems.stream()
                .map(cartItem -> OrderItem.builder()
                        .order(order)
                        .productId(cartItem.getProductId())
                        .productName(cartItem.getProductName())
                        .productSku(cartItem.getProductSku())
                        .quantity(cartItem.getQuantity())
                        .unitPrice(cartItem.getUnitPrice())
                        .lineTotal(cartItem.getUnitPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                        .build())
                .collect(Collectors.toList());
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);

        // Step 6: Publish Saga start event
        List<OrderCreatedEvent.OrderItem> eventItems = cartItems.stream()
                .map(i -> OrderCreatedEvent.OrderItem.builder()
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .unitPrice(i.getUnitPrice())
                        .quantity(i.getQuantity())
                        .build())
                .collect(Collectors.toList());

        eventProducer.publishOrderCreated(OrderCreatedEvent.builder()
                .orderId(savedOrder.getId())
                .userId(userId)
                .userEmail(email)
                .totalAmount(totalAmount)
                .items(eventItems)
                .shippingStreet(savedOrder.getShippingStreet())
                .shippingCity(savedOrder.getShippingCity())
                .shippingCountry(savedOrder.getShippingCountry())
                .shippingPostalCode(savedOrder.getShippingPostalCode())
                .notes(savedOrder.getNotes())
                .build());

        log.info("Order placed: {} for userId={}, total={}", savedOrder.getId(), userId, totalAmount);
        return mapToResponse(savedOrder);
    }

    /**
     * Cancel order — Saga Compensation:
     * Publishes order.cancelled → Inventory releases stock, Notification sends email
     */
    @Transactional
    public OrderResponse cancelOrder(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to this user");
        }

        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Cannot cancel order with status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order updated = orderRepository.save(order);

        // Publish Saga compensation event
        List<OrderCreatedEvent.OrderItem> eventItems = order.getItems().stream()
                .map(i -> OrderCreatedEvent.OrderItem.builder()
                        .productId(i.getProductId())
                        .quantity(i.getQuantity())
                        .build())
                .collect(Collectors.toList());

        eventProducer.publishOrderCancelled(OrderCreatedEvent.builder()
                .orderId(orderId)
                .userId(userId)
                .userEmail(order.getUserEmail())
                .items(eventItems)
                .build());

        cartService.clearCart(userId);
        log.info("Order cancelled: {}", orderId);
        return mapToResponse(updated);
    }

    /**
     * Called by Kafka consumer when payment.completed is received.
     * Updates order status to PAID.
     */
    @Transactional
    public void markOrderPaid(UUID orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
            log.info("Order marked PAID: {}", orderId);
        });
    }

    /**
     * Called by Kafka consumer when payment.failed or stock.insufficient is received.
     * Updates order status to FAILED.
     */
    @Transactional
    public void markOrderFailed(UUID orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setStatus(OrderStatus.FAILED);
            orderRepository.save(order);
            log.warn("Order marked FAILED: {}", orderId);

            // Publish Saga compensation event to release stock
            List<OrderCreatedEvent.OrderItem> eventItems = order.getItems().stream()
                    .map(i -> OrderCreatedEvent.OrderItem.builder()
                            .productId(i.getProductId())
                            .quantity(i.getQuantity())
                            .build())
                    .collect(Collectors.toList());

            eventProducer.publishOrderCancelled(OrderCreatedEvent.builder()
                    .orderId(orderId)
                    .userId(order.getUserId())
                    .userEmail(order.getUserEmail())
                    .items(eventItems)
                    .build());

            cartService.clearCart(order.getUserId());
        });
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrdersForAdmin() {
        return orderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private OrderResponse mapToResponse(Order o) {
        return OrderResponse.builder()
                .id(o.getId())
                .userId(o.getUserId())
                .status(o.getStatus().name())
                .totalAmount(o.getTotalAmount())
                .items(o.getItems().stream().map(i -> OrderItemResponse.builder()
                        .id(i.getId())
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .lineTotal(i.getLineTotal())
                        .build()).collect(Collectors.toList()))
                .shippingStreet(o.getShippingStreet())
                .shippingCity(o.getShippingCity())
                .shippingCountry(o.getShippingCountry())
                .shippingPostalCode(o.getShippingPostalCode())
                .notes(o.getNotes())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
