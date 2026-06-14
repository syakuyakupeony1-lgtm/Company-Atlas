// TypeScript interfaces matching the Postgres schema exactly.
// bigint → number, timestamptz → string (ISO), numeric → number, smallint → number

export interface Market {
  code: string;       // 'prime' | 'standard' | 'growth' | 'pro'
  label_ja: string;
  label_en: string;
  sort_order: number;
}

export interface Sector {
  code: string;
  label_ja: string;
  label_en?: string;
}

export interface Company {
  id: string;
  ticker: string;
  name: string;
  name_en?: string;
  market_code?: string;
  is_domestic: boolean;
  sector_code?: string;
  fiscal_month?: number;
  market_cap?: number;
  listed_on?: string;
  is_active: boolean;
  jpx_updated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialReport {
  id: string;
  company_id: string;
  fiscal_year: number;
  period_type: 'FY' | 'H1';
  consolidated: boolean;
  disclosed_at: string;
  doc_id: string;
  // PL
  net_sales?: number;
  cost_of_sales?: number;
  gross_profit?: number;
  sga?: number;
  operating_income?: number;
  ordinary_income?: number;
  net_income?: number;
  // BS
  total_assets?: number;
  cash_and_deposits?: number;
  inventories?: number;
  ppe?: number;
  goodwill?: number;
  investment_secs?: number;
  total_equity?: number;
  retained_earnings?: number;
  // CF
  cf_operating?: number;
  cf_investing?: number;
  cf_financing?: number;
  cash_end?: number;
  // Returns
  dividends_paid?: number;
  treasury_purchases?: number;
  dividend_per_share?: number;
  // Forecast
  forecast_net_sales?: number;
  forecast_operating_income?: number;
  forecast_net_income?: number;
  created_at: string;
}

export interface SectorStat {
  id: string;
  sector_code: string;
  fiscal_year: number;
  metric_key: string;
  median?: number;
  q1?: number;
  q3?: number;
  sample_size?: number;
  computed_at: string;
}

export interface MarketStat {
  id: string;
  market_code?: string;   // undefined/null = 全市場
  fiscal_year: number;
  metric_key: string;
  median?: number;
  mean?: number;
  q1?: number;
  q3?: number;
  sample_size?: number;
  computed_at: string;
}

export interface MarketSummaryRow {
  id: string;
  market_code?: string;   // undefined/null = 全市場
  fiscal_year: number;
  metric: string;
  value?: number;
  sample_size?: number;
  computed_at: string;
}

export interface AiInsight {
  id: string;
  company_id: string;
  report_id?: string;
  kind: string;   // 'snapshot_summary' | 'earnings_review' | 'key_points' | 'highlights'
  level: string;  // 'easy' | 'standard' | 'pro'
  content: Record<string, unknown>;
  model?: string;
  generated_at: string;
}

export interface Segment {
  id: string;
  company_id: string;
  fiscal_year: number;
  source_doc_id: string;
  name: string;
  display_order?: number;
  net_sales?: number;
  segment_profit?: number;
  assets?: number;
  description?: string;
  source_excerpt?: string;
  created_at: string;
}

/** Derived metrics computed from a FinancialReport */
export interface DerivedMetrics {
  op_margin?: number | null;
  fcf?: number | null;
  roic?: number | null;
  equity_ratio?: number | null;
}
