package com.lvmh.inventory.kafka;

import com.lvmh.inventory.event.StockInsufficientEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryEventProducer {

    private static final String TOPIC_STOCK_INSUFFICIENT = "stock.insufficient";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishStockInsufficient(StockInsufficientEvent event) {
        log.warn("Publishing stock.insufficient event — orderId={}", event.getOrderId());
        kafkaTemplate.send(TOPIC_STOCK_INSUFFICIENT, event.getOrderId().toString(), event);
    }
}
