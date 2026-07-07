package com.lvmh.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class InitiatePaymentRequest {
    @NotNull private UUID orderId;
    private UUID userId; // Set from X-User-Id header
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    private String currency;
}
