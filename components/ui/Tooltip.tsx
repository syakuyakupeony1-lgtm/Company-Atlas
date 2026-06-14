"use client";

import { useState, useRef, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  /** Show the ⓘ trigger automatically when children is omitted */
  infoIcon?: boolean;
}

export function Tooltip({ content, children, infoIcon }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  }

  function hide(delay = 80) {
    timeoutRef.current = setTimeout(() => setVisible(false), delay);
  }

  const trigger = infoIcon ? (
    <button
      type="button"
      aria-label="説明を見る"
      aria-describedby={visible ? id : undefined}
      className="inline-flex items-center justify-center w-4 h-4 rounded-full align-middle"
      style={{
        fontSize: 10,
        color: "var(--ink-tertiary)",
        background: "var(--surface-sunken)",
        border: "none",
        cursor: "pointer",
        lineHeight: 1,
        flexShrink: 0,
      }}
      onMouseEnter={show}
      onMouseLeave={() => hide()}
      onFocus={show}
      onBlur={() => hide(0)}
      onClick={() => setVisible((v) => !v)}
    >
      ⓘ
    </button>
  ) : (
    <span
      onMouseEnter={show}
      onMouseLeave={() => hide()}
      onFocus={show}
      onBlur={() => hide(0)}
      aria-describedby={visible ? id : undefined}
      tabIndex={0}
    >
      {children}
    </span>
  );

  return (
    <span className="relative inline-flex items-center">
      {trigger}
      <AnimatePresence>
        {visible && (
          <motion.div
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onMouseEnter={show}
            onMouseLeave={() => hide()}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 z-50 pointer-events-auto"
            style={{
              background: "var(--ink)",
              color: "#fff",
              borderRadius: 8,
              fontSize: "var(--text-caption)",
              lineHeight: 1.5,
              maxWidth: 240,
              whiteSpace: "normal",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            {content}
            {/* Arrow */}
            <span
              aria-hidden="true"
              className="absolute top-full left-1/2 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid var(--ink)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
