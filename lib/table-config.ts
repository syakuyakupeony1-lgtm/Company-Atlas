/**
 * Table column definitions and presets.
 * Contains functions — client-side only.
 */
import type { FinancialReport, DerivedMetrics, SectorStat } from "@/lib/types";
import type { Company, Market, Sector } from "@/lib/types";
import { formatYen, formatBigNum, formatPct } from "@/lib/metrics";

// Row shape passed from server → client (serializable)
export interface CompanyRowData {
  company: Company;
  market?: Market;
  sector?: Sector;
  latestReport?: FinancialReport;
  derived: DerivedMetrics;
  /** sector stats for the row's sector × latest fiscal year, keyed by metric_key */
  sectorBench: Partial<Record<string, SectorStat>>;
}

// ─── Column definition ────────────────────────────────────────
export interface ColumnDef {
  key: string;
  label: string;
  unit?: string;
  desc: string;
  plain: string;
  getValue: (row: CompanyRowData) => number | null;
  format: (v: number | null) => string;
  /** Which key to look up in sectorBench for the range bar */
  benchKey?: string;
  /** If set, column is from a future phase and should be greyed */
  phase?: number;
  sortable?: boolean;
  align?: "right" | "left";
}

/** Extract a numeric value from a row for server-side sorting */
export function getRowSortValue(row: CompanyRowData, key: string): number | null {
  switch (key) {
    case "net_sales":        return row.latestReport?.net_sales ?? null;
    case "cost_of_sales":    return row.latestReport?.cost_of_sales ?? null;
    case "gross_profit":     return row.latestReport?.gross_profit ?? null;
    case "operating_income": return row.latestReport?.operating_income ?? null;
    case "net_income":       return row.latestReport?.net_income ?? null;
    case "total_assets":     return row.latestReport?.total_assets ?? null;
    case "total_equity":     return row.latestReport?.total_equity ?? null;
    case "cf_operating":     return row.latestReport?.cf_operating ?? null;
    case "market_cap":       return row.company.market_cap ?? null;
    case "op_margin":        return row.derived.op_margin ?? null;
    case "fcf":              return row.derived.fcf ?? null;
    case "roic":             return row.derived.roic ?? null;
    case "equity_ratio":     return row.derived.equity_ratio ?? null;
    default:                 return null;
  }
}

