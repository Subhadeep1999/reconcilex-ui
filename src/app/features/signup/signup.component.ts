import {
  Component,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  ApiService
} from '../../core/services/api.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {

  private readonly api =
    inject(ApiService);

  private readonly router =
    inject(Router);

  email = '';
  password = '';
  confirmPassword = '';

  loading = false;
  errorMessage = '';

  signup(): void {

    this.errorMessage = '';

    if (!this.email || !this.password || !this.confirmPassword) {
      this.errorMessage =
        'Please fill in all fields.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage =
        'Passwords do not match.';
      return;
    }

    this.loading = true;

    this.api.signup({
      email: this.email,
      password: this.password
    }).subscribe({

      next: () => {

        this.loading = false;

        this.router.navigate(['/login']);

      },

      error: error => {

        this.loading = false;

        this.errorMessage =
          error?.error?.message ??
          'Unable to create account.';
      }

    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}