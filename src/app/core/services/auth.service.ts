import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthRequest } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly tokenKey = 'token';

  login(request: AuthRequest): void {

    this.api.login(request).subscribe({
      next: response => {

        localStorage.setItem(
          this.tokenKey,
          response.accessToken
        );

        localStorage.setItem(
          'reconcilex_email',
          response.email
        );

        this.router.navigate(['/upload']);
      },

      error: error => {

        console.error(
          'Login failed',
          error
        );

        alert(
          error?.error?.message ??
          'Invalid email or password'
        );
      }
    });
  }

  getToken(): string | null {
    return localStorage.getItem(
      this.tokenKey
    );
  }

  logout(): void {

    localStorage.removeItem(
      this.tokenKey
    );

    localStorage.removeItem(
      'reconcilex_email'
    );

    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}