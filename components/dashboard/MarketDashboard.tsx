"use client";

import { useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import type { MarketStat, MarketSummaryRow } from "@/lib/types";

interface MarketDashboardProps {
  stats: MarketStat[];
  summary: MarketSummaryRow[];
  /** Currently selected market codes (from URL). Empty = 全市場 */
  selectedMarkets: string[];
  fiscalYear: number;
  /** Whether this section is collapsed */
  collapsed: boolean;
  onToggle: () => void;
}

interface StatDef {
  key: string;
  label: string;
  desc: string;
  plain: string;
  fromStats?: string;   // metric_key in market_stats
  fromSummary?: string; // metric in market_summary
  format: (v: number) => string;
}

const STAT_DEFS: StatDef[] = [
  {
    key: "op_margin",
    label: "平均営業利益率",
    desc: "全上場企業の営業利益率の平均値。業種で大きくばらつくので下の業界マップで確認",
    plain: "日本の会社は平均このくらい本業で儲けている",
    fromStats: "op_margin",
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: "roic",
    label: "平均ROIC",
    desc: "投下資本に対する税引後営業利益の平均（簡易計算）",
    plain: "平均的にどれだけ元手を活かして稼いでいるか",
    fromStats: "roic",
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: "equity_ratio",
    label: "自己資本比率（中央値）",
    desc: "上場企業の自己資本比率の中央値。高いほど財務が安定",
    plain: "上場企業の借金割合の目安。この数字より高ければ財務は安定傾向",
    fromStats: "equity_ratio",
    format: (v) => `${v.toFixed(0)}%`,
  },
  {
    key: "revenue_up_ratio",
    label: "増収企業",
    desc: "前期より売上が増えた企業の割合",
    plain: "売上が増えた会社の比率",
    fromSummary: "revenue_up_ratio",
    format: (v) => `${(v * 100).toFixed(0)}%`,
  },
  {
    key: "profit_up_ratio",
    label: "増益企業",
    desc: "前期より営業利益が増えた企業の割合",
    plain: "儲けが増えた会社の比率",
    fromSummary: "profit_up_ratio",
    format: (v) => `${(v * 100).toFixed(0)}%`,
  },
  {
    key: "listed_count",
    label: "上場社数",
    desc: "現在の上場企業総数（東証全市場）",
    plain: "日本に上場している会社の数",
    fromSummary: "listed_count",
    format: (v) => `${v.toLocaleString("ja-JP")}社`,
  },
];

export function MarketDashboard({
  stats,
  summary,
  selectedMarkets,
  fiscalYear,
  collapsed,
  onToggle,
}: MarketDashboardProps) {
  const { level } = useLevelContext();

  // Resolve market code for lookup (null = 全市場)
  const marketCode =
    selectedMarkets.length === 1 ? selectedMarkets[0] : null;

  // Build lookup maps
  const statMap = new Map<string, MarketStat>();
  for (const s of stats) {
    if (s.fiscal_year === fiscalYear && (s.market_code ?? null) === marketCode) {
      statMap.set(s.metric_key, s);
    }
  }
  const summaryMap = new Map<string, MarketSummaryRow>();
  for (const s of summary) {
    if (s.fiscal_year === fiscalYear && (s.market_code ?? null) === marketCode) {
      summaryMap.set(s.metric, s);
    }
  }

  function getValue(def: StatDef): number | null {
    if (def.fromStats) {
      const s = statMap.get(def.fromStats);
      if (!s) return null;
      return def.fromStats === "equity_ratio" ? (s.median ?? null) : (s.mean ?? null);
    }
    if (def.fromSummary) {
      const s = summaryMap.get(def.fromSummary);
      return s?.value ?? null;
    }
    return null;
  }

  const marketLabel =
    selectedMarkets.length === 1
      ? selectedMarkets[0] === "prime"
        ? "プライム"
        : selectedMarkets[0] === "standard"
        ? "スタンダード"
        : selectedMarkets[0] === "growth"
        ? "グロース"
        : selectedMarkets[0]
      : "全市場";

  return (
    <section aria-labelledby="market-dashboard-heading" className="mb-6">
      {/* Section header with collapse toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-4 group"
        aria-expanded={!collapsed}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 3,
              height: 16,
              borderRadius: 2,
              background: "var(--accent)",
              flexShrink: 0,
            }}
          />
          <h2
            id="market-dashboard-heading"
            className="heading-ja"
            style={{ fontSize: "var(--text-h2)", color: "var(--ink)" }}
          >
            市場ダッシュボード
          </h2>
          <span style={{ fontSize: "var(--text-label)", color: "var(--ink-tertiary)" }}>
            {marketLabel} · FY{fiscalYear}
          </span>
        </div>
        <span
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--ink-tertiary)",
            transform: collapsed ? "none" : "rotate(180deg)",
            transition: "transform 200ms var(--ease)",
          }}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {!collapsed && (
        /* Mobile: horizontal scroll carousel; Desktop: 3-col or 6-col grid */
        <div
          className="flex gap-3 overflow-x-auto pb-1 md:grid md:overflow-visible"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            scrollSnapType: "x mandatory",
          }}
        >
          {STAT_DEFS.map((def) => {
            const value = getValue(def);
            return (
              <StatCard
                key={def.key}
                def={def}
                value={value}
                level={level}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function StatCard({
  def,
  value,
  level,
}: {
  def: StatDef;
  value: number | null;
  level: string;
}) {
  const displayDesc = level === "easy" ? def.plain : def.desc;

  return (
    <div
      className="flex-shrink-0 flex flex-col gap-1 card"
      style={{
        minWidth: 160,
        scrollSnapAlign: "start",
        padding: "16px 20px",
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <p
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--ink-secondary)",
            lineHeight: 1.4,
            fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
          }}
        >
          {def.label}
        </p>
        <Tooltip content={displayDesc} infoIcon />
      </div>

      <p
        className="num mt-1"
        style={{
          fontSize: "clamp(22px, 3vw, 28px)",
          fontWeight: 700,
          color: value != null ? "var(--ink)" : "var(--ink-tertiary)",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
        aria-label={value != null ? `${def.label}: ${def.format(value)}` : `${def.label}: データなし`}
      >
        {value != null ? def.format(value) : "—"}
      </p>
    </div>
  );
}
