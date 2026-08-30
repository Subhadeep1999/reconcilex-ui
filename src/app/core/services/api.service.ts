import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AuthResponse,
  Discrepancy,
  ImportBatchResponse,
  AuthRequest,
  ReconciliationSummary
} from '../models/api.models';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  login(request: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/auth/login`,
      request
    );
  }

  signup(
  request: AuthRequest
): Observable<void> {

  return this.http.post<void>(
    `${this.baseUrl}/auth/signup`,
    request
  );
}

  upload(
    ordersFile: File,
    paymentsFile: File
  ): Observable<ImportBatchResponse> {

    const formData = new FormData();

    formData.append('ordersFile', ordersFile);
    formData.append('paymentsFile', paymentsFile);

    return this.http.post<ImportBatchResponse>(
      `${this.baseUrl}/import`,
      formData
    );
  }

  reconcile(
    batchId: number
  ): Observable<ReconciliationSummary> {

    return this.http.post<ReconciliationSummary>(
      `${this.baseUrl}/reconciliation/${batchId}`,
      {}
    );
  }

  getSummary(
    batchId: number
  ): Observable<ReconciliationSummary> {

    return this.http.get<ReconciliationSummary>(
      `${this.baseUrl}/reconciliation/${batchId}`
    );
  }

  getDiscrepancies(
    batchId: number
  ): Observable<Discrepancy[]> {

    return this.http.get<Discrepancy[]>(
      `${this.baseUrl}/reconciliation/${batchId}/discrepancies`
    );
  }
}