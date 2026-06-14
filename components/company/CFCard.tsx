"use client";

import type { CSSProperties } from "react";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import { Tooltip } from "@/components/ui/Tooltip";
import { CFWaterfall } from "@/components/charts/CFWaterfall";
import { formatBigNum } from "@/lib/metrics";
import type { FinancialReport } from "@/lib/types";

interface CFCardProps {
  report: FinancialReport;
  staggerIndex?: number;
}

export function CFCard({ report, staggerIndex = 0 }: CFCardProps) {
  const { level } = useLevelContext();
  const staggerStyle = { "--stagger": staggerIndex } as CSSProperties;

  const fcf = (report.cf_operating ?? 0) + (report.cf_investing ?? 0);
  const fcfSign = fcf >= 0 ? "+" : "";

  const desc =
    level === "easy"
      ? "会社のお金の出入りを3つに分けて見ます。「営業」は本業でのお金の出入り、「投資」は将来のための設備投資、「財務」は借入れや配当です"
      : "CF計算書を滝グラフで可視化。営業CF・投資CF・財務CFの増減と現金期末残高、FCFを一目で把握";

  return (
    <article className="card mb-6 expose" style={staggerStyle} aria-label="CF X-Ray">
      <div className="flex items-center gap-2 mb-4" style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}>
        <h2 className="heading-ja" style={{ fontSize: "var(--text-h2)", color: "var(--ink)", margin: 0 }}>
          CF X-Ray
        </h2>
        <Tooltip content={<span style={{ fontFamily: "var(--font-noto)" }}>{desc}</span>} infoIcon />
        <span style={{ marginLeft: "auto", fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>
          利益と現金の違い
        </span>
      </div>

      {level === "easy" && (
        <p className="mb-4" style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)", lineHeight: 1.6, padding: "10px 14px", background: "var(--surface-sunken)", borderRadius: "var(--r-control)" }}>
          棒の高さがお金の量です。FCF（フリーキャッシュフロー）は本業と投資を合わせた「自由に使えるお金」。プラスが続く会社は財務的に健全です。
        </p>
      )}

      <CFWaterfall report={report} height={level === "pro" ? 220 : 260} />

      {/* FCF highlight */}
      <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--hairline)" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>FCF</span>
            <span
              className="num"
              style={{
                fontSize: "var(--text-h2)",
                fontWeight: 700,
                color: fcf >= 0 ? "var(--pos)" : "var(--neg)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fcfSign}{formatBigNum(fcf)}
            </span>
          </div>
          {level === "easy" && (
            <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-secondary)" }}>
              = 営業CF + 投資CF。この数字がプラスなら「稼いで投資してもお金が余っている」状態
            </p>
          )}
          {level !== "easy" && (
            <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>
              営業CF {formatBigNum(report.cf_operating ?? 0)} + 投資CF {formatBigNum(report.cf_investing ?? 0)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
