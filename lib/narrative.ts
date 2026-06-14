/**
 * Template-based narrative generation — zero AI cost.
 * Generates fact-only, level-aware text from financial data + sector benchmarks.
 * No evaluation words. No buy/sell/good/bad language.
 */
import { formatBigNum, formatPct } from "./metrics";
import { approximatePercentile, positionLabel } from "./sector-bench";
import type { BenchResult, SectorBenches } from "./sector-bench";
import type { Company, FinancialReport, DerivedMetrics } from "./types";

// ─── Types ────────────────────────────────────────────────────

export interface NarrativeContext {
  company: Company;
  report: FinancialReport;
  prevReport?: FinancialReport | null;
  derived: DerivedMetrics;
  sectorLabel?: string | null;
  benches?: SectorBenches;
}

export interface SnapshotNarrative {
  summary: string;
  highlights: string[];
}

export interface EarningsNumbers {
  salesYoY?: string;
  opYoY?: string;
  niYoY?: string;
  salesProgress?: string;
  opProgress?: string;
  niProgress?: string;
}

export interface TemplateKeyPoint {
  question: string;
}

// ─── Utility helpers ──────────────────────────────────────────

function yoyText(current: number, prev: number | null | undefined): string | null {
  if (prev == null || prev === 0) return null;
  const pct = ((current - prev) / Math.abs(prev)) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `前期比${sign}${pct.toFixed(1)}%`;
}

function benchText(
  value: number,
  bench: BenchResult | null | undefined,
  sectorName: string,
  smallSample: boolean,
): string {
  if (!bench) return "";
  const pct = approximatePercentile(value, bench);
  const label = positionLabel(pct);
  const note = smallSample ? "（比較企業数が少ないため参考値）" : "";
  return `${sectorName}内: ${label}${note}`;
}

// ─── Snapshot narrative ───────────────────────────────────────

export function generateSnapshotNarrative(
  ctx: NarrativeContext,
  level: string,
): SnapshotNarrative {
  const { company, report, prevReport, derived, sectorLabel, benches } = ctx;
  const sectorName = sectorLabel ?? "業種";
  const fy = report.fiscal_year;
  const smallSample = (benches?.net_sales?.sample_size ?? benches?.op_margin?.sample_size ?? 99) < 5;

  const salesYoY = report.net_sales != null ? yoyText(report.net_sales, prevReport?.net_sales) : null;
  const opYoY = report.operating_income != null ? yoyText(report.operating_income, prevReport?.operating_income) : null;

  const opMarginPos = (derived.op_margin != null && benches?.op_margin)
    ? benchText(derived.op_margin, benches.op_margin, sectorName, smallSample)
    : null;
  const roicPos = (derived.roic != null && benches?.roic)
    ? benchText(derived.roic, benches.roic, sectorName, smallSample)
    : null;

  // ── Easy mode ──
  if (level === "easy") {
    const parts: string[] = [];
    if (report.net_sales != null) {
      parts.push(`${fy}年度の売上高は${formatBigNum(report.net_sales)}${salesYoY ? `（${salesYoY}）` : ""}。`);
    }
    if (derived.op_margin != null) {
      const posStr = opMarginPos ? `${opMarginPos}。` : "";
      parts.push(`営業利益率は${formatPct(derived.op_margin)}${posStr ? `で、${posStr}` : "。"}`);
    }
    if (derived.equity_ratio != null) {
      parts.push(`自己資本比率は${formatPct(derived.equity_ratio, 0)}。`);
    }

    const summary = parts.join("") || `${company.name}の${fy}年度データを掲載しています。`;

    const highlights: string[] = [];
    if (report.net_sales != null) {
      highlights.push(`売上高 ${formatBigNum(report.net_sales)}${salesYoY ? `（${salesYoY}）` : ""}`);
    }
    if (derived.op_margin != null) {
      const posStr = opMarginPos ? ` — ${opMarginPos}` : "";
      highlights.push(`営業利益率 ${formatPct(derived.op_margin)}${posStr}`);
    }
    if (derived.equity_ratio != null) {
      highlights.push(`自己資本比率 ${formatPct(derived.equity_ratio, 0)}`);
    }

    return { summary, highlights };
  }

  // ── Standard / Pro mode ──
  const parts: string[] = [];
  if (report.net_sales != null) {
    parts.push(`売上高 ${formatBigNum(report.net_sales)}${salesYoY ? `（${salesYoY}）` : ""}`);
  }
  if (derived.op_margin != null) {
    const posStr = opMarginPos ? `、${opMarginPos}` : "";
    parts.push(`営業利益率 ${formatPct(derived.op_margin)}${posStr}`);
  }
  if (report.operating_income != null && opYoY) {
    parts.push(`営業利益 ${opYoY}`);
  }
  if (derived.roic != null) {
    const posStr = roicPos ? `（${roicPos}）` : "";
    parts.push(`ROIC ${formatPct(derived.roic)}${posStr}`);
  }
  if (derived.equity_ratio != null) {
    parts.push(`自己資本比率 ${formatPct(derived.equity_ratio, 0)}`);
  }

  const summary = parts.length > 0
    ? `${company.name}（${fy}年度）: ` + parts.join(" / ") + "。"
    : `${company.name}の${fy}年度財務データ。`;

  return { summary, highlights: [] };
}

