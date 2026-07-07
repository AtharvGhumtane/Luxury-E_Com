package com.lvmh.inventory.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Consumed from topic: order.created
 * Published by Order Service when a new order is placed.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreatedEvent {
    private UUID orderId;
    private UUID userId;
    private List<OrderItem> items;
    
    private String userEmail;
    private BigDecimal totalAmount;
    private String shippingStreet;
    private String shippingCity;
    private String shippingCountry;
    private String shippingPostalCode;
    private String notes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItem {
        private UUID productId;
        private String productName;
        private BigDecimal unitPrice;
        private int quantity;
    }
}
