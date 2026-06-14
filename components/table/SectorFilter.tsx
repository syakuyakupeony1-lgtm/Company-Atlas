"use client";

import type { Sector } from "@/lib/types";

interface SectorFilterProps {
  sectors: Sector[];
  selected: string | undefined;
  onChange: (code: string | undefined) => void;
}

export function SectorFilter({ sectors, selected, onChange }: SectorFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sector-filter"
        style={{
          fontSize: "var(--text-label)",
          color: "var(--ink-secondary)",
          flexShrink: 0,
          fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
        }}
      >
        業種
      </label>
      <select
        id="sector-filter"
        value={selected ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        style={{
          fontSize: "var(--text-label)",
          color: selected ? "var(--ink)" : "var(--ink-secondary)",
          background: "var(--surface-sunken)",
          border: selected ? "1.5px solid var(--accent)" : "1.5px solid transparent",
          borderRadius: "var(--r-control)",
          padding: "4px 28px 4px 10px",
          height: 32,
          cursor: "pointer",
          fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
          outline: "none",
          appearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23AEAEB2' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
        aria-label="業種で絞り込む"
      >
        <option value="">すべての業種</option>
        {sectors.map((s) => (
          <option key={s.code} value={s.code}>
            {s.label_ja}
          </option>
        ))}
      </select>
    </div>
  );
}
