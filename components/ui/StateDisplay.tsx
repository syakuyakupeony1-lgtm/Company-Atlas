"use client";

import { CardSkeleton } from "@/components/ui/Skeleton";

/* ── Loading ────────────────────────────────────────────────── */
interface LoadingProps {
  height?: number;
  label?: string;
}

export function LoadingState({ height = 200, label = "データを読み込み中" }: LoadingProps) {
  return <CardSkeleton height={height} />;
}

/* ── Empty ──────────────────────────────────────────────────── */
interface EmptyProps {
  title?: string;
  description?: string;
  reason?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "データなし",
  description,
  reason,
  action,
}: EmptyProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-12 px-6"
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-card)",
        boxShadow: "var(--shadow)",
      }}
      role="status"
    >
      <span
        aria-hidden="true"
        style={{ fontSize: 32, lineHeight: 1 }}
      >
        —
      </span>
      <p
        className="mt-3 font-medium"
        style={{ fontSize: "var(--text-h2)", color: "var(--ink)" }}
      >
        {title}
      </p>
      {(description || reason) && (
        <p
          className="mt-2"
          style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)", maxWidth: 300 }}
        >
          {description ?? reason}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ── Partial ────────────────────────────────────────────────── */
interface PartialProps {
  children: React.ReactNode;
  notice?: string;
}

export function PartialState({ children, notice }: PartialProps) {
  return (
    <div className="relative">
      {children}
      {notice && (
        <p
          className="mt-2 px-1"
          style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}
        >
          ⚠ {notice}
        </p>
      )}
    </div>
  );
}

/* ── Error ──────────────────────────────────────────────────── */
interface ErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "データを読み込めませんでした。",
  onRetry,
}: ErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-12 px-6"
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-card)",
        boxShadow: "var(--shadow)",
        border: "1px solid var(--hairline)",
      }}
      role="alert"
    >
      <p
        className="font-medium"
        style={{ fontSize: "var(--text-h2)", color: "var(--ink)" }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            background: "var(--ink)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "var(--text-label)",
            borderRadius: "var(--r-control)",
            transitionDuration: "120ms",
          }}
        >
          再試行する
        </button>
      )}
    </div>
  );
}
