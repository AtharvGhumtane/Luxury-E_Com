package com.lvmh.payment.controller;

import com.lvmh.payment.dto.InitiatePaymentRequest;
import com.lvmh.payment.dto.PaymentResponse;
import com.lvmh.payment.service.PaymentService;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Stripe payment integration")
public class PaymentController {

    private final PaymentService paymentService;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @PostMapping("/initiate")
    @Operation(summary = "Create Stripe PaymentIntent, returns clientSecret for frontend")
    public ResponseEntity<PaymentResponse> initiatePayment(@RequestHeader("X-User-Id") String userIdStr,
                                                            @Valid @RequestBody InitiatePaymentRequest request) {
        request.setUserId(UUID.fromString(userIdStr));
        return ResponseEntity.ok(paymentService.initiatePayment(request));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get payment status for an order")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable UUID orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId));
    }

    @PostMapping("/{paymentId}/refund")
    @Operation(summary = "Request refund for a payment")
    public ResponseEntity<PaymentResponse> refund(@PathVariable UUID paymentId) {
        return ResponseEntity.ok(paymentService.refundPayment(paymentId));
    }

    /**
     * Stripe Webhook endpoint.
     * Stripe sends events here when payment status changes.
     * Signature verification prevents spoofed webhooks.
     */
    @PostMapping("/webhook")
    @Operation(summary = "Stripe webhook receiver (do not call directly)")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload,
                                                  @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            log.info("Stripe webhook received: type={}", event.getType());

            if (event.getType().startsWith("payment_intent.")) {
                PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject().orElseThrow();
                paymentService.handleStripeWebhook(paymentIntent.getId(), event.getType());
            }

            return ResponseEntity.ok("Webhook processed");
        } catch (Exception e) {
            log.error("Stripe webhook error: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Webhook error: " + e.getMessage());
        }
    }
}
