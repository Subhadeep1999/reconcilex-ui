export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: number;
  email: string;
  accessToken: string;
}

export interface ImportBatchResponse {
  importBatchId: number;
  ordersImported: number;
  paymentsImported: number;
  status: string;
}

export interface ReconciliationSummary {
  importBatchId: number;
  totalReferences: number;
  matchedCount: number;
  warningCount: number;
  discrepancyCount: number;
  matchedValue: number;
  discrepancyValue: number;
  moneyAtRisk: number;
}

export interface Discrepancy {
  id: number;
  orderReference: string;
  transactionRef: string;
  expectedAmount: number;
  actualAmount: number;
  differenceAmount: number;
  currency: string;
  paymentCurrency: string;
  discrepancyType: string;
  riskAmount: number;
  reason: string;
}

export interface AiAnalysisResponse {
  importBatchId: number;
  executiveSummary: string;
  keyFindings: string[];
  riskAnalysis: string;
  recommendations: string[];
}