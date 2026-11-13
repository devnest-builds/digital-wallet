
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TransferService, TransferResponse } from './services/transfer.service';

@Component({
  imports: [ReactiveFormsModule, CurrencyPipe],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly fb = inject(FormBuilder);
  private readonly transferService = inject(TransferService);

  private readonly sourceAccount = 'WALLET1001';
  private idempotencyKey: string | null = null;

  protected readonly availableBalance = signal(0);
  protected readonly balanceLoading = signal(true);
  protected readonly balanceError = signal('');

  protected readonly transferLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly transferResult = signal<TransferResponse | null>(null);
  protected readonly transferConfirmed = signal(false);

  protected readonly transferForm = this.fb.nonNullable.group({
    recipient: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    account: ['', [Validators.required, Validators.minLength(8)]],
    amount: [
      0,
      [
        Validators.required,
        Validators.min(0.01),
        Validators.max(0),
      ],
    ],
    description: [''],
  });

  protected readonly amountValue = toSignal(
    this.transferForm.controls.amount.valueChanges,
    { initialValue: this.transferForm.controls.amount.value },
  );

  protected readonly remainingBalance = computed(() => {
    const amount = Number(this.amountValue());
    return Math.max(
      0,
      this.availableBalance() - (amount > 0 ? amount : 0),
    );
  });

  protected readonly reviewData = signal<{
    recipient: string;
    email: string;
    account: string;
    amount: number;
    description: string;
  } | null>(null);

  constructor() {
    this.loadWalletBalance();
  }

  private loadWalletBalance(): void {
    this.balanceLoading.set(true);
    this.balanceError.set('');

    this.transferService.getWallet(this.sourceAccount).subscribe({
      next: (wallet) => {
        this.availableBalance.set(Number(wallet.balance));

        this.transferForm.controls.amount.setValidators([
          Validators.required,
          Validators.min(0.01),
          Validators.max(Number(wallet.balance)),
        ]);

        this.transferForm.controls.amount.updateValueAndValidity();
        this.balanceLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.balanceError.set(
          this.getErrorMessage(error, 'Unable to load your wallet balance.'),
        );
        this.balanceLoading.set(false);
      },
    });
  }

  protected reviewTransfer(): void {
    if (this.balanceLoading() || this.balanceError()) {
      return;
    }

    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.transferResult.set(null);
    this.transferConfirmed.set(false);

    // Generate once for this reviewed transfer. Keep it if the API call fails,
    // so a retry uses the same key and cannot create a duplicate transaction.
    this.idempotencyKey = crypto.randomUUID();

    this.reviewData.set(this.transferForm.getRawValue());
  }

  protected confirmTransfer(): void {
    const review = this.reviewData();

   if (
  !review ||
  !this.idempotencyKey ||
  this.transferLoading() ||
  this.transferConfirmed()
) {
  return;
}

    this.transferLoading.set(true);
    this.errorMessage.set('');

    this.transferService.transfer(
      {
        fromAccount: this.sourceAccount,
        toAccount: review.account,
        amount: review.amount,
      },
      this.idempotencyKey,
    ).subscribe({
next: (response) => {
  // Update the actual available balance.
  this.availableBalance.update(
    balance => balance - Number(response.amount),
  );

  // Preserve the response for the success message.
  this.transferResult.set(response);
  this.transferConfirmed.set(true);
  this.transferLoading.set(false);

  // Clear the form so the amount is not deducted again
  // by the remainingBalance computed signal.
  this.transferForm.reset({
    recipient: '',
    email: '',
    account: '',
    amount: 0,
    description: '',
  });

  // The completed transfer no longer needs a pending key.
  this.idempotencyKey = null;
},

      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Transfer failed. Please try again.'),
        );
        this.transferLoading.set(false);
      },
    });
  }

  protected resetReview(): void {
    this.reviewData.set(null);
    this.transferConfirmed.set(false);
    this.transferResult.set(null);
    this.errorMessage.set('');
    this.idempotencyKey = null;
  }

  protected startNewTransfer(): void {
    this.transferForm.reset({
      recipient: '',
      email: '',
      account: '',
      amount: 0,
      description: '',
    });

    this.resetReview();
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string,
  ): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return error.error?.message
      || error.error?.detail
      || error.message
      || fallback;
  }
}
