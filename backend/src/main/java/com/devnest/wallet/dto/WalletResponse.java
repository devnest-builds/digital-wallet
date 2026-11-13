package com.devnest.wallet.dto;

import java.math.BigDecimal;

public record WalletResponse(
        Long id,
        String accountNumber,
        BigDecimal balance
) {
}