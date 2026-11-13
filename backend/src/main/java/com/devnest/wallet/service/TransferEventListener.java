package com.devnest.wallet.service;

import com.devnest.wallet.event.TransferCompletedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class TransferEventListener {

    private final KafkaTransferProducer producer;

    public TransferEventListener(KafkaTransferProducer producer) {
        this.producer = producer;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterTransferCommitted(TransferCompletedEvent event) {
        producer.publish(event);
    }
}
