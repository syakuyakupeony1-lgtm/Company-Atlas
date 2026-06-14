/**
 * Company-page formatting helpers.
 * Canonical number formatters live in lib/metrics.ts — import from there.
 */
export { formatYen, formatBigNum, formatPct, formatDelta } from "@/lib/metrics";

/** Format a fiscal period as "2024年3月期" */
export function formatFiscalPeriod(fiscalYear: number, fiscalMonth?: number | null): string {
  if (fiscalMonth) return `${fiscalYear}年${fiscalMonth}月期`;
  return `${fiscalYear}年度`;
}

/** Format ISO date string as "YYYY年M月D日" */
export function formatJapaneseDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** market_code → Japanese display label */
export function formatMarketLabel(code: string | null | undefined): string {
  const map: Record<string, string> = {
    prime: "プライム",
    standard: "スタンダード",
    growth: "グロース",
    pro: "PRO Market",
  };
  return code ? (map[code] ?? code) : "—";
}

/** Apply formatter, returning "—" when value is null/undefined */
export function fmtOr(
  value: number | null | undefined,
  fmt: (v: number) => string,
): string {
  if (value == null) return "—";
  return fmt(value);
}
