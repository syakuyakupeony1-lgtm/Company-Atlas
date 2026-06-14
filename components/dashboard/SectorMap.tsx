"use client";

import { useState, useMemo } from "react";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import type { Sector, SectorStat } from "@/lib/types";

type MetricMode = "op_margin" | "roic" | "equity_ratio" | "fcf";

const METRIC_LABELS: Record<MetricMode, string> = {
  op_margin:    "営業利益率",
  roic:         "ROIC",
  equity_ratio: "自己資本比率",
  fcf:          "FCF",
};

interface SectorEntry {
  sector: Sector;
  stat?: SectorStat;    // stat for the chosen metric
}

interface SectorMapProps {
  sectors: Sector[];
  sectorStats: SectorStat[];
  selectedSector: string | undefined;
  onSelectSector: (code: string | undefined) => void;
  fiscalYear: number;
  collapsed: boolean;
  onToggle: () => void;
}

// Cat colors for sectors (looping)
const CAT_COLORS = [
  "var(--cat-1)", "var(--cat-2)", "var(--cat-3)",
  "var(--cat-4)", "var(--cat-5)", "var(--cat-6)",
];

export function SectorMap({
  sectors,
  sectorStats,
  selectedSector,
  onSelectSector,
  fiscalYear,
  collapsed,
  onToggle,
}: SectorMapProps) {
  const [metric, setMetric] = useState<MetricMode>("op_margin");
  const { level } = useLevelContext();

  // Build stat lookup for the current metric + year
  const statLookup = useMemo(() => {
    const map = new Map<string, SectorStat>();
    for (const s of sectorStats) {
      if (s.fiscal_year === fiscalYear && s.metric_key === metric) {
        map.set(s.sector_code, s);
      }
    }
    return map;
  }, [sectorStats, fiscalYear, metric]);

  // Build entries for sectors that have data
  const entries: SectorEntry[] = useMemo(
    () =>
      sectors
        .map((sector) => ({
          sector,
          stat: statLookup.get(sector.code),
        }))
        .filter((e) => e.stat != null), // only show sectors with data
    [sectors, statLookup],
  );

  const metricLabel = METRIC_LABELS[metric];

  return (
    <section aria-labelledby="sector-map-heading" className="mb-6">
      {/* Header + collapse */}
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
              background: "var(--cat-2)",
              flexShrink: 0,
            }}
          />
          <h2
            id="sector-map-heading"
            className="heading-ja"
            style={{ fontSize: "var(--text-h2)", color: "var(--ink)" }}
          >
            業界マップ
          </h2>
          <span style={{ fontSize: "var(--text-label)", color: "var(--ink-tertiary)" }}>
            タップで企業を絞り込み
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
        <>
          {/* Metric toggle */}
          <div
            className="flex items-center gap-2 mb-4 flex-wrap"
            role="radiogroup"
            aria-label="表示指標を切替"
          >
            <span
              style={{
                fontSize: "var(--text-caption)",
                color: "var(--ink-tertiary)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontFamily: "var(--font-inter), Inter, sans-serif",
              }}
            >
              表示
            </span>
            {(Object.entries(METRIC_LABELS) as [MetricMode, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={metric === key}
                onClick={() => setMetric(key)}
                className="px-2.5 py-1 transition-all"
                style={{
                  borderRadius: "var(--r-chip)",
                  border: metric === key ? "none" : "1px solid var(--hairline)",
                  background: metric === key ? "var(--surface-sunken)" : "transparent",
                  color: metric === key ? "var(--ink)" : "var(--ink-secondary)",
                  fontSize: "var(--text-caption)",
                  fontWeight: metric === key ? 600 : 400,
                  cursor: "pointer",
                  transitionDuration: "120ms",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sector chips — horizontal scroll on mobile */}
          {level === "easy" && (
            <p
              className="mb-3"
              style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)" }}
            >
              業界によって「儲かりやすい水準」が全く違います。まず業界を選んで数値感を掴みましょう。
            </p>
          )}

          <div
            className="flex gap-2 overflow-x-auto pb-2 flex-wrap"
            style={{ scrollSnapType: "x mandatory" }}
            role="listbox"
            aria-label="業界を選択"
            aria-multiselectable="false"
          >
            {/* 全業種 chip */}
            <SectorChip
              label="全業種"
              active={!selectedSector}
              color="var(--ink)"
              metricLabel=""
              metricValue={null}
              metricMode={metric}
              onClick={() => onSelectSector(undefined)}
              aria-selected={!selectedSector}
            />

            {entries.length === 0 ? (
              <p style={{ fontSize: "var(--text-label)", color: "var(--ink-tertiary)" }}>
                業種データがありません
              </p>
            ) : (
              entries.map((e, i) => {
                const color = CAT_COLORS[i % CAT_COLORS.length];
                const stat = e.stat!;
                const medVal = stat.median ?? null;
                const isSelected = selectedSector === e.sector.code;

                return (
                  <SectorChip
                    key={e.sector.code}
                    label={e.sector.label_ja}
                    active={isSelected}
                    color={color}
                    metricLabel={metricLabel}
                    metricValue={medVal}
                    metricMode={metric}
                    onClick={() =>
                      onSelectSector(isSelected ? undefined : e.sector.code)
                    }
                    aria-selected={isSelected}
                  />
                );
              })
            )}
          </div>

          {/* Selected sector callout */}
          {selectedSector && entries.find((e) => e.sector.code === selectedSector) && (
            <SelectedSectorBanner
              entry={entries.find((e) => e.sector.code === selectedSector)!}
              metric={metric}
              metricLabel={metricLabel}
              level={level}
            />
          )}
        </>
      )}
    </section>
  );
}

