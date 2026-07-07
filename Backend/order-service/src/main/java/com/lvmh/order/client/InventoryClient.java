package com.lvmh.order.client;

import com.lvmh.order.dto.StockCheckResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

/**
 * OpenFeign client for synchronous calls to inventory-service.
 * Used by Order Service to check stock BEFORE persisting an order (Saga start).
 *
 * Circuit breaker (Resilience4j) protects this call — fallback returns "available=false"
 * which prevents order placement if inventory service is down.
 */
@FeignClient(
        name = "inventory-service",
        path = "/api/inventory",
        fallback = InventoryClientFallback.class
)
public interface InventoryClient {

    @GetMapping("/check")
    StockCheckResponse checkAvailability(@RequestParam UUID productId,
                                          @RequestParam int quantity);
}
