"use client";

import type { CSSProperties } from "react";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import { Tooltip } from "@/components/ui/Tooltip";
import { PLSankey } from "@/components/charts/PLSankey";
import type { FinancialReport } from "@/lib/types";

interface PLCardProps {
  report: FinancialReport;
  staggerIndex?: number;
}

export function PLCard({ report, staggerIndex = 0 }: PLCardProps) {
  const { level } = useLevelContext();
  const staggerStyle = { "--stagger": staggerIndex } as CSSProperties;

  const descContent =
    level === "easy"
      ? (
        <span>
          売上高がどのように「費用」と「利益」に分かれていくかを流れで見る図です。幅が広いほど金額が大きいです。
        </span>
      ) : (
        <span>
          PL構造をサンキー図で可視化。流量＝金額。費用フロー（灰）と利益フロー（色）で収益構造を一目で把握できます。
        </span>
      );

  return (
    <article className="card mb-6 expose" style={staggerStyle} aria-label="PL X-Ray">
      {/* Header */}
      <div
        className="flex items-center gap-2 mb-6"
        style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}
      >
        <h2 className="heading-ja" style={{ fontSize: "var(--text-h2)", color: "var(--ink)", margin: 0 }}>
          PL X-Ray
        </h2>
        <Tooltip content={descContent} infoIcon />
        <span style={{ marginLeft: "auto", fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>
          利益率の正体
        </span>
      </div>

      {/* Easy-mode intro */}
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
          太い帯ほどたくさんのお金が流れています。右端の「純利益」まで残るのが全体のどれくらいかを確認しましょう。
        </p>
      )}

      <PLSankey report={report} height={level === "pro" ? 260 : 300} />
    </article>
  );
}
