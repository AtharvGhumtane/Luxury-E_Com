package com.lvmh.payment.kafka;

import com.lvmh.payment.event.PaymentCompletedEvent;
import com.lvmh.payment.event.PaymentFailedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventProducer {

    private static final String TOPIC_PAYMENT_COMPLETED = "payment.completed";
    private static final String TOPIC_PAYMENT_FAILED    = "payment.failed";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishPaymentCompleted(PaymentCompletedEvent event) {
        log.info("Publishing payment.completed — orderId={}", event.getOrderId());
        kafkaTemplate.send(TOPIC_PAYMENT_COMPLETED, event.getOrderId().toString(), event);
    }

    public void publishPaymentFailed(PaymentFailedEvent event) {
        log.warn("Publishing payment.failed — orderId={}", event.getOrderId());
        kafkaTemplate.send(TOPIC_PAYMENT_FAILED, event.getOrderId().toString(), event);
    }
}
