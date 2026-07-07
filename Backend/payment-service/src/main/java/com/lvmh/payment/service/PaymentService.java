package com.lvmh.payment.service;

import com.lvmh.payment.dto.InitiatePaymentRequest;
import com.lvmh.payment.dto.PaymentResponse;
import com.lvmh.payment.event.PaymentCompletedEvent;
import com.lvmh.payment.event.PaymentFailedEvent;
import com.lvmh.payment.kafka.PaymentEventProducer;
import com.lvmh.payment.model.Payment;
import com.lvmh.payment.model.PaymentStatus;
import com.lvmh.payment.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventProducer eventProducer;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    /**
     * Initiate payment — creates Stripe PaymentIntent.
     * Returns clientSecret to frontend for payment confirmation (Stripe.js).
     */
    @Transactional
    public PaymentResponse initiatePayment(InitiatePaymentRequest request) {
        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .userId(request.getUserId())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "usd")
                .status(PaymentStatus.SUCCEEDED) // Simulated Success
                .stripePaymentIntentId("simulated_" + UUID.randomUUID())
                .stripeClientSecret("simulated_secret_" + UUID.randomUUID())
                .build();

        Payment saved = paymentRepository.save(payment);
        log.info("Simulated Payment succeeded: paymentId={}, orderId={}",
                saved.getId(), request.getOrderId());

        // Publish Saga event -> Order Service marks order PAID
        eventProducer.publishPaymentCompleted(PaymentCompletedEvent.builder()
                .orderId(payment.getOrderId())
                .paymentId(saved.getId())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .build());

        return mapToResponse(saved);
    }

    /**
     * Stripe Webhook handler — called by Stripe when payment status changes.
     * This is the primary way payment status is updated.
     */
    @Transactional
    public void handleStripeWebhook(String stripePaymentIntentId, String eventType) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(stripePaymentIntentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for Stripe ID: " + stripePaymentIntentId));

        switch (eventType) {
            case "payment_intent.succeeded" -> {
                payment.setStatus(PaymentStatus.SUCCEEDED);
                paymentRepository.save(payment);
                log.info("Payment succeeded: paymentId={}, orderId={}", payment.getId(), payment.getOrderId());
                // Publish Saga event → Order Service marks order PAID
                eventProducer.publishPaymentCompleted(PaymentCompletedEvent.builder()
                        .orderId(payment.getOrderId())
                        .paymentId(payment.getId())
                        .stripePaymentIntentId(stripePaymentIntentId)
                        .build());
            }
            case "payment_intent.payment_failed" -> {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                log.warn("Payment failed: paymentId={}, orderId={}", payment.getId(), payment.getOrderId());
                // Publish Saga compensation → Order Service marks FAILED, Inventory releases stock
                eventProducer.publishPaymentFailed(PaymentFailedEvent.builder()
                        .orderId(payment.getOrderId())
                        .paymentId(payment.getId())
                        .reason("Stripe payment intent failed")
                        .build());
            }
            default -> log.debug("Unhandled Stripe event type: {}", eventType);
        }
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(UUID orderId) {
        return paymentRepository.findByOrderId(orderId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new IllegalArgumentException("No payment found for orderId: " + orderId));
    }

    @Transactional
    public PaymentResponse refundPayment(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        if (payment.getStatus() != PaymentStatus.SUCCEEDED) {
            throw new IllegalArgumentException("Only succeeded payments can be refunded");
        }

        try {
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(payment.getStripePaymentIntentId())
                    .build();
            Refund.create(params);

            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            log.info("Payment refunded: paymentId={}", paymentId);
            return mapToResponse(payment);
        } catch (StripeException e) {
            log.error("Stripe refund failed: {}", e.getMessage());
            throw new RuntimeException("Refund failed: " + e.getMessage(), e);
        }
    }

    private PaymentResponse mapToResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .orderId(p.getOrderId())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .status(p.getStatus().name())
                .stripeClientSecret(p.getStripeClientSecret())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
