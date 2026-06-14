import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCompany,
  getCompanies,
  getReports,
  getSectors,
  getMarkets,
  getSectorStats,
} from "@/lib/db";
import { deriveAll } from "@/lib/metrics";
import { Breadcrumb } from "@/components/company/Breadcrumb";
import { FreshnessHeader } from "@/components/company/FreshnessHeader";
import { SnapshotCard } from "@/components/company/SnapshotCard";
import { BusinessMixCard } from "@/components/company/BusinessMixCard";
import { PLCard } from "@/components/company/PLCard";
import { BSCard } from "@/components/company/BSCard";
import { CFCard } from "@/components/company/CFCard";
import { SSCard } from "@/components/company/SSCard";
import { TimelineCard } from "@/components/company/TimelineCard";
import { RelatedCompanies } from "@/components/company/RelatedCompanies";
import { CompanyCard } from "@/components/company/CompanyCard";

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

  // Primary company fetch
  const company = await getCompany(ticker);
  if (!company) notFound();

  // Parallel secondary fetches
  const [allReports, sectors, markets, sectorStats, sectorPeers] = await Promise.all([
    getReports(company.id, { periodType: "FY" }),
    getSectors(),
    getMarkets(),
    company.sector_code
      ? getSectorStats({ sector: company.sector_code })
      : Promise.resolve([]),
    company.sector_code
      ? getCompanies({ sector: company.sector_code })
      : Promise.resolve([]),
  ]);

  const latestReport = allReports[0] ?? null;
  const derived = latestReport ? deriveAll(latestReport) : {};

  const sector = sectors.find((s) => s.code === company.sector_code);
  void markets;

  const fy = latestReport?.fiscal_year ?? 2024;

  // Build sector benchmarks for the latest fiscal year
  function getBench(metricKey: string) {
    return sectorStats.find((s) => s.metric_key === metricKey && s.fiscal_year === fy) ?? null;
  }

  const benchmarks = {
    net_sales: getBench("net_sales"),
    op_margin: getBench("op_margin"),
    roic:      getBench("roic"),
  };

  // Build related companies with latest net_sales, sorted by revenue proximity
  const currentSales = latestReport?.net_sales ?? null;
  const relatedWithSales = await Promise.all(
    sectorPeers
      .filter((c) => c.ticker !== company.ticker)
      .map(async (c) => {
        const [r] = await getReports(c.id, { periodType: "FY", limit: 1 });
        return {
          ticker: c.ticker,
          name: c.name,
          net_sales: r?.net_sales ?? null,
          sector_code: c.sector_code ?? null,
        };
      }),
  );

  const relatedSorted = relatedWithSales
    .filter((c) => c.net_sales != null)
    .sort((a, b) => {
      if (currentSales == null) return 0;
      return Math.abs((a.net_sales ?? 0) - currentSales) - Math.abs((b.net_sales ?? 0) - currentSales);
    })
    .slice(0, 8);

  // Cards after BS: CF=4, SS=5, Timeline=6, Segment X-Ray=7, Related=8, Phase2 start at 9
  let staggerIdx = 4;

  return (
    <div className="mx-auto px-4 md:px-6 py-8 md:py-12" style={{ maxWidth: 960 }}>

      {/* ── Breadcrumb ─────────────────────────────────────── */}
      <Breadcrumb
        sectorCode={company.sector_code}
        sectorLabel={sector?.label_ja}
        companyName={company.name}
      />

      {/* ── Data freshness header ──────────────────────────── */}
      {latestReport && (
        <FreshnessHeader
          report={latestReport}
          fiscalMonth={company.fiscal_month}
        />
      )}

      {/* ── ① Snapshot ─────────────────────────────────────── */}
      <SnapshotCard
        company={company}
        report={latestReport}
        derived={derived}
        sectorLabel={sector?.label_ja}
        benchmarks={benchmarks}
        staggerIndex={0}
      />

      {/* ── ② Business Mix ────────────────────────────────── */}
      {latestReport && (
        <BusinessMixCard report={latestReport} staggerIndex={1} />
      )}

      {/* ── ③ PL X-Ray ────────────────────────────────────── */}
      {latestReport && (
        <PLCard report={latestReport} staggerIndex={2} />
      )}

      {/* ── ④ BS X-Ray ────────────────────────────────────── */}
      {latestReport && (
        <BSCard report={latestReport} staggerIndex={3} />
      )}

      {/* ── ⑤ CF X-Ray ─────────────────────────────────────── */}
      {latestReport && (
        <CFCard report={latestReport} staggerIndex={staggerIdx++} />
      )}

      {/* ── ⑥ SS X-Ray ─────────────────────────────────────── */}
      {latestReport && (
        <SSCard report={latestReport} staggerIndex={staggerIdx++} />
      )}

      {/* ── ⑦ Timeline ──────────────────────────────────────── */}
      {allReports.length >= 2 && (
        <TimelineCard reports={allReports} staggerIndex={staggerIdx++} />
      )}

      {/* ── Segment X-Ray — 近日対応 ───────────────────────── */}
      <CompanyCard
        title="セグメント X-Ray"
        staggerIndex={staggerIdx++}
        status="coming_soon"
      />

      {/* ── ⑨ Related companies ─────────────────────────────── */}
      {relatedSorted.length > 0 && (
        <RelatedCompanies
          companies={relatedSorted}
          currentTicker={company.ticker}
          sectorLabel={sector?.label_ja}
          staggerIndex={staggerIdx++}
        />
      )}

      {/* ── Phase 2 placeholder cards ─────────────────────── */}
      {PHASE2_CARDS.map((card) => (
        <CompanyCard
          key={card.key}
          title={card.title}
          staggerIndex={staggerIdx++}
          status="coming_soon"
        />
      ))}
    </div>
  );
}
