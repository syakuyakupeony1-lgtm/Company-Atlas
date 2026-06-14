"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCompare } from "@/lib/compare-store";
import { useToast } from "@/components/ui/ToastProvider";
import type { Company } from "@/lib/types";

export function CompareTray() {
  const { compared, removeCompany, clearAll } = useCompare();
  const { addToast } = useToast();
  const router = useRouter();

  if (compared.length === 0) return null;

  function handleRemove(c: Company) {
    removeCompany(c.id);
    addToast({
      message: `${c.name}を比較から削除しました`,
      undoAction: () => {
        // Re-add via compare store — import would create circular deps, so use event
        window.dispatchEvent(new CustomEvent("compare:readd", { detail: c }));
      },
    });
  }

  function handleCompare() {
    const codes = compared.map((c) => c.ticker).join(",");
    router.push(`/compare?codes=${codes}`);
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "rgba(251,251,253,0.92)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderTop: "1px solid var(--hairline)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
      }}
    >
      <div
        className="mx-auto flex items-center gap-3 px-4 md:px-6"
        style={{ height: 64, maxWidth: 1280 }}
      >
        {/* Company chips */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none min-w-0">
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--ink-tertiary)",
              flexShrink: 0,
              fontFamily: "var(--font-inter), Inter, sans-serif",
            }}
          >
            比較中
          </span>
          <AnimatePresence mode="popLayout">
            {compared.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-1.5 flex-shrink-0"
                style={{
                  padding: "4px 10px 4px 12px",
                  borderRadius: "var(--r-chip)",
                  border: "1px solid var(--hairline)",
                  background: "var(--surface)",
                  fontSize: "var(--text-caption)",
                  color: "var(--ink)",
                  fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
                }}
              >
                <span className="num" style={{ fontSize: 10, color: "var(--ink-tertiary)" }}>
                  {c.ticker}
                </span>
                <span>{c.name}</span>
                <button
                  onClick={() => handleRemove(c)}
                  aria-label={`${c.name}を削除`}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--ink-tertiary)", fontSize: 12, lineHeight: 1,
                    padding: "0 0 0 2px",
                  }}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Slot placeholders (up to 4) */}
          {Array.from({ length: 4 - compared.length }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 80, height: 28, flexShrink: 0,
                borderRadius: "var(--r-chip)",
                border: "1.5px dashed var(--hairline)",
                opacity: 0.4,
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={clearAll}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "var(--text-caption)", color: "var(--ink-tertiary)",
              padding: "4px 8px",
              fontFamily: "var(--font-inter), Inter, sans-serif",
            }}
          >
            クリア
          </button>
          <button
            onClick={handleCompare}
            disabled={compared.length < 2}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: compared.length >= 2 ? "var(--accent)" : "var(--hairline)",
              color: compared.length >= 2 ? "#fff" : "var(--ink-tertiary)",
              border: "none",
              cursor: compared.length >= 2 ? "pointer" : "default",
              fontSize: "var(--text-label)",
              fontFamily: "var(--font-inter), Inter, sans-serif",
              transitionDuration: "120ms",
            }}
          >
            比較する {compared.length >= 2 ? `（${compared.length}社）` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
