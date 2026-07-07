package com.lvmh.notification.kafka;

import com.lvmh.notification.event.OrderCreatedEvent;
import com.lvmh.notification.event.PaymentCompletedEvent;
import com.lvmh.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Notification Event Consumer — Kafka-driven email notifications.
 *
 * Topics consumed:
 * - order.created      → Send order confirmation email
 * - payment.completed  → Send payment receipt email
 * - order.cancelled    → Send cancellation email
 * - order.shipped      → Send shipping notification email
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventConsumer {

    private final EmailService emailService;
    private final RestTemplate restTemplate;

    @KafkaListener(topics = "order.created", groupId = "notification-service")
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Sending order confirmation email — orderId={}", event.getOrderId());
        try {
            emailService.sendOrderConfirmation(event);
        } catch (Exception e) {
            log.error("Failed to send customer order confirmation: {}", e.getMessage());
        }

        // Fetch all admin emails from auth-service and notify them
        try {
            String[] adminEmails = restTemplate.getForObject("http://auth-service/api/auth/admins", String[].class);
            if (adminEmails != null && adminEmails.length > 0) {
                for (String adminEmail : adminEmails) {
                    try {
                        emailService.sendOrderNotificationToAdmin(event, adminEmail);
                        log.info("Order notification sent to admin: {}", adminEmail);
                    } catch (Exception ex) {
                        log.error("Failed to send order notification to admin {}: {}", adminEmail, ex.getMessage());
                    }
                }
            } else {
                log.warn("No admin emails returned from auth-service, skipping notifications.");
            }
        } catch (Exception e) {
            log.error("Error communicating with auth-service or sending admin notifications: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "payment.completed", groupId = "notification-service")
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        log.info("Sending payment receipt email — orderId={}", event.getOrderId());
        emailService.sendPaymentReceipt(event);
    }

    @KafkaListener(topics = "order.cancelled", groupId = "notification-service")
    public void handleOrderCancelled(OrderCreatedEvent event) {
        log.info("Sending cancellation email — orderId={}", event.getOrderId());
        emailService.sendOrderCancellation(event);
    }
}
