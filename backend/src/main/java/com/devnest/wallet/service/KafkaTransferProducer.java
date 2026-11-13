package com.devnest.wallet.service;

import com.devnest.wallet.event.TransferCompletedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaTransferProducer {

    private static final Logger log =
            LoggerFactory.getLogger(KafkaTransferProducer.class);

    private static final String TOPIC = "wallet-transfers";

    private final KafkaTemplate<String, String> kafkaTemplate;

    public KafkaTransferProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publish(TransferCompletedEvent event) {

        String message = String.format(
                "transactionId=%s, from=%s, to=%s, amount=%s, createdAt=%s",
                event.transactionId(),
                event.fromAccount(),
                event.toAccount(),
                event.amount(),
                event.createdAt()
        );

        kafkaTemplate.send(TOPIC, event.transactionId().toString(), message)
                .whenComplete((result, exception) -> {
                    if (exception != null) {
                        log.error("Failed to publish transfer event", exception);
                    } else {
                        log.info(
                                "Transfer event published. Topic={}, partition={}, offset={}",
                                TOPIC,
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset()
                        );
                    }
                });
    }
}
