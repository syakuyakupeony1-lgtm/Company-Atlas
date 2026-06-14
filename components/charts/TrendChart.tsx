"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { deriveAll } from "@/lib/metrics";
import { formatBigNum } from "@/lib/metrics";
import { computeBench } from "@/lib/sector-bench";
import type { FinancialReport } from "@/lib/types";

// ─── Metric definitions ───────────────────────────────────────
interface MetricDef {
  key: string;
  label: string;
  isRatio?: boolean;   // % metric (op_margin, equity_ratio)
  color: string;
}

const METRICS: MetricDef[] = [
  { key: "net_sales",        label: "売上高",      color: "#5B8DEF" }, // cat-1
  { key: "operating_income", label: "営業利益",    color: "#57B3A4" }, // cat-2
  { key: "net_income",       label: "純利益",      color: "#1A7F4B" }, // pos
  { key: "cf_operating",     label: "営業CF",      color: "#E0A458" }, // cat-3
  { key: "total_assets",     label: "総資産",      color: "#B57BD6" }, // cat-4
  { key: "total_equity",     label: "純資産",      color: "#6BA368" }, // cat-5
  { key: "op_margin",        label: "営業利益率",  color: "#D98C8C", isRatio: true }, // cat-6
];

const DEFAULT_SELECTED = ["net_sales", "operating_income"];

function extractValue(report: FinancialReport, key: string): number | null {
  if (key === "op_margin") {
    const d = deriveAll(report);
    return d.op_margin ?? null;
  }
  return (report as unknown as Record<string, unknown>)[key] as number ?? null;
}

interface ChartPoint {
  year: number;
  [key: string]: number | null;
}

function buildChartData(reports: FinancialReport[], metrics: string[], indexed: boolean): ChartPoint[] {
  const sorted = [...reports].sort((a, b) => a.fiscal_year - b.fiscal_year);
  const raw: ChartPoint[] = sorted.map((r) => {
    const pt: ChartPoint = { year: r.fiscal_year };
    for (const m of metrics) {
      pt[m] = extractValue(r, m);
    }
    return pt;
  });
  if (!indexed || raw.length === 0) return raw;

  // Index to first year = 100
  const base = raw[0];
  return raw.map((pt) => {
    const indexed: ChartPoint = { year: pt.year };
    for (const m of metrics) {
      const bv = base[m];
      const v  = pt[m];
      indexed[m] = bv != null && bv !== 0 && v != null ? (v / bv) * 100 : null;
    }
    return indexed;
  });
}

