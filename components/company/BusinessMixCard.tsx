"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import { Tooltip } from "@/components/ui/Tooltip";
import { Treemap, type TreemapItem } from "@/components/charts/Treemap";
import { formatBigNum } from "@/lib/metrics";
import type { FinancialReport } from "@/lib/types";

type Tab = "asset" | "revenue" | "profit";

const TABS: { id: Tab; label: string }[] = [
  { id: "asset",   label: "資産構成" },
  { id: "revenue", label: "売上構成" },
  { id: "profit",  label: "利益構成" },
];

// Asset category colors (--cat-*)
const ASSET_COLORS = {
  cash:       "var(--cat-2)",  // teal
  inventory:  "var(--cat-3)",  // amber
  ppe:        "var(--cat-4)",  // purple
  goodwill:   "var(--cat-6)",  // muted red
  investment: "var(--cat-1)",  // blue
  other:      "#B7B7BD",       // --cost gray
};

function buildAssetItems(r: FinancialReport): TreemapItem[] {
  const cash       = r.cash_and_deposits ?? 0;
  const inventory  = r.inventories       ?? 0;
  const ppe        = r.ppe               ?? 0;
  const goodwill   = r.goodwill          ?? 0;
  const investment = r.investment_secs   ?? 0;
  const total      = r.total_assets      ?? 0;
  const other = Math.max(0, total - cash - inventory - ppe - goodwill - investment);

  return [
    { id: "cash",       label: "現金・預金",    value: cash,       color: ASSET_COLORS.cash },
    { id: "inventory",  label: "棚卸資産",      value: inventory,  color: ASSET_COLORS.inventory },
    { id: "ppe",        label: "有形固定資産",  value: ppe,        color: ASSET_COLORS.ppe },
    { id: "goodwill",   label: "のれん",        value: goodwill,   color: ASSET_COLORS.goodwill },
    { id: "investment", label: "投資有価証券",  value: investment, color: ASSET_COLORS.investment },
    { id: "other",      label: "その他資産",    value: other,      color: ASSET_COLORS.other },
  ].filter((it) => it.value > 0);
}

function SingleSegmentItem(props: { label: string; value: number; note: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--surface-sunken)",
          borderRadius: "var(--r-control)",
          border: "1px solid var(--hairline)",
        }}
      >
        <span style={{ fontSize: "var(--text-label)", color: "var(--ink)" }}>全社単一</span>
        <span
          className="num"
          style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--ink)" }}
        >
          {formatBigNum(props.value)}
        </span>
      </div>
      <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>
        {props.note}
        <span
          className="ml-1 px-1.5 py-0.5"
          style={{
            background: "var(--surface-sunken)",
            borderRadius: "var(--r-chip)",
            border: "1px solid var(--hairline)",
          }}
        >
          セグメント別は近日対応
        </span>
      </p>
    </div>
  );
}

interface BusinessMixCardProps {
  report: FinancialReport;
  staggerIndex?: number;
}

export function BusinessMixCard({ report, staggerIndex = 0 }: BusinessMixCardProps) {
  const { level } = useLevelContext();
  const [activeTab, setActiveTab] = useState<Tab>("asset");
  const staggerStyle = { "--stagger": staggerIndex } as CSSProperties;

  const assetItems = buildAssetItems(report);

  const desc =
    level === "easy"
      ? "会社が持っているものの内訳。現金が多いか、建物・設備が多いかで業種の性質がわかります"
      : "貸借対照表の資産サイドを構成比で分解。業種特性や経営戦略が資産の形に現れる";

  return (
    <article className="card mb-6 expose" style={staggerStyle} aria-label="Business Mix">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4" style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}>
        <h2 className="heading-ja" style={{ fontSize: "var(--text-h2)", color: "var(--ink)", margin: 0 }}>
          Business Mix
        </h2>
        <Tooltip content={desc} infoIcon />
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-4 p-0.5"
        role="tablist"
        aria-label="構成表示を切替"
        style={{
          background: "var(--surface-sunken)",
          borderRadius: "var(--r-control)",
          width: "fit-content",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`mix-panel-${tab.id}`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-1 transition-all"
            style={{
              borderRadius: "var(--r-control)",
              border: "none",
              background: activeTab === tab.id ? "var(--surface)" : "transparent",
              color: activeTab === tab.id ? "var(--ink)" : "var(--ink-tertiary)",
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: "var(--text-caption)",
              cursor: "pointer",
              boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,.07)" : "none",
              transitionDuration: "150ms",
              fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          role="tabpanel"
          id={`mix-panel-${activeTab}`}
        >
          {activeTab === "asset" && (
            <Treemap items={assetItems} height={220} compact />
          )}
          {activeTab === "revenue" && (
            <SingleSegmentItem
              label="売上高"
              value={report.net_sales ?? 0}
              note="セグメント別売上データを準備中です。"
            />
          )}
          {activeTab === "profit" && (
            <SingleSegmentItem
              label="営業利益"
              value={report.operating_income ?? 0}
              note="セグメント別利益データを準備中です。"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </article>
  );
}
