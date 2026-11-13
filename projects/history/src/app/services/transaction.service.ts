
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TransactionHistoryResponse {
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
export class TransactionService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:8080/api/wallets/WALLET1001/transactions';

  getTransactionHistory(): Observable<TransactionHistoryResponse[]> {
    return this.http.get<TransactionHistoryResponse[]>(this.apiUrl);
  }
}
