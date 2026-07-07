package com.lvmh.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductCreatedEvent {
    private UUID id;
    private String name;
    private String description;
    private String sku;
    private BigDecimal price;
    private String brand;
    private String imageUrl;
}
