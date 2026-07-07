package com.lvmh.inventory.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Published to topic: stock.insufficient
 * Triggers Saga compensation in Order Service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockInsufficientEvent {
    private UUID orderId;
    private UUID productId;
    private int requestedQuantity;
    private int availableQuantity;
}