// ─── Earnings numbers (for earnings_review card) ──────────────

export function generateEarningsNumbers(
  report: FinancialReport,
  prevReport?: FinancialReport | null,
): EarningsNumbers {
  const result: EarningsNumbers = {};

  if (report.net_sales != null && prevReport?.net_sales != null) {
    result.salesYoY = yoyText(report.net_sales, prevReport.net_sales) ?? undefined;
  }
  if (report.operating_income != null && prevReport?.operating_income != null) {
    result.opYoY = yoyText(report.operating_income, prevReport.operating_income) ?? undefined;
  }
  if (report.net_income != null && prevReport?.net_income != null) {
    result.niYoY = yoyText(report.net_income, prevReport.net_income) ?? undefined;
  }

  // Forecast progress
  if (report.net_sales != null && report.forecast_net_sales != null && report.forecast_net_sales > 0) {
    result.salesProgress = `予想比${((report.net_sales / report.forecast_net_sales) * 100).toFixed(0)}%`;
  }
  if (report.operating_income != null && report.forecast_operating_income != null && report.forecast_operating_income > 0) {
    result.opProgress = `予想比${((report.operating_income / report.forecast_operating_income) * 100).toFixed(0)}%`;
  }
  if (report.net_income != null && report.forecast_net_income != null && report.forecast_net_income > 0) {
    result.niProgress = `予想比${((report.net_income / report.forecast_net_income) * 100).toFixed(0)}%`;
  }

  return result;
}

// ─── Template key points (fallback when no AI insight) ────────

export function generateTemplateKeyPoints(
  ctx: NarrativeContext,
  level: string,
): TemplateKeyPoint[] {
  const { report, derived, prevReport, sectorLabel, benches } = ctx;
  const sectorName = sectorLabel ?? "同業種";

  const salesYoY = report.net_sales != null ? yoyText(report.net_sales, prevReport?.net_sales) : null;
  const opYoY = report.operating_income != null ? yoyText(report.operating_income, prevReport?.operating_income) : null;
  const fcf = (report.cf_operating ?? 0) + (report.cf_investing ?? 0);

  const questions: TemplateKeyPoint[] = [];

  if (level === "easy") {
    if (salesYoY) {
      questions.push({ question: `売上高が${salesYoY}となった背景として、どのような事業環境の変化が考えられるでしょうか？` });
    } else if (report.net_sales != null) {
      questions.push({ question: `売上高${formatBigNum(report.net_sales)}の規模はどのような事業活動から生まれていますか？` });
    }
    if (derived.op_margin != null) {
      const bench = benches?.op_margin;
      const posStr = bench ? `（${sectorName}内: ${positionLabel(approximatePercentile(derived.op_margin, bench))}）` : "";
      questions.push({ question: `営業利益率${formatPct(derived.op_margin)}${posStr}の水準をどう読み解けばよいですか？` });
    }
    return questions.slice(0, 2);
  }

  // Standard / Pro
  if (salesYoY) {
    questions.push({ question: `売上高${salesYoY}の主な増減要因は何でしょうか？` });
  }
  if (opYoY) {
    questions.push({ question: `営業利益${opYoY}の変動に対して、固定費・変動費構造はどう作用していますか？` });
  }
  if (derived.op_margin != null && benches?.op_margin) {
    const pos = positionLabel(approximatePercentile(derived.op_margin, benches.op_margin));
    questions.push({ question: `営業利益率${formatPct(derived.op_margin)}（${sectorName}内${pos}）の水準を維持・改善するための課題は何でしょうか？` });
  }
  if (derived.roic != null) {
    questions.push({ question: `ROIC ${formatPct(derived.roic)}は資本コストとどのような関係にあると考えられますか？` });
  }
  if (report.cf_operating != null) {
    const fcfText = fcf >= 0 ? `プラス${formatBigNum(fcf)}` : `マイナス${formatBigNum(Math.abs(fcf))}`;
    questions.push({ question: `FCF${fcfText}の水準は、将来の設備投資や株主還元の余力にどう影響しますか？` });
  }
  if (derived.equity_ratio != null && questions.length < 5) {
    questions.push({ question: `自己資本比率${formatPct(derived.equity_ratio, 0)}の財務構造は業種特性をどう反映していますか？` });
  }

  const count = level === "pro" ? 5 : 3;
  return questions.slice(0, count);
}
