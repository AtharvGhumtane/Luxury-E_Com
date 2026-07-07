package com.lvmh.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private UUID id;
    private String name;
    private String description;
    private String sku;
    private BigDecimal price;
    private String brand;
    private String imageUrl;
    private UUID categoryId;
    private String categoryName;
    private boolean active;
    private LocalDateTime createdAt;
}
