package com.devnest.wallet.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransferCompletedEvent(
        Long transactionId,
        String fromAccount,
        String toAccount,
        BigDecimal amount,
        LocalDateTime createdAt
) {
}
