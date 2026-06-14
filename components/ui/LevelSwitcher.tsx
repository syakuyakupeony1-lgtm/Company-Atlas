"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type Level = "easy" | "standard" | "pro";

const LEVEL_STORAGE_KEY = "company-atlas-level";

interface LevelContextValue {
  level: Level;
  setLevel: (l: Level) => void;
}

const LevelContext = createContext<LevelContextValue>({
  level: "easy",
  setLevel: () => {},
});

export function useLevelContext() {
  return useContext(LevelContext);
}

export function LevelProvider({ children }: { children: React.ReactNode }) {
  const [level, setLevelState] = useState<Level>("easy");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LEVEL_STORAGE_KEY) as Level | null;
      if (stored === "easy" || stored === "standard" || stored === "pro") {
        setLevelState(stored);
      }
    } catch {
      // localStorage unavailable in this context
    }
  }, []);

  function setLevel(l: Level) {
    setLevelState(l);
    try {
      localStorage.setItem(LEVEL_STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }

  return (
    <LevelContext.Provider value={{ level, setLevel }}>
      {children}
    </LevelContext.Provider>
  );
}

const LEVELS: { value: Level; label: string; aria: string }[] = [
  { value: "easy",     label: "やさしい", aria: "やさしいレベル" },
  { value: "standard", label: "標準",     aria: "標準レベル" },
  { value: "pro",      label: "プロ",     aria: "プロレベル" },
];

export function LevelSwitcher() {
  const { level, setLevel } = useLevelContext();

  return (
    <div
      role="radiogroup"
      aria-label="理解レベルの切替"
      className="flex items-center p-0.5 gap-0.5"
      style={{
        background: "var(--surface-sunken)",
        borderRadius: "var(--r-control)",
        fontSize: "var(--text-caption)",
      }}
    >
      {LEVELS.map((l) => (
        <button
          key={l.value}
          role="radio"
          aria-checked={level === l.value}
          onClick={() => setLevel(l.value)}
          className="px-2 py-1 rounded-lg transition-all"
          style={{
            background: level === l.value ? "var(--surface)" : "transparent",
            color: level === l.value ? "var(--ink)" : "var(--ink-tertiary)",
            fontWeight: level === l.value ? 600 : 400,
            boxShadow: level === l.value ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            transitionDuration: "150ms",
            transitionTimingFunction: "var(--ease)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
          }}
          aria-label={l.aria}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
