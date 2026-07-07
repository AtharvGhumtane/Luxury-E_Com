package com.lvmh.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentResponse {
    private UUID id;
    private UUID orderId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String stripeClientSecret; // Frontend uses this to confirm payment with Stripe.js
    private LocalDateTime createdAt;
}
