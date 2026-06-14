"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import { Tooltip } from "@/components/ui/Tooltip";
import { RangeBadge } from "@/components/table/RangeBadge";
import { formatBigNum, formatPct } from "@/lib/metrics";
import { formatMarketLabel } from "@/lib/format";
import type { BenchResult, SectorBenches } from "@/lib/sector-bench";
import type { SnapshotNarrative } from "@/lib/narrative";
import type { Company, FinancialReport, DerivedMetrics } from "@/lib/types";

interface SnapshotCardProps {
  company: Company;
  report: FinancialReport | null;
  derived: DerivedMetrics;
  sectorLabel?: string | null;
  benches: SectorBenches;
  narrative: SnapshotNarrative;
  staggerIndex?: number;
}

const MARKET_COLOR: Record<string, string> = {
  prime:    "var(--accent)",
  standard: "var(--cat-3)",
  growth:   "var(--pos)",
  pro:      "var(--cat-4)",
};

export function SnapshotCard({
  company,
  report,
  derived,
  sectorLabel,
  benches,
  narrative,
  staggerIndex = 0,
}: SnapshotCardProps) {
  const { level } = useLevelContext();
  const staggerStyle = { "--stagger": staggerIndex } as CSSProperties;

  const mktColor = company.market_code ? (MARKET_COLOR[company.market_code] ?? "var(--ink-secondary)") : "var(--ink-secondary)";
  const hasBenches = Object.values(benches).some((b) => b != null);

  return (
    <article className="card mb-6 expose" style={staggerStyle} aria-label="企業スナップショット">

      {/* ── Company identity ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* Market chip */}
            {company.market_code && (
              <span
                className="px-2 py-0.5"
                style={{
                  fontSize: "var(--text-caption)",
                  color: mktColor,
                  background: "var(--surface-sunken)",
                  borderRadius: "var(--r-chip)",
                  border: `1px solid ${mktColor}`,
                  fontWeight: 500,
                }}
              >
                {formatMarketLabel(company.market_code)}
              </span>
            )}

            {/* Sector link */}
            {company.sector_code && sectorLabel && (
              <Link
                href={`/sector/${company.sector_code}`}
                style={{
                  fontSize: "var(--text-caption)",
                  color: "var(--ink-secondary)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--hairline)",
                }}
              >
                {sectorLabel}
              </Link>
            )}
          </div>

          {/* Company name */}
          <h1
            className="heading-ja"
            style={{ fontSize: "var(--text-h1)", color: "var(--ink)", margin: 0, lineHeight: 1.2 }}
          >
            {company.name}
          </h1>

          <div
            className="flex items-center gap-3 mt-1"
            style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)" }}
          >
            <span className="num">{company.ticker}</span>
            {company.fiscal_month && (
              <span>{company.fiscal_month}月決算</span>
            )}
          </div>
        </div>

        {/* Market cap if available */}
        {company.market_cap != null && (
          <div className="text-right">
            <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>時価総額</p>
            <p className="num" style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--ink)" }}>
              {formatBigNum(company.market_cap)}
            </p>
          </div>
        )}
      </div>

      {/* ── Narrative summary ─────────────────────────────────── */}
      <div
        className="mb-5 px-4 py-3"
        style={{
          background: "var(--surface-sunken)",
          borderRadius: "var(--r-control)",
          borderLeft: "3px solid var(--accent)",
        }}
      >
        {level === "easy" ? (
          <>
            <p style={{ fontSize: "var(--text-label)", color: "var(--ink)", lineHeight: 1.6 }}>
              {narrative.summary}
            </p>
            {narrative.highlights.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5">
                {narrative.highlights.map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "var(--text-caption)", flexShrink: 0 }}>
                      {i + 1}.
                    </span>
                    <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-secondary)" }}>
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: "var(--text-label)", color: "var(--ink)", lineHeight: 1.6 }}>
            {narrative.summary}
          </p>
        )}
      </div>

      {/* ── Key metrics ──────────────────────────────────────── */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
      >
        {/* 売上高 */}
        {report?.net_sales != null && (
          <MetricTile
            label="売上高"
            reading={level === "easy" ? "うりあげだか" : undefined}
            plain={level === "easy" ? "どれだけ売ったか" : undefined}
            desc="事業全体の売上規模"
            value={formatBigNum(report.net_sales)}
            level={level}
          >
            <RangeBadge
              value={report.net_sales}
              bench={benches.net_sales}
              level={level}
            />
          </MetricTile>
        )}

        {/* 営業利益 */}
        {report?.operating_income != null && (
          <MetricTile
            label="営業利益"
            reading={level === "easy" ? "えいぎょうりえき" : undefined}
            plain={level === "easy" ? "本業でいくら儲かったか" : undefined}
            desc="本業で稼ぐ力"
            value={formatBigNum(report.operating_income)}
            level={level}
          />
        )}

        {/* 営業利益率 */}
        {derived.op_margin != null && (
          <MetricTile
            label="営業利益率"
            reading={level === "easy" ? "えいぎょうりえきりつ" : undefined}
            plain={level === "easy" ? "売上に対して何%残るか" : undefined}
            desc="売上高に占める営業利益の割合。業種内比較が有効"
            value={formatPct(derived.op_margin)}
            level={level}
          >
            <RangeBadge
              value={derived.op_margin}
              bench={benches.op_margin}
              level={level}
            />
          </MetricTile>
        )}

        {/* ROIC */}
        {derived.roic != null && level !== "easy" && (
          <MetricTile
            label="ROIC（簡易）"
            desc="投下資本に対する税引後営業利益の割合（簡易計算）"
            value={formatPct(derived.roic)}
            level={level}
          >
            <RangeBadge
              value={derived.roic}
              bench={benches.roic}
              level={level}
            />
          </MetricTile>
        )}

        {/* 自己資本比率 */}
        {derived.equity_ratio != null && (
          <MetricTile
            label="自己資本比率"
            reading={level === "easy" ? "じこしほんひりつ" : undefined}
            plain={level === "easy" ? "借金に頼らない度合い" : undefined}
            desc="総資産に対する純資産の割合。高いほど財務が安定"
            value={formatPct(derived.equity_ratio, 0)}
            level={level}
          >
            <RangeBadge
              value={derived.equity_ratio}
              bench={benches.equity_ratio}
              level={level}
            />
          </MetricTile>
        )}
      </div>

      {/* Bench footnote */}
      {hasBenches && (
        <p
          className="mt-4"
          style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", lineHeight: 1.6 }}
        >
          {level === "easy"
            ? `※ バーは${sectorLabel ?? "業種内"}の四分位範囲（Q1〜Q3）における位置を示しています（高い=良いではありません）`
            : `※ 業種比較は${sectorLabel ?? "業種内"}の同期データによる中央値・四分位。比較企業数が少ない場合は参考値です`}
        </p>
      )}
    </article>
  );
}

