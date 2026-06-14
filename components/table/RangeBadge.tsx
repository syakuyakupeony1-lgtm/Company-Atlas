/**
 * Inline sector benchmark badge — shows where a value sits within [q1, median, q3].
 * Level-aware: easy shows label only, pro shows label + approximate percentile.
 */
import { approximatePercentile } from "@/lib/sector-bench";
import type { BenchResult } from "@/lib/sector-bench";

interface RangeBadgeProps {
  value: number | null | undefined;
  q1?: number | null;
  median?: number | null;
  q3?: number | null;
  /** Full bench result — enables percentile display in pro mode. */
  bench?: BenchResult | null;
  /** "easy" | "standard" | "pro" — controls label verbosity */
  level?: string;
}

function getLabel(ratio: number): string {
  if (ratio >= 0.85) return "上位";
  if (ratio >= 0.5)  return "平均的";
  if (ratio >= 0.15) return "下位傾向";
  return "下位";
}

export function RangeBadge({
  value,
  q1,
  median,
  q3,
  bench,
  level = "standard",
}: RangeBadgeProps) {
  // Use bench fields if individual q values not provided
  const effectiveQ1     = q1     ?? bench?.q1     ?? null;
  const effectiveMedian = median ?? bench?.median  ?? null;
  const effectiveQ3     = q3     ?? bench?.q3     ?? null;

  if (value == null || effectiveQ1 == null || effectiveQ3 == null) return null;

  const range = effectiveQ3 - effectiveQ1;
  const rawRatio = range > 0 ? (value - effectiveQ1) / range : 0.5;
  const ratio = Math.max(0, Math.min(1, rawRatio));
  const label = getLabel(ratio);

  const dotColor =
    ratio >= 0.75
      ? "var(--pos)"
      : ratio >= 0.4
      ? "var(--ink-tertiary)"
      : "var(--neg)";

  const dotPct = ratio * 100;

  // For pro mode, show approximate percentile if bench is provided
  const pctLabel =
    level === "pro" && bench
      ? `約${Math.round(approximatePercentile(value, bench))}%ile`
      : null;

  // For standard+, show sample size note when bench.sample_size < 5
  const smallNote =
    level !== "easy" && bench && bench.sample_size < 5
      ? `n=${bench.sample_size}`
      : null;

  return (
    <span
      className="inline-flex items-center gap-1 ml-1.5 flex-wrap"
      aria-label={`業種内ポジション: ${label}${pctLabel ? ` (${pctLabel})` : ""}`}
    >
      {/* Thin range bar */}
      <span
        className="relative inline-block flex-shrink-0"
        style={{ width: 36, height: 6, borderRadius: 3, background: "var(--surface-sunken)" }}
        aria-hidden="true"
      >
        {/* Median tick */}
        {effectiveMedian != null && (
          <span
            className="absolute top-0 bottom-0"
            style={{
              left: `${Math.max(0, Math.min(100, ((effectiveMedian - effectiveQ1) / (range || 1)) * 100))}%`,
              width: 1,
              background: "var(--hairline)",
              transform: "translateX(-50%)",
            }}
          />
        )}
        {/* Dot */}
        <span
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            left: `${dotPct}%`,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: dotColor,
            transform: "translate(-50%, -50%)",
            transition: "left 200ms var(--ease)",
          }}
        />
      </span>

      {/* Label */}
      <span
        style={{
          fontSize: "var(--text-caption)",
          color: dotColor,
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {label}
      </span>

      {/* Pro percentile */}
      {pctLabel && (
        <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
          {pctLabel}
        </span>
      )}

      {/* Small-sample note */}
      {smallNote && (
        <span style={{ fontSize: 9, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
          ({smallNote})
        </span>
      )}
    </span>
  );
}
