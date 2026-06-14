import type { Metadata } from "next";
import Link from "next/link";
import { getCompany, getReports, getSectors, getSectorStats } from "@/lib/db";
import { deriveAll, formatBigNum, formatPct } from "@/lib/metrics";
import { benchFromSectorStat } from "@/lib/sector-bench";

export const metadata: Metadata = {
  title: "企業比較 — Company Atlas",
};

interface ComparePageProps {
  searchParams: Promise<{ codes?: string }>;
}

// ─── Metric rows to compare ───────────────────────────────────

interface MetricRow {
  key: string;
  label: string;
  format: (v: number) => string;
  higherIsBetter?: boolean;
}

const METRIC_ROWS: MetricRow[] = [
  { key: "net_sales",        label: "売上高",       format: formatBigNum },
  { key: "operating_income", label: "営業利益",     format: formatBigNum },
  { key: "op_margin",        label: "営業利益率",   format: (v) => formatPct(v),       higherIsBetter: true },
  { key: "net_income",       label: "純利益",       format: formatBigNum },
  { key: "roic",             label: "ROIC（簡易）", format: (v) => formatPct(v),       higherIsBetter: true },
  { key: "equity_ratio",     label: "自己資本比率", format: (v) => formatPct(v, 0),    higherIsBetter: true },
  { key: "total_assets",     label: "総資産",       format: formatBigNum },
  { key: "cf_operating",     label: "営業CF",       format: formatBigNum },
  { key: "fcf",              label: "FCF",          format: formatBigNum,              higherIsBetter: true },
];

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { codes } = await searchParams;
  const tickers = (codes ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

  if (tickers.length === 0) {
    return (
      <div className="mx-auto px-4 py-16 text-center" style={{ maxWidth: 640 }}>
        <p style={{ color: "var(--ink-tertiary)", fontSize: "var(--text-label)" }}>
          比較する企業を選んでいません。企業ページの「比較に追加」ボタンから追加してください。
        </p>
        <Link href="/" style={{ color: "var(--accent)", fontSize: "var(--text-label)", marginTop: 16, display: "inline-block" }}>
          企業を探す
        </Link>
      </div>
    );
  }

  // Fetch all companies + reports in parallel
  const [sectors, companyResults] = await Promise.all([
    getSectors(),
    Promise.all(tickers.map(async (ticker) => {
      const company = await getCompany(ticker);
      if (!company) return null;
      const [reports] = await Promise.all([getReports(company.id, { periodType: "FY", limit: 1 })]);
      const report = reports[0] ?? null;
      const derived = report ? deriveAll(report) : {};

      // Sector bench for op_margin
      const sectorStats = company.sector_code
        ? await getSectorStats({ sector: company.sector_code, fiscalYear: report?.fiscal_year })
        : [];
      const opMarginStat = sectorStats.find((s) => s.metric_key === "op_margin");
      const opMarginBench = benchFromSectorStat(opMarginStat);

      return { company, report, derived, opMarginBench };
    })),
  ]);

  const entries = companyResults.filter((e): e is NonNullable<typeof e> => e != null);

  if (entries.length === 0) {
    return (
      <div className="mx-auto px-4 py-16 text-center" style={{ maxWidth: 640 }}>
        <p style={{ color: "var(--neg)", fontSize: "var(--text-label)" }}>
          企業が見つかりませんでした（{tickers.join(", ")}）
        </p>
      </div>
    );
  }

  // Extract metric value for each entry
  function getValue(entry: (typeof entries)[number], key: string): number | null {
    const { report, derived } = entry;
    if (!report) return null;
    if (key in derived) return (derived as Record<string, number | null>)[key] ?? null;
    return (report as unknown as Record<string, number | null>)[key] ?? null;
  }

  // Find min/max across all entries for a metric (for highlighting)
  function getMinMax(key: string): { min: number | null; max: number | null } {
    const vals = entries.map((e) => getValue(e, key)).filter((v): v is number => v != null);
    if (vals.length < 2) return { min: null, max: null };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }

  const colCount = entries.length;
  const sectorName = (sectorCode: string | undefined) =>
    sectors.find((s) => s.code === sectorCode)?.label_ja ?? sectorCode ?? "—";

  return (
    <div className="mx-auto px-4 md:px-6 py-8" style={{ maxWidth: 1280 }}>
      {/* Header */}
      <div className="mb-6">
        <nav style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", marginBottom: 8 }}>
          <Link href="/" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>ホーム</Link>
          <span className="mx-1">›</span>
          <span>企業比較</span>
        </nav>
        <h1 className="heading-ja" style={{ fontSize: "var(--text-h1)", color: "var(--ink)", margin: 0 }}>
          企業比較
        </h1>
        <p className="mt-1" style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>
          ↑ は各行で最も高い値（評価を意味するものではありません）
        </p>
      </div>

      {/* Scrollable compare table */}
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: colCount * 200 }}>
          {/* Company header row */}
          <thead>
            <tr>
              <th style={{ width: 160, padding: "8px 12px", textAlign: "left", fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", fontWeight: 400, borderBottom: "2px solid var(--hairline)", position: "sticky", left: 0, background: "var(--surface)", zIndex: 2 }}>
                指標
              </th>
              {entries.map(({ company }) => (
                <th
                  key={company.id}
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    borderBottom: "2px solid var(--hairline)",
                    minWidth: 180,
                  }}
                >
                  <Link
                    href={`/company/${company.ticker}`}
                    style={{ textDecoration: "none" }}
                  >
                    <p className="num" style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", marginBottom: 2 }}>
                      {company.ticker}
                    </p>
                    <p
                      className="heading-ja"
                      style={{ fontSize: "var(--text-label)", color: "var(--ink)", fontWeight: 700, lineHeight: 1.3 }}
                    >
                      {company.name}
                    </p>
                    <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", marginTop: 2 }}>
                      {sectorName(company.sector_code)} / {entries[0].report?.fiscal_year ?? "—"}年度
                    </p>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {METRIC_ROWS.map((row, rowIdx) => {
              const { min, max } = getMinMax(row.key);
              const isAlt = rowIdx % 2 === 0;

              return (
                <tr
                  key={row.key}
                  style={{ background: isAlt ? "var(--surface-sunken)" : "transparent" }}
                >
                  {/* Metric label — sticky */}
                  <td
                    style={{
                      padding: "12px 12px",
                      fontSize: "var(--text-label)",
                      color: "var(--ink-secondary)",
                      fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif",
                      borderBottom: "1px solid var(--hairline)",
                      position: "sticky",
                      left: 0,
                      background: isAlt ? "var(--surface-sunken)" : "var(--surface)",
                      zIndex: 1,
                    }}
                  >
                    {row.label}
                  </td>

                  {entries.map(({ company, report, derived }) => {
                    const val = getValue({ company, report, derived, opMarginBench: null }, row.key);
                    const isMax = val != null && val === max;
                    const isMin = val != null && val === min && max !== min;

                    return (
                      <td
                        key={company.id}
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          borderBottom: "1px solid var(--hairline)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {val != null ? (
                          <span
                            className="num"
                            style={{
                              fontSize: "var(--text-label)",
                              fontWeight: isMax ? 700 : 400,
                              color: isMax ? "var(--pos)" : isMin ? "var(--ink-tertiary)" : "var(--ink)",
                              padding: isMax ? "2px 6px" : undefined,
                              background: isMax ? "var(--pos)12" : undefined,
                              borderRadius: isMax ? 4 : undefined,
                              display: "inline-block",
                            }}
                          >
                            {row.format(val)}
                            {isMax && <span style={{ fontSize: 10, marginLeft: 3, color: "var(--pos)" }}>↑</span>}
                          </span>
                        ) : (
                          <span style={{ color: "var(--ink-tertiary)", fontSize: "var(--text-caption)" }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sector bench row (op_margin) */}
      {entries.some((e) => e.opMarginBench) && (
        <div
          className="mt-6 p-4"
          style={{ background: "var(--surface-sunken)", borderRadius: "var(--r-control)" }}
        >
          <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", marginBottom: 8 }}>
            業種中央値（営業利益率）— 比較企業と同業種の参考値
          </p>
          <div className="flex flex-wrap gap-4">
            {entries.map(({ company, opMarginBench }) => {
              if (!opMarginBench || !company.sector_code) return null;
              const sLabel = sectorName(company.sector_code);
              return (
                <div key={company.id} style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)" }}>
                  <span className="num" style={{ color: "var(--ink-tertiary)", fontSize: "var(--text-caption)" }}>{sLabel}</span>
                  <span className="num ml-2" style={{ fontWeight: 600 }}>
                    {formatPct(opMarginBench.median)}
                  </span>
                  <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)", marginLeft: 4 }}>
                    (Q1: {formatPct(opMarginBench.q1)} — Q3: {formatPct(opMarginBench.q3)})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share URL */}
      <ShareButton codes={tickers.join(",")} />
    </div>
  );
}

function ShareButton({ codes }: { codes: string }) {
  return (
    <div className="mt-8 flex items-center gap-3">
      <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>
        このページをシェア：
      </p>
      <code
        style={{
          fontSize: "var(--text-caption)",
          color: "var(--ink-secondary)",
          background: "var(--surface-sunken)",
          padding: "4px 8px",
          borderRadius: 4,
          fontFamily: "var(--font-mono)",
        }}
      >
        /compare?codes={codes}
      </code>
    </div>
  );
}
