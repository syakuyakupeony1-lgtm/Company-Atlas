"use client";

import type { CSSProperties } from "react";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import { Tooltip } from "@/components/ui/Tooltip";
import { SSFlow, buildSSData } from "@/components/charts/SSFlow";
import type { FinancialReport } from "@/lib/types";

interface SSCardProps {
  report: FinancialReport;
  staggerIndex?: number;
}

export function SSCard({ report, staggerIndex = 0 }: SSCardProps) {
  const { level } = useLevelContext();
  const staggerStyle = { "--stagger": staggerIndex } as CSSProperties;

  const data = buildSSData(report);
  if (!data) return null;

  const desc =
    level === "easy"
      ? "会社が稼いだ利益を、社内に蓄える分・株主に配当として返す分・自社株買いで返す分の3つに分けて見ます"
      : "純利益の使途（内部留保・配当・自社株買い）を比率と金額で可視化。ペイアウト比率・還元方針の傾向を把握";

  return (
    <article className="card mb-6 expose" style={staggerStyle} aria-label="SS X-Ray">
      <div
        className="flex items-center gap-2 mb-4"
        style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}
      >
        <h2
          className="heading-ja"
          style={{ fontSize: "var(--text-h2)", color: "var(--ink)", margin: 0 }}
        >
          SS X-Ray
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
          利益の使い道
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
          棒グラフの面積が比率を表します。青は将来の成長のために会社内に残すお金、緑は株主への配当、黄色は自社株買いです。
        </p>
      )}

      <SSFlow data={data} />
    </article>
  );
}
