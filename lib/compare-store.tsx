"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Company } from "@/lib/types";

const MAX_COMPARE = 4;
const STORAGE_KEY = "company-atlas-compare";

interface CompareContextValue {
  compared: Company[];
  addCompany: (c: Company) => void;
  removeCompany: (id: string) => void;
  clearAll: () => void;
  isCompared: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextValue>({
  compared: [],
  addCompany: () => {},
  removeCompany: () => {},
  clearAll: () => {},
  isCompared: () => false,
});

export function useCompare() {
  return useContext(CompareContext);
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compared, setCompared] = useState<Company[]>([]);

  // Rehydrate from sessionStorage on mount (not localStorage — compare is session-scoped)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setCompared(JSON.parse(raw));
    } catch {
      // ignore
    }

    // Listen for undo-readd events from the tray
    const handler = (e: Event) => {
      const company = (e as CustomEvent<Company>).detail;
      if (company) {
        setCompared((prev) => {
          if (prev.length >= MAX_COMPARE || prev.some((x) => x.id === company.id)) return prev;
          const next = [...prev, company];
          try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
      }
    };
    window.addEventListener("compare:readd", handler);
    return () => window.removeEventListener("compare:readd", handler);
  }, []);

  const persist = useCallback((next: Company[]) => {
    setCompared(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const addCompany = useCallback(
    (c: Company) => {
      setCompared((prev) => {
        if (prev.length >= MAX_COMPARE) return prev;
        if (prev.some((x) => x.id === c.id)) return prev;
        const next = [...prev, c];
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [],
  );

  const removeCompany = useCallback(
    (id: string) => {
      setCompared((prev) => {
        const next = prev.filter((c) => c.id !== id);
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [],
  );

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  const isCompared = useCallback(
    (id: string) => compared.some((c) => c.id === id),
    [compared],
  );

  return (
    <CompareContext.Provider
      value={{ compared, addCompany, removeCompany, clearAll, isCompared }}
    >
      {children}
    </CompareContext.Provider>
  );
}
