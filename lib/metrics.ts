import type { FinancialReport, DerivedMetrics } from "@/lib/types";

// ─── METRICS registry ────────────────────────────────────────
// Every metric that can appear in the UI. desc = standard explanation,
// plain = jargon-free one-liner for the "easy" level.
export const METRICS = {
  net_sales: {
    label: "売上高",
    reading: "うりあげだか",
    unit: "円",
    desc: "企業の事業規模がわかる",
    plain: "どれだけ商品やサービスを売ったか",
  },
  cost_of_sales: {
    label: "売上原価",
    reading: "うりあげげんか",
    unit: "円",
    desc: "商品を作るためにかかったコストがわかる",
    plain: "商品を作るのにかかったお金",
  },
  gross_profit: {
    label: "売上総利益",
    reading: "うりあげそうりえき",
    unit: "円",
    desc: "原価を引いた後に残る利益（粗利）がわかる",
    plain: "原価を引いた後に残るお金（粗利）",
  },
  sga: {
    label: "販売費及び一般管理費",
    reading: "はんかんひ",
    unit: "円",
    desc: "販売活動・管理活動に使ったコストがわかる",
    plain: "営業や管理のためにかかったお金",
  },
  operating_income: {
    label: "営業利益",
    reading: "えいぎょうりえき",
    unit: "円",
    desc: "本業で稼ぐ力がわかる",
    plain: "本業でいくら儲かったか",
  },
  ordinary_income: {
    label: "経常利益",
    reading: "けいじょうりえき",
    unit: "円",
    desc: "利息収支など金融活動も含めた稼ぐ力がわかる",
    plain: "お金のやりとりも含めた通常の儲け",
  },
  net_income: {
    label: "当期純利益",
    reading: "とうきじゅんりえき",
    unit: "円",
    desc: "最終的に株主に帰属する利益がわかる",
    plain: "税金まで払って最後に残ったお金",
  },
  total_assets: {
    label: "総資産",
    reading: "そうしさん",
    unit: "円",
    desc: "会社が保有する全資産の規模がわかる",
    plain: "会社が持っている財産の合計",
  },
  total_equity: {
    label: "純資産",
    reading: "じゅんしさん",
    unit: "円",
    desc: "株主が持つ資産の取り分がわかる",
    plain: "借金を引いた後に残る会社の財産",
  },
  retained_earnings: {
    label: "利益剰余金",
    reading: "りえきじょうよきん",
    unit: "円",
    desc: "過去に稼いだ利益の積み上げがわかる",
    plain: "過去に稼いで会社に残してきたお金の合計",
  },
  cf_operating: {
    label: "営業キャッシュフロー",
    reading: "えいぎょうキャッシュフロー",
    unit: "円",
    desc: "本業で実際に生んだ現金がわかる",
    plain: "本業で実際に手に入ったお金",
  },
  cf_investing: {
    label: "投資キャッシュフロー",
    reading: "とうしキャッシュフロー",
    unit: "円",
    desc: "設備投資やM&Aなど投資活動の現金の動きがわかる",
    plain: "設備投資やM&Aに使った（または売って得た）お金",
  },
  cf_financing: {
    label: "財務キャッシュフロー",
    reading: "ざいむキャッシュフロー",
    unit: "円",
    desc: "借入・返済・配当など資金調達の動きがわかる",
    plain: "借りたお金や返したお金・配当のまとめ",
  },
  dividend_per_share: {
    label: "1株配当",
    reading: "いちかぶはいとう",
    unit: "円",
    desc: "株1株当たりの配当金額がわかる",
    plain: "株を1株持っていると毎年もらえる配当金",
  },
  market_cap: {
    label: "時価総額",
    reading: "じかそうがく",
    unit: "円",
    desc: "市場が評価する企業全体の価値がわかる",
    plain: "今この会社を丸ごと買うとしたら合計いくらか",
  },
  // ─── Derived metrics ───────────────────────────────────────
  op_margin: {
    label: "営業利益率",
    reading: "えいぎょうりえきりつ",
    unit: "%",
    desc: "売上に占める営業利益の割合。稼ぐ効率がわかる",
    plain: "売上のうち何割が本業の儲けか",
    derived: true,
  },
  fcf: {
    label: "フリーキャッシュフロー",
    reading: "フリーキャッシュフロー",
    unit: "円",
    desc: "本業で稼いだ現金から設備投資を引いた「自由に使える現金」。成長投資・株主還元の源泉がわかる",
    plain: "自由に使えるお金をどれだけ生んだか",
    derived: true,
  },
  roic: {
    label: "ROIC（簡易）",
    reading: "ロイック",
    unit: "%",
    desc: "投下資本（純資産＋有利子負債近似）に対する税引後営業利益の比率。簡易計算（有利子負債を総資産−純資産で近似）のため参考値として扱う",
    plain: "元手を使ってどれだけ上手に稼いだか（目安値）",
    derived: true,
  },
  equity_ratio: {
    label: "自己資本比率",
    reading: "じこしほんひりつ",
    unit: "%",
    desc: "総資産に占める純資産の割合。財務の安定性がわかる（高いほど借金に頼っていない）",
    plain: "会社の財産のうち借金でない割合（高いほど安全）",
    derived: true,
  },
  dividend_yield: {
    label: "配当利回り",
    reading: "はいとうりまわり",
    unit: "%",
    desc: "株価に対する年間配当の比率。株主に対する現金還元水準がわかる",
    plain: "株を買うと毎年どれくらい配当がもらえるか",
    derived: true,
  },
} as const;

