
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { WalletService, WalletTransactionResponse } from './services/wallet.service';

@Component({
  imports: [RouterOutlet, CurrencyPipe, DatePipe],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {

  private readonly walletService = inject(WalletService);

  protected readonly wallet = signal<{
    id: number;
    accountNumber: string;
    balance: number;
  } | null>(null);

  protected readonly transactions = signal<WalletTransactionResponse[]>([]);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly totalIncome = computed(() =>
    this.transactions()
      .filter(t => t.transactionType === 'CREDIT')
      .reduce((total, t) => total + Number(t.amount), 0)
  );

  protected readonly totalExpenses = computed(() =>
    this.transactions()
      .filter(t => t.transactionType === 'DEBIT')
      .reduce((total, t) => total + Number(t.amount), 0)
  );

  protected readonly recentTransactions = computed(() =>
    this.transactions().slice(0, 5)
  );

  ngOnInit(): void {
    this.loadWallet();
    this.loadTransactions();
  }

  private loadWallet(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.walletService.getWallet().subscribe({
      next: response => {
        this.wallet.set(response);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Wallet API error:', error);
        this.errorMessage.set('Unable to load wallet balance.');
        this.isLoading.set(false);
      }
    });
  }

  private loadTransactions(): void {
    this.walletService.getRecentTransactions().subscribe({
      next: response => {
        this.transactions.set(response);
      },
      error: error => {
        console.error('Transaction API error:', error);
      }
    });
  }

  protected getTransactionName(transaction: WalletTransactionResponse): string {
    return transaction.transactionType === 'DEBIT'
      ? `Transfer to ${transaction.toAccount}`
      : `Transfer from ${transaction.fromAccount}`;
  }
}
