package com.lvmh.order.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StockInsufficientEvent {
    private UUID orderId;
    private UUID productId;
    private int requestedQuantity;
    private int availableQuantity;
}
