package com.lvmh.order.kafka;

import com.lvmh.order.event.PaymentCompletedEvent;
import com.lvmh.order.event.PaymentFailedEvent;
import com.lvmh.order.event.StockInsufficientEvent;
import com.lvmh.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Listens to Kafka events that affect Order state.
 *
 * Topics consumed:
 * - payment.completed    → Mark order as PAID
 * - payment.failed       → Mark order as FAILED (Saga compensation)
 * - stock.insufficient   → Mark order as FAILED (Saga compensation)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final OrderService orderService;

    @KafkaListener(topics = "payment.completed", groupId = "order-service")
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        log.info("Received payment.completed — orderId={}", event.getOrderId());
        orderService.markOrderPaid(event.getOrderId());
    }

    @KafkaListener(topics = "payment.failed", groupId = "order-service")
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.warn("Received payment.failed — orderId={}", event.getOrderId());
        orderService.markOrderFailed(event.getOrderId());
    }

    @KafkaListener(topics = "stock.insufficient", groupId = "order-service")
    public void handleStockInsufficient(StockInsufficientEvent event) {
        log.warn("Received stock.insufficient — orderId={}", event.getOrderId());
        orderService.markOrderFailed(event.getOrderId());
    }
}
