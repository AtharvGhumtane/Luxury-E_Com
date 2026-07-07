package com.lvmh.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateProductRequest {
    @NotBlank private String name;
    private String description;
    @NotBlank private String sku;
    @NotNull @DecimalMin("0.01") private BigDecimal price;
    @NotNull private UUID categoryId;
    private String brand;
    private String imageUrl;
}