// ─── Metric Tile ──────────────────────────────────────────────

interface MetricTileProps {
  label: string;
  reading?: string;
  plain?: string;
  desc: string;
  value: string;
  level: string;
  children?: React.ReactNode;
}

function MetricTile({ label, reading, plain, desc, value, level, children }: MetricTileProps) {
  return (
    <div
      className="flex flex-col gap-1 px-4 py-3"
      style={{
        background: "var(--surface-sunken)",
        borderRadius: "var(--r-control)",
      }}
    >
      {/* Label row */}
      <div className="flex items-center gap-1">
        <div className="flex flex-col">
          {reading && (
            <span style={{ fontSize: 9, color: "var(--ink-tertiary)", letterSpacing: "0.05em" }}>
              {reading}
            </span>
          )}
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--ink-secondary)",
              fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
            }}
          >
            {label}
          </span>
          {plain && (
            <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", lineHeight: 1.4 }}>
              {plain}
            </span>
          )}
        </div>
        {level !== "easy" && (
          <Tooltip content={desc} infoIcon />
        )}
      </div>

      {/* Value */}
      <p
        className="num"
        style={{
          fontSize: "clamp(20px, 3vw, 26px)",
          fontWeight: 700,
          color: "var(--ink)",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>

      {/* Sector range badge */}
      {children && (
        <div className="mt-1">{children}</div>
      )}
    </div>
  );
}
