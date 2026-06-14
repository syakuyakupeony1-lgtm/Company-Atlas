"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { CompanyRowData, ColumnDef } from "@/lib/table-config";
import { COLUMN_MAP } from "@/lib/table-config";
import { RangeBadge } from "@/components/table/RangeBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { useCompare } from "@/lib/compare-store";

interface CompanyTableProps {
  rows: CompanyRowData[];
  cols: string[];
  sortKey?: string;
  sortDir?: "asc" | "desc";
  totalCount: number;
}

export function CompanyTable({
  rows,
  cols,
  sortKey,
  sortDir = "desc",
  totalCount,
}: CompanyTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addCompany, removeCompany, isCompared } = useCompare();

  const activeCols = cols
    .map((k) => COLUMN_MAP[k])
    .filter((c): c is ColumnDef => Boolean(c));

  function handleSort(colKey: string) {
    const col = COLUMN_MAP[colKey];
    if (!col?.sortable) return;

    const params = new URLSearchParams(searchParams.toString());
    if (params.get("sort") === colKey && params.get("dir") !== "asc") {
      params.set("dir", "asc");
    } else {
      params.set("sort", colKey);
      params.delete("dir");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Row count */}
      <p
        className="px-1"
        style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}
      >
        {totalCount.toLocaleString("ja-JP")} 社
        {rows.length < totalCount && `（${rows.length} 社表示中）`}
      </p>

      {/* Table wrapper — horizontal scroll on mobile */}
      <div
        className="w-full overflow-x-auto"
        style={{ borderRadius: "var(--r-card)", boxShadow: "var(--shadow)" }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "var(--surface)",
            minWidth: 600,
          }}
          aria-label="企業一覧"
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              {/* Fixed columns */}
              <Th label="コード" />
              <Th label="企業名" align="left" />
              <Th label="市場" />
              <Th label="業種" className="hidden md:table-cell" />
              <Th label="決算" />

              {/* Variable columns */}
              {activeCols.map((col) => (
                <SortableTh
                  key={col.key}
                  col={col}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onClick={() => handleSort(col.key)}
                />
              ))}

              {/* Compare column */}
              <Th label="" />
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5 + activeCols.length + 1}
                  className="text-center py-16"
                  style={{ color: "var(--ink-tertiary)", fontSize: "var(--text-label)" }}
                >
                  条件に合う企業が見つかりませんでした。フィルタを変更してください。
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <CompanyRow
                  key={row.company.id}
                  row={row}
                  cols={activeCols}
                  index={i}
                  isCompared={isCompared(row.company.id)}
                  onCompareToggle={() => {
                    if (isCompared(row.company.id)) {
                      removeCompany(row.company.id);
                    } else {
                      addCompany(row.company);
                    }
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Table header cells ───────────────────────────────────────

function Th({
  label,
  align = "right",
  className = "",
}: {
  label: string;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={className}
      style={{
        padding: "10px 12px",
        textAlign: align,
        fontSize: "var(--text-caption)",
        color: "var(--ink-tertiary)",
        fontWeight: 500,
        background: "var(--surface-sunken)",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </th>
  );
}

function SortableTh({
  col,
  sortKey,
  sortDir,
  onClick,
}: {
  col: ColumnDef;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onClick: () => void;
}) {
  const active = sortKey === col.key;
  const arrow = active ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <th
      style={{
        padding: "10px 12px",
        textAlign: "right",
        fontSize: "var(--text-caption)",
        color: active ? "var(--ink)" : "var(--ink-tertiary)",
        fontWeight: active ? 600 : 500,
        background: "var(--surface-sunken)",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      <span className="inline-flex items-center justify-end gap-1">
        <Tooltip content={col.desc} infoIcon />
        <button
          type="button"
          onClick={onClick}
          disabled={!col.sortable}
          style={{
            background: "none",
            border: "none",
            cursor: col.sortable ? "pointer" : "default",
            color: "inherit",
            fontWeight: "inherit",
            fontSize: "inherit",
            padding: 0,
          }}
          aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
        >
          {col.label}
          {col.unit && (
            <span style={{ color: "var(--ink-tertiary)", fontWeight: 400 }}>
              {" "}({col.unit})
            </span>
          )}
          {arrow}
        </button>
        {col.phase && (
          <span
            style={{
              fontSize: 9,
              color: "var(--ink-tertiary)",
              background: "var(--surface-sunken)",
              borderRadius: 3,
              padding: "1px 3px",
              border: "1px solid var(--hairline)",
            }}
          >
            P{col.phase}
          </span>
        )}
      </span>
    </th>
  );
}

// ─── Table row ────────────────────────────────────────────────

function CompanyRow({
  row,
  cols,
  index,
  isCompared,
  onCompareToggle,
}: {
  row: CompanyRowData;
  cols: ColumnDef[];
  index: number;
  isCompared: boolean;
  onCompareToggle: () => void;
}) {
  const { company, market, sector, latestReport } = row;
  const isEven = index % 2 === 1;

  return (
    <tr
      style={{
        background: isEven ? "var(--surface-sunken)" : "var(--surface)",
        borderBottom: "1px solid var(--hairline)",
        transition: "background 80ms",
      }}
      className="group"
    >
      {/* Code */}
      <td
        className="num"
        style={{
          padding: "10px 12px",
          textAlign: "right",
          fontSize: "var(--text-label)",
          color: "var(--ink-secondary)",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {company.ticker}
      </td>

      {/* Name — clickable */}
      <td style={{ padding: "10px 12px", minWidth: 140 }}>
        <Link
          href={`/company/${company.ticker}`}
          className="hover:underline"
          style={{
            color: "var(--ink)",
            fontSize: "var(--text-label)",
            fontWeight: 500,
            textDecoration: "none",
            fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
          }}
        >
          {company.name}
          {company.name_en && (
            <span
              className="hidden lg:inline"
              style={{
                marginLeft: 8,
                fontSize: "var(--text-caption)",
                color: "var(--ink-tertiary)",
                fontFamily: "var(--font-inter), Inter, sans-serif",
              }}
            >
              {company.name_en}
            </span>
          )}
        </Link>
      </td>

      {/* Market chip */}
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        {market && (
          <span
            className="inline-block px-2 py-0.5"
            style={{
              borderRadius: "var(--r-chip)",
              background: "var(--surface-sunken)",
              color: "var(--ink-secondary)",
              fontSize: "var(--text-caption)",
              border: "1px solid var(--hairline)",
              fontFamily: "var(--font-inter), Inter, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {market.label_en}
          </span>
        )}
      </td>

      {/* Sector */}
      <td
        className="hidden md:table-cell"
        style={{
          padding: "10px 12px",
          fontSize: "var(--text-caption)",
          color: "var(--ink-secondary)",
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {sector?.label_ja ?? "—"}
      </td>

      {/* Fiscal month */}
      <td
        className="num"
        style={{
          padding: "10px 12px",
          textAlign: "right",
          fontSize: "var(--text-label)",
          color: "var(--ink-secondary)",
          whiteSpace: "nowrap",
        }}
      >
        {company.fiscal_month != null ? `${company.fiscal_month}月` : "—"}
      </td>

      {/* Variable columns */}
      {cols.map((col) => {
        const rawValue = col.getValue(row);
        const formatted = col.format(rawValue);
        const bench = col.benchKey ? row.sectorBench[col.benchKey] : undefined;
        const isPhase2 = Boolean(col.phase);

        return (
          <td
            key={col.key}
            className="num"
            style={{
              padding: "10px 12px",
              textAlign: "right",
              fontSize: "var(--text-label)",
              color: isPhase2 ? "var(--ink-tertiary)" : "var(--ink)",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {isPhase2 ? (
              <span style={{ color: "var(--ink-tertiary)" }}>—</span>
            ) : (
              <span className="inline-flex items-center justify-end gap-0">
                <span>{formatted}</span>
                {bench && rawValue != null && (
                  <RangeBadge
                    value={rawValue}
                    q1={bench.q1 ?? undefined}
                    median={bench.median ?? undefined}
                    q3={bench.q3 ?? undefined}
                  />
                )}
              </span>
            )}
          </td>
        );
      })}

      {/* Compare button */}
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <button
          type="button"
          onClick={onCompareToggle}
          aria-label={
            isCompared
              ? `${company.name}を比較から外す`
              : `${company.name}を比較に追加`
          }
          aria-pressed={isCompared}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full transition-all"
          style={{
            background: isCompared ? "var(--accent)" : "transparent",
            color: isCompared ? "#fff" : "var(--ink-tertiary)",
            border: isCompared ? "none" : "1px solid var(--hairline)",
            cursor: "pointer",
            fontSize: 14,
            transitionDuration: "120ms",
            transitionTimingFunction: "var(--ease)",
          }}
          title={isCompared ? "比較中" : "比較に追加"}
        >
          {isCompared ? "✓" : "+"}
        </button>
      </td>
    </tr>
  );
}