// ─── Custom tooltip ──────────────────────────────────────────
function CustomTooltip({ active, payload, label, indexed, reports }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number | null; color: string }>;
  label?: number;
  indexed: boolean;
  reports: FinancialReport[];
}) {
  if (!active || !payload?.length) return null;
  const report = reports.find(r => r.fiscal_year === label);

  return (
    <div
      style={{
        background: "var(--ink)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: "var(--text-caption)",
        color: "#fff",
        lineHeight: 1.6,
        boxShadow: "0 4px 16px rgba(0,0,0,.2)",
        maxWidth: 220,
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}年度</p>
      {payload.map((entry) => {
        const def = METRICS.find(m => m.key === entry.dataKey);
        if (!def || entry.value == null) return null;
        let rawLabel = "";
        if (indexed) {
          const rawVal = report ? extractValue(report, entry.dataKey) : null;
          rawLabel = rawVal != null ? `（${def.isRatio ? rawVal.toFixed(1) + "%" : formatBigNum(rawVal)}）` : "";
        }
        return (
          <div key={entry.dataKey} className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-noto)" }}>{def.label}</span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {indexed
                ? `${entry.value.toFixed(1)} ${rawLabel}`
                : def.isRatio
                ? `${entry.value.toFixed(1)}%`
                : formatBigNum(entry.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface TrendChartProps {
  reports: FinancialReport[];
}

export function TrendChart({ reports }: TrendChartProps) {
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);
  const [indexed, setIndexed] = useState(false);

  const chartData = useMemo(
    () => buildChartData(reports, selected, indexed),
    [reports, selected, indexed],
  );

  // Historical range band: p25–p75 across all years for a single selected metric.
  // Only shown in non-indexed mode when exactly one metric is selected.
  const histRange = useMemo(() => {
    if (indexed || selected.length !== 1) return null;
    const key = selected[0];
    const values = reports.map((r) => extractValue(r, key)).filter((v): v is number => v != null);
    const bench = computeBench(values);
    if (!bench) return null;
    return { y1: bench.q1, y2: bench.q3, color: METRICS.find(m => m.key === key)?.color ?? "#888" };
  }, [reports, selected, indexed]);

  function toggleMetric(key: string) {
    setSelected(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key],
    );
  }

  const yFormatter = (v: number) => {
    if (indexed) return `${v.toFixed(0)}`;
    const hasRatio = selected.some(k => METRICS.find(m => m.key === k)?.isRatio);
    const hasAbsolute = selected.some(k => !METRICS.find(m => m.key === k)?.isRatio);
    if (hasRatio && !hasAbsolute) return `${v.toFixed(1)}%`;
    return formatBigNum(v);
  };

  if (reports.length < 2) {
    return <p style={{ color: "var(--ink-tertiary)", fontSize: "var(--text-label)", textAlign: "center", padding: "24px 0" }}>推移データが2期分以上ありません</p>;
  }

  return (
    <div>
      {/* Metric selector chips */}
      <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="指標を選択">
        {METRICS.map((m) => {
          const active = selected.includes(m.key);
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={active}
              onClick={() => toggleMetric(m.key)}
              className="px-2.5 py-1 transition-all"
              style={{
                borderRadius: "var(--r-chip)",
                border: active ? `1.5px solid ${m.color}` : "1.5px solid var(--hairline)",
                background: active ? `${m.color}18` : "transparent",
                color: active ? m.color : "var(--ink-tertiary)",
                fontSize: "var(--text-caption)",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transitionDuration: "120ms",
                fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
              }}
            >
              {m.label}
            </button>
          );
        })}

        {/* Index mode toggle */}
        <button
          type="button"
          aria-pressed={indexed}
          onClick={() => setIndexed(v => !v)}
          className="px-2.5 py-1 ml-2 transition-all"
          style={{
            borderRadius: "var(--r-chip)",
            border: indexed ? "1.5px solid var(--accent)" : "1.5px solid var(--hairline)",
            background: indexed ? "var(--accent-weak)" : "transparent",
            color: indexed ? "var(--accent)" : "var(--ink-tertiary)",
            fontSize: "var(--text-caption)",
            fontWeight: indexed ? 600 : 400,
            cursor: "pointer",
            transitionDuration: "120ms",
            fontFamily: "var(--font-inter), Inter, sans-serif",
          }}
        >
          指数化（起点=100）
        </button>
      </div>

      {indexed && (
        <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", marginBottom: 12 }}>
          最初の期を100として各年の成長倍率を表示
        </p>
      )}
      {histRange && !indexed && (
        <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", marginBottom: 8 }}>
          帯は自社過去実績のQ1〜Q3レンジ
        </p>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 4 }}>
          <CartesianGrid
            strokeDasharray="3 0"
            stroke="var(--hairline)"
            vertical={false}
          />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "var(--ink-tertiary)", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(y) => `'${String(y).slice(2)}`}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--ink-tertiary)", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yFormatter}
            width={52}
          />
          <Tooltip
            content={<CustomTooltip indexed={indexed} reports={reports} />}
            cursor={{ stroke: "var(--hairline)", strokeWidth: 1 }}
          />
          {/* Historical range band (Q1–Q3 of own data) */}
          {histRange && (
            <ReferenceArea
              y1={histRange.y1}
              y2={histRange.y2}
              fill={histRange.color}
              fillOpacity={0.07}
              stroke="none"
            />
          )}
          {selected.map((key) => {
            const def = METRICS.find(m => m.key === key)!;
            return (
              <Line
                key={key}
                type="monotoneX"
                dataKey={key}
                stroke={def.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: def.color }}
                connectNulls={false}
                animationDuration={300}
                animationEasing="ease-out"
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
