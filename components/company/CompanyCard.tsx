import type { CSSProperties } from "react";

type CardStatus = "loading" | "empty" | "partial" | "error" | "ready" | "coming_soon";

interface CompanyCardProps {
  title: string;
  staggerIndex?: number;
  status?: CardStatus;
  children?: React.ReactNode;
}

export function CompanyCard({
  title,
  staggerIndex = 0,
  status = "ready",
  children,
}: CompanyCardProps) {
  const staggerStyle = { "--stagger": staggerIndex } as CSSProperties;

  if (status === "loading") {
    return (
      <div
        className="skeleton mb-6"
        style={{ ...staggerStyle, height: 200, borderRadius: "var(--r-card)" }}
        role="status"
        aria-label={`${title}を読み込み中`}
      />
    );
  }

  return (
    <div className="card mb-6 expose" style={staggerStyle}>
      {/* Card title bar */}
      <div
        className="flex items-center gap-2 mb-4"
        style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}
      >
        <h2
          className="heading-ja"
          style={{ fontSize: "var(--text-h2)", color: "var(--ink)", margin: 0 }}
        >
          {title}
        </h2>
        {(status === "coming_soon") && (
          <span
            className="px-2 py-0.5"
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--ink-tertiary)",
              background: "var(--surface-sunken)",
              borderRadius: "var(--r-chip)",
              border: "1px solid var(--hairline)",
            }}
          >
            準備中
          </span>
        )}
      </div>

      {status === "empty" && (
        <p
          style={{
            color: "var(--ink-tertiary)",
            fontSize: "var(--text-label)",
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          データがありません
        </p>
      )}

      {status === "error" && (
        <p style={{ color: "var(--neg)", fontSize: "var(--text-label)" }}>
          データの取得に失敗しました
        </p>
      )}

      {status === "coming_soon" && (
        <p
          style={{
            color: "var(--ink-tertiary)",
            fontSize: "var(--text-label)",
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          このカードは今後のアップデートで追加されます
        </p>
      )}

      {(status === "ready" || status === "partial") && children}
    </div>
  );
}
