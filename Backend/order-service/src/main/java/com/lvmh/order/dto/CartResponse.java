package com.lvmh.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CartResponse {
    private UUID userId;
    private List<CartItem> items;
    private BigDecimal totalAmount;
    private int itemCount;
}
