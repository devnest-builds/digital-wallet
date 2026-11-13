package com.devnest.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record WalletRequest(

        @NotBlank(message = "Account number is required")
        String accountNumber,

        @NotNull(message = "Opening balance is required")
        @PositiveOrZero(message = "Opening balance cannot be negative")
        BigDecimal balance

) {
}