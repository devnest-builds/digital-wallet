import { Component, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';

interface Transaction {
  name: string;
  category: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  status: string;
  icon: string;
  iconClass: string;
}

@Component({
  imports: [RouterOutlet, CurrencyPipe],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('history');

  protected readonly searchTerm = signal('');
  protected readonly selectedType = signal('all');

  protected readonly transactions = signal<Transaction[]>([
    { name: 'Walmart', category: 'Shopping', date: 'Nov 03, 2026', amount: 125.50, type: 'debit', status: 'Completed', icon: '🛒', iconClass: 'shopping' },
    { name: 'Salary Deposit', category: 'Income', date: 'Nov 02, 2026', amount: 4500, type: 'credit', status: 'Completed', icon: '💼', iconClass: 'salary' },
    { name: 'Starbucks', category: 'Food & Dining', date: 'Nov 02, 2026', amount: 12.75, type: 'debit', status: 'Completed', icon: '☕', iconClass: 'food' },
    { name: 'Rent Payment', category: 'Housing', date: 'Oct 30, 2026', amount: 1800, type: 'debit', status: 'Completed', icon: '🏠', iconClass: 'home' },
    { name: 'Cashback Reward', category: 'Reward', date: 'Oct 29, 2026', amount: 25, type: 'credit', status: 'Completed', icon: '🎁', iconClass: 'reward' },
    { name: 'Transfer to John', category: 'Money Transfer', date: 'Oct 28, 2026', amount: 250, type: 'debit', status: 'Completed', icon: '↗', iconClass: 'transfer' },
  ]);

  protected readonly filteredTransactions = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const type = this.selectedType();

    return this.transactions().filter((transaction) => {
      const matchesSearch =
        transaction.name.toLowerCase().includes(search) ||
        transaction.category.toLowerCase().includes(search);

      const matchesType = type === 'all' || transaction.type === type;

      return matchesSearch && matchesType;
    });
  });
}