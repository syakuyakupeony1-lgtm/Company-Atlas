"use client";

import { formatBigNum, formatPct } from "@/lib/metrics";
import type { FinancialReport } from "@/lib/types";

interface Slice {
  id: string;
  label: string;
  amount: number;
  pct: number;
  color: string;
}

interface SSFlowData {
  netIncome: number;
  dividends: number;
  buybacks: number;
  retained: number;
  totalEquity: number | null;
  retainedEarnings: number | null;
}

export function buildSSData(r: FinancialReport): SSFlowData | null {
  const ni = r.net_income;
  if (!ni || ni <= 0) return null;

  const dividends = r.dividends_paid != null ? Math.abs(r.dividends_paid) : 0;
  const buybacks  = r.treasury_purchases != null ? Math.abs(r.treasury_purchases) : 0;
  const retained  = Math.max(0, ni - dividends - buybacks);

  return {
    netIncome: ni,
    dividends,
    buybacks,
    retained,
    totalEquity: r.total_equity ?? null,
    retainedEarnings: r.retained_earnings ?? null,
  };
}

interface SSFlowProps {
  data: SSFlowData;
}

export function SSFlow({ data }: SSFlowProps) {
  const { netIncome, dividends, buybacks, retained } = data;

  const slices: Slice[] = [
    { id: "retained", label: "内部留保", amount: retained,  pct: (retained  / netIncome) * 100, color: "#5B8DEF" }, // cat-1
    { id: "dividend", label: "配当",     amount: dividends, pct: (dividends / netIncome) * 100, color: "#57B3A4" }, // cat-2
    { id: "buyback",  label: "自社株買", amount: buybacks,  pct: (buybacks  / netIncome) * 100, color: "#E0A458" }, // cat-3
  ].filter(s => s.amount > 0);

  const totalPct = slices.reduce((s, sl) => s + sl.pct, 0);

  return (
    <div>
      {/* Net income header */}
      <div className="flex items-baseline gap-2 mb-4">
        <span style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)" }}>純利益</span>
        <span className="num" style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 700, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
          {formatBigNum(netIncome)}
        </span>
        <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>の使途</span>
      </div>

      {/* Allocation bar */}
      <div
        className="flex overflow-hidden"
        style={{ borderRadius: 6, height: 36, gap: 2 }}
        role="img"
        aria-label="純利益の使途内訳"
      >
        {slices.map((sl) => (
          <div
            key={sl.id}
            title={`${sl.label}: ${formatBigNum(sl.amount)} (${sl.pct.toFixed(1)}%)`}
            style={{
              flex: sl.pct / 100,
              background: sl.color,
              opacity: 0.7,
              minWidth: 4,
              transition: "flex 400ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        ))}
        {totalPct < 99.5 && (
          <div style={{ flex: (100 - totalPct) / 100, background: "var(--surface-sunken)", minWidth: 4 }} />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {slices.map((sl) => (
          <div key={sl.id} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: sl.color, flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-secondary)" }}>{sl.label}</span>
            </div>
            <span className="num" style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--ink)", marginLeft: 14, fontVariantNumeric: "tabular-nums" }}>
              {formatBigNum(sl.amount)}
            </span>
            <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", marginLeft: 14 }}>
              {formatPct(sl.pct)}
            </span>
          </div>
        ))}
      </div>

      {/* Equity stats */}
      {(data.totalEquity != null || data.retainedEarnings != null) && (
        <div
          className="flex gap-6 mt-5 pt-4"
          style={{ borderTop: "1px solid var(--hairline)" }}
        >
          {data.totalEquity != null && (
            <div>
              <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>純資産</p>
              <p className="num" style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {formatBigNum(data.totalEquity)}
              </p>
            </div>
          )}
          {data.retainedEarnings != null && (
            <div>
              <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>利益剰余金</p>
              <p className="num" style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {formatBigNum(data.retainedEarnings)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
