import Link from "next/link";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { getWatchlist, getReports } from "@/lib/db";
import { deriveAll, formatBigNum, formatPct } from "@/lib/metrics";
import { AddToCompareButton } from "@/components/compare/AddToCompareButton";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import type { Company, WatchlistItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "ウォッチリスト — Company Atlas",
};

export default async function WatchlistPage() {
  let userId: string | null = null;
  let userEmail: string | null = null;
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      userEmail = user?.email ?? null;
    }
  } catch {
    // seed mode — no auth
  }

  if (!userId) {
    return <GuestPage />;
  }

  const watchlist = await getWatchlist(userId);
  const items = (watchlist?.items ?? []) as WatchlistItem[];

  const enriched = await Promise.all(
    items.map(async (item) => {
      const company = item.company as Company | undefined;
      if (!company) return null;
      const reports = await getReports(company.id, { periodType: "FY", limit: 1 });
      const report = reports[0] ?? null;
      const derived = report ? deriveAll(report) : {};
      return { item, company, report, derived };
    }),
  );
  const valid = enriched.filter((e): e is NonNullable<typeof e> => e != null);

  return (
    <div className="mx-auto px-4 md:px-6 py-10" style={{ maxWidth: 960 }}>
      <nav style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", marginBottom: 24 }}>
        <Link href="/" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>ホーム</Link>
        <span className="mx-1">›</span>
        <span>ウォッチリスト</span>
      </nav>

      <div className="flex items-baseline gap-3 mb-6 flex-wrap">
        <h1 className="heading-ja" style={{ fontSize: "var(--text-h1)", color: "var(--ink)", margin: 0 }}>
          ウォッチリスト
        </h1>
        {userEmail && (
          <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>{userEmail}</span>
        )}
        <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>{valid.length}社</span>
      </div>

      {valid.length === 0 ? (
        <EmptyWatchlist />
      ) : (
        <div className="flex flex-col gap-3">
          {valid.map(({ item, company, report, derived }) => (
            <WatchlistRow key={item.id} item={item} company={company} report={report} derived={derived} />
          ))}
        </div>
      )}
    </div>
  );
}

function GuestPage() {
  return (
    <div className="mx-auto px-4 md:px-6 py-10" style={{ maxWidth: 960 }}>
      <nav style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", marginBottom: 24 }}>
        <Link href="/" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>ホーム</Link>
        <span className="mx-1">›</span>
        <span>ウォッチリスト</span>
      </nav>
      <h1 className="heading-ja mb-6" style={{ fontSize: "var(--text-h1)", color: "var(--ink)" }}>
        ウォッチリスト
      </h1>
      <div className="p-8 text-center" style={{ background: "var(--surface-sunken)", borderRadius: "var(--r-card)", border: "1px solid var(--hairline)" }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>☆</p>
        <p className="heading-ja mb-2" style={{ fontSize: "var(--text-h2)", color: "var(--ink)" }}>
          まだ企業が登録されていません
        </p>
        <p className="mb-6" style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)", lineHeight: 1.6 }}>
          気になる企業を見つけたら ☆ から追加できます。<br />ウォッチリストの保存にはログインが必要です。
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link href="/auth" className="px-5 py-2.5 rounded-lg font-medium" style={{ background: "var(--accent)", color: "#fff", textDecoration: "none", fontSize: "var(--text-label)", fontFamily: "var(--font-inter), Inter, sans-serif" }}>
            ログインして保存する
          </Link>
          <Link href="/" className="px-5 py-2.5 rounded-lg" style={{ border: "1px solid var(--hairline)", color: "var(--ink-secondary)", textDecoration: "none", fontSize: "var(--text-label)", fontFamily: "var(--font-inter), Inter, sans-serif" }}>
            企業を探す
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyWatchlist() {
  return (
    <div className="p-8 text-center" style={{ background: "var(--surface-sunken)", borderRadius: "var(--r-card)", border: "1px solid var(--hairline)" }}>
      <p style={{ fontSize: 36, marginBottom: 12 }}>☆</p>
      <p className="heading-ja mb-3" style={{ fontSize: "var(--text-h2)", color: "var(--ink)" }}>
        まだ企業が登録されていません
      </p>
      <Link href="/" className="px-5 py-2.5 rounded-lg" style={{ background: "var(--accent)", color: "#fff", textDecoration: "none", fontSize: "var(--text-label)", fontFamily: "var(--font-inter), Inter, sans-serif" }}>
        企業を探す
      </Link>
    </div>
  );
}

function WatchlistRow({ item, company, report, derived }: {
  item: WatchlistItem;
  company: Company;
  report: Awaited<ReturnType<typeof getReports>>[0] | null;
  derived: ReturnType<typeof deriveAll>;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3" style={{ background: "var(--surface-sunken)", borderRadius: "var(--r-control)", border: "1px solid var(--hairline)", flexWrap: "wrap" }}>
      <WatchlistButton companyId={company.id} companyName={company.name} isWatched={true} size="sm" />

      <Link href={`/company/${company.ticker}`} style={{ textDecoration: "none", flex: "1 1 160px", minWidth: 0 }}>
        <p className="num" style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>{company.ticker}</p>
        <p className="heading-ja" style={{ fontSize: "var(--text-label)", color: "var(--ink)", fontWeight: 600, lineHeight: 1.3 }}>{company.name}</p>
      </Link>

      {report && (
        <div className="flex gap-4 flex-wrap">
          {report.net_sales != null && <Stat label="売上高" value={formatBigNum(report.net_sales)} />}
          {derived.op_margin != null && <Stat label="営業利益率" value={formatPct(derived.op_margin)} />}
          {derived.equity_ratio != null && <Stat label="自己資本比率" value={formatPct(derived.equity_ratio, 0)} />}
        </div>
      )}

      <AddToCompareButton company={company} variant="chip" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 72 }}>
      <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>{label}</p>
      <p className="num" style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  );
}
