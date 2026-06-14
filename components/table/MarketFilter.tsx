"use client";

import type { Market } from "@/lib/types";

interface MarketFilterProps {
  markets: Market[];
  selected: string[];
  onChange: (next: string[]) => void;
}

const MAIN_MARKETS = ["prime", "standard", "growth"];

export function MarketFilter({ markets, selected, onChange }: MarketFilterProps) {
  const sortedMain = markets
    .filter((m) => MAIN_MARKETS.includes(m.code))
    .sort((a, b) => a.sort_order - b.sort_order);
  const proMarket = markets.find((m) => m.code === "pro");

  function toggleAll() {
    onChange([]);
  }

  function toggleMarket(code: string) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  }

  const isAll = selected.length === 0;

  return (
    <div
      className="flex items-center flex-wrap gap-2"
      role="group"
      aria-label="市場区分フィルタ"
    >
      {/* 全 */}
      <FilterChip
        label="全市場"
        active={isAll}
        onClick={toggleAll}
        aria-pressed={isAll}
      />

      {/* Prime / Standard / Growth */}
      {sortedMain.map((m) => (
        <FilterChip
          key={m.code}
          label={m.label_ja}
          active={selected.includes(m.code)}
          onClick={() => toggleMarket(m.code)}
          aria-pressed={selected.includes(m.code)}
        />
      ))}

      {/* PRO Market toggle (separated) */}
      {proMarket && (
        <>
          <span
            aria-hidden="true"
            style={{ width: 1, height: 18, background: "var(--hairline)", flexShrink: 0 }}
          />
          <FilterChip
            label={proMarket.label_en}
            active={selected.includes(proMarket.code)}
            onClick={() => toggleMarket(proMarket.code)}
            aria-pressed={selected.includes(proMarket.code)}
            muted
          />
        </>
      )}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  muted?: boolean;
  "aria-pressed"?: boolean;
}

function FilterChip({ label, active, onClick, muted, "aria-pressed": pressed }: FilterChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-pressed={pressed}
      onClick={onClick}
      className="inline-flex items-center px-3 py-1 transition-all select-none"
      style={{
        borderRadius: "var(--r-chip)",
        border: active ? "none" : "1px solid var(--hairline)",
        background: active ? "var(--ink)" : "var(--surface)",
        color: active
          ? "#fff"
          : muted
          ? "var(--ink-tertiary)"
          : "var(--ink-secondary)",
        fontSize: "var(--text-label)",
        fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
        cursor: "pointer",
        transitionDuration: "120ms",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      {label}
    </button>
  );
}
