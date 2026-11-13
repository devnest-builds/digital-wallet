
package com.devnest.wallet.service;

import com.devnest.wallet.dto.*;
import com.devnest.wallet.entity.Wallet;
import com.devnest.wallet.entity.WalletTransaction;
import com.devnest.wallet.exception.*;
import com.devnest.wallet.repository.WalletRepository;
import com.devnest.wallet.repository.WalletTransactionRepository;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.devnest.wallet.event.TransferCompletedEvent;
import org.springframework.context.ApplicationEventPublisher;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final ApplicationEventPublisher eventPublisher;

    public WalletService(
            WalletRepository walletRepository,
            WalletTransactionRepository transactionRepository,
            ApplicationEventPublisher eventPublisher) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "walletBalance", key = "#p0")
    public WalletResponse getWalletByAccountNumber(String accountNumber) {
        System.out.println("CACHE MISS - Fetching wallet from DATABASE: " + accountNumber);

        Wallet wallet = walletRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new WalletNotFoundException(
                        "Wallet not found for account: " + accountNumber
                ));

        return new WalletResponse(
                wallet.getId(),
                wallet.getAccountNumber(),
                wallet.getBalance()
        );
    }

    @Transactional
    @CacheEvict(cacheNames = "walletBalance", key = "#p0.accountNumber()")
    public WalletResponse createWallet(WalletRequest request) {

        if (request.balance() == null ||
                request.balance().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Wallet balance cannot be negative or null"
            );
        }

        if (walletRepository.existsByAccountNumber(request.accountNumber())) {
            throw new WalletAlreadyExistsException(
                    "Wallet already exists for account: " + request.accountNumber()
            );
        }

        Wallet wallet = new Wallet();
        wallet.setAccountNumber(request.accountNumber());
        wallet.setBalance(request.balance());

        Wallet savedWallet = walletRepository.save(wallet);

        return new WalletResponse(
                savedWallet.getId(),
                savedWallet.getAccountNumber(),
                savedWallet.getBalance()
        );
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "walletBalance",
                    key = "#p0.fromAccount()"),
            @CacheEvict(cacheNames = "walletBalance",
                    key = "#p0.toAccount()")
    })
    public TransferResponse transfer(
            TransferRequest request,
            String idempotencyKey) {

        // 1. Validate transfer request.

        if (request.fromAccount() == null ||
                request.toAccount() == null ||
                request.amount() == null) {
            throw new IllegalArgumentException(
                    "Sender, receiver and amount are required"
            );
        }

        BigDecimal amount = request.amount();

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Transfer amount must be greater than zero"
            );
        }

        if (amount.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException(
                    "Transfer amount cannot have more than two decimal places"
            );
        }

        if (request.fromAccount().equals(request.toAccount())) {
            throw new IllegalArgumentException(
                    "Sender and receiver accounts cannot be the same"
            );
        }

        if (idempotencyKey != null && idempotencyKey.isBlank()) {
            idempotencyKey = null;
        }

        if (idempotencyKey != null && idempotencyKey.length() > 100) {
            throw new IllegalArgumentException(
                    "Idempotency key cannot exceed 100 characters"
            );
        }

        // 2. Check whether this request was already processed.

        if (idempotencyKey != null) {
            var existing = transactionRepository
                    .findByIdempotencyKey(idempotencyKey);

            if (existing.isPresent()) {
                return returnExistingTransfer(existing.get(), request);
            }
        }

        // 3. Lock accounts in alphabetical order to reduce deadlock risk.

        String firstAccount = request.fromAccount()
                .compareTo(request.toAccount()) < 0
                ? request.fromAccount() : request.toAccount();

        String secondAccount = request.fromAccount()
                .compareTo(request.toAccount()) < 0
                ? request.toAccount() : request.fromAccount();

        Wallet firstWallet = walletRepository
                .findByAccountNumberForUpdate(firstAccount)
                .orElseThrow(() -> new WalletNotFoundException(
                        "Wallet not found for account: " + firstAccount
                ));

        Wallet secondWallet = walletRepository
                .findByAccountNumberForUpdate(secondAccount)
                .orElseThrow(() -> new WalletNotFoundException(
                        "Wallet not found for account: " + secondAccount
                ));

        Wallet sender = request.fromAccount().equals(firstAccount)
                ? firstWallet : secondWallet;

        Wallet receiver = request.toAccount().equals(firstAccount)
                ? firstWallet : secondWallet;

        // 4. Check again after obtaining locks.
        // This handles simultaneous retries with the same key.

        if (idempotencyKey != null) {
            var existing = transactionRepository
                    .findByIdempotencyKey(idempotencyKey);

            if (existing.isPresent()) {
                return returnExistingTransfer(existing.get(), request);
            }
        }

        // 5. Check available balance.

        if (sender.getBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException(
                    "Insufficient balance in sender wallet"
            );
        }

        // 6. Update both managed wallet entities.

        sender.setBalance(sender.getBalance().subtract(amount));
        receiver.setBalance(receiver.getBalance().add(amount));

        // 7. Save transaction record.

        WalletTransaction transaction = new WalletTransaction();
        transaction.setFromAccount(request.fromAccount());
        transaction.setToAccount(request.toAccount());
        transaction.setAmount(amount);
        transaction.setIdempotencyKey(idempotencyKey);

        WalletTransaction savedTransaction =
                transactionRepository.saveAndFlush(transaction);

        // 8. Publish an event after the transfer is committed.
        eventPublisher.publishEvent(new TransferCompletedEvent(
                savedTransaction.getId(),
                savedTransaction.getFromAccount(),
                savedTransaction.getToAccount(),
                savedTransaction.getAmount(),
                savedTransaction.getCreatedAt()
        ));        

        return new TransferResponse(
                savedTransaction.getId(),
                savedTransaction.getFromAccount(),
                savedTransaction.getToAccount(),
                savedTransaction.getAmount(),
                savedTransaction.getCreatedAt(),
                "Transfer completed successfully"
        );
    }

    private TransferResponse returnExistingTransfer(
            WalletTransaction transaction,
            TransferRequest request) {

        // A key cannot be reused for a different transfer.

        if (!transaction.getFromAccount().equals(request.fromAccount()) ||
                !transaction.getToAccount().equals(request.toAccount()) ||
                transaction.getAmount().compareTo(request.amount()) != 0) {
            throw new IllegalArgumentException(
                    "Idempotency key has already been used for a different transfer"
            );
        }

        return new TransferResponse(
                transaction.getId(),
                transaction.getFromAccount(),
                transaction.getToAccount(),
                transaction.getAmount(),
                transaction.getCreatedAt(),
                "Transfer already processed successfully"
        );
    }

    @Transactional(readOnly = true)
    public List<TransactionHistoryResponse> getTransactionHistory(
            String accountNumber,
            String type,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String search) {

        if (fromDate != null && toDate != null &&
                fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException(
                    "From date cannot be after to date"
            );
        }

        String normalizedType = type == null
                ? null : type.trim().toUpperCase();

        if (normalizedType != null &&
                !normalizedType.isBlank() &&
                !normalizedType.equals("DEBIT") &&
                !normalizedType.equals("CREDIT")) {
            throw new IllegalArgumentException(
                    "Transaction type must be DEBIT or CREDIT"
            );
        }

        List<WalletTransaction> transactions;

        if (fromDate != null && toDate != null) {
            transactions = transactionRepository
                    .findByFromAccountOrToAccountAndCreatedAtBetweenOrderByCreatedAtDesc(
                            accountNumber, accountNumber, fromDate, toDate);
        } else if (fromDate != null) {
            transactions = transactionRepository
                    .findByFromAccountOrToAccountAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                            accountNumber, accountNumber, fromDate);
        } else if (toDate != null) {
            transactions = transactionRepository
                    .findByFromAccountOrToAccountAndCreatedAtLessThanEqualOrderByCreatedAtDesc(
                            accountNumber, accountNumber, toDate);
        } else {
            transactions = transactionRepository
                    .findByFromAccountOrToAccountOrderByCreatedAtDesc(
                            accountNumber, accountNumber);
        }

        String searchTerm = search == null
                ? "" : search.trim().toLowerCase();

        return transactions.stream()
                .filter(t -> {
                    String transactionType =
                            accountNumber.equals(t.getFromAccount())
                                    ? "DEBIT" : "CREDIT";

                    return normalizedType == null ||
                            normalizedType.isBlank() ||
                            normalizedType.equals(transactionType);
                })
                .filter(t ->
                        searchTerm.isBlank() ||
                        t.getFromAccount().toLowerCase().contains(searchTerm) ||
                        t.getToAccount().toLowerCase().contains(searchTerm)
                )
                .map(t -> new TransactionHistoryResponse(
                        t.getId(),
                        t.getFromAccount(),
                        t.getToAccount(),
                        t.getAmount(),
                        t.getCreatedAt(),
                        accountNumber.equals(t.getFromAccount())
                                ? "DEBIT" : "CREDIT"
                ))
                .toList();
    }
}
