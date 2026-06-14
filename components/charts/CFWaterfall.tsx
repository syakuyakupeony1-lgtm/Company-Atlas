"use client";

import { useMemo, useState, useId, type CSSProperties } from "react";
import { useContainerWidth } from "./useContainerWidth";
import { formatBigNum } from "@/lib/metrics";
import type { FinancialReport } from "@/lib/types";

// ─── Color tokens (must resolve client-side) ──────────────────
const POS_COLOR  = "#1A7F4B"; // --pos
const NEG_COLOR  = "#C7362F"; // --neg
const FCF_COLOR  = "#57B3A4"; // --cat-2
const CASH_COLOR = "#5B8DEF"; // --cat-1

interface Bar {
  label: string;
  sublabel?: string;
  value: number;    // raw yen
  base: number;     // cumulative start (lower edge)
  top: number;      // cumulative end (upper edge)
  color: string;
  isTotal?: boolean;
  isGap?: boolean;  // spacer column
}

function buildBars(r: FinancialReport): { bars: Bar[]; fcfValue: number; yMin: number; yMax: number } | null {
  const cfOp  = r.cf_operating  ?? null;
  const cfInv = r.cf_investing  ?? null;
  const cfFin = r.cf_financing  ?? null;
  const cashEnd = r.cash_end    ?? null;
  if (cfOp == null) return null;

  const bars: Bar[] = [];
  let running = 0;

  // 営業CF
  const opColor = cfOp >= 0 ? POS_COLOR : NEG_COLOR;
  bars.push({
    label: "営業CF", sublabel: formatBigNum(cfOp),
    value: cfOp,
    base: cfOp >= 0 ? running : running + cfOp,
    top:  cfOp >= 0 ? running + cfOp : running,
    color: opColor,
  });
  running += cfOp;

  // 投資CF
  if (cfInv != null) {
    const invColor = cfInv >= 0 ? POS_COLOR : NEG_COLOR;
    bars.push({
      label: "投資CF", sublabel: formatBigNum(cfInv),
      value: cfInv,
      base: cfInv >= 0 ? running : running + cfInv,
      top:  cfInv >= 0 ? running + cfInv : running,
      color: invColor,
    });
    running += cfInv;
  }

  const fcfValue = running; // after op + inv

  // 財務CF
  if (cfFin != null) {
    const finColor = cfFin >= 0 ? POS_COLOR : NEG_COLOR;
    bars.push({
      label: "財務CF", sublabel: formatBigNum(cfFin),
      value: cfFin,
      base: cfFin >= 0 ? running : running + cfFin,
      top:  cfFin >= 0 ? running + cfFin : running,
      color: finColor,
    });
    running += cfFin;
  }

  // Spacer then 現金期末 (absolute)
  if (cashEnd != null) {
    bars.push({ label: "", value: 0, base: 0, top: 0, color: "transparent", isGap: true });
    bars.push({
      label: "現金期末", sublabel: formatBigNum(cashEnd),
      value: cashEnd,
      base: 0, top: cashEnd,
      color: CASH_COLOR,
      isTotal: true,
    });
  }

  // Y domain
  const allTops  = bars.filter(b => !b.isGap).map(b => b.top);
  const allBases = bars.filter(b => !b.isGap).map(b => b.base);
  const rawMax = Math.max(...allTops, 0);
  const rawMin = Math.min(...allBases, 0);
  const pad = (rawMax - rawMin) * 0.18;
  return { bars, fcfValue, yMin: rawMin - pad * 0.1, yMax: rawMax + pad };
}

const PAD = { top: 20, right: 8, bottom: 40, left: 8 };
const BAR_W_RATIO = 0.62; // bar width as fraction of column width

interface CFWaterfallProps {
  report: FinancialReport;
  height?: number;
}

