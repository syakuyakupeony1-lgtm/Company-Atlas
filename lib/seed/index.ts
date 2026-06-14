/**
 * Typed seed data. All UI code must go through lib/db.ts — do NOT import
 * from this file directly. This module re-exports JSON as typed entities.
 */
import type {
  Market,
  Sector,
  Company,
  FinancialReport,
  SectorStat,
  MarketStat,
  MarketSummaryRow,
} from "@/lib/types";

import marketsRaw       from "./markets.json";
import sectorsRaw       from "./sectors.json";
import companiesRaw     from "./companies.json";
import reportsRaw       from "./financial-reports.json";
import sectorStatsRaw   from "./sector-stats.json";
import marketStatsRaw   from "./market-stats.json";
import marketSummaryRaw from "./market-summary.json";

export const seedMarkets:       Market[]           = marketsRaw       as Market[];
export const seedSectors:       Sector[]           = sectorsRaw       as Sector[];
export const seedCompanies:     Company[]          = companiesRaw     as Company[];
export const seedReports:       FinancialReport[]  = reportsRaw       as FinancialReport[];
export const seedSectorStats:   SectorStat[]       = sectorStatsRaw   as SectorStat[];
export const seedMarketStats:   MarketStat[]       = marketStatsRaw   as MarketStat[];
export const seedMarketSummary: MarketSummaryRow[] = marketSummaryRaw as MarketSummaryRow[];

/** Combined seed object for convenience */
export const SEED = {
  markets:       seedMarkets,
  sectors:       seedSectors,
  companies:     seedCompanies,
  reports:       seedReports,
  sectorStats:   seedSectorStats,
  marketStats:   seedMarketStats,
  marketSummary: seedMarketSummary,
} as const;
