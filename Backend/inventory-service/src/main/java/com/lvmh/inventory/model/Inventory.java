package com.lvmh.inventory.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory", indexes = {
        @Index(name = "idx_inventory_product_id", columnList = "productId", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * References product-service.products.id (logical reference, not FK — different DB).
     */
    @Column(nullable = false, unique = true)
    private UUID productId;

    @Column(nullable = false)
    @Builder.Default
    private int availableQuantity = 0;

    @Column(nullable = false)
    @Builder.Default
    private int reservedQuantity = 0;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public int getTotalQuantity() {
        return availableQuantity + reservedQuantity;
    }

    public boolean hasSufficientStock(int required) {
        return availableQuantity >= required;
    }
}
