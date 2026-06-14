"use client";

import { useRef, useState } from "react";
import type { ColumnDef } from "@/lib/table-config";
import { VARIABLE_COLUMNS } from "@/lib/table-config";

interface ColumnCustomizerProps {
  activeCols: string[];
  onChange: (cols: string[]) => void;
}

export function ColumnCustomizer({ activeCols, onChange }: ColumnCustomizerProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  function toggleCol(key: string) {
    if (activeCols.includes(key)) {
      onChange(activeCols.filter((k) => k !== key));
    } else {
      onChange([...activeCols, key]);
    }
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="表示列をカスタマイズ"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 transition-all"
        style={{
          borderRadius: "var(--r-control)",
          border: "1px solid var(--hairline)",
          background: open ? "var(--surface-sunken)" : "var(--surface)",
          color: "var(--ink-secondary)",
          fontSize: "var(--text-label)",
          fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
          cursor: "pointer",
          transitionDuration: "120ms",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 13 }}>⚙</span>
        <span>列</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          {/* Popover */}
          <div
            role="listbox"
            aria-label="表示する列を選択"
            aria-multiselectable="true"
            className="absolute right-0 top-full mt-1 z-50 py-2"
            style={{
              background: "var(--surface)",
              borderRadius: "var(--r-card)",
              boxShadow: "0 4px 24px rgba(0,0,0,.10)",
              border: "1px solid var(--hairline)",
              minWidth: 220,
              maxHeight: 360,
              overflowY: "auto",
            }}
          >
            <p
              className="px-4 pb-2 mb-1"
              style={{
                fontSize: "var(--text-caption)",
                color: "var(--ink-tertiary)",
                borderBottom: "1px solid var(--hairline)",
              }}
            >
              表示する指標を選択
            </p>
            {VARIABLE_COLUMNS.map((col) => (
              <ColRow
                key={col.key}
                col={col}
                active={activeCols.includes(col.key)}
                onToggle={() => !col.phase && toggleCol(col.key)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ColRow({
  col,
  active,
  onToggle,
}: {
  col: ColumnDef;
  active: boolean;
  onToggle: () => void;
}) {
  const isPhase2 = Boolean(col.phase);

  return (
    <button
      role="option"
      aria-selected={active}
      onClick={isPhase2 ? undefined : onToggle}
      disabled={isPhase2}
      className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
      style={{
        background: "transparent",
        border: "none",
        cursor: isPhase2 ? "default" : "pointer",
        opacity: isPhase2 ? 0.45 : 1,
      }}
    >
      {/* Checkbox */}
      <span
        className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
        style={{
          border: active && !isPhase2 ? "none" : "1.5px solid var(--hairline)",
          background: active && !isPhase2 ? "var(--accent)" : "transparent",
        }}
        aria-hidden="true"
      >
        {active && !isPhase2 && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      {/* Label */}
      <span className="flex-1 min-w-0">
        <span
          style={{
            fontSize: "var(--text-label)",
            color: "var(--ink)",
            fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
          }}
        >
          {col.label}
        </span>
        {col.unit && (
          <span
            className="ml-1"
            style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}
          >
            ({col.unit})
          </span>
        )}
      </span>

      {/* Phase badge */}
      {isPhase2 && (
        <span
          className="flex-shrink-0 px-1.5 py-0.5 rounded"
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--ink-tertiary)",
            background: "var(--surface-sunken)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          Phase 2
        </span>
      )}
    </button>
  );
}
