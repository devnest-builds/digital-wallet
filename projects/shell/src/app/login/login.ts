
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';

  protected readonly errorMessage = signal('');

  protected login(): void {
    const success = this.authService.login(
      this.email,
      this.password,
    );

    if (success) {
      this.router.navigate(['/wallet']);
    } else {
      this.errorMessage.set('Invalid email or password.');
    }
  }
}
