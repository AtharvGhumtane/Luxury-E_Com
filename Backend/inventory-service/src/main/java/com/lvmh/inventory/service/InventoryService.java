package com.lvmh.inventory.service;

import com.lvmh.inventory.dto.*;
import com.lvmh.inventory.event.StockInsufficientEvent;
import com.lvmh.inventory.kafka.InventoryEventProducer;
import com.lvmh.inventory.model.Inventory;
import com.lvmh.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryEventProducer eventProducer;

    @Transactional(readOnly = true)
    public InventoryResponse getStock(UUID productId) {
        return inventoryRepository.findByProductId(productId)
                .map(this::mapToResponse)
                .orElseGet(() -> InventoryResponse.builder()
                        .productId(productId)
                        .availableQuantity(0)
                        .reservedQuantity(0)
                        .build());
    }

    @Transactional
    public InventoryResponse updateStock(UUID productId, int quantity) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseGet(() -> Inventory.builder().productId(productId).build());
        inv.setAvailableQuantity(quantity);
        return mapToResponse(inventoryRepository.save(inv));
    }

    /**
     * OpenFeign-compatible: Check if sufficient stock exists.
     * Called synchronously by Order Service before placing order.
     */
    @Transactional(readOnly = true)
    public StockCheckResponse checkAvailability(UUID productId, int requiredQuantity) {
        return inventoryRepository.findByProductId(productId)
                .map(inv -> StockCheckResponse.builder()
                        .productId(productId)
                        .available(inv.hasSufficientStock(requiredQuantity))
                        .availableQuantity(inv.getAvailableQuantity())
                        .build())
                .orElse(StockCheckResponse.builder()
                        .productId(productId)
                        .available(false)
                        .availableQuantity(0)
                        .build());
    }

    /**
     * Saga Step: Reserve stock when order is created.
     * If insufficient, publishes stock.insufficient event to trigger Saga compensation.
     */
    @Transactional
    public void reserveStock(UUID orderId, UUID productId, int quantity) {
        Inventory inv = findOrThrow(productId);

        if (!inv.hasSufficientStock(quantity)) {
            log.warn("Insufficient stock for product {} — orderId={}, required={}, available={}",
                    productId, orderId, quantity, inv.getAvailableQuantity());
            eventProducer.publishStockInsufficient(StockInsufficientEvent.builder()
                    .orderId(orderId)
                    .productId(productId)
                    .requestedQuantity(quantity)
                    .availableQuantity(inv.getAvailableQuantity())
                    .build());
            return;
        }

        inv.setAvailableQuantity(inv.getAvailableQuantity() - quantity);
        inv.setReservedQuantity(inv.getReservedQuantity() + quantity);
        inventoryRepository.save(inv);
        log.info("Stock reserved: productId={}, quantity={}, orderId={}", productId, quantity, orderId);
    }

    /**
     * Saga Compensation: Release reserved stock when order is cancelled or payment fails.
     */
    @Transactional
    public void releaseStock(UUID productId, int quantity) {
        inventoryRepository.findByProductId(productId).ifPresent(inv -> {
            int releaseAmount = Math.min(quantity, inv.getReservedQuantity());
            inv.setReservedQuantity(inv.getReservedQuantity() - releaseAmount);
            inv.setAvailableQuantity(inv.getAvailableQuantity() + releaseAmount);
            inventoryRepository.save(inv);
            log.info("Stock released: productId={}, quantity={}", productId, releaseAmount);
        });
    }

    private Inventory findOrThrow(UUID productId) {
        return inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new IllegalArgumentException("No inventory record for product: " + productId));
    }

    private InventoryResponse mapToResponse(Inventory inv) {
        return InventoryResponse.builder()
                .id(inv.getId())
                .productId(inv.getProductId())
                .availableQuantity(inv.getAvailableQuantity())
                .reservedQuantity(inv.getReservedQuantity())
                .updatedAt(inv.getUpdatedAt())
                .build();
    }
}
