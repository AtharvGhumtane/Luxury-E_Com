package com.lvmh.order.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderCreatedEvent {
    private UUID orderId;
    private UUID userId;
    private String userEmail;
    private BigDecimal totalAmount;
    private List<OrderItem> items;
    
    private String shippingStreet;
    private String shippingCity;
    private String shippingCountry;
    private String shippingPostalCode;
    private String notes;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderItem {
        private UUID productId;
        private String productName;
        private BigDecimal unitPrice;
        private int quantity;
    }
}
