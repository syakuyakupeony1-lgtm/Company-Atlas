interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  /** Accessible label for screen readers */
  label?: string;
}

export function Skeleton({ className = "", style, label = "読み込み中" }: SkeletonProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`skeleton block ${className}`}
      style={style}
    />
  );
}

/** A card-shaped skeleton that preserves layout to prevent CLS */
export function CardSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="w-full"
      style={{
        height,
        borderRadius: "var(--r-card)",
        background: "var(--surface)",
        boxShadow: "var(--shadow)",
        overflow: "hidden",
      }}
      role="status"
      aria-label="読み込み中"
    >
      <div className="skeleton w-full h-full" />
    </div>
  );
}

/** Multi-line text skeleton */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="読み込み中">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          style={{
            height: 14,
            width: i === lines - 1 ? "60%" : "100%",
            borderRadius: 4,
          }}
        />
      ))}
    </div>
  );
}
