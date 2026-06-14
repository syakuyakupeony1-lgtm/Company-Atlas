"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import { formatBigNum } from "@/lib/metrics";
import type { Company } from "@/lib/types";

interface RelatedCompany {
  ticker: string;
  name: string;
  net_sales: number | null;
  sector_code: string | null;
}

interface RelatedCompaniesProps {
  companies: RelatedCompany[];
  currentTicker: string;
  sectorLabel?: string;
  staggerIndex?: number;
}

export function RelatedCompanies({
  companies,
  currentTicker,
  sectorLabel,
  staggerIndex = 0,
}: RelatedCompaniesProps) {
  const { level } = useLevelContext();
  const staggerStyle = { "--stagger": staggerIndex } as CSSProperties;

  const peers = companies.filter((c) => c.ticker !== currentTicker).slice(0, 8);
  if (peers.length === 0) return null;

  return (
    <article className="card mb-6 expose" style={staggerStyle} aria-label="関連企業">
      <div
        className="flex items-center gap-2 mb-4"
        style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}
      >
        <h2
          className="heading-ja"
          style={{ fontSize: "var(--text-h2)", color: "var(--ink)", margin: 0 }}
        >
          同業他社
        </h2>
        {sectorLabel && (
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--ink-tertiary)",
              background: "var(--surface-sunken)",
              borderRadius: "var(--r-chip)",
              padding: "2px 8px",
            }}
          >
            {sectorLabel}
          </span>
        )}
      </div>

      {level === "easy" && (
        <p
          className="mb-4"
          style={{
            fontSize: "var(--text-label)",
            color: "var(--ink-secondary)",
            lineHeight: 1.6,
            padding: "10px 14px",
            background: "var(--surface-sunken)",
            borderRadius: "var(--r-control)",
          }}
        >
          同じ業種の会社を規模が近い順に並べています。比較して業界内の立ち位置を確認しましょう。
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {peers.map((c) => (
          <Link
            key={c.ticker}
            href={`/company/${c.ticker}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: "8px 12px",
              borderRadius: "var(--r-control)",
              border: "1.5px solid var(--hairline)",
              background: "var(--surface)",
              textDecoration: "none",
              transition: "border-color 120ms, background 120ms",
              minWidth: 110,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)";
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-weak)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--hairline)";
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface)";
            }}
          >
            <span
              style={{
                fontSize: "var(--text-caption)",
                color: "var(--ink-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {c.ticker}
            </span>
            <span
              style={{
                fontSize: "var(--text-label)",
                color: "var(--ink)",
                fontWeight: 600,
                fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
                lineHeight: 1.3,
              }}
            >
              {c.name}
            </span>
            {c.net_sales != null && (
              <span
                className="num"
                style={{
                  fontSize: "var(--text-caption)",
                  color: "var(--ink-secondary)",
                  fontVariantNumeric: "tabular-nums",
                  marginTop: 2,
                }}
              >
                {formatBigNum(c.net_sales)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </article>
  );
}
