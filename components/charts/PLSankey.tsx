"use client";

import { useMemo, useState, useId } from "react";
import { sankey, sankeyLeft } from "d3-sankey";
import { useContainerWidth } from "./useContainerWidth";
import { formatBigNum, formatPct } from "@/lib/metrics";
import type { FinancialReport } from "@/lib/types";

// ─── Colors per node kind ────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  net_sales:       "#6E6E73",  // --ink-secondary
  cost_of_sales:   "#B7B7BD",  // --cost
  gross_profit:    "#57B3A4",  // --cat-2
  sga:             "#B7B7BD",  // --cost
  op_income:       "#6BA368",  // --cat-5
  tax_etc:         "#B7B7BD",  // --cost
  net_income:      "#1A7F4B",  // --pos
};

interface RawNode { id: string; label: string; }
interface RawLink { source: string; target: string; value: number; }

function buildData(r: FinancialReport): { nodes: RawNode[]; links: RawLink[]; total: number } | null {
  const ns = r.net_sales;
  if (!ns || ns <= 0) return null;

  const cos = Math.max(0, r.cost_of_sales ?? 0);
  const gp  = Math.max(0, r.gross_profit  ?? (ns - cos));
  const sga = Math.max(0, r.sga           ?? 0);
  const oi  = Math.max(0, r.operating_income ?? (gp - sga));
  const ni  = Math.max(0, r.net_income    ?? 0);
  const tax = Math.max(0, oi - ni);

  const nodes: RawNode[] = [{ id: "net_sales", label: "売上高" }];
  const links: RawLink[] = [];

  if (cos > 0) {
    nodes.push({ id: "cost_of_sales", label: "売上原価" });
    links.push({ source: "net_sales", target: "cost_of_sales", value: cos });
  }
  if (gp > 0) {
    nodes.push({ id: "gross_profit", label: "粗利" });
    links.push({ source: "net_sales", target: "gross_profit", value: gp });

    if (sga > 0) {
      nodes.push({ id: "sga", label: "販管費" });
      links.push({ source: "gross_profit", target: "sga", value: sga });
    }
    if (oi > 0) {
      nodes.push({ id: "op_income", label: "営業利益" });
      links.push({ source: "gross_profit", target: "op_income", value: oi });

      if (tax > 0) {
        nodes.push({ id: "tax_etc", label: "税金等" });
        links.push({ source: "op_income", target: "tax_etc", value: tax });
      }
      if (ni > 0) {
        nodes.push({ id: "net_income", label: "純利益" });
        links.push({ source: "op_income", target: "net_income", value: ni });
      }
    }
  }

  return { nodes, links, total: ns };
}

interface TooltipState {
  x: number; y: number;
  sourceLabel: string; targetLabel: string;
  value: number; pct: number;
}

interface PLSankeyProps {
  report: FinancialReport;
  height?: number;
}

const NODE_W = 12;
const NODE_PAD = 22;
const PAD = { top: 16, right: 120, bottom: 16, left: 104 };

