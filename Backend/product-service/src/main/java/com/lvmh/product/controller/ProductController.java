package com.lvmh.product.controller;

import com.lvmh.product.dto.*;
import com.lvmh.product.model.ProductDocument;
import com.lvmh.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product catalog management and search")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "List all products (paginated)")
    public ResponseEntity<Page<ProductResponse>> listProducts(Pageable pageable) {
        return ResponseEntity.ok(productService.getAllProducts(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @GetMapping("/search")
    @Operation(summary = "Full-text search via Elasticsearch (fuzzy, multi-field)")
    public ResponseEntity<Page<ProductDocument>> searchProducts(@RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(productService.searchProducts(q, pageable));
    }

    @GetMapping("/categories")
    @Operation(summary = "List all categories")
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        return ResponseEntity.ok(productService.getAllCategories());
    }

    @GetMapping("/filter")
    @Operation(summary = "Filter products by category and price range")
    public ResponseEntity<Page<ProductResponse>> filterProducts(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            Pageable pageable) {
        return ResponseEntity.ok(productService.filterProducts(categoryId, minPrice, maxPrice, pageable));
    }

    @PostMapping
    @Operation(summary = "[ADMIN] Create a new product")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "[ADMIN] Update a product")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable UUID id,
                                                          @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "[ADMIN] Soft-delete a product")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
