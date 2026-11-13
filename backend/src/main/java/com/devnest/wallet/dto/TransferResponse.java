package com.devnest.wallet.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransferResponse(
        Long transactionId,
        String fromAccount,
        String toAccount,
        BigDecimal amount,
        LocalDateTime createdAt,
        String message
) {
}