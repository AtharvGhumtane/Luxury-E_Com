package com.lvmh.order.service;

import com.lvmh.order.dto.CartItem;
import com.lvmh.order.dto.CartResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Cart Service — Redis-backed, session-based shopping cart.
 *
 * Key strategy: cart:{userId}  →  JSON list of CartItems
 * TTL: 7 days (reset on each update to extend session)
 *
 * Cart lifecycle is separate from Order lifecycle:
 * - Cart: browsing session, ephemeral, Redis only
 * - Order: business record, persistent, PostgreSQL
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {

    private static final String CART_KEY_PREFIX = "cart:";
    private static final long CART_TTL_DAYS = 7;

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public CartResponse getCart(UUID userId) {
        List<CartItem> items = getCartItems(userId);
        return buildCartResponse(userId, items);
    }

    public CartResponse addItem(UUID userId, CartItem newItem) {
        List<CartItem> items = getCartItems(userId);

        // Update quantity if item already in cart
        Optional<CartItem> existing = items.stream()
                .filter(i -> i.getProductId().equals(newItem.getProductId()))
                .findFirst();

        if (existing.isPresent()) {
            existing.get().setQuantity(existing.get().getQuantity() + newItem.getQuantity());
        } else {
            items.add(newItem);
        }

        saveCart(userId, items);
        log.debug("Cart updated for userId={}: {} items", userId, items.size());
        return buildCartResponse(userId, items);
    }

    public CartResponse updateItemQuantity(UUID userId, UUID productId, int quantity) {
        List<CartItem> items = getCartItems(userId);

        if (quantity <= 0) {
            items.removeIf(i -> i.getProductId().equals(productId));
        } else {
            items.stream()
                    .filter(i -> i.getProductId().equals(productId))
                    .findFirst()
                    .ifPresent(i -> i.setQuantity(quantity));
        }

        saveCart(userId, items);
        return buildCartResponse(userId, items);
    }

    public CartResponse removeItem(UUID userId, UUID productId) {
        List<CartItem> items = getCartItems(userId);
        items.removeIf(i -> i.getProductId().equals(productId));
        saveCart(userId, items);
        return buildCartResponse(userId, items);
    }

    public void clearCart(UUID userId) {
        redisTemplate.delete(cartKey(userId));
        log.debug("Cart cleared for userId={}", userId);
    }

    public List<CartItem> getCartItems(UUID userId) {
        String json = redisTemplate.opsForValue().get(cartKey(userId));
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<CartItem>>() {});
        } catch (Exception e) {
            log.error("Failed to deserialize cart for userId={}: {}", userId, e.getMessage());
            return new ArrayList<>();
        }
    }

    private void saveCart(UUID userId, List<CartItem> items) {
        try {
            String json = objectMapper.writeValueAsString(items);
            redisTemplate.opsForValue().set(cartKey(userId), json, CART_TTL_DAYS, TimeUnit.DAYS);
        } catch (Exception e) {
            log.error("Failed to save cart for userId={}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to save cart", e);
        }
    }

    private CartResponse buildCartResponse(UUID userId, List<CartItem> items) {
        BigDecimal total = items.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return CartResponse.builder()
                .userId(userId)
                .items(items)
                .totalAmount(total)
                .itemCount(items.size())
                .build();
    }

    private String cartKey(UUID userId) {
        return CART_KEY_PREFIX + userId.toString();
    }
}
