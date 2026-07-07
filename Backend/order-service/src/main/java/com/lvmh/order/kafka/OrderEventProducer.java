package com.lvmh.order.kafka;

import com.lvmh.order.event.OrderCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventProducer {

    private static final String TOPIC_ORDER_CREATED   = "order.created";
    private static final String TOPIC_ORDER_CANCELLED  = "order.cancelled";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishOrderCreated(OrderCreatedEvent event) {
        log.info("Publishing order.created — orderId={}", event.getOrderId());
        kafkaTemplate.send(TOPIC_ORDER_CREATED, event.getOrderId().toString(), event);
    }

    public void publishOrderCancelled(OrderCreatedEvent event) {
        log.info("Publishing order.cancelled — orderId={}", event.getOrderId());
        kafkaTemplate.send(TOPIC_ORDER_CANCELLED, event.getOrderId().toString(), event);
    }
}
