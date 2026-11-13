
package com.devnest.wallet.controller;

import com.devnest.wallet.dto.WalletRequest;
import com.devnest.wallet.dto.WalletResponse;
import com.devnest.wallet.dto.TransferRequest;
import com.devnest.wallet.dto.TransferResponse;
import com.devnest.wallet.dto.TransactionHistoryResponse;
import com.devnest.wallet.service.WalletService;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/wallets")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/{accountNumber}")
    public WalletResponse getWallet(
            @PathVariable String accountNumber) {
        return walletService.getWalletByAccountNumber(accountNumber);
    }

    @PostMapping
    public WalletResponse createWallet(
            @Valid @RequestBody WalletRequest request) {
        return walletService.createWallet(request);
    }

    @PostMapping("/transfer")
    public TransferResponse transfer(
            @Valid @RequestBody TransferRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false)
            String idempotencyKey) {

        return walletService.transfer(request, idempotencyKey);
    }

    @GetMapping("/{accountNumber}/transactions")
    public List<TransactionHistoryResponse> getTransactionHistory(
            @PathVariable String accountNumber,

            @RequestParam(required = false)
            String type,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,

            @RequestParam(required = false)
            String search) {

        return walletService.getTransactionHistory(
                accountNumber,
                type,
                fromDate != null ? fromDate.atStartOfDay() : null,
                toDate != null ? toDate.atTime(23, 59, 59, 999999999) : null,
                search
        );
    }
}
