package com.lvmh.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CartItem {
    private UUID productId;
    private String productName;
    private String productSku;
    private int quantity;
    private BigDecimal unitPrice;
}
