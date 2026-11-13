
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WalletResponse {
  id: number;
  accountNumber: string;
  balance: number;
}

export interface TransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
}

export interface TransferResponse {
  transactionId: number;
  fromAccount: string;
  toAccount: string;
  amount: number;
  createdAt: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class TransferService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/wallets';

  getWallet(accountNumber: string): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(
      `${this.apiUrl}/${accountNumber}`,
    );
  }

  transfer(
    request: TransferRequest,
    idempotencyKey: string,
  ): Observable<TransferResponse> {
    const headers = new HttpHeaders({
      'Idempotency-Key': idempotencyKey,
    });

    return this.http.post<TransferResponse>(
      `${this.apiUrl}/transfer`,
      request,
      { headers },
    );
  }
}