// ─── Sector Chip ─────────────────────────────────────────────

function formatMetricValue(value: number | null, mode: MetricMode): string {
  if (value == null) return "—";
  if (mode === "op_margin" || mode === "roic" || mode === "equity_ratio") {
    return `${value.toFixed(1)}%`;
  }
  // fcf: yen value
  const abs = Math.abs(value);
  if (abs >= 1e8) return `${(value / 1e8).toFixed(0)}億`;
  return value.toLocaleString("ja-JP");
}

function SectorChip({
  label,
  active,
  color,
  metricLabel,
  metricValue,
  metricMode,
  onClick,
  "aria-selected": ariaSelected,
}: {
  label: string;
  active: boolean;
  color: string;
  metricLabel: string;
  metricValue: number | null;
  metricMode: MetricMode;
  onClick: () => void;
  "aria-selected": boolean;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={ariaSelected}
      onClick={onClick}
      className="flex-shrink-0 inline-flex flex-col items-start px-3 py-2 transition-all"
      style={{
        scrollSnapAlign: "start",
        borderRadius: "var(--r-control)",
        border: active
          ? `2px solid ${color}`
          : "1.5px solid var(--hairline)",
        background: active ? "var(--accent-weak)" : "var(--surface)",
        cursor: "pointer",
        transitionDuration: "120ms",
        transitionTimingFunction: "var(--ease)",
        minWidth: 100,
      }}
    >
      {/* Sector dot */}
      <span className="flex items-center gap-1.5 mb-0.5">
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "var(--text-caption)",
            color: active ? "var(--accent)" : "var(--ink)",
            fontWeight: active ? 600 : 400,
            fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </span>

      {/* Metric value */}
      {metricLabel && (
        <span
          className="num"
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--ink-secondary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {metricLabel} {formatMetricValue(metricValue, metricMode)}
        </span>
      )}
    </button>
  );
}

// ─── Selected sector callout ──────────────────────────────────

function SelectedSectorBanner({
  entry,
  metric,
  metricLabel,
  level,
}: {
  entry: SectorEntry;
  metric: MetricMode;
  metricLabel: string;
  level: string;
}) {
  const stat = entry.stat!;

  const benchDesc: Record<MetricMode, string> = {
    op_margin: `${entry.sector.label_ja}の営業利益率は中央値 ${stat.median?.toFixed(1) ?? "—"}%（四分位レンジ ${stat.q1?.toFixed(1) ?? "—"}〜${stat.q3?.toFixed(1) ?? "—"}%）。この業種内での位置で企業の数字を読みましょう。`,
    roic:      `${entry.sector.label_ja}のROICは中央値 ${stat.median?.toFixed(1) ?? "—"}%。`,
    equity_ratio: `${entry.sector.label_ja}の自己資本比率は中央値 ${stat.median?.toFixed(0) ?? "—"}%。`,
    fcf:       `${entry.sector.label_ja}のFCFは中央値 ${stat.median != null ? (stat.median / 1e8).toFixed(0) + "億円" : "—"}。`,
  };

  const easyDesc: Record<MetricMode, string> = {
    op_margin:    `${entry.sector.label_ja}は「${stat.median?.toFixed(1) ?? "—"}%くらいが普通」の業界です。この数字を基準に企業を見てみましょう。`,
    roic:         `${entry.sector.label_ja}では${stat.median?.toFixed(1) ?? "—"}%くらいが元手の活かし方の目安です。`,
    equity_ratio: `${entry.sector.label_ja}では自己資本比率${stat.median?.toFixed(0) ?? "—"}%くらいが一般的です。`,
    fcf:          `${entry.sector.label_ja}の自由なお金の目安は中央値${stat.median != null ? (stat.median / 1e8).toFixed(0) + "億円" : "—"}です。`,
  };

  return (
    <div
      className="mt-3 px-4 py-3 expose"
      style={{
        background: "var(--accent-weak)",
        borderRadius: "var(--r-control)",
        border: "1px solid var(--hairline)",
      }}
      role="status"
      aria-live="polite"
    >
      <p style={{ fontSize: "var(--text-label)", color: "var(--ink)" }}>
        {level === "easy" ? easyDesc[metric] : benchDesc[metric]}
        {stat.sample_size != null && (
          <span style={{ color: "var(--ink-tertiary)", marginLeft: 8, fontSize: "var(--text-caption)" }}>
            （{stat.sample_size}社）
          </span>
        )}
      </p>
    </div>
  );
}
