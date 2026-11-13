package com.devnest.wallet.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class TransferEventConsumer {

    private static final Logger log =
            LoggerFactory.getLogger(TransferEventConsumer.class);

    @KafkaListener(
            topics = "wallet-transfers",
            groupId = "wallet-transfer-consumer"
    )
    public void consume(String message) {
        log.info("Received Kafka transfer event: {}", message);
    }
}
