"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/app/api/search/route";

interface SearchBoxProps {
  autoFocus?: boolean;
}

const MARKET_LABELS: Record<string, string> = {
  prime:    "プライム",
  standard: "スタンダード",
  growth:   "グロース",
  pro:      "PRO",
};

export function SearchBox({ autoFocus }: SearchBoxProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const fetchResults = useCallback(async (q: string) => {
    if (q.length === 0) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data: SearchResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value), 160);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, fetchResults]);

  function navigate(ticker: string) {
    setValue("");
    setResults([]);
    setFocused(false);
    router.push(`/company/${ticker}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && results[activeIdx]) {
        navigate(results[activeIdx].ticker);
      } else if (/^\d{4}$/.test(value.trim())) {
        navigate(value.trim());
      } else if (results.length === 1) {
        navigate(results[0].ticker);
      }
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  function handleClear() {
    setValue("");
    setResults([]);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }

  const showDropdown = focused && value.length > 0;

  return (
    <div className="relative w-full">
      <div
        className="flex items-center gap-2 w-full px-3 transition-all duration-150"
        style={{
          background: "var(--surface-sunken)",
          border: focused ? "1.5px solid var(--accent)" : "1.5px solid transparent",
          borderRadius: "var(--r-control)",
          height: 36,
          outline: "none",
        }}
      >
        <svg
          width="15" height="15" viewBox="0 0 15 15" fill="none"
          aria-hidden="true"
          style={{ color: "var(--ink-tertiary)", flexShrink: 0 }}
        >
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="9.85" y1="9.85" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => { setValue(e.target.value); setActiveIdx(-1); }}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
              setTimeout(() => setFocused(false), 150);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="企業名・証券コードで検索"
          autoFocus={autoFocus}
          autoComplete="off"
          className="flex-1 bg-transparent border-none outline-none min-w-0"
          style={{
            fontSize: "var(--text-label)",
            color: "var(--ink)",
            fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
          }}
          aria-label="企業名または証券コードで検索"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          aria-activedescendant={activeIdx >= 0 ? `search-item-${activeIdx}` : undefined}
          role="combobox"
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            tabIndex={-1}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full"
            style={{ background: "var(--ink-tertiary)", color: "white" }}
            aria-label="検索をクリア"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
              <line x1="1" y1="1" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="7" y1="1" x2="1" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 py-1 z-50"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--r-control)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            border: "1px solid var(--hairline)",
          }}
          role="listbox"
          aria-label="検索候補"
        >
          {loading && (
            <p className="px-3 py-2 text-center" style={{ fontSize: "var(--text-label)", color: "var(--ink-tertiary)" }}>
              検索中…
            </p>
          )}

          {!loading && results.length === 0 && (
            <p className="px-3 py-2 text-center" style={{ fontSize: "var(--text-label)", color: "var(--ink-tertiary)" }}>
              「{value}」に一致する企業が見つかりません
            </p>
          )}

          {!loading && results.map((r, i) => (
            <button
              key={r.ticker}
              id={`search-item-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              type="button"
              onClick={() => navigate(r.ticker)}
              onMouseEnter={() => setActiveIdx(i)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left"
              style={{
                background: i === activeIdx ? "var(--surface-sunken)" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "background 80ms",
              }}
            >
              <span
                className="num flex-shrink-0"
                style={{ fontSize: "var(--text-caption)", color: "var(--ink-secondary)", width: 36 }}
              >
                {r.ticker}
              </span>
              <span
                style={{
                  fontSize: "var(--text-label)",
                  color: "var(--ink)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
                }}
              >
                {r.name}
              </span>
              {r.market_code && (
                <span
                  className="flex-shrink-0 px-1.5 py-0.5"
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--ink-secondary)",
                    background: "var(--surface-sunken)",
                    borderRadius: "var(--r-chip)",
                    border: "1px solid var(--hairline)",
                  }}
                >
                  {MARKET_LABELS[r.market_code] ?? r.market_code}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
