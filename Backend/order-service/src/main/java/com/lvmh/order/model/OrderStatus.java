package com.lvmh.order.model;

public enum OrderStatus {
    PENDING,       // Order placed, awaiting payment
    PAID,          // Payment successful
    PROCESSING,    // Being prepared/packed
    SHIPPED,       // Dispatched
    DELIVERED,     // Delivered to customer
    CANCELLED,     // Cancelled (before shipping)
    FAILED         // Payment failed or stock insufficient
}
