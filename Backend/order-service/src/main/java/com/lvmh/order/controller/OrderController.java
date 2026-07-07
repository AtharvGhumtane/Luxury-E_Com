package com.lvmh.order.controller;

import com.lvmh.order.dto.OrderResponse;
import com.lvmh.order.dto.PlaceOrderRequest;
import com.lvmh.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order placement and lifecycle management")
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "List my orders (paginated)")
    public ResponseEntity<Page<OrderResponse>> getOrders(@RequestHeader("X-User-Id") String userIdStr,
                                                          Pageable pageable) {
        return ResponseEntity.ok(orderService.getUserOrders(UUID.fromString(userIdStr), pageable));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order details")
    public ResponseEntity<OrderResponse> getOrder(@RequestHeader("X-User-Id") String userIdStr,
                                                   @PathVariable UUID orderId) {
        return ResponseEntity.ok(orderService.getOrder(orderId, UUID.fromString(userIdStr)));
    }

    @PostMapping
    @Operation(summary = "Place order (reads cart, triggers Saga)")
    public ResponseEntity<OrderResponse> placeOrder(@RequestHeader("X-User-Id") String userIdStr,
                                                     @RequestHeader("X-User-Email") String email,
                                                     @RequestHeader(value = "X-User-Role", required = false) String role,
                                                     @Valid @RequestBody PlaceOrderRequest request) {
        if ("ROLE_ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.placeOrder(UUID.fromString(userIdStr), email, request));
    }

    @GetMapping("/admin/all")
    @Operation(summary = "Get all orders for admin dashboard")
    public ResponseEntity<java.util.List<OrderResponse>> getAllOrdersForAdmin(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!"ROLE_ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(orderService.getAllOrdersForAdmin());
    }

    @PutMapping("/{orderId}/cancel")
    @Operation(summary = "Cancel order (triggers Saga compensation)")
    public ResponseEntity<OrderResponse> cancelOrder(@RequestHeader("X-User-Id") String userIdStr,
                                                      @PathVariable UUID orderId) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId, UUID.fromString(userIdStr)));
    }
}
