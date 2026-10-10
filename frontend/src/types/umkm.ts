// Diagnostic payload sesuai desain code.html (5 parameter)
export interface DiagnosticInput {
  netProfitMargin: number;
  burnRateRatio: number;
  repeatOrderRate: number;
  transactionCount: number;
  peakHourLatency: 'Low' | 'Med' | 'High';
}

export type DiagnosticVariant = 'PRIMA_HIJAU' | 'KRITIS_MERAH';

export interface DiagnosticResult {
  variant: DiagnosticVariant;
  status: 'CRITICAL' | 'STRUGGLING' | 'ELITE' | 'GROWTH' | 'PRIMA';
  status_id: 0 | 1 | 2;
  health_score: number;
  confidence: number;
  risk_level: string;
  metrics_summary: {
    net_profit_margin: number;
    burn_rate_ratio: number;
    repeat_order_rate: number;
    transaction_count: number;
    peak_hour_latency: 'Low' | 'Med' | 'High';
  };
  ai_narration: string;
  prescriptive_actions: string[];
  shap_top_drivers: { feature: string; impact: string }[];
  timestamp: string;
}

export interface DiagnosticPreset {
  label: string;
  values: DiagnosticInput;
}
