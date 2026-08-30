import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AiAnalysisResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AiService {

  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  analyze(
    batchId: number
  ): Observable<AiAnalysisResponse> {

    return this.http.post<AiAnalysisResponse>(
      `${this.baseUrl}/ai/analysis/${batchId}`,
      {}
    );
  }
}