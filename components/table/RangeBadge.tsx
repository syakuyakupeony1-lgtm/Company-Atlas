/**
 * Inline sector benchmark badge — shows where a value sits within [q1, median, q3].
 * Reusable across the company table and sector page.
 */
interface RangeBadgeProps {
  value: number | null | undefined;
  q1?: number | null;
  median?: number | null;
  q3?: number | null;
  /** Whether higher is better (true = default, false for e.g. cost ratios) */
  higherIsBetter?: boolean;
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
}: RangeBadgeProps) {
  if (value == null || q1 == null || q3 == null) return null;

  // Position within [q1, q3], clamped to [0, 1]
  const range = q3 - q1;
  const rawRatio = range > 0 ? (value - q1) / range : 0.5;
  const ratio = Math.max(0, Math.min(1, rawRatio));
  const label = getLabel(ratio);

  // Color of the dot
  const dotColor =
    ratio >= 0.75
      ? "var(--pos)"
      : ratio >= 0.4
      ? "var(--ink-tertiary)"
      : "var(--neg)";

  const dotPct = ratio * 100;

  return (
    <span
      className="inline-flex items-center gap-1 ml-1.5"
      aria-label={`業種内ポジション: ${label}`}
    >
      {/* Thin range bar */}
      <span
        className="relative inline-block flex-shrink-0"
        style={{ width: 36, height: 6, borderRadius: 3, background: "var(--surface-sunken)" }}
        aria-hidden="true"
      >
        {/* Median tick */}
        {median != null && (
          <span
            className="absolute top-0 bottom-0"
            style={{
              left: `${Math.max(0, Math.min(100, ((median - q1) / (range || 1)) * 100))}%`,
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
    </span>
  );
}
