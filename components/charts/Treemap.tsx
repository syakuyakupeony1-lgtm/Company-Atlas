"use client";

import { useMemo, useState, useId } from "react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { useContainerWidth } from "./useContainerWidth";
import { formatBigNum } from "@/lib/metrics";

export interface TreemapItem {
  id: string;
  label: string;
  value: number;       // raw yen
  color: string;       // CSS color string
}

interface TreemapProps {
  items: TreemapItem[];
  /** Height in px. Default: auto (width / 1.7, min 180) */
  height?: number;
  /** Compact mode: smaller font, no amount label */
  compact?: boolean;
  className?: string;
}

interface Leaf {
  x0: number; y0: number; x1: number; y1: number;
  data: TreemapItem;
  value: number;
  pct: number;
}

export function Treemap({ items, height: fixedHeight, compact = false, className }: TreemapProps) {
  const [containerRef, width] = useContainerWidth();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const uid = useId().replace(/:/g, "");

  const height = fixedHeight ?? Math.max(180, Math.round(width / 1.7));

  const leaves = useMemo<Leaf[]>(() => {
    if (width < 10 || items.length === 0) return [];

    const validItems = items.filter((it) => it.value > 0);
    if (validItems.length === 0) return [];

    const root = hierarchy<{ children?: TreemapItem[] }>({ children: validItems })
      .sum((d) => {
        const item = d as unknown as TreemapItem;
        return item.value ?? 0;
      })
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    treemap<{ children?: TreemapItem[] }>()
      .size([width, height])
      .paddingOuter(4)
      .paddingInner(2)
      .tile(treemapSquarify.ratio(1.618))
      .round(true)(root);

    const total = root.value ?? 1;

    return root.leaves().map((leaf) => {
      const l = leaf as typeof leaf & { x0: number; y0: number; x1: number; y1: number };
      return {
        x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1,
        data: leaf.data as unknown as TreemapItem,
        value: leaf.value ?? 0,
        pct: ((leaf.value ?? 0) / total) * 100,
      };
    });
  }, [items, width, height]);

  const ROUNDING = 7; // tile border radius

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", userSelect: "none" }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          aria-label="資産構成 Treemap"
          role="img"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            {leaves.map((leaf) => (
              <clipPath key={`clip-${uid}-${leaf.data.id}`} id={`clip-${uid}-${leaf.data.id}`}>
                <rect
                  x={leaf.x0} y={leaf.y0}
                  width={leaf.x1 - leaf.x0}
                  height={leaf.y1 - leaf.y0}
                  rx={ROUNDING} ry={ROUNDING}
                />
              </clipPath>
            ))}
          </defs>

          {leaves.map((leaf) => {
            const w = leaf.x1 - leaf.x0;
            const h = leaf.y1 - leaf.y0;
            const isHovered = hoveredId === leaf.data.id;
            const isOther = hoveredId !== null && !isHovered;
            const showLabel = w > 52 && h > 28;
            const showAmount = !compact && w > 80 && h > 48;

            return (
              <g
                key={leaf.data.id}
                clipPath={`url(#clip-${uid}-${leaf.data.id})`}
                style={{
                  cursor: "default",
                  transition: "opacity 160ms ease",
                  opacity: isOther ? 0.5 : 1,
                  filter: isHovered ? "brightness(1.06)" : "none",
                }}
                onMouseEnter={() => setHoveredId(leaf.data.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <rect
                  x={leaf.x0} y={leaf.y0}
                  width={w} height={h}
                  fill={leaf.data.color}
                  rx={ROUNDING} ry={ROUNDING}
                  fillOpacity={0.18}
                  stroke={leaf.data.color}
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                />

                {showLabel && (
                  <text
                    x={leaf.x0 + 9}
                    y={leaf.y0 + (showAmount ? 20 : h / 2 + 4)}
                    fontSize={compact ? 10 : 12}
                    fill={leaf.data.color}
                    fontFamily="var(--font-noto), 'Noto Sans JP', sans-serif"
                    fontWeight={600}
                    style={{ pointerEvents: "none" }}
                  >
                    {truncateLabel(leaf.data.label, w - 18)}
                  </text>
                )}

                {showAmount && (
                  <text
                    x={leaf.x0 + 9}
                    y={leaf.y0 + 36}
                    fontSize={11}
                    fill={leaf.data.color}
                    fillOpacity={0.8}
                    fontFamily="var(--font-mono), 'Roboto Mono', monospace"
                    style={{ pointerEvents: "none", fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatBigNum(leaf.value)}
                  </text>
                )}

                {showLabel && (
                  <text
                    x={leaf.x0 + 9}
                    y={leaf.y1 - 8}
                    fontSize={10}
                    fill={leaf.data.color}
                    fillOpacity={0.7}
                    fontFamily="var(--font-mono), 'Roboto Mono', monospace"
                    style={{ pointerEvents: "none", fontVariantNumeric: "tabular-nums" }}
                  >
                    {leaf.pct.toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* Hover tooltip */}
      {hoveredId && (() => {
        const leaf = leaves.find((l) => l.data.id === hoveredId);
        if (!leaf) return null;
        return (
          <div
            style={{
              marginTop: 8,
              padding: "6px 10px",
              background: "var(--ink)",
              color: "#fff",
              borderRadius: 8,
              fontSize: "var(--text-caption)",
              lineHeight: 1.5,
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
            }}
            aria-live="polite"
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: leaf.data.color,
                flexShrink: 0,
              }}
            />
            <span>{leaf.data.label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {formatBigNum(leaf.value)}
            </span>
            <span style={{ opacity: 0.7 }}>{leaf.pct.toFixed(1)}%</span>
          </div>
        );
      })()}
    </div>
  );
}

function truncateLabel(label: string, maxWidth: number): string {
  // Approximate: 7px per character for 12px font
  const maxChars = Math.floor(maxWidth / 7);
  if (label.length <= maxChars) return label;
  return label.slice(0, Math.max(1, maxChars - 1)) + "…";
}