export function CFWaterfall({ report, height = 260 }: CFWaterfallProps) {
  const [containerRef, width] = useContainerWidth();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const uid = useId().replace(/:/g, "");

  const data = useMemo(() => buildBars(report), [report]);

  if (!data) {
    return (
      <p style={{ color: "var(--ink-tertiary)", fontSize: "var(--text-label)", textAlign: "center", padding: "24px 0" }}>
        キャッシュフローデータがありません
      </p>
    );
  }

  const { bars, fcfValue, yMin, yMax } = data;
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;

  const colWidth = innerW / bars.length;
  const barWidth = colWidth * BAR_W_RATIO;
  const barOffset = (colWidth - barWidth) / 2;

  function yPx(v: number): number {
    return PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  }

  // FCF is between column 1 (投資CF) and column 2 (財務CF)
  const fcfY = yPx(fcfValue);
  const fcfBarIdx = 1; // after investing CF column
  const fcfLineX1 = PAD.left + fcfBarIdx * colWidth + colWidth; // right edge of col 1
  const fcfLineX2 = PAD.left + (fcfBarIdx + 1) * colWidth;      // left edge of col 2

  return (
    <div ref={containerRef} style={{ width: "100%", userSelect: "none" }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="CF ウォーターフォール" style={{ display: "block", overflow: "visible" }}>
          {/* Zero line */}
          <line
            x1={PAD.left} y1={yPx(0)}
            x2={width - PAD.right} y2={yPx(0)}
            stroke="var(--hairline)" strokeWidth={1}
          />

          {/* FCF dashed connector */}
          {fcfLineX2 > fcfLineX1 && (
            <>
              <line
                x1={fcfLineX1} y1={fcfY}
                x2={fcfLineX2} y2={fcfY}
                stroke={FCF_COLOR} strokeWidth={1.5} strokeDasharray="4 3"
                strokeLinecap="round"
              />
              {/* FCF badge */}
              <rect
                x={(fcfLineX1 + fcfLineX2) / 2 - 38} y={fcfY - 18}
                width={76} height={18} rx={9}
                fill={FCF_COLOR} fillOpacity={0.12}
                stroke={FCF_COLOR} strokeWidth={1}
              />
              <text
                x={(fcfLineX1 + fcfLineX2) / 2} y={fcfY - 9}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={10} fill={FCF_COLOR} fontWeight={600}
                fontFamily="var(--font-mono)"
                style={{ fontVariantNumeric: "tabular-nums" } as CSSProperties}
              >
                FCF {formatBigNum(fcfValue)}
              </text>
            </>
          )}

          {/* Connector lines between adjacent non-gap bars */}
          {bars.map((bar, i) => {
            if (bar.isGap || i === 0) return null;
            const prev = bars[i - 1];
            if (!prev || prev.isGap) return null;
            const prevConnectorY = yPx(prev.value >= 0 ? prev.top : prev.base);
            const currX = PAD.left + i * colWidth + barOffset;
            const prevX = PAD.left + (i - 1) * colWidth + barOffset + barWidth;
            return (
              <line
                key={`conn-${i}`}
                x1={prevX} y1={prevConnectorY}
                x2={currX} y2={prevConnectorY}
                stroke="var(--hairline)" strokeWidth={1} strokeDasharray="2 2"
              />
            );
          })}

          {/* Bars */}
          {bars.map((bar, i) => {
            if (bar.isGap) return null;
            const x = PAD.left + i * colWidth + barOffset;
            const barTop    = yPx(bar.top);
            const barBottom = yPx(bar.base);
            const barH = Math.max(2, barBottom - barTop);
            const isHovered = hoveredIdx === i;

            return (
              <g key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: "default" }}
              >
                <rect
                  x={x} y={barTop}
                  width={barWidth} height={barH}
                  rx={4} ry={4}
                  fill={bar.color}
                  fillOpacity={bar.isTotal ? 0.15 : isHovered ? 0.85 : 0.75}
                  stroke={bar.color}
                  strokeWidth={1}
                  strokeOpacity={bar.isTotal ? 0.4 : 0.3}
                />
                {/* X-axis label */}
                <text
                  x={x + barWidth / 2} y={height - PAD.bottom + 14}
                  textAnchor="middle"
                  fontSize={11} fill="var(--ink-secondary)"
                  fontFamily="var(--font-noto), 'Noto Sans JP', sans-serif"
                >
                  {bar.label}
                </text>
                {/* Amount label (above or inside bar) */}
                {bar.sublabel && barH > 20 && (
                  <text
                    x={x + barWidth / 2}
                    y={barTop + (barH > 40 ? barH / 2 : -8)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={10} fill={barH > 40 ? "white" : bar.color}
                    fontWeight={600}
                    fontFamily="var(--font-mono)"
                    style={{ fontVariantNumeric: "tabular-nums" } as CSSProperties}
                  >
                    {bar.sublabel}
                  </text>
                )}
                {bar.sublabel && barH <= 20 && (
                  <text
                    x={x + barWidth / 2}
                    y={bar.value >= 0 ? barTop - 6 : barBottom + 14}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={10} fill={bar.color}
                    fontFamily="var(--font-mono)"
                    style={{ fontVariantNumeric: "tabular-nums" } as CSSProperties}
                  >
                    {bar.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
