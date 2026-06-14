"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "var(--ink)",
    color: "#fff",
    border: "none",
  },
  secondary: {
    background: "transparent",
    color: "var(--ink)",
    border: "1.5px solid var(--hairline)",
  },
  ghost: {
    background: "transparent",
    color: "var(--ink-secondary)",
    border: "none",
  },
};

const sizes: Record<Size, { padding: string; fontSize: string; height: string }> = {
  sm: { padding: "0 12px", fontSize: "var(--text-caption)", height: "28px" },
  md: { padding: "0 16px", fontSize: "var(--text-label)",   height: "36px" },
  lg: { padding: "0 20px", fontSize: "var(--text-body)",    height: "44px" },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      disabled,
      style,
      className = "",
      children,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={`inline-flex items-center justify-center gap-2 font-medium select-none transition-all ${className}`}
        style={{
          ...styles[variant],
          ...sizes[size],
          borderRadius: "var(--r-control)",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? "100%" : undefined,
          fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
          transitionDuration: "120ms",
          transitionTimingFunction: "var(--ease)",
          ...style,
        }}
        {...props}
      >
        {loading ? (
          <span
            className="inline-block w-3.5 h-3.5 border-2 rounded-full border-t-transparent"
            style={{ borderColor: "currentColor", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }}
            aria-hidden="true"
          />
        ) : null}
        {children}
      </button>
    );
  },
);

/* Chip — rounded pill button */
interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected, className = "", style, children, ...props }: ChipProps) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      className={`inline-flex items-center gap-1.5 px-3 py-1 font-medium select-none transition-all ${className}`}
      style={{
        borderRadius: "var(--r-chip)",
        border: selected ? "none" : "1px solid var(--hairline)",
        background: selected ? "var(--ink)" : "var(--surface)",
        color: selected ? "#fff" : "var(--ink-secondary)",
        cursor: "pointer",
        fontSize: "var(--text-label)",
        fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
        transitionDuration: "120ms",
        transitionTimingFunction: "var(--ease)",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
