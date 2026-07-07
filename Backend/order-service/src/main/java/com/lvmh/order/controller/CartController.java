package com.lvmh.order.controller;

import com.lvmh.order.dto.*;
import com.lvmh.order.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Redis-based shopping cart (session lifecycle)")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get current cart")
    public ResponseEntity<CartResponse> getCart(@RequestHeader("X-User-Id") String userIdStr) {
        return ResponseEntity.ok(cartService.getCart(UUID.fromString(userIdStr)));
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to cart")
    public ResponseEntity<CartResponse> addItem(@RequestHeader("X-User-Id") String userIdStr,
                                                 @Valid @RequestBody CartItem item) {
        return ResponseEntity.ok(cartService.addItem(UUID.fromString(userIdStr), item));
    }

    @PutMapping("/items/{productId}")
    @Operation(summary = "Update item quantity")
    public ResponseEntity<CartResponse> updateItem(@RequestHeader("X-User-Id") String userIdStr,
                                                    @PathVariable UUID productId,
                                                    @RequestParam int quantity) {
        return ResponseEntity.ok(cartService.updateItemQuantity(UUID.fromString(userIdStr), productId, quantity));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<CartResponse> removeItem(@RequestHeader("X-User-Id") String userIdStr,
                                                    @PathVariable UUID productId) {
        return ResponseEntity.ok(cartService.removeItem(UUID.fromString(userIdStr), productId));
    }

    @DeleteMapping
    @Operation(summary = "Clear cart")
    public ResponseEntity<Void> clearCart(@RequestHeader("X-User-Id") String userIdStr) {
        cartService.clearCart(UUID.fromString(userIdStr));
        return ResponseEntity.noContent().build();
    }
}
