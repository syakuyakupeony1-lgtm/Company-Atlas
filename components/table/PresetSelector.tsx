"use client";

import type { Preset } from "@/lib/table-config";

interface PresetSelectorProps {
  presets: Preset[];
  activeId: string | undefined;
  onChange: (id: string | undefined) => void;
}

export function PresetSelector({ presets, activeId, onChange }: PresetSelectorProps) {
  return (
    <div
      className="flex items-center gap-1.5 flex-wrap"
      role="radiogroup"
      aria-label="プリセット選択"
    >
      <span
        style={{
          fontSize: "var(--text-caption)",
          color: "var(--ink-tertiary)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontFamily: "var(--font-inter), Inter, sans-serif",
          marginRight: 4,
        }}
      >
        プリセット
      </span>
      {presets.map((p) => {
        const active = activeId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? undefined : p.id)}
            className="inline-flex items-center px-2.5 py-1 transition-all select-none"
            style={{
              borderRadius: "var(--r-chip)",
              border: active ? "none" : "1px solid var(--hairline)",
              background: active ? "var(--accent-weak)" : "transparent",
              color: active ? "var(--accent)" : "var(--ink-secondary)",
              fontSize: "var(--text-caption)",
              fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              transitionDuration: "120ms",
              transitionTimingFunction: "var(--ease)",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
