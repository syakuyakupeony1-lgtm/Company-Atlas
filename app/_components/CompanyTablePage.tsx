"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { CompanyRowData } from "@/lib/table-config";
import type { Market, Sector } from "@/lib/types";
import { PRESETS, resolveCols } from "@/lib/table-config";
import { MarketFilter } from "@/components/table/MarketFilter";
import { SectorFilter } from "@/components/table/SectorFilter";
import { PresetSelector } from "@/components/table/PresetSelector";
import { ColumnCustomizer } from "@/components/table/ColumnCustomizer";
import { CompanyTable } from "@/components/table/CompanyTable";

interface CompanyTablePageProps {
  rows: CompanyRowData[];
  markets: Market[];
  availableSectors: Sector[];
  totalCount: number;
  initialMarkets: string[];
  initialSector: string | undefined;
  initialSort: string | undefined;
  initialDir: string | undefined;
  initialPreset: string | undefined;
  initialCols: string | undefined;
}

export default function CompanyTablePage({
  rows,
  markets,
  availableSectors,
  totalCount,
  initialMarkets,
  initialSector,
  initialSort,
  initialDir,
  initialPreset,
  initialCols,
}: CompanyTablePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync a set of params to URL
  const pushParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === undefined || val === "") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  // Resolve current cols from URL / preset
  const activeCols = resolveCols(initialPreset, initialCols);
  const sortDir = (initialDir === "asc" ? "asc" : "desc") as "asc" | "desc";

  function handleMarketChange(selected: string[]) {
    pushParams({ market: selected.length > 0 ? selected.join(",") : undefined });
  }

  function handleSectorChange(code: string | undefined) {
    pushParams({ sector: code });
  }

  function handlePresetChange(id: string | undefined) {
    pushParams({ preset: id, cols: undefined }); // clear custom cols when preset chosen
  }

  function handleColsChange(cols: string[]) {
    pushParams({ cols: cols.join(","), preset: undefined });
  }

  return (
    <section aria-labelledby="company-table-heading">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2
          id="company-table-heading"
          className="heading-ja"
          style={{ fontSize: "var(--text-h2)", color: "var(--ink)" }}
        >
          企業一覧
          {initialSector && availableSectors.length > 0 && (
            <span style={{ color: "var(--ink-secondary)", fontWeight: 400, marginLeft: 8 }}>
              {availableSectors.find((s) => s.code === initialSector)?.label_ja}
            </span>
          )}
        </h2>

        {/* Preset + column customizer */}
        <div className="flex items-center gap-3 flex-wrap">
          <PresetSelector
            presets={PRESETS}
            activeId={initialPreset}
            onChange={handlePresetChange}
          />
          <ColumnCustomizer
            activeCols={activeCols}
            onChange={handleColsChange}
          />
        </div>
      </div>

      {/* Filters row */}
      <div
        className="flex items-center flex-wrap gap-3 mb-4 pb-4"
        style={{ borderBottom: "1px solid var(--hairline)" }}
      >
        <MarketFilter
          markets={markets}
          selected={initialMarkets}
          onChange={handleMarketChange}
        />
        <span
          aria-hidden="true"
          className="hidden sm:block"
          style={{ width: 1, height: 20, background: "var(--hairline)" }}
        />
        <SectorFilter
          sectors={availableSectors}
          selected={initialSector}
          onChange={handleSectorChange}
        />
      </div>

      {/* Table */}
      <CompanyTable
        rows={rows}
        cols={activeCols}
        sortKey={initialSort}
        sortDir={sortDir}
        totalCount={totalCount}
      />
    </section>
  );
}
