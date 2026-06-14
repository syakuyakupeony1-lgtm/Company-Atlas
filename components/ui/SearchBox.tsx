"use client";

import { useState, useRef } from "react";

interface SearchBoxProps {
  autoFocus?: boolean;
}

export function SearchBox({ autoFocus }: SearchBoxProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full">
      <div
        className="flex items-center gap-2 w-full px-3 transition-all duration-150"
        style={{
          background: "var(--surface-sunken)",
          border: focused
            ? "1.5px solid var(--accent)"
            : "1.5px solid transparent",
          borderRadius: "var(--r-control)",
          height: 36,
          outline: "none",
        }}
      >
        {/* Search icon */}
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
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
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="企業名・証券コードで検索"
          autoFocus={autoFocus}
          className="flex-1 bg-transparent border-none outline-none min-w-0"
          style={{
            fontSize: "var(--text-label)",
            color: "var(--ink)",
            fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
          }}
          aria-label="企業名または証券コードで検索"
          role="searchbox"
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full transition-opacity"
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

      {/* Dropdown placeholder — populated in a future step */}
      {focused && value.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 py-2 z-50"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--r-control)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            border: "1px solid var(--hairline)",
          }}
          role="listbox"
          aria-label="検索候補"
        >
          <p
            className="px-3 py-2 text-center"
            style={{
              fontSize: "var(--text-label)",
              color: "var(--ink-tertiary)",
            }}
          >
            企業名・証券コードを入力してください
          </p>
        </div>
      )}
    </div>
  );
}
