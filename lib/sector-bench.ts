/**
 * Sector benchmark computation from financial reports.
 * Works with the in-memory seed data during Phase 1 (pre-DB).
 */
import { deriveAll } from "./metrics";
import type { FinancialReport, SectorStat } from "./types";

export type BenchMetricKey =
  | "net_sales"
  | "operating_income"
  | "net_income"
  | "total_assets"
  | "total_equity"
  | "cf_operating"
  | "op_margin"
  | "equity_ratio"
  | "roic"
  | "fcf";

export interface BenchResult {
  median: number;
  q1: number;
  q3: number;
  mean: number;
  sample_size: number;
  min: number;
  max: number;
}

export type SectorBenches = Partial<Record<BenchMetricKey, BenchResult | null>>;

// ─── Core math ────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function computeBench(values: (number | null | undefined)[]): BenchResult | null {
  const valid = values.filter((v): v is number => v != null && isFinite(v));
  if (valid.length < 2) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  return {
    q1: percentile(sorted, 25),
    median: percentile(sorted, 50),
    q3: percentile(sorted, 75),
    mean,
    sample_size: valid.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

// ─── Extract a metric value from a report ─────────────────────

function extractMetric(r: FinancialReport, key: BenchMetricKey): number | null {
  if (key === "op_margin" || key === "equity_ratio" || key === "roic" || key === "fcf") {
    const d = deriveAll(r);
    return (d as Record<string, number | null | undefined>)[key] ?? null;
  }
  return (r as unknown as Record<string, number | null | undefined>)[key] ?? null;
}

/**
 * Compute bench from a list of reports (e.g., all sector peers for a given FY).
 * Used for metrics not covered by pre-computed seed sector-stats.
 */
export function computeSectorBench(
  reports: FinancialReport[],
  key: BenchMetricKey,
): BenchResult | null {
  return computeBench(reports.map((r) => extractMetric(r, key)));
}

/**
 * Convert a seed SectorStat row to BenchResult (for metrics that are pre-computed).
 * Falls back to null if key fields are missing.
 */
export function benchFromSectorStat(stat: SectorStat | null | undefined): BenchResult | null {
  if (!stat || stat.median == null || stat.q1 == null || stat.q3 == null) return null;
  return {
    median: stat.median,
    q1: stat.q1,
    q3: stat.q3,
    mean: stat.median,
    sample_size: stat.sample_size ?? 1,
    min: stat.q1,
    max: stat.q3,
  };
}

/**
 * Estimate the approximate percentile rank of a value within a bench distribution.
 * Uses linear interpolation between known quartiles (Q1=25th, median=50th, Q3=75th).
 */
export function approximatePercentile(value: number, bench: BenchResult): number {
  const { q1, median, q3 } = bench;
  if (value <= q1) {
    const span = q1 - bench.min;
    return span > 0 ? Math.max(1, 25 * ((value - bench.min) / span)) : 12;
  }
  if (value <= median) {
    const span = median - q1;
    return span > 0 ? 25 + 25 * ((value - q1) / span) : 37;
  }
  if (value <= q3) {
    const span = q3 - median;
    return span > 0 ? 50 + 25 * ((value - median) / span) : 62;
  }
  const span = bench.max - q3;
  return span > 0 ? Math.min(99, 75 + 24 * ((value - q3) / span)) : 87;
}

/** Label for a position within sector range (no evaluation connotation). */
export function positionLabel(pct: number): string {
  if (pct >= 75) return "上位25%以内";
  if (pct >= 50) return "中央値以上";
  if (pct >= 25) return "中央値以下";
  return "下位25%以内";
}
