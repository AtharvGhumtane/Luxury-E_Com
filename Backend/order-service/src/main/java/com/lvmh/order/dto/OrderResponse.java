package com.lvmh.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderResponse {
    private UUID id;
    private UUID userId;
    private String status;
    private BigDecimal totalAmount;
    private List<OrderItemResponse> items;
    private String shippingStreet;
    private String shippingCity;
    private String shippingCountry;
    private String shippingPostalCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
