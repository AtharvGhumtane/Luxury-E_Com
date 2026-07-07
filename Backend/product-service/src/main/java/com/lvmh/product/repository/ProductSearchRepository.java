package com.lvmh.product.repository;

import com.lvmh.product.model.ProductDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductSearchRepository extends ElasticsearchRepository<ProductDocument, String> {

    /**
     * Full-text search across name, description, and brand fields.
     * Uses Elasticsearch multi_match query.
     */
    @Query("{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"name^3\", \"description\", \"brand^2\"], \"fuzziness\": \"AUTO\"}}")
    Page<ProductDocument> searchByQuery(String query, Pageable pageable);

    Page<ProductDocument> findByCategoryNameAndActiveTrue(String categoryName, Pageable pageable);

    Page<ProductDocument> findByActiveTrue(Pageable pageable);
}
