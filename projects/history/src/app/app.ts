
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import {
  TransactionService,
  TransactionHistoryResponse
} from './services/transaction.service';

interface Transaction {
  transactionId: number;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  status: string;
  icon: string;
  iconClass: string;
  fromAccount: string;
  toAccount: string;
}

@Component({
  imports: [RouterOutlet, CurrencyPipe, DatePipe],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {

  private readonly transactionService = inject(TransactionService);

  protected readonly title = signal('history');

  protected readonly searchTerm = signal('');
  protected readonly selectedType = signal('all');

  protected readonly transactions = signal<Transaction[]>([]);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly filteredTransactions = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const type = this.selectedType();

    return this.transactions().filter(transaction => {
      const matchesSearch =
        transaction.name.toLowerCase().includes(search) ||
        transaction.fromAccount.toLowerCase().includes(search) ||
        transaction.toAccount.toLowerCase().includes(search);

      const matchesType =
        type === 'all' || transaction.type === type;

      return matchesSearch && matchesType;
    });
  });

  protected readonly totalTransactions = computed(
    () => this.transactions().length
  );

  protected readonly totalCredits = computed(() =>
    this.transactions()
      .filter(t => t.type === 'credit')
      .reduce((total, t) => total + t.amount, 0)
  );

  protected readonly totalDebits = computed(() =>
    this.transactions()
      .filter(t => t.type === 'debit')
      .reduce((total, t) => total + t.amount, 0)
  );

  ngOnInit(): void {
    this.loadTransactions();
  }

  private loadTransactions(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.transactionService.getTransactionHistory().subscribe({
      next: (response: TransactionHistoryResponse[]) => {
        const mappedTransactions = response.map(transaction =>
          this.mapTransaction(transaction)
        );

        this.transactions.set(mappedTransactions);
        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Transaction history API error:', error);

        this.errorMessage.set(
          'Unable to load transactions. Please try again.'
        );

        this.isLoading.set(false);
      }
    });
  }

  private mapTransaction(
    transaction: TransactionHistoryResponse
  ): Transaction {

    const isDebit = transaction.transactionType === 'DEBIT';

    return {
      transactionId: transaction.transactionId,
      name: isDebit
        ? `Transfer to ${transaction.toAccount}`
        : `Transfer from ${transaction.fromAccount}`,

      category: 'Money Transfer',
      date: transaction.createdAt,
      amount: Number(transaction.amount),
      type: isDebit ? 'debit' : 'credit',
      status: 'Recorded',
      icon: isDebit ? '↗' : '↙',
      iconClass: isDebit ? 'transfer' : 'salary',
      fromAccount: transaction.fromAccount,
      toAccount: transaction.toAccount
    };
  }
}
