/**
 * Data access layer — currently backed by seed JSON.
 * All functions are async so callers need no changes when Supabase is wired in.
 *
 * Swap pattern: replace the body of each function with a Supabase query
 * using the same filter shape and return type.
 */
import type {
  Market,
  Sector,
  Company,
  FinancialReport,
  SectorStat,
  MarketStat,
  MarketSummaryRow,
  AiInsight,
} from "@/lib/types";

import {
  seedMarkets,
  seedSectors,
  seedCompanies,
  seedReports,
  seedSectorStats,
  seedMarketStats,
  seedMarketSummary,
} from "@/lib/seed";

// ─── Filter types ─────────────────────────────────────────────

export interface CompanyFilter {
  /** Filter by market_code ('prime' | 'standard' | 'growth' | 'pro') */
  market?: string;
  /** Filter by sector_code (e.g. '3050') */
  sector?: string;
  /** Default true — exclude is_active=false companies */
  activeOnly?: boolean;
}

export interface ReportFilter {
  /** 'FY' (annual) or 'H1' (semi-annual) */
  periodType?: "FY" | "H1";
  /** Most-recent N records (sorted by fiscal_year desc) */
  limit?: number;
}

export interface StatsFilter {
  /** sector_code to filter by */
  sector?: string;
  /** metric_key to filter by (e.g. 'op_margin') */
  metric?: string;
  /** fiscal_year to filter by */
  fiscalYear?: number;
}

export interface MarketStatsFilter {
  /**
   * market_code to filter by.
   * Pass null explicitly to get the 全市場 aggregate rows.
   * Pass undefined (or omit) to get all rows regardless of market.
   */
  market?: string | null;
  /** metric_key to filter by */
  metric?: string;
  /** fiscal_year to filter by */
  fiscalYear?: number;
}

export interface SummaryFilter {
  /**
   * market_code to filter by.
   * Pass null explicitly to get 全市場 rows.
   * Pass undefined to get all rows.
   */
  market?: string | null;
  /** fiscal_year to filter by */
  fiscalYear?: number;
}

// ─── Query functions ──────────────────────────────────────────

export async function getMarkets(): Promise<Market[]> {
  return [...seedMarkets].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getSectors(): Promise<Sector[]> {
  return [...seedSectors].sort((a, b) => a.code.localeCompare(b.code));
}

export async function getCompanies(filter: CompanyFilter = {}): Promise<Company[]> {
  const { market, sector, activeOnly = true } = filter;
  return seedCompanies.filter((c) => {
    if (activeOnly && !c.is_active) return false;
    if (market && c.market_code !== market) return false;
    if (sector && c.sector_code !== sector) return false;
    return true;
  });
}

export async function getCompany(ticker: string): Promise<Company | null> {
  return seedCompanies.find((c) => c.ticker === ticker) ?? null;
}

export async function getReports(
  companyId: string,
  filter: ReportFilter = {},
): Promise<FinancialReport[]> {
  const { periodType, limit } = filter;

  let results = seedReports.filter((r) => {
    if (r.company_id !== companyId) return false;
    if (periodType && r.period_type !== periodType) return false;
    return true;
  });

  // Sort descending by fiscal year
  results = results.sort((a, b) => b.fiscal_year - a.fiscal_year);

  if (limit != null) results = results.slice(0, limit);

  return results;
}

export async function getSectorStats(filter: StatsFilter = {}): Promise<SectorStat[]> {
  const { sector, metric, fiscalYear } = filter;
  return seedSectorStats.filter((s) => {
    if (sector     && s.sector_code !== sector)   return false;
    if (metric     && s.metric_key  !== metric)   return false;
    if (fiscalYear && s.fiscal_year !== fiscalYear) return false;
    return true;
  });
}

export async function getMarketStats(filter: MarketStatsFilter = {}): Promise<MarketStat[]> {
  const { market, metric, fiscalYear } = filter;
  return seedMarketStats.filter((s) => {
    // Explicit null = filter to 全市場 rows (market_code is null/undefined in data)
    if (market !== undefined) {
      if (market === null) {
        if (s.market_code != null) return false;
      } else {
        if (s.market_code !== market) return false;
      }
    }
    if (metric     && s.metric_key  !== metric)     return false;
    if (fiscalYear && s.fiscal_year !== fiscalYear) return false;
    return true;
  });
}

export async function getMarketSummary(filter: SummaryFilter = {}): Promise<MarketSummaryRow[]> {
  const { market, fiscalYear } = filter;
  return seedMarketSummary.filter((s) => {
    if (market !== undefined) {
      if (market === null) {
        if (s.market_code != null) return false;
      } else {
        if (s.market_code !== market) return false;
      }
    }
    if (fiscalYear && s.fiscal_year !== fiscalYear) return false;
    return true;
  });
}

/** Returns AI insights for a company. Currently no seed data — returns empty. */
export async function getInsights(companyId: string): Promise<AiInsight[]> {
  // Seed has no ai_insights rows yet; populated by the batch AI generation step.
  void companyId;
  return [];
}

// ─── Convenience helpers ──────────────────────────────────────

/** Latest annual report for a company (FY, most recent fiscal_year). */
export async function getLatestReport(companyId: string): Promise<FinancialReport | null> {
  const reports = await getReports(companyId, { periodType: "FY", limit: 1 });
  return reports[0] ?? null;
}

/** Sector stat for a given metric in the latest fiscal year. */
export async function getSectorBench(
  sectorCode: string,
  metricKey: string,
  fiscalYear: number,
): Promise<SectorStat | null> {
  const rows = await getSectorStats({ sector: sectorCode, metric: metricKey, fiscalYear });
  return rows[0] ?? null;
}

/** Market-wide stat for a given metric (全市場 row). */
export async function getMarketBench(
  metricKey: string,
  fiscalYear: number,
): Promise<MarketStat | null> {
  const rows = await getMarketStats({ market: null, metric: metricKey, fiscalYear });
  return rows[0] ?? null;
}
