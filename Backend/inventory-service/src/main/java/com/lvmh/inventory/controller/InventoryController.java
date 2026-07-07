package com.lvmh.inventory.controller;

import com.lvmh.inventory.dto.InventoryResponse;
import com.lvmh.inventory.dto.StockCheckResponse;
import com.lvmh.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Stock management")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/{productId}")
    @Operation(summary = "Get stock level for a product")
    public ResponseEntity<InventoryResponse> getStock(@PathVariable UUID productId) {
        return ResponseEntity.ok(inventoryService.getStock(productId));
    }

    @PutMapping("/{productId}")
    @Operation(summary = "[ADMIN] Update stock level")
    public ResponseEntity<InventoryResponse> updateStock(@PathVariable UUID productId,
                                                          @RequestParam int quantity) {
        return ResponseEntity.ok(inventoryService.updateStock(productId, quantity));
    }

    /**
     * Internal endpoint called by Order Service via OpenFeign.
     * Checks if sufficient stock is available.
     */
    @GetMapping("/check")
    @Operation(summary = "[Internal] Check stock availability")
    public ResponseEntity<StockCheckResponse> checkAvailability(@RequestParam UUID productId,
                                                                  @RequestParam int quantity) {
        return ResponseEntity.ok(inventoryService.checkAvailability(productId, quantity));
    }
}