export type MetricKey = keyof typeof METRICS;

// ─── Derived metric calculators ──────────────────────────────
// All return null if inputs are missing or produce invalid results.

export function calcOpMargin(
  operatingIncome: number | null | undefined,
  netSales: number | null | undefined,
): number | null {
  if (operatingIncome == null || netSales == null || netSales === 0) return null;
  return (operatingIncome / netSales) * 100;
}

export function calcFcf(
  cfOperating: number | null | undefined,
  cfInvesting: number | null | undefined,
): number | null {
  if (cfOperating == null || cfInvesting == null) return null;
  return cfOperating + cfInvesting;
}

/** Simplified ROIC: uses (totalAssets − totalEquity) as a proxy for interest-bearing debt.
 *  This is noted as "簡易計算" in the ROIC metric desc above.
 */
export function calcRoic(
  operatingIncome: number | null | undefined,
  totalEquity: number | null | undefined,
  totalAssets: number | null | undefined,
  taxRate = 0.3,
): number | null {
  if (operatingIncome == null || totalEquity == null || totalAssets == null) return null;
  const investedCapital = totalAssets; // equity + debt proxy
  if (investedCapital <= 0) return null;
  return ((operatingIncome * (1 - taxRate)) / investedCapital) * 100;
}

export function calcEquityRatio(
  totalEquity: number | null | undefined,
  totalAssets: number | null | undefined,
): number | null {
  if (totalEquity == null || totalAssets == null || totalAssets === 0) return null;
  return (totalEquity / totalAssets) * 100;
}

/** Requires a share price (yen) from market data — not stored in financial_reports. */
export function calcDividendYield(
  dividendPerShare: number | null | undefined,
  sharePrice: number | null | undefined,
): number | null {
  if (dividendPerShare == null || sharePrice == null || sharePrice === 0) return null;
  return (dividendPerShare / sharePrice) * 100;
}

/** YoY growth rate in % */
export function calcGrowthRate(
  current: number | null | undefined,
  prev: number | null | undefined,
): number | null {
  if (current == null || prev == null || prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

/** Compute all derivable metrics from a single report. */
export function deriveAll(report: FinancialReport): DerivedMetrics {
  return {
    op_margin:    calcOpMargin(report.operating_income, report.net_sales),
    fcf:          calcFcf(report.cf_operating, report.cf_investing),
    roic:         calcRoic(report.operating_income, report.total_equity, report.total_assets),
    equity_ratio: calcEquityRatio(report.total_equity, report.total_assets),
  };
}

// ─── Display formatters ───────────────────────────────────────

/** Format a yen value as 億円 / 兆円. Returns "—" for null. */
export function formatYen(
  value: number | null | undefined,
  precision = 0,
): string {
  if (value == null) return "—";
  const sign = value < 0 ? "−" : "";
  const abs  = Math.abs(value);
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(precision + 1)}兆円`;
  if (abs >= 1e8)  return `${sign}${(abs / 1e8).toFixed(precision)}億円`;
  if (abs >= 1e4)  return `${sign}${(abs / 1e4).toFixed(precision)}万円`;
  return `${sign}${abs.toLocaleString("ja-JP")}円`;
}

/** Short label for chart axes: 650億 / 1.4兆 */
export function formatBigNum(value: number | null | undefined): string {
  if (value == null) return "—";
  const sign = value < 0 ? "−" : "";
  const abs  = Math.abs(value);
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)}兆`;
  if (abs >= 1e8)  return `${sign}${Math.round(abs / 1e8)}億`;
  if (abs >= 1e4)  return `${sign}${Math.round(abs / 1e4)}万`;
  return `${sign}${abs.toLocaleString("ja-JP")}`;
}

/** Format a percentage value. Returns "—" for null. */
export function formatPct(
  value: number | null | undefined,
  precision = 1,
): string {
  if (value == null) return "—";
  return `${value.toFixed(precision)}%`;
}

/** Format with sign (+/−) for delta values. */
export function formatDelta(
  value: number | null | undefined,
  precision = 1,
  unit = "%",
): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(precision)}${unit}`;
}
