
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api/auth';

  private readonly authenticated = signal(
    this.getStoredToken() !== null,
  );

  readonly isAuthenticated = this.authenticated.asReadonly();

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          sessionStorage.setItem('access_token', response.accessToken);
          this.authenticated.set(true);
        }),
      );
  }

  logout(): void {
    sessionStorage.removeItem('access_token');
    this.authenticated.set(false);
  }

  private getStoredToken(): string | null {
    return typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('access_token')
      : null;
  }
}
