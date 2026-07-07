package com.lvmh.order.client;

import com.lvmh.order.dto.StockCheckResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Fallback for InventoryClient when inventory-service is unavailable.
 * Returns unavailable to prevent orders when stock cannot be verified.
 */
@Slf4j
@Component
public class InventoryClientFallback implements InventoryClient {

    @Override
    public StockCheckResponse checkAvailability(UUID productId, int quantity) {
        log.error("InventoryClient fallback: inventory-service unavailable for productId={}", productId);
        return StockCheckResponse.builder()
                .productId(productId)
                .available(false)
                .availableQuantity(0)
                .build();
    }
}
