package com.lvmh.inventory.kafka;

import com.lvmh.inventory.event.OrderCreatedEvent;
import com.lvmh.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Listens to Kafka events as part of the Choreography-based Saga.
 *
 * Topics consumed:
 * - order.created     → reserve stock for all order items
 * - order.cancelled   → release reserved stock
 * - payment.failed    → release reserved stock (compensation)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryEventConsumer {

    private final InventoryService inventoryService;

    @KafkaListener(topics = "order.created", groupId = "inventory-service",
                   containerFactory = "kafkaListenerContainerFactory")
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Received order.created — orderId={}, items={}", event.getOrderId(), event.getItems().size());
        // Reserve stock for each item in the order (Saga step)
        for (OrderCreatedEvent.OrderItem item : event.getItems()) {
            inventoryService.reserveStock(event.getOrderId(), item.getProductId(), item.getQuantity());
        }
    }

    @KafkaListener(topics = "order.cancelled", groupId = "inventory-service",
                   containerFactory = "kafkaListenerContainerFactory")
    public void handleOrderCancelled(OrderCreatedEvent event) {
        log.info("Received order.cancelled — orderId={}", event.getOrderId());
        // Saga compensation: release reserved stock
        for (OrderCreatedEvent.OrderItem item : event.getItems()) {
            inventoryService.releaseStock(item.getProductId(), item.getQuantity());
        }
    }
}
