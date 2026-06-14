import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCompany,
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

// Cards not yet implemented — shown as placeholders
const UPCOMING_CARDS = [
  { key: "cf",         title: "キャッシュフロー（CF）" },
  { key: "shareholder",title: "株主還元" },
  { key: "timeline",   title: "業績タイムライン" },
  { key: "related",    title: "関連企業" },
  { key: "earnings",   title: "業績予想" },
  { key: "discussion", title: "論点" },
];

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { ticker } = await params;

  // Primary company fetch
  const company = await getCompany(ticker);
  if (!company) notFound();

  // Parallel secondary fetches
  const [reports, sectors, markets, sectorStats] = await Promise.all([
    getReports(company.id, { periodType: "FY", limit: 1 }),
    getSectors(),
    getMarkets(),
    company.sector_code
      ? getSectorStats({ sector: company.sector_code })
      : Promise.resolve([]),
  ]);

  const latestReport = reports[0] ?? null;
  const derived = latestReport ? deriveAll(latestReport) : {};

  const sector = sectors.find((s) => s.code === company.sector_code);
  void markets; // available for future use

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

      {/* ── Upcoming cards (placeholders) ─────────────────── */}
      {UPCOMING_CARDS.map((card, i) => (
        <CompanyCard
          key={card.key}
          title={card.title}
          staggerIndex={i + 4}
          status="coming_soon"
        />
      ))}
    </div>
  );
}