export function PLSankey({ report, height: fixedHeight = 300 }: PLSankeyProps) {
  const [containerRef, width] = useContainerWidth();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const uid = useId().replace(/:/g, "");

  const data = useMemo(() => buildData(report), [report]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout = useMemo<{ nodes: any[]; links: any[] } | null>(() => {
    if (!data || width < 120) return null;

    const gen = sankey<RawNode, RawLink>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .nodeId((d: any) => d.id)
      .nodeAlign(sankeyLeft)
      .nodeWidth(NODE_W)
      .nodePadding(NODE_PAD)
      .extent([
        [PAD.left, PAD.top],
        [width - PAD.right, fixedHeight - PAD.bottom],
      ]);

    // Deep-copy to avoid mutation issues on re-render
    return gen({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    });
  }, [data, width, fixedHeight]);

  if (!data) {
    return (
      <p style={{ color: "var(--ink-tertiary)", fontSize: "var(--text-label)", textAlign: "center", padding: "24px 0" }}>
        損益データがありません
      </p>
    );
  }

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative", userSelect: "none" }}>
      {width > 0 && layout && (
        <svg
          width={width}
          height={fixedHeight}
          role="img"
          aria-label="PL X-Ray — 損益構造"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            {layout.links.map((link: any, i: number) => {
              const srcColor = NODE_COLORS[link.source.id] ?? "#999";
              const tgtColor = NODE_COLORS[link.target.id] ?? "#999";
              return (
                <linearGradient
                  key={i}
                  id={`${uid}-lg-${i}`}
                  x1={link.source.x1} y1={0}
                  x2={link.target.x0} y2={0}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%"   stopColor={srcColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={tgtColor} stopOpacity={0.18} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Links */}
          {layout.links.map((link: any, i: number) => {
            // Build bezier path manually: source exits from right, target enters from left
            const sx = link.source.x1;
            const tx = link.target.x0;
            const sy0 = link.y0;
            const ty0 = link.y1;
            const cx = (sx + tx) / 2;
            const path =
              `M ${sx},${sy0}` +
              ` C ${cx},${sy0} ${cx},${ty0} ${tx},${ty0}`;

            return (
              <path
                key={i}
                d={path}
                stroke={`url(#${uid}-lg-${i})`}
                strokeWidth={Math.max(1, link.width ?? 0)}
                fill="none"
                strokeLinecap="round"
                style={{
                  cursor: "default",
                  transition: "opacity 120ms ease",
                  opacity: tooltip && tooltip.sourceLabel !== link.source.label && tooltip.targetLabel !== link.target.label ? 0.3 : 0.85,
                }}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget as SVGPathElement).getBoundingClientRect();
                  const containerRect = containerRef.current?.getBoundingClientRect();
                  setTooltip({
                    x: rect.left - (containerRect?.left ?? 0) + rect.width / 2,
                    y: rect.top - (containerRect?.top ?? 0) - 8,
                    sourceLabel: link.source.label,
                    targetLabel: link.target.label,
                    value: link.value,
                    pct: (link.value / data.total) * 100,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {/* Nodes */}
          {layout.nodes.map((node: any) => {
            const nColor = NODE_COLORS[node.id] ?? "#999";
            const nx = node.x0;
            const ny = node.y0;
            const nw = (node.x1 ?? node.x0) - node.x0;
            const nh = Math.max(4, (node.y1 ?? node.y0) - node.y0);
            const midY = ny + nh / 2;

            // Label placement: source → left, sink → right, intermediate → above
            const isSource = (node.targetLinks?.length ?? 0) === 0;
            const isSink   = (node.sourceLinks?.length ?? 0) === 0;
            const isMiddle = !isSource && !isSink;

            const labelX      = isSource ? nx - 6 : isSink ? nx + nw + 6 : nx + nw / 2;
            const labelAnchor = isSource ? "end"  : isSink ? "start"      : "middle";
            // For intermediate nodes, place label above; for source/sink, align to midY
            const labelBaseY  = isMiddle ? Math.max(ny - 2, PAD.top + 10) : midY - 6;
            const amountY     = isMiddle ? labelBaseY + 12 : midY + 8;
            const ratioY      = isMiddle ? amountY + 12   : midY + 22;

            return (
              <g key={node.id}>
                <rect
                  x={nx} y={ny}
                  width={nw} height={nh}
                  fill={nColor}
                  rx={3}
                  opacity={0.9}
                />
                {/* Category label */}
                <text
                  x={labelX}
                  y={labelBaseY}
                  fontSize={11}
                  fill="var(--ink-secondary)"
                  textAnchor={labelAnchor}
                  fontFamily="var(--font-noto), 'Noto Sans JP', sans-serif"
                  dominantBaseline="middle"
                >
                  {node.label}
                </text>
                {/* Amount */}
                <text
                  x={labelX}
                  y={amountY}
                  fontSize={11}
                  fill={nColor}
                  fontWeight={600}
                  textAnchor={labelAnchor}
                  fontFamily="var(--font-mono), 'Roboto Mono', monospace"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                  dominantBaseline="middle"
                >
                  {formatBigNum(node.value ?? 0)}
                </text>
                {/* Ratio (non-source nodes only) */}
                {!isSource && (
                  <text
                    x={labelX}
                    y={ratioY}
                    fontSize={10}
                    fill="var(--ink-tertiary)"
                    textAnchor={labelAnchor}
                    fontFamily="var(--font-mono), 'Roboto Mono', monospace"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                    dominantBaseline="middle"
                  >
                    {formatPct(((node.value ?? 0) / data.total) * 100)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* Hover tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            background: "var(--ink)",
            color: "#fff",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: "var(--text-caption)",
            lineHeight: 1.5,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
          role="tooltip"
        >
          <span style={{ fontFamily: "var(--font-noto)" }}>
            {tooltip.sourceLabel} → {tooltip.targetLabel}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", marginLeft: 8, fontVariantNumeric: "tabular-nums" }}>
            {formatBigNum(tooltip.value)}
          </span>
          <span style={{ opacity: 0.7, marginLeft: 6 }}>
            ({tooltip.pct.toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  );
}
