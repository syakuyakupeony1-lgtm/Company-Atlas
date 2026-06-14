"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "company-atlas-onboarding-dismissed";

export function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // SSR or localStorage unavailable — skip
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <div
      className="expose mb-6 px-5 py-4 flex items-start justify-between gap-4"
      style={{
        borderRadius: "var(--r-card)",
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      }}
      role="status"
      aria-label="使い方ガイド"
    >
      <div className="flex flex-col gap-1" style={{ maxWidth: 640 }}>
        <p
          className="heading-ja"
          style={{ fontSize: "var(--text-label)", color: "var(--ink)", fontWeight: 600 }}
        >
          業界マップ → 企業一覧の順に見ると理解が深まります
        </p>
        <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-secondary)", lineHeight: 1.6 }}>
          上の「業界マップ」で気になる業種をタップ → 下の企業一覧が自動絞り込み。
          右上の「かんたん / くわしい」切替で表示レベルを変えられます。
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="ガイドを閉じる"
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid var(--hairline)",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-tertiary)",
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
