"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import { Tooltip } from "@/components/ui/Tooltip";
import { Treemap, type TreemapItem } from "@/components/charts/Treemap";
import { formatBigNum, formatPct } from "@/lib/metrics";
import type { FinancialReport } from "@/lib/types";

// ─── Asset categories ─────────────────────────────────────────
const ASSET_COLORS = {
  cash:       "var(--cat-2)",
  inventory:  "var(--cat-3)",
  ppe:        "var(--cat-4)",
  goodwill:   "var(--cat-6)",
  investment: "var(--cat-1)",
  other:      "#B7B7BD",
};

interface Category {
  id: string;
  label: string;
  value: number;
  color: string;
}

function buildCategories(r: FinancialReport): Category[] {
  const total = r.total_assets ?? 0;
  const cash       = r.cash_and_deposits ?? 0;
  const inventory  = r.inventories       ?? 0;
  const ppe        = r.ppe               ?? 0;
  const goodwill   = r.goodwill          ?? 0;
  const investment = r.investment_secs   ?? 0;
  const other      = Math.max(0, total - cash - inventory - ppe - goodwill - investment);

  return [
    { id: "cash",       label: "現金・預金",    value: cash,       color: ASSET_COLORS.cash },
    { id: "inventory",  label: "棚卸資産",      value: inventory,  color: ASSET_COLORS.inventory },
    { id: "ppe",        label: "有形固定資産",  value: ppe,        color: ASSET_COLORS.ppe },
    { id: "goodwill",   label: "のれん",        value: goodwill,   color: ASSET_COLORS.goodwill },
    { id: "investment", label: "投資有価証券",  value: investment, color: ASSET_COLORS.investment },
    { id: "other",      label: "その他資産",    value: other,      color: ASSET_COLORS.other },
  ].filter((c) => c.value > 0);
}

// ─── Judgment chip ────────────────────────────────────────────
interface Judgment {
  label: string;
  desc: string;
  color: string;
}

function judgeType(cats: Category[], total: number): Judgment | null {
  if (total <= 0 || cats.length === 0) return null;
  // Exclude "other" from judgment
  const knowns = cats.filter((c) => c.id !== "other");
  if (knowns.length === 0) return null;

  const pcts = Object.fromEntries(knowns.map((c) => [c.id, (c.value / total) * 100]));

  if ((pcts.goodwill ?? 0) > 12) {
    return { label: "M&A型", desc: "のれんが資産の12%超。積極的なM&Aで成長している企業に多いパターン", color: "var(--cat-6)" };
  }
  if ((pcts.ppe ?? 0) > 28) {
    return { label: "設備型", desc: "有形固定資産が大きい。製造業・インフラ・小売など設備投資が収益基盤", color: "var(--cat-4)" };
  }
  if ((pcts.inventory ?? 0) > 18) {
    return { label: "在庫型", desc: "棚卸資産比率が高い。製造・商社・食品など在庫回転が経営効率の鍵", color: "var(--cat-3)" };
  }
  if ((pcts.cash ?? 0) > 20) {
    return { label: "現金型", desc: "現金・預金比率が高い。財務安全性が高く、投資機会を狙っている企業に多い", color: "var(--cat-2)" };
  }
  return { label: "バランス型", desc: "特定の資産に偏りが少ない。安定した資産構成", color: "var(--ink-secondary)" };
}

interface BSCardProps {
  report: FinancialReport;
  staggerIndex?: number;
}

export function BSCard({ report, staggerIndex = 0 }: BSCardProps) {
  const { level } = useLevelContext();
  const staggerStyle = { "--stagger": staggerIndex } as CSSProperties;

  const categories = useMemo(() => buildCategories(report), [report]);
  const total = report.total_assets ?? 0;
  const judgment = useMemo(() => judgeType(categories, total), [categories, total]);

  const treemapItems: TreemapItem[] = categories.map((c) => ({
    id: c.id,
    label: c.label,
    value: c.value,
    color: c.color,
  }));

  const desc =
    level === "easy"
      ? "会社が持っているお金・物・設備などを面積で見せます。大きいタイルほど多くの資産が集まっています"
      : "貸借対照表の資産構成をTreemapで可視化。科目別の構成比と絶対額で資産の形を把握";

  if (total <= 0) {
    return (
      <article className="card mb-6 expose" style={staggerStyle} aria-label="BS X-Ray">
        <div className="flex items-center gap-2 mb-4" style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}>
          <h2 className="heading-ja" style={{ fontSize: "var(--text-h2)", color: "var(--ink)", margin: 0 }}>BS X-Ray</h2>
        </div>
        <p style={{ color: "var(--ink-tertiary)", fontSize: "var(--text-label)", textAlign: "center", padding: "24px 0" }}>
          BSデータがありません
        </p>
      </article>
    );
  }

  return (
    <article className="card mb-6 expose" style={staggerStyle} aria-label="BS X-Ray">
      {/* Header */}
      <div
        className="flex items-center gap-2 mb-4"
        style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}
      >
        <h2 className="heading-ja" style={{ fontSize: "var(--text-h2)", color: "var(--ink)", margin: 0 }}>
          BS X-Ray
        </h2>
        <Tooltip content={desc} infoIcon />
        <span style={{ marginLeft: "auto", fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>
          総資産 {formatBigNum(total)}
        </span>
      </div>

      {/* Easy intro */}
      {level === "easy" && (
        <p
          className="mb-4"
          style={{
            fontSize: "var(--text-label)",
            color: "var(--ink-secondary)",
            lineHeight: 1.6,
            padding: "10px 14px",
            background: "var(--surface-sunken)",
            borderRadius: "var(--r-control)",
          }}
        >
          面積が大きいほど資産が多い科目です。設備型・現金型など業種ごとに独特の形が現れます。
        </p>
      )}

      {/* Treemap */}
      <Treemap items={treemapItems} height={260} />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-1.5">
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: cat.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-secondary)" }}>
              {cat.label}
            </span>
            <span
              className="num"
              style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", fontVariantNumeric: "tabular-nums" }}
            >
              {formatPct((cat.value / total) * 100, 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Judgment chip */}
      {judgment && (
        <div
          className="mt-5 pt-4"
          style={{ borderTop: "1px solid var(--hairline)" }}
        >
          <div className="flex items-start gap-3">
            <span
              className="px-2.5 py-1 flex-shrink-0"
              style={{
                fontSize: "var(--text-label)",
                fontWeight: 600,
                color: judgment.color,
                background: "var(--surface-sunken)",
                borderRadius: "var(--r-chip)",
                border: `1.5px solid ${judgment.color}`,
              }}
            >
              {judgment.label}
            </span>
            <p style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)", lineHeight: 1.6, margin: 0 }}>
              {level === "easy"
                ? `この会社は「${judgment.label}」です。`
                : judgment.desc}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
