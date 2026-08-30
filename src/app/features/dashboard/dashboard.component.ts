import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import {
  AiAnalysisResponse,
  Discrepancy,
  ReconciliationSummary
} from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { AiService } from '../../core/services/ai.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  private readonly ai = inject(AiService);

  aiAnalysis: AiAnalysisResponse | null = null;
  aiLoading = false;
  aiError = '';
  aiPanelOpen = false;

  summary: ReconciliationSummary | null = null;
  discrepancies: Discrepancy[] = [];

  batchId!: number;

  loading = true;
  reconciling = false;

  errorMessage = '';

  // Search/filter
  searchTerm = '';
  selectedType = 'ALL';

  // Row detail
  selectedDiscrepancy: Discrepancy | null = null;

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('batchId');

    if (!id) {
      this.router.navigate(['/upload']);
      return;
    }

    this.batchId = Number(id);

    this.loadDashboard();
  }

  loadDashboard(): void {

    this.loading = true;
    this.errorMessage = '';

    this.api.getSummary(this.batchId).subscribe({

      next: summary => {

        this.summary = summary;

        this.loadDiscrepancies();
      },

      error: error => {

        console.error(
          'Failed to load reconciliation summary',
          error
        );

        this.loading = false;

        this.errorMessage =
          error?.error?.message ??
          'Unable to load reconciliation summary.';
      }
    });
  }

  loadDiscrepancies(): void {

    this.api.getDiscrepancies(this.batchId).subscribe({

      next: discrepancies => {

        this.discrepancies = discrepancies;

        this.loading = false;
      },

      error: error => {

        console.error(
          'Failed to load discrepancies',
          error
        );

        this.loading = false;

        this.errorMessage =
          error?.error?.message ??
          'Unable to load discrepancies.';
      }
    });
  }

  runReconciliation(): void {

    this.reconciling = true;
    this.errorMessage = '';

    this.api.reconcile(this.batchId).subscribe({

      next: summary => {

        this.summary = summary;

        this.reconciling = false;

        this.loadDiscrepancies();
      },

      error: error => {

        console.error(
          'Reconciliation failed',
          error
        );

        this.reconciling = false;

        this.errorMessage =
          error?.error?.message ??
          'Reconciliation failed.';
      }
    });
  }

  goToUpload(): void {
    this.router.navigate(['/upload']);
  }

  // ========================================
  // Search & Filter
  // ========================================

  get discrepancyTypes(): string[] {

    return [
      'ALL',
      ...Array.from(
        new Set(
          this.discrepancies
            .map(item => item.discrepancyType)
            .filter(Boolean)
        )
      )
    ];
  }

  get filteredDiscrepancies(): Discrepancy[] {

    const search = this.searchTerm
      .trim()
      .toLowerCase();

    return this.discrepancies.filter(item => {

      const matchesType =
        this.selectedType === 'ALL' ||
        item.discrepancyType === this.selectedType;

      if (!matchesType) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        item.orderReference,
        item.transactionRef,
        item.discrepancyType,
        item.reason,
        item.currency,
        item.paymentCurrency
      ]
        .filter(value => value !== null && value !== undefined)
        .some(value =>
          String(value)
            .toLowerCase()
            .includes(search)
        );
    });
  }

  clearFilters(): void {

    this.searchTerm = '';
    this.selectedType = 'ALL';
  }

  // ========================================
  // Chart
  // ========================================

  get discrepancyChart(): {
    type: string;
    count: number;
    percentage: number;
  }[] {

    const total = this.discrepancies.length;

    if (total === 0) {
      return [];
    }

    const counts = new Map<string, number>();

    this.discrepancies.forEach(item => {

      const type = item.discrepancyType;

      counts.set(
        type,
        (counts.get(type) ?? 0) + 1
      );
    });

    return Array.from(counts.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round(
          (count / total) * 100
        )
      }))
      .sort((a, b) => b.count - a.count);
  }

  getChartWidth(count: number): string {

    const max = Math.max(
      ...this.discrepancyChart.map(item => item.count),
      1
    );

    return `${(count / max) * 100}%`;
  }

  // ========================================
  // Row detail
  // ========================================

  openDetails(
    discrepancy: Discrepancy
  ): void {

    this.selectedDiscrepancy = discrepancy;
  }

  closeDetails(): void {

    this.selectedDiscrepancy = null;
  }

  // ========================================
  // Formatting
  // ========================================

  formatAmount(
    amount: number | null | undefined,
    currency?: string | null
  ): string {

    if (
      amount === null ||
      amount === undefined
    ) {
      return '—';
    }

    return `${currency ?? ''} ${amount.toFixed(2)}`.trim();
  }

  getDifferenceClass(
    difference: number | null | undefined
  ): string {

    if (
      difference === null ||
      difference === undefined
    ) {
      return '';
    }

    if (difference > 0) {
      return 'positive';
    }

    if (difference < 0) {
      return 'negative';
    }

    return 'zero';
  }

  logout(): void {
    this.auth.logout();
  }

  analyzeWithAi(): void {
    if (!this.batchId) {
      return;
    }

    this.aiLoading = true;
    this.aiError = '';

    this.ai.analyze(this.batchId).subscribe({
      next: response => {
        this.aiLoading = false;
        this.aiAnalysis = response;
      },

      error: error => {
        console.error('AI analysis failed:', error);

        this.aiLoading = false;

        this.aiError =
          error?.error?.message ??
          'Unable to generate AI analysis.';
      }
    });
  }
}