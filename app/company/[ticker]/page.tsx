import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCompany,
  getCompanies,
  getReports,
  getSectors,
  getMarkets,
  getSectorStats,
  getInsights,
} from "@/lib/db";
import { deriveAll } from "@/lib/metrics";
import { benchFromSectorStat, computeSectorBench } from "@/lib/sector-bench";
import { generateSnapshotNarrative, generateTemplateKeyPoints } from "@/lib/narrative";
import type { NarrativeContext } from "@/lib/narrative";
import { Breadcrumb } from "@/components/company/Breadcrumb";
import { FreshnessHeader } from "@/components/company/FreshnessHeader";
import { SnapshotCard } from "@/components/company/SnapshotCard";
import { BusinessMixCard } from "@/components/company/BusinessMixCard";
import { PLCard } from "@/components/company/PLCard";
import { BSCard } from "@/components/company/BSCard";
import { CFCard } from "@/components/company/CFCard";
import { SSCard } from "@/components/company/SSCard";
import { TimelineCard } from "@/components/company/TimelineCard";
import { KeyPointsCard } from "@/components/company/KeyPointsCard";
import { RelatedCompanies } from "@/components/company/RelatedCompanies";
import { CompanyCard } from "@/components/company/CompanyCard";
import { AddToCompareButton } from "@/components/compare/AddToCompareButton";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { createServerClient } from "@/lib/supabase/server";
import { getWatchlist } from "@/lib/db";

interface CompanyPageProps {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { ticker } = await params;
  const company = await getCompany(ticker);
  if (!company) return { title: "企業が見つかりません — Company Atlas" };
  return {
    title: `${company.name}（${company.ticker}）— Company Atlas`,
    description: `${company.name}の財務データ・業績推移・業種内ポジションを分析`,
  };
}

// Phase 2 placeholder cards
const PHASE2_CARDS = [
  { key: "capital_allocation", title: "資本配分" },
  { key: "business_situation", title: "業況分析" },
  { key: "segment_compare",    title: "セグメント比較" },
];

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { ticker } = await params;

  const company = await getCompany(ticker);
  if (!company) notFound();

  // Check auth for watchlist state
  let userId: string | null = null;
  let isWatched = false;
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }
  } catch {
    // seed mode — no auth
  }
  if (userId) {
    const watchlist = await getWatchlist(userId);
    const items = watchlist?.items ?? [];
    isWatched = items.some((item) => item.company_id === company.id);
  }

  // Parallel fetches
  const [allReports, sectors, markets, sectorStats, sectorPeers, insights] = await Promise.all([
    getReports(company.id, { periodType: "FY" }),
    getSectors(),
    getMarkets(),
    company.sector_code
      ? getSectorStats({ sector: company.sector_code })
      : Promise.resolve([]),
    company.sector_code
      ? getCompanies({ sector: company.sector_code })
      : Promise.resolve([]),
    getInsights(company.id),
  ]);

  void markets;

  const latestReport = allReports[0] ?? null;
  const prevReport   = allReports[1] ?? null;
  const derived      = latestReport ? deriveAll(latestReport) : {};

  const sector     = sectors.find((s) => s.code === company.sector_code);
  const sectorLabel = sector?.label_ja;

  const fy = latestReport?.fiscal_year ?? 2024;

  // ── Sector benchmarks ─────────────────────────────────────────
  // Pre-computed from seed (op_margin, roic, equity_ratio, fcf)
  function seedBench(metricKey: string) {
    const stat = sectorStats.find((s) => s.metric_key === metricKey && s.fiscal_year === fy);
    return benchFromSectorStat(stat);
  }

  // Live-computed for net_sales (not in seed sector-stats)
  const peerReports = await Promise.all(
    sectorPeers
      .filter((c) => c.id !== company.id)
      .map(async (c) => {
        const [r] = await getReports(c.id, { periodType: "FY", limit: 1 });
        return r ?? null;
      }),
  );
  const validPeerReports = peerReports.filter((r): r is NonNullable<typeof r> => r != null && r.fiscal_year === fy);
  const allFyReports = latestReport ? [latestReport, ...validPeerReports] : validPeerReports;

  const benches = {
    net_sales:    computeSectorBench(allFyReports, "net_sales"),
    op_margin:    seedBench("op_margin"),
    roic:         seedBench("roic"),
    equity_ratio: seedBench("equity_ratio"),
    fcf:          seedBench("fcf"),
  };

  // ── Narrative & key_points (template, zero AI cost) ──────────
  const empty = { summary: "", highlights: [] };
  const narrativeCtx: NarrativeContext | null = latestReport
    ? { company, report: latestReport, prevReport, derived, sectorLabel, benches }
    : null;

  const narrative = narrativeCtx
    ? { easy: generateSnapshotNarrative(narrativeCtx, "easy") }
    : { easy: empty };

  const templatePointsByLevel = narrativeCtx
    ? {
        easy:     generateTemplateKeyPoints(narrativeCtx, "easy"),
        standard: generateTemplateKeyPoints(narrativeCtx, "standard"),
        pro:      generateTemplateKeyPoints(narrativeCtx, "pro"),
      }
    : { easy: [], standard: [], pro: [] };

  // ── Related companies with net_sales ─────────────────────────
  const currentSales = latestReport?.net_sales ?? null;
  const relatedWithSales = peerReports
    .map((r, i) => {
      const c = sectorPeers.filter((p) => p.id !== company.id)[i];
      if (!c || !r) return null;
      return { ticker: c.ticker, name: c.name, net_sales: r.net_sales ?? null, sector_code: c.sector_code ?? null };
    })
    .filter((x): x is NonNullable<typeof x> => x != null && x.net_sales != null)
    .sort((a, b) =>
      currentSales != null
        ? Math.abs((a.net_sales ?? 0) - currentSales) - Math.abs((b.net_sales ?? 0) - currentSales)
        : 0,
    )
    .slice(0, 8);

  // Sequential stagger starting after ①–④
  let si = 4;

  return (
    <div className="mx-auto px-4 md:px-6 py-8 md:py-12" style={{ maxWidth: 960 }}>

      <Breadcrumb
        sectorCode={company.sector_code}
        sectorLabel={sectorLabel}
        companyName={company.name}
      />

      {latestReport && (
        <FreshnessHeader report={latestReport} fiscalMonth={company.fiscal_month} />
      )}

      {/* Company action buttons */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <WatchlistButton
          companyId={company.id}
          companyName={company.name}
          isWatched={isWatched}
        />
        <AddToCompareButton company={company} variant="chip" />
      </div>

      {/* ① Snapshot */}
      <SnapshotCard
        company={company}
        report={latestReport}
        derived={derived}
        sectorLabel={sectorLabel}
        benches={benches}
        narrative={narrative.easy}
        staggerIndex={0}
      />

      {/* ② Business Mix */}
      {latestReport && <BusinessMixCard report={latestReport} staggerIndex={1} />}

      {/* ③ PL X-Ray */}
      {latestReport && <PLCard report={latestReport} staggerIndex={2} />}

      {/* ④ BS X-Ray */}
      {latestReport && <BSCard report={latestReport} staggerIndex={3} />}

      {/* ⑤ CF X-Ray */}
      {latestReport && <CFCard report={latestReport} staggerIndex={si++} />}

      {/* ⑥ SS X-Ray */}
      {latestReport && <SSCard report={latestReport} staggerIndex={si++} />}

      {/* ⑦ Timeline */}
      {allReports.length >= 2 && <TimelineCard reports={allReports} staggerIndex={si++} />}

      {/* ⑩ Key points */}
      {latestReport && (
        <KeyPointsCard
          insights={insights}
          templatePoints={templatePointsByLevel}
          reportId={latestReport.id}
          staggerIndex={si++}
        />
      )}

      {/* Segment X-Ray — 近日対応 */}
      <CompanyCard title="セグメント X-Ray" staggerIndex={si++} status="coming_soon" />

      {/* ⑨ Related companies */}
      {relatedWithSales.length > 0 && (
        <RelatedCompanies
          companies={relatedWithSales}
          currentTicker={company.ticker}
          sectorLabel={sectorLabel}
          staggerIndex={si++}
        />
      )}

      {/* Phase 2 placeholders */}
      {PHASE2_CARDS.map((card) => (
        <CompanyCard key={card.key} title={card.title} staggerIndex={si++} status="coming_soon" />
      ))}
    </div>
  );
}
