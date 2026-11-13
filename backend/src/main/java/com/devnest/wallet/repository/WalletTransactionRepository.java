
package com.devnest.wallet.repository;

import com.devnest.wallet.entity.WalletTransaction;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WalletTransactionRepository
        extends JpaRepository<WalletTransaction, Long> {

    Optional<WalletTransaction> findByIdempotencyKey(String idempotencyKey);

    List<WalletTransaction> findByFromAccountOrToAccountOrderByCreatedAtDesc(
            String fromAccount, String toAccount);

    List<WalletTransaction> findByFromAccountOrToAccountAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            String fromAccount, String toAccount, LocalDateTime fromDate);

    List<WalletTransaction> findByFromAccountOrToAccountAndCreatedAtLessThanEqualOrderByCreatedAtDesc(
            String fromAccount, String toAccount, LocalDateTime toDate);

    List<WalletTransaction> findByFromAccountOrToAccountAndCreatedAtBetweenOrderByCreatedAtDesc(
            String fromAccount, String toAccount,
            LocalDateTime fromDate, LocalDateTime toDate);
}
