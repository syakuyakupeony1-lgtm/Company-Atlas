"use client";

import type { CSSProperties } from "react";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import { Tooltip } from "@/components/ui/Tooltip";
import { TrendChart } from "@/components/charts/TrendChart";
import type { FinancialReport } from "@/lib/types";

interface TimelineCardProps {
  reports: FinancialReport[];
  staggerIndex?: number;
}

export function TimelineCard({ reports, staggerIndex = 0 }: TimelineCardProps) {
  const { level } = useLevelContext();
  const staggerStyle = { "--stagger": staggerIndex } as CSSProperties;

  const desc =
    level === "easy"
      ? "会社の売上や利益が年々どう変わってきたかを折れ線グラフで確認します。右肩上がりなら成長中のサインです"
      : "複数期の財務指標を折れ線で比較。指標チェックで重ね合わせ、指数化で成長倍率を相対比較できます";

  if (reports.length < 2) return null;

  return (
    <article className="card mb-6 expose" style={staggerStyle} aria-label="業績推移">
      <div
        className="flex items-center gap-2 mb-4"
        style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}
      >
        <h2
          className="heading-ja"
          style={{ fontSize: "var(--text-h2)", color: "var(--ink)", margin: 0 }}
        >
          業績推移
        </h2>
        <Tooltip
          content={<span style={{ fontFamily: "var(--font-noto)" }}>{desc}</span>}
          infoIcon
        />
        <span
          style={{
            marginLeft: "auto",
            fontSize: "var(--text-caption)",
            color: "var(--ink-tertiary)",
          }}
        >
          {reports.length}期分
        </span>
      </div>

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
          見たい指標をボタンで選んでください。「指数化」を押すと最初の年を100として成長率が比べやすくなります。
        </p>
      )}

      <TrendChart reports={reports} />
    </article>
  );
}
