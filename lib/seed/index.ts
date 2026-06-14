/** Dummy seed data — same shape as the Postgres schema */

export const markets = [
  { code: "prime",    label_ja: "プライム",           label_en: "Prime",    sort_order: 1 },
  { code: "standard", label_ja: "スタンダード",       label_en: "Standard", sort_order: 2 },
  { code: "growth",   label_ja: "グロース",           label_en: "Growth",   sort_order: 3 },
  { code: "pro",      label_ja: "TOKYO PRO Market",   label_en: "Pro",      sort_order: 4 },
] as const;

export const sectors = [
  { code: "3050", label_ja: "食料品",     label_en: "Foods" },
  { code: "3250", label_ja: "化学",       label_en: "Chemicals" },
  { code: "3300", label_ja: "医薬品",     label_en: "Pharmaceutical" },
  { code: "3350", label_ja: "石油・石炭製品", label_en: "Oil & Coal" },
  { code: "3400", label_ja: "ゴム製品",   label_en: "Rubber" },
  { code: "3500", label_ja: "機械",       label_en: "Machinery" },
  { code: "3700", label_ja: "輸送用機器", label_en: "Transportation Equipment" },
  { code: "5250", label_ja: "情報・通信業", label_en: "Information & Communication" },
  { code: "6050", label_ja: "卸売業",     label_en: "Wholesale" },
  { code: "6100", label_ja: "小売業",     label_en: "Retail" },
] as const;

export const companies = [
  {
    id: "c-001",
    ticker: "2871",
    name: "ニチレイ",
    name_en: "Nichirei",
    market_code: "prime",
    is_domestic: true,
    sector_code: "3050",
    fiscal_month: 3,
    market_cap: 410_000_000_000,
    is_active: true,
  },
  {
    id: "c-002",
    ticker: "2802",
    name: "味の素",
    name_en: "Ajinomoto",
    market_code: "prime",
    is_domestic: true,
    sector_code: "3050",
    fiscal_month: 3,
    market_cap: 2_100_000_000_000,
    is_active: true,
  },
  {
    id: "c-003",
    ticker: "1332",
    name: "ニッスイ",
    name_en: "Nissui",
    market_code: "prime",
    is_domestic: true,
    sector_code: "3050",
    fiscal_month: 3,
    market_cap: 280_000_000_000,
    is_active: true,
  },
  {
    id: "c-004",
    ticker: "4502",
    name: "武田薬品工業",
    name_en: "Takeda Pharmaceutical",
    market_code: "prime",
    is_domestic: true,
    sector_code: "3300",
    fiscal_month: 3,
    market_cap: 5_800_000_000_000,
    is_active: true,
  },
  {
    id: "c-005",
    ticker: "7203",
    name: "トヨタ自動車",
    name_en: "Toyota Motor",
    market_code: "prime",
    is_domestic: true,
    sector_code: "3700",
    fiscal_month: 3,
    market_cap: 47_000_000_000_000,
    is_active: true,
  },
] as const;

export const financialReports = [
  {
    id: "fr-001",
    company_id: "c-001",
    fiscal_year: 2024,
    period_type: "FY",
    consolidated: true,
    disclosed_at: "2024-06-21T00:00:00Z",
    doc_id: "S100V000",
    net_sales:        650_000_000_000,
    cost_of_sales:    500_000_000_000,
    gross_profit:     150_000_000_000,
    sga:              108_000_000_000,
    operating_income:  42_000_000_000,
    ordinary_income:   44_000_000_000,
    net_income:        28_000_000_000,
    total_assets:     600_000_000_000,
    cash_and_deposits: 55_000_000_000,
    inventories:       45_000_000_000,
    ppe:              180_000_000_000,
    goodwill:          30_000_000_000,
    investment_secs:   60_000_000_000,
    total_equity:     280_000_000_000,
    retained_earnings: 240_000_000_000,
    cf_operating:      55_000_000_000,
    cf_investing:     -38_000_000_000,
    cf_financing:     -14_000_000_000,
    cash_end:          60_000_000_000,
    dividends_paid:    -8_000_000_000,
    treasury_purchases: -5_000_000_000,
    dividend_per_share: 34,
    forecast_net_sales:        680_000_000_000,
    forecast_operating_income:  44_000_000_000,
    forecast_net_income:        30_000_000_000,
  },
] as const;

export const sectorStats = [
  { sector_code: "3050", fiscal_year: 2024, metric_key: "op_margin",    median: 5.2,  q1: 3.1, q3: 8.0,  sample_size: 32 },
  { sector_code: "3050", fiscal_year: 2024, metric_key: "roic",         median: 5.8,  q1: 3.0, q3: 8.5,  sample_size: 30 },
  { sector_code: "3050", fiscal_year: 2024, metric_key: "equity_ratio", median: 44.0, q1: 35.0, q3: 55.0, sample_size: 32 },
  { sector_code: "3300", fiscal_year: 2024, metric_key: "op_margin",    median: 18.0, q1: 10.0, q3: 28.0, sample_size: 18 },
  { sector_code: "3700", fiscal_year: 2024, metric_key: "op_margin",    median: 7.5,  q1: 4.0, q3: 12.0,  sample_size: 25 },
] as const;

export const marketStats = [
  { market_code: null, fiscal_year: 2024, metric_key: "op_margin",    median: 6.2, mean: 6.8, q1: 3.5, q3: 11.0, sample_size: 3850 },
  { market_code: null, fiscal_year: 2024, metric_key: "roic",         median: 6.5, mean: 7.2, q1: 3.0, q3: 11.5, sample_size: 3780 },
  { market_code: null, fiscal_year: 2024, metric_key: "equity_ratio", median: 48.0, mean: 49.5, q1: 33.0, q3: 62.0, sample_size: 3900 },
  { market_code: "prime", fiscal_year: 2024, metric_key: "op_margin", median: 7.0, mean: 7.8, q1: 4.0, q3: 12.5, sample_size: 1650 },
] as const;

export const marketSummary = [
  { market_code: null, fiscal_year: 2024, metric: "revenue_up_ratio", value: 0.62, sample_size: 3800 },
  { market_code: null, fiscal_year: 2024, metric: "profit_up_ratio",  value: 0.55, sample_size: 3750 },
  { market_code: null, fiscal_year: 2024, metric: "listed_count",     value: 3900, sample_size: 3900 },
] as const;
