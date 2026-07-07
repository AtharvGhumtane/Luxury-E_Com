package com.lvmh.payment.model;

public enum PaymentStatus {
    PENDING,       // Payment intent created, awaiting confirmation
    SUCCEEDED,     // Stripe confirmed payment
    FAILED,        // Payment failed
    REFUNDED,      // Full refund processed
    PARTIALLY_REFUNDED
}
