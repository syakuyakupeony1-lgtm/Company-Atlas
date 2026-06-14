"use client";

import { useCompare } from "@/lib/compare-store";
import type { Company } from "@/lib/types";

interface AddToCompareButtonProps {
  company: Company;
  /** "chip" = compact inline badge; "icon" = icon-only; "full" = default button */
  variant?: "chip" | "icon" | "full";
}

export function AddToCompareButton({ company, variant = "full" }: AddToCompareButtonProps) {
  const { addCompany, removeCompany, isCompared, compared } = useCompare();
  const active    = isCompared(company.id);
  const isFull    = compared.length >= 4 && !active;

  function toggle() {
    if (active) removeCompany(company.id);
    else if (!isFull) addCompany(company);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isFull}
        aria-pressed={active}
        aria-label={active ? "比較から削除" : "比較に追加"}
        style={{
          width: 28, height: 28,
          borderRadius: "50%",
          border: `1.5px solid ${active ? "var(--accent)" : "var(--hairline)"}`,
          background: active ? "var(--accent-weak)" : "transparent",
          color: active ? "var(--accent)" : "var(--ink-tertiary)",
          cursor: isFull ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, lineHeight: 1,
          transition: "all 120ms",
          flexShrink: 0,
          opacity: isFull ? 0.4 : 1,
        }}
      >
        {active ? "✓" : "+"}
      </button>
    );
  }

  if (variant === "chip") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isFull}
        aria-pressed={active}
        style={{
          padding: "2px 8px",
          borderRadius: "var(--r-chip)",
          border: `1px solid ${active ? "var(--accent)" : "var(--hairline)"}`,
          background: active ? "var(--accent-weak)" : "transparent",
          color: active ? "var(--accent)" : "var(--ink-tertiary)",
          fontSize: "var(--text-caption)",
          cursor: isFull ? "default" : "pointer",
          transition: "all 120ms",
          opacity: isFull ? 0.4 : 1,
          fontFamily: "var(--font-inter), Inter, sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        {active ? "✓ 比較中" : "+ 比較"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isFull}
      aria-pressed={active}
      className="flex items-center gap-1 px-3 py-1.5 transition-all"
      style={{
        borderRadius: "var(--r-control)",
        border: `1.5px solid ${active ? "var(--accent)" : "var(--hairline)"}`,
        background: active ? "var(--accent-weak)" : "transparent",
        color: active ? "var(--accent)" : "var(--ink-secondary)",
        fontSize: "var(--text-caption)",
        fontWeight: active ? 600 : 400,
        cursor: isFull ? "default" : "pointer",
        transitionDuration: "120ms",
        opacity: isFull ? 0.5 : 1,
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{active ? "✓" : "＋"}</span>
      {active ? "比較中" : "比較に追加"}
    </button>
  );
}
