
import { Component, computed, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [ReactiveFormsModule, CurrencyPipe],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly fb = new FormBuilder();

  protected readonly availableBalance = signal(24850.75);

  protected readonly transferForm = this.fb.nonNullable.group({
    recipient: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    account: ['', [Validators.required, Validators.minLength(8)]],
    amount: [
      0,
      [
        Validators.required,
        Validators.min(0.01),
        Validators.max(this.availableBalance()),
      ],
    ],
    description: [''],
  });
  protected readonly amountValue = toSignal(
  this.transferForm.controls.amount.valueChanges,
  { initialValue: this.transferForm.controls.amount.value }
);

 protected readonly remainingBalance = computed(() => {
  const amount = Number(this.amountValue());
  return this.availableBalance() - (amount > 0 ? amount : 0);
});

  protected readonly reviewData = signal<{
    recipient: string;
    email: string;
    account: string;
    amount: number;
    description: string;
  } | null>(null);

  protected reviewTransfer(): void {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.reviewData.set(this.transferForm.getRawValue());
  }
  protected readonly transferConfirmed = signal(false);

protected confirmTransfer(): void {
  this.transferConfirmed.set(true);
}
protected resetReview(): void {
  this.reviewData.set(null);
  this.transferConfirmed.set(false);
}
}
