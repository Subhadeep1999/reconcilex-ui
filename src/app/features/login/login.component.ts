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
  AuthService
} from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  email = '';
  password = '';

  errorMessage = '';

  login(): void {

    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage =
        'Please enter your email and password.';
      return;
    }

    this.authService.login({
      email: this.email,
      password: this.password
    });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}