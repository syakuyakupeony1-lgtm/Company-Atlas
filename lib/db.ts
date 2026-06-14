/**
 * Data access layer — dual-mode: seed JSON (dev/demo) or Supabase (production).
 *
 * Detection: if NEXT_PUBLIC_SUPABASE_URL is set → Supabase mode.
 *            otherwise → seed data mode (5 demo companies, no auth required).
 *
 * All function signatures are identical in both modes; callers need no changes.
 */
import { createClient } from "@supabase/supabase-js";
import type {
  Market,
  Sector,
  Company,
  FinancialReport,
  SectorStat,
  MarketStat,
  MarketSummaryRow,
  AiInsight,
  WatchlistItem,
  Watchlist,
  SavedView,
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

// ─── Supabase client (singleton, only created when env vars present) ───────

let _db: ReturnType<typeof createClient> | null = null;

function getDb() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!_db) _db = createClient(url, key);
  // Cast to `any` so untyped (no Database generic) queries don't produce `never` types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return _db as any;
}

// ─── Filter types ─────────────────────────────────────────────

export interface CompanyFilter {
  market?: string;
  sector?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  searchQuery?: string;
}

export interface ReportFilter {
  periodType?: "FY" | "H1";
  limit?: number;
}

export interface StatsFilter {
  sector?: string;
  metric?: string;
  fiscalYear?: number;
}

export interface MarketStatsFilter {
  market?: string | null;
  metric?: string;
  fiscalYear?: number;
}

export interface SummaryFilter {
  market?: string | null;
  fiscalYear?: number;
}

// ─── Public query functions ───────────────────────────────────

export async function getMarkets(): Promise<Market[]> {
  const db = getDb();
  if (db) {
    const { data } = await db.from("markets").select("*").order("sort_order");
    return (data as Market[]) ?? [];
  }
  return [...seedMarkets].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getSectors(): Promise<Sector[]> {
  const db = getDb();
  if (db) {
    const { data } = await db.from("sectors").select("*").order("code");
    return (data as Sector[]) ?? [];
  }
  return [...seedSectors].sort((a, b) => a.code.localeCompare(b.code));
}

export async function getCompanies(filter: CompanyFilter = {}): Promise<Company[]> {
  const { market, sector, activeOnly = true, limit = 500, offset = 0, searchQuery } = filter;
  const db = getDb();
  if (db) {
    let q = db.from("companies").select("*");
    if (activeOnly) q = q.eq("is_active", true);
    if (market)     q = q.eq("market_code", market);
    if (sector)     q = q.eq("sector_code", sector);
    if (searchQuery) q = q.or(`ticker.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
    q = q.order("name").range(offset, offset + limit - 1);
    const { data } = await q;
    return (data as Company[]) ?? [];
  }
  return seedCompanies.filter((c) => {
    if (activeOnly && !c.is_active) return false;
    if (market && c.market_code !== market) return false;
    if (sector && c.sector_code !== sector) return false;
    return true;
  });
}

export async function getCompany(ticker: string): Promise<Company | null> {
  const db = getDb();
  if (db) {
    const { data } = await db.from("companies").select("*").eq("ticker", ticker).single();
    return (data as Company) ?? null;
  }
  return seedCompanies.find((c) => c.ticker === ticker) ?? null;
}

export async function getReports(
  companyId: string,
  filter: ReportFilter = {},
): Promise<FinancialReport[]> {
  const { periodType, limit } = filter;
  const db = getDb();
  if (db) {
    let q = db.from("financial_reports").select("*").eq("company_id", companyId).order("fiscal_year", { ascending: false });
    if (periodType) q = q.eq("period_type", periodType);
    if (limit)      q = q.limit(limit);
    const { data } = await q;
    return (data as FinancialReport[]) ?? [];
  }
  let results = seedReports.filter((r) => {
    if (r.company_id !== companyId) return false;
    if (periodType && r.period_type !== periodType) return false;
    return true;
  }).sort((a, b) => b.fiscal_year - a.fiscal_year);
  if (limit != null) results = results.slice(0, limit);
  return results;
}

export async function getSectorStats(filter: StatsFilter = {}): Promise<SectorStat[]> {
  const { sector, metric, fiscalYear } = filter;
  const db = getDb();
  if (db) {
    let q = db.from("sector_stats").select("*");
    if (sector)     q = q.eq("sector_code", sector);
    if (metric)     q = q.eq("metric_key", metric);
    if (fiscalYear) q = q.eq("fiscal_year", fiscalYear);
    const { data } = await q;
    return (data as SectorStat[]) ?? [];
  }
  return seedSectorStats.filter((s) => {
    if (sector     && s.sector_code !== sector)     return false;
    if (metric     && s.metric_key  !== metric)     return false;
    if (fiscalYear && s.fiscal_year !== fiscalYear) return false;
    return true;
  });
}

export async function getMarketStats(filter: MarketStatsFilter = {}): Promise<MarketStat[]> {
  const { market, metric, fiscalYear } = filter;
  const db = getDb();
  if (db) {
    let q = db.from("market_stats").select("*");
    if (market !== undefined) {
      q = market === null ? q.is("market_code", null) : q.eq("market_code", market);
    }
    if (metric)     q = q.eq("metric_key", metric);
    if (fiscalYear) q = q.eq("fiscal_year", fiscalYear);
    const { data } = await q;
    return (data as MarketStat[]) ?? [];
  }
  return seedMarketStats.filter((s) => {
    if (market !== undefined) {
      if (market === null) { if (s.market_code != null) return false; }
      else { if (s.market_code !== market) return false; }
    }
    if (metric     && s.metric_key  !== metric)     return false;
    if (fiscalYear && s.fiscal_year !== fiscalYear) return false;
    return true;
  });
}

export async function getMarketSummary(filter: SummaryFilter = {}): Promise<MarketSummaryRow[]> {
  const { market, fiscalYear } = filter;
  const db = getDb();
  if (db) {
    let q = db.from("market_summary").select("*");
    if (market !== undefined) {
      q = market === null ? q.is("market_code", null) : q.eq("market_code", market);
    }
    if (fiscalYear) q = q.eq("fiscal_year", fiscalYear);
    const { data } = await q;
    return (data as MarketSummaryRow[]) ?? [];
  }
  return seedMarketSummary.filter((s) => {
    if (market !== undefined) {
      if (market === null) { if (s.market_code != null) return false; }
      else { if (s.market_code !== market) return false; }
    }
    if (fiscalYear && s.fiscal_year !== fiscalYear) return false;
    return true;
  });
}

// ─── AI insights ──────────────────────────────────────────────

const insightStore: AiInsight[] = [];

export async function getInsights(companyId: string): Promise<AiInsight[]> {
  const db = getDb();
  if (db) {
    const { data } = await db.from("ai_insights").select("*").eq("company_id", companyId);
    return (data as AiInsight[]) ?? [];
  }
  return insightStore.filter((i) => i.company_id === companyId);
}

interface SaveInsightInput {
  company_id: string;
  report_id?: string;
  kind: string;
  level: string;
  content: Record<string, unknown>;
  model?: string;
}

export async function saveInsight(input: SaveInsightInput): Promise<AiInsight> {
  const db = getDb();
  if (db) {
    const { data, error } = await db.from("ai_insights").upsert({
      ...input,
      generated_at: new Date().toISOString(),
    }, {
      onConflict: "company_id,kind,level,report_id",
    }).select().single();
    if (error) throw error;
    return data as AiInsight;
  }
  const insight: AiInsight = {
    id: `insight-${input.company_id}-${input.kind}-${input.level}-${Date.now()}`,
    ...input,
    generated_at: new Date().toISOString(),
  };
  const idx = insightStore.findIndex(
    (i) => i.company_id === input.company_id && i.kind === input.kind &&
            i.level === input.level && i.report_id === input.report_id,
  );
  if (idx >= 0) insightStore[idx] = insight;
  else insightStore.push(insight);
  return insight;
}

// ─── User-data functions (require auth context from caller) ───

/** Get the user's default watchlist with items + company data. */
export async function getWatchlist(userId: string): Promise<Watchlist | null> {
  const db = getDb();
  if (!db) return null;
  const { data } = await db
    .from("watchlists")
    .select(`*, items:watchlist_items(*, company:companies(*))`)
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .single();
  return (data as Watchlist) ?? null;
}

/** Toggle watchlist membership. Returns { added: boolean }. */
export async function toggleWatchlist(
  userId: string,
  companyId: string,
  note?: string,
): Promise<{ added: boolean; itemId?: string }> {
  const db = getDb();
  if (!db) throw new Error("Supabase not configured");

  // Find default watchlist
  const { data: wl } = await db
    .from("watchlists")
    .select("id")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .single();
  if (!wl) throw new Error("Watchlist not found");

  // Check existing
  const { data: existing } = await db
    .from("watchlist_items")
    .select("id")
    .eq("watchlist_id", wl.id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (existing) {
    await db.from("watchlist_items").delete().eq("id", existing.id);
    return { added: false };
  }

  const { data: inserted } = await db
    .from("watchlist_items")
    .insert({ watchlist_id: wl.id, company_id: companyId, note: note ?? null })
    .select("id")
    .single();
  return { added: true, itemId: inserted?.id };
}

export async function updateWatchlistNote(itemId: string, note: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.from("watchlist_items").update({ note }).eq("id", itemId);
}

/** Get all saved views for a user. */
export async function getSavedViews(userId: string): Promise<SavedView[]> {
  const db = getDb();
  if (!db) return [];
  const { data } = await db.from("saved_views").select("*").eq("user_id", userId).order("created_at");
  return (data as SavedView[]) ?? [];
}

export async function saveSavedView(
  userId: string,
  name: string,
  columns: string[],
  sortKey?: string,
): Promise<SavedView> {
  const db = getDb();
  if (!db) throw new Error("Supabase not configured");
  const { data, error } = await db
    .from("saved_views")
    .insert({ user_id: userId, name, columns, sort_key: sortKey ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as SavedView;
}

export async function deleteSavedView(viewId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.from("saved_views").delete().eq("id", viewId);
}

// ─── Convenience helpers ──────────────────────────────────────

export async function getLatestReport(companyId: string): Promise<FinancialReport | null> {
  const reports = await getReports(companyId, { periodType: "FY", limit: 1 });
  return reports[0] ?? null;
}

export async function getSectorBench(
  sectorCode: string,
  metricKey: string,
  fiscalYear: number,
): Promise<SectorStat | null> {
  const rows = await getSectorStats({ sector: sectorCode, metric: metricKey, fiscalYear });
  return rows[0] ?? null;
}

export async function getMarketBench(
  metricKey: string,
  fiscalYear: number,
): Promise<MarketStat | null> {
  const rows = await getMarketStats({ market: null, metric: metricKey, fiscalYear });
  return rows[0] ?? null;
}
