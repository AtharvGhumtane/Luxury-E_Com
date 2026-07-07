package com.lvmh.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StockCheckResponse {
    private UUID productId;
    private boolean available;
    private int availableQuantity;
}
