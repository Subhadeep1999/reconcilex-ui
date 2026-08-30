import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent {

  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ordersFile: File | null = null;
  paymentsFile: File | null = null;

  loading = false;
  errorMessage = '';

  onOrdersFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    this.ordersFile = input.files?.[0] ?? null;

    this.errorMessage = '';
  }

  onPaymentsFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    this.paymentsFile = input.files?.[0] ?? null;

    this.errorMessage = '';
  }

  upload(): void {

    if (!this.ordersFile || !this.paymentsFile) {

      this.errorMessage =
        'Please select both Orders CSV and Payments CSV.';

      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.api.upload(
      this.ordersFile,
      this.paymentsFile
    ).subscribe({

      next: batch => {

        console.log('UPLOAD RESPONSE:', batch);
        console.log('BATCH ID:', batch.importBatchId);

        this.loading = false;

        if (!batch?.importBatchId) {

          this.errorMessage =
            'Upload succeeded, but no batch ID was returned.';

          console.error(
            'Invalid upload response:',
            batch
          );

          return;
        }

        this.router.navigate([
          '/dashboard',
          batch.importBatchId
        ]).then(navigated => {

          console.log(
            'NAVIGATION RESULT:',
            navigated
          );

          if (!navigated) {

            this.errorMessage =
              'Upload succeeded, but navigation to dashboard failed.';
          }

        }).catch(error => {

          console.error(
            'Navigation error:',
            error
          );

          this.errorMessage =
            'Upload succeeded, but navigation to dashboard failed.';
        });
      },

      error: error => {

        console.error(
          'File upload failed:',
          error
        );

        this.loading = false;

        this.errorMessage =
          error?.error?.message ??
          'File upload failed.';
      }
    });
  }

  logout(): void {

    this.auth.logout();
  }
}