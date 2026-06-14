"use client";

import type { CSSProperties } from "react";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import type { AiInsight } from "@/lib/types";
import type { TemplateKeyPoint } from "@/lib/narrative";

interface TemplatePointsByLevel {
  easy: TemplateKeyPoint[];
  standard: TemplateKeyPoint[];
  pro: TemplateKeyPoint[];
}

interface KeyPointsCardProps {
  insights: AiInsight[];
  /** Pre-computed template fallback points for each level (server-generated). */
  templatePoints: TemplatePointsByLevel;
  reportId?: string;
  staggerIndex?: number;
}

function findInsight(
  insights: AiInsight[],
  kind: string,
  level: string,
  reportId?: string,
): AiInsight | undefined {
  return insights.find(
    (i) =>
      i.kind === kind &&
      i.level === level &&
      (reportId == null || i.report_id === reportId),
  );
}

export function KeyPointsCard({
  insights,
  templatePoints,
  reportId,
  staggerIndex = 0,
}: KeyPointsCardProps) {
  const { level } = useLevelContext();
  const staggerStyle = { "--stagger": staggerIndex } as CSSProperties;

  // Try to find pre-generated AI insight; fall back to level-appropriate template
  const aiInsight = findInsight(insights, "key_points", level, reportId);
  const levelKey = (level === "easy" || level === "pro") ? level : "standard";
  const rawPoints = aiInsight
    ? (aiInsight.content.points as TemplateKeyPoint[] | undefined) ?? []
    : templatePoints[levelKey as keyof typeof templatePoints];

  const isAi = !!aiInsight;
  const count = level === "easy" ? 2 : level === "pro" ? 5 : 3;
  const points = rawPoints.slice(0, count);

  if (points.length === 0) return null;

  return (
    <article className="card mb-6 expose" style={staggerStyle} aria-label="確認すべき論点">
      <div
        className="flex items-center gap-2 mb-4"
        style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}
      >
        <h2
          className="heading-ja"
          style={{ fontSize: "var(--text-h2)", color: "var(--ink)", margin: 0 }}
        >
          {level === "easy" ? "確認してみよう" : "確認すべき論点"}
        </h2>
        {isAi && (
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--ink-tertiary)",
              background: "var(--surface-sunken)",
              borderRadius: "var(--r-chip)",
              padding: "2px 7px",
              border: "1px solid var(--hairline)",
            }}
          >
            AI生成
          </span>
        )}
      </div>

      <ol
        className="flex flex-col gap-3"
        style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}
      >
        {points.map((pt, i) => (
          <li
            key={i}
            className="flex gap-3 items-start"
            style={{
              padding: "10px 14px",
              background: "var(--surface-sunken)",
              borderRadius: "var(--r-control)",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span
              style={{
                fontSize: "var(--text-label)",
                color: "var(--ink)",
                lineHeight: 1.6,
                fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
              }}
            >
              {pt.question}
            </span>
          </li>
        ))}
      </ol>

      {/* Disclaimer — shown once at the bottom of this card */}
      <p
        className="mt-4"
        style={{
          fontSize: "var(--text-caption)",
          color: "var(--ink-tertiary)",
          lineHeight: 1.5,
        }}
      >
        ※ これらは財務データに基づく事実の提示であり、投資の評価・推奨ではありません
      </p>
    </article>
  );
}
