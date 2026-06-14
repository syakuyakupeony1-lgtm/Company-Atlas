import { Suspense } from "react";
import {
  getCompanies,
  getMarkets,
  getSectors,
  getSectorStats,
  getReports,
  getMarketStats,
  getMarketSummary,
} from "@/lib/db";
import { deriveAll } from "@/lib/metrics";
import { getRowSortValue } from "@/lib/table-config";
import type { CompanyRowData } from "@/lib/table-config";
import type { SectorStat } from "@/lib/types";
import CompanyTablePage from "@/app/_components/CompanyTablePage";
import TopPageLayout from "@/app/_components/TopPageLayout";

interface SearchParams {
  market?: string;
  sector?: string;
  sort?: string;
  dir?: string;
  preset?: string;
  cols?: string;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  // Parse URL params
  const marketFilter = sp.market ? sp.market.split(",").filter(Boolean) : [];
  const sectorFilter = sp.sector || undefined;
  const sortKey = sp.sort || undefined;
  const sortDir = sp.dir === "asc" ? "asc" : "desc";

  // Parallel data fetches
  const [allCompanies, markets, allSectors, allSectorStats, marketStats, marketSummary] =
    await Promise.all([
      getCompanies({ sector: sectorFilter, activeOnly: true }),
      getMarkets(),
      getSectors(),
      getSectorStats(),
      getMarketStats(),
      getMarketSummary(),
    ]);

  // Apply market filter
  const companies =
    marketFilter.length > 0
      ? allCompanies.filter((c) => marketFilter.includes(c.market_code ?? ""))
      : allCompanies;

  // Build sector-stats lookup: `${sector_code}_${fiscal_year}_${metric_key}` → SectorStat
  const benchIndex = new Map<string, SectorStat>();
  for (const s of allSectorStats) {
    benchIndex.set(`${s.sector_code}_${s.fiscal_year}_${s.metric_key}`, s);
  }

  // Sectors available in the current result set
  const usedSectorCodes = new Set(companies.map((c) => c.sector_code).filter(Boolean));
  const availableSectors = allSectors.filter((s) => usedSectorCodes.has(s.code));

  const fiscalYear = 2024;

  // Fetch latest annual reports for each company (parallel)
  const reportArrays = await Promise.all(
    companies.map((c) => getReports(c.id, { periodType: "FY", limit: 1 })),
  );

  // Assemble rows
  let rows: CompanyRowData[] = companies.map((company, i) => {
    const latestReport = reportArrays[i][0];
    const derived = latestReport ? deriveAll(latestReport) : {};
    const fy = latestReport?.fiscal_year ?? 2024;
    const sc = company.sector_code ?? "";

    const sectorBench: Record<string, SectorStat> = {};
    for (const metricKey of [
      "net_sales",
      "operating_income",
      "op_margin",
      "roic",
      "equity_ratio",
      "fcf",
    ]) {
      const stat = benchIndex.get(`${sc}_${fy}_${metricKey}`);
      if (stat) sectorBench[metricKey] = stat;
    }

    return {
      company,
      market: markets.find((m) => m.code === company.market_code),
      sector: allSectors.find((s) => s.code === company.sector_code),
      latestReport,
      derived,
      sectorBench,
    };
  });

  // Server-side sort
  if (sortKey) {
    rows = rows.sort((a, b) => {
      const av = getRowSortValue(a, sortKey);
      const bv = getRowSortValue(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av - bv;
      return sortDir === "desc" ? -cmp : cmp;
    });
  }

  return (
    <div
      className="mx-auto px-4 md:px-6 py-8 md:py-12"
      style={{ maxWidth: 1280 }}
    >
      {/* ── 第1層・第2層: 市場ダッシュボード + 業界マップ ── */}
      <Suspense fallback={<DashboardSkeleton />}>
        <TopPageLayout
          marketStats={marketStats}
          marketSummary={marketSummary}
          sectors={availableSectors}
          sectorStats={allSectorStats}
          selectedMarkets={marketFilter}
          selectedSector={sectorFilter}
          fiscalYear={fiscalYear}
        />
      </Suspense>

      {/* ── 第3層: 企業テーブル ─── */}
      <Suspense fallback={<TableSkeleton />}>
        <CompanyTablePage
          rows={rows}
          markets={markets}
          availableSectors={availableSectors}
          totalCount={rows.length}
          initialMarkets={marketFilter}
          initialSector={sectorFilter}
          initialSort={sortKey}
          initialDir={sp.dir}
          initialPreset={sp.preset}
          initialCols={sp.cols}
        />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="w-full skeleton mb-6"
      style={{ height: 180, borderRadius: "var(--r-card)" }}
      role="status"
      aria-label="ダッシュボードを読み込み中"
    />
  );
}

function TableSkeleton() {
  return (
    <div
      className="w-full skeleton"
      style={{
        height: 400,
        borderRadius: "var(--r-card)",
      }}
      role="status"
      aria-label="テーブルを読み込み中"
    />
  );
}
