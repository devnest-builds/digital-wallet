
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WalletResponse {
  id: number;
  accountNumber: string;
  balance: number;
}

export interface WalletTransactionResponse {
  transactionId: number;
  fromAccount: string;
  toAccount: string;
  amount: number;
  createdAt: string;
  transactionType: 'DEBIT' | 'CREDIT';
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://localhost:8080/api/wallets';
  private readonly accountNumber = 'WALLET1001';

  getWallet(): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(
      `${this.baseUrl}/${this.accountNumber}`
    );
  }

  getRecentTransactions(): Observable<WalletTransactionResponse[]> {
    return this.http.get<WalletTransactionResponse[]>(
      `${this.baseUrl}/${this.accountNumber}/transactions`
    );
  }
}
