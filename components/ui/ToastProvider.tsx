"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface Toast {
  id: string;
  message: string;
  undoAction?: () => void;
  duration?: number;
}

interface ToastContextValue {
  addToast: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ message, undoAction, duration = 4000 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-3), { id, message, undoAction, duration }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 pointer-events-none"
        style={{ width: "min(calc(100vw - 32px), 360px)" }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3"
              style={{
                background: "var(--ink)",
                color: "#fff",
                borderRadius: "var(--r-control)",
                fontSize: "var(--text-label)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
              }}
              role="status"
            >
              <span className="flex-1">{toast.message}</span>
              {toast.undoAction && (
                <button
                  onClick={() => {
                    toast.undoAction?.();
                    dismiss(toast.id);
                  }}
                  className="flex-shrink-0 font-medium underline underline-offset-2"
                  style={{ color: "var(--cat-1)", background: "none", border: "none", cursor: "pointer", fontSize: "inherit" }}
                >
                  元に戻す
                </button>
              )}
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="閉じる"
                className="flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
