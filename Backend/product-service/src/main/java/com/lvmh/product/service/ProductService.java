package com.lvmh.product.service;

import com.lvmh.product.dto.*;
import com.lvmh.product.model.Category;
import com.lvmh.product.model.Product;
import com.lvmh.product.model.ProductDocument;
import com.lvmh.product.repository.CategoryRepository;
import com.lvmh.product.repository.ProductRepository;
import com.lvmh.product.repository.ProductSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductSearchRepository searchRepository;
    private final CategoryRepository categoryRepository;
    private final RestTemplate restTemplate;


    @Cacheable(value = "products", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findByActiveTrue(pageable).map(this::mapToResponse);
    }

    @Cacheable(value = "product", key = "#id")
    public ProductResponse getProduct(UUID id) {
        return mapToResponse(findProductOrThrow(id));
    }

    /**
     * Full-text search via Elasticsearch. Falls back to DB on ES unavailability.
     */
    public Page<ProductDocument> searchProducts(String query, Pageable pageable) {
        log.debug("Elasticsearch search: query={}", query);
        return searchRepository.searchByQuery(query, pageable);
    }

    public Page<ProductResponse> getProductsByCategory(UUID categoryId, Pageable pageable) {
        return productRepository.findByCategoryIdAndActiveTrue(categoryId, pageable).map(this::mapToResponse);
    }

    public Page<ProductResponse> filterProducts(UUID categoryId, BigDecimal minPrice,
                                                 BigDecimal maxPrice, Pageable pageable) {
        return productRepository.findWithFilters(categoryId, minPrice, maxPrice, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    @CacheEvict(value = {"products", "product"}, allEntries = true)
    public ProductResponse createProduct(CreateProductRequest request) {
        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new IllegalArgumentException("SKU already exists: " + request.getSku());
        }
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.getCategoryId()));

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .sku(request.getSku())
                .price(request.getPrice())
                .category(category)
                .brand(request.getBrand())
                .imageUrl(request.getImageUrl())
                .active(true)
                .build();

        product = productRepository.save(product);

        // Dual-write to Elasticsearch
        syncToElasticsearch(product);

        log.info("Product created: {} (SKU: {})", product.getId(), product.getSku());

        ProductResponse response = mapToResponse(product);
        try {
            restTemplate.postForLocation("http://notification-service/api/notifications/new-product", response);
            log.info("Sent product creation notification for: {}", product.getId());
        } catch (Exception e) {
            log.error("Failed to send new product notification for {}: {}", product.getId(), e.getMessage());
        }

        return response;

    }

    @Transactional
    @CacheEvict(value = {"products", "product"}, allEntries = true)
    public ProductResponse updateProduct(UUID id, UpdateProductRequest request) {
        Product product = findProductOrThrow(id);

        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getBrand() != null) product.setBrand(request.getBrand());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());

        product = productRepository.save(product);
        syncToElasticsearch(product);

        return mapToResponse(product);
    }

    @Transactional
    @CacheEvict(value = {"products", "product"}, allEntries = true)
    public void deleteProduct(UUID id) {
        Product product = findProductOrThrow(id);
        product.setActive(false); // Soft delete
        productRepository.save(product);
        searchRepository.deleteById(id.toString());
        log.info("Product soft-deleted: {}", id);
    }

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(c -> CategoryResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .imageUrl(c.getImageUrl())
                        .build())
                .collect(Collectors.toList());
    }

    private void syncToElasticsearch(Product product) {
        try {
            ProductDocument doc = ProductDocument.builder()
                    .id(product.getId().toString())
                    .name(product.getName())
                    .description(product.getDescription())
                    .sku(product.getSku())
                    .price(product.getPrice())
                    .brand(product.getBrand())
                    .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                    .imageUrl(product.getImageUrl())
                    .active(product.isActive())
                    .build();
            searchRepository.save(doc);
        } catch (Exception e) {
            // Log and continue — Elasticsearch sync failure should not break the main flow
            log.error("Failed to sync product {} to Elasticsearch: {}", product.getId(), e.getMessage());
        }
    }

    private Product findProductOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
    }

    private ProductResponse mapToResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .sku(p.getSku())
                .price(p.getPrice())
                .brand(p.getBrand())
                .imageUrl(p.getImageUrl())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .active(p.isActive())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
