import { formatFiscalPeriod, formatJapaneseDate } from "@/lib/format";
import type { FinancialReport } from "@/lib/types";

interface FreshnessHeaderProps {
  report: FinancialReport;
  fiscalMonth?: number | null;
}

const STALE_THRESHOLD_MS = 365 * 24 * 60 * 60 * 1000;

export function FreshnessHeader({ report, fiscalMonth }: FreshnessHeaderProps) {
  const period = formatFiscalPeriod(report.fiscal_year, fiscalMonth);
  const disclosed = formatJapaneseDate(report.disclosed_at);

  const isStale =
    report.disclosed_at &&
    Date.now() - new Date(report.disclosed_at).getTime() > STALE_THRESHOLD_MS;

  return (
    <div
      className="flex items-center gap-3 mb-6 flex-wrap"
      style={{ fontSize: "var(--text-label)" }}
    >
      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{period}</span>

      <span aria-hidden="true" style={{ color: "var(--hairline)" }}>|</span>

      <span style={{ color: "var(--ink-secondary)" }}>{disclosed}提出</span>

      {isStale && (
        <span
          className="px-2 py-0.5"
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--ink-tertiary)",
            background: "var(--surface-sunken)",
            borderRadius: "var(--r-chip)",
            border: "1px solid var(--hairline)",
          }}
        >
          ※ 最新期ではない可能性があります
        </span>
      )}
    </div>
  );
}