// ─── Variable column definitions ─────────────────────────────
export const VARIABLE_COLUMNS: ColumnDef[] = [
  {
    key: "net_sales",
    label: "売上高",
    unit: "億円",
    desc: "企業の事業規模がわかる",
    plain: "どれだけ商品やサービスを売ったか",
    getValue: (r) => r.latestReport?.net_sales ?? null,
    format: formatBigNum,
    benchKey: "net_sales",
    sortable: true,
    align: "right",
  },
  {
    key: "operating_income",
    label: "営業利益",
    unit: "億円",
    desc: "本業で稼ぐ力がわかる",
    plain: "本業でいくら儲かったか",
    getValue: (r) => r.latestReport?.operating_income ?? null,
    format: formatBigNum,
    benchKey: "operating_income",
    sortable: true,
    align: "right",
  },
  {
    key: "op_margin",
    label: "営業利益率",
    unit: "%",
    desc: "売上に占める営業利益の割合。稼ぐ効率がわかる",
    plain: "売上のうち何割が本業の儲けか",
    getValue: (r) => r.derived.op_margin ?? null,
    format: (v) => formatPct(v),
    benchKey: "op_margin",
    sortable: true,
    align: "right",
  },
  {
    key: "net_income",
    label: "純利益",
    unit: "億円",
    desc: "最終的に株主に帰属する利益がわかる",
    plain: "税金まで払って最後に残ったお金",
    getValue: (r) => r.latestReport?.net_income ?? null,
    format: formatBigNum,
    sortable: true,
    align: "right",
  },
  {
    key: "roic",
    label: "ROIC（簡易）",
    unit: "%",
    desc: "投下資本に対する税引後営業利益の比率（簡易計算）",
    plain: "元手を使ってどれだけ上手に稼いだか（目安値）",
    getValue: (r) => r.derived.roic ?? null,
    format: (v) => formatPct(v),
    benchKey: "roic",
    sortable: true,
    align: "right",
  },
  {
    key: "fcf",
    label: "FCF",
    unit: "億円",
    desc: "営業CFから設備投資を引いた自由に使える現金",
    plain: "自由に使えるお金をどれだけ生んだか",
    getValue: (r) => r.derived.fcf ?? null,
    format: formatBigNum,
    benchKey: "fcf",
    sortable: true,
    align: "right",
  },
  {
    key: "equity_ratio",
    label: "自己資本比率",
    unit: "%",
    desc: "総資産に占める純資産の割合。財務の安定性がわかる",
    plain: "会社の財産のうち借金でない割合（高いほど安全）",
    getValue: (r) => r.derived.equity_ratio ?? null,
    format: (v) => formatPct(v),
    benchKey: "equity_ratio",
    sortable: true,
    align: "right",
  },
  {
    key: "total_assets",
    label: "総資産",
    unit: "億円",
    desc: "会社が保有する全資産の規模がわかる",
    plain: "会社が持っている財産の合計",
    getValue: (r) => r.latestReport?.total_assets ?? null,
    format: formatBigNum,
    sortable: true,
    align: "right",
  },
  {
    key: "market_cap",
    label: "時価総額",
    unit: "億円",
    desc: "市場が評価する企業全体の価値がわかる",
    plain: "今この会社を丸ごと買うとしたら合計いくらか",
    getValue: (r) => r.company.market_cap ?? null,
    format: formatBigNum,
    sortable: true,
    align: "right",
  },
  {
    key: "cf_operating",
    label: "営業CF",
    unit: "億円",
    desc: "本業で実際に生んだ現金がわかる",
    plain: "本業で実際に手に入ったお金",
    getValue: (r) => r.latestReport?.cf_operating ?? null,
    format: formatBigNum,
    sortable: true,
    align: "right",
  },
  // Phase 2 columns (greyed out — require data not yet available)
  {
    key: "dividend_yield",
    label: "配当利回り",
    unit: "%",
    desc: "株価に対する年間配当の比率（株価データが必要）",
    plain: "株を買うと毎年どれくらい配当がもらえるか",
    getValue: () => null,
    format: () => "—",
    phase: 2,
    sortable: false,
    align: "right",
  },
  {
    key: "employee_count",
    label: "従業員数",
    unit: "人",
    desc: "会社の規模感がわかる（有報Phase 2で対応）",
    plain: "会社で働いている人の数",
    getValue: () => null,
    format: () => "—",
    phase: 2,
    sortable: false,
    align: "right",
  },
  {
    key: "avg_salary",
    label: "平均年収",
    unit: "万円",
    desc: "従業員の平均給与水準がわかる（有報Phase 2で対応）",
    plain: "社員の平均的な年収",
    getValue: () => null,
    format: () => "—",
    phase: 2,
    sortable: false,
    align: "right",
  },
];

export const COLUMN_MAP = Object.fromEntries(
  VARIABLE_COLUMNS.map((c) => [c.key, c]),
) as Record<string, ColumnDef>;

// ─── Presets ─────────────────────────────────────────────────
export interface Preset {
  id: string;
  label: string;
  cols: string[];
}

export const PRESETS: Preset[] = [
  {
    id: "beginner",
    label: "初心者",
    cols: ["net_sales", "operating_income", "op_margin"],
  },
  {
    id: "investor",
    label: "投資家",
    cols: ["net_sales", "op_margin", "roic", "fcf", "equity_ratio", "market_cap"],
  },
  {
    id: "job",
    label: "就活",
    cols: ["net_sales", "operating_income", "op_margin", "equity_ratio", "employee_count", "avg_salary"],
  },
  {
    id: "sales",
    label: "営業",
    cols: ["net_sales", "operating_income", "market_cap"],
  },
  {
    id: "strategy",
    label: "経営企画",
    cols: ["net_sales", "op_margin", "roic", "equity_ratio", "net_income"],
  },
  {
    id: "pro",
    label: "プロ",
    cols: ["net_sales", "operating_income", "op_margin", "net_income", "roic", "fcf", "equity_ratio", "dividend_yield"],
  },
];

export const DEFAULT_COLS = ["net_sales", "operating_income", "op_margin"];

/** Resolve cols for a preset, falling back to default */
export function resolveCols(presetId?: string, rawCols?: string): string[] {
  if (rawCols) return rawCols.split(",").filter(Boolean);
  if (presetId) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) return preset.cols;
  }
  return DEFAULT_COLS;
}
