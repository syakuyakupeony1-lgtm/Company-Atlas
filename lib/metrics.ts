export const METRICS = {
  net_sales: {
    label: "売上高",
    reading: "うりあげだか",
    unit: "円",
    desc: "企業規模がわかる",
    plain: "どれだけ商品やサービスを売ったか",
  },
  operating_income: {
    label: "営業利益",
    reading: "えいぎょうりえき",
    unit: "円",
    desc: "本業で稼ぐ力がわかる",
    plain: "本業でいくら儲かったか",
  },
  op_margin: {
    label: "営業利益率",
    reading: "えいぎょうりえきりつ",
    unit: "%",
    desc: "稼ぐ効率がわかる",
    plain: "売上のうち何割が本業の儲けか",
    derived: true,
  },
  net_income: {
    label: "純利益",
    reading: "じゅんりえき",
    unit: "円",
    desc: "最終的に残る利益がわかる",
    plain: "税金まで払って最後に残ったお金",
  },
  roic: {
    label: "ROIC",
    reading: "ロイック",
    unit: "%",
    desc: "投下資本をどれだけ効率よく利益に変えたかがわかる",
    plain: "元手を使ってどれだけ上手に稼いだか",
    derived: true,
  },
  fcf: {
    label: "FCF",
    reading: "エフシーエフ",
    unit: "円",
    desc: "自由に使える現金の創出力がわかる",
    plain: "自由に使えるお金をどれだけ生んだか",
    derived: true,
  },
  dividend_yield: {
    label: "配当利回り",
    reading: "はいとうりまわり",
    unit: "%",
    desc: "株価に対する配当の水準がわかる",
    plain: "株を買うと毎年どれくらい配当がもらえるか",
    derived: true,
  },
  equity_ratio: {
    label: "自己資本比率",
    reading: "じこしほんひりつ",
    unit: "%",
    desc: "財務の安定性がわかる",
    plain: "会社の財産のうち借金でない割合（高いほど安全）",
    derived: true,
  },
  gross_profit: {
    label: "売上総利益",
    reading: "うりあげそうりえき",
    unit: "円",
    desc: "粗利がわかる",
    plain: "原価を引いた後に残る利益",
  },
  total_assets: {
    label: "総資産",
    reading: "そうしさん",
    unit: "円",
    desc: "会社が保有する全資産の規模がわかる",
    plain: "会社が持っている財産の合計",
  },
  cf_operating: {
    label: "営業CF",
    reading: "えいぎょうキャッシュフロー",
    unit: "円",
    desc: "本業で生んだ現金がわかる",
    plain: "本業で実際に手に入ったお金",
  },
} as const;

export type MetricKey = keyof typeof METRICS;

/** Derived metric calculation (pure functions) */
export function calcOpMargin(
  operatingIncome: number | null,
  netSales: number | null,
): number | null {
  if (!operatingIncome || !netSales || netSales === 0) return null;
  return (operatingIncome / netSales) * 100;
}

export function calcFcf(
  cfOperating: number | null,
  cfInvesting: number | null,
): number | null {
  if (cfOperating == null || cfInvesting == null) return null;
  return cfOperating + cfInvesting;
}

export function calcRoic(
  operatingIncome: number | null,
  totalEquity: number | null,
  totalAssets: number | null,
  taxRate = 0.3,
): number | null {
  if (!operatingIncome || !totalEquity || !totalAssets) return null;
  const investedCapital = totalAssets - totalEquity; // simplified
  if (investedCapital <= 0) return null;
  return ((operatingIncome * (1 - taxRate)) / (totalEquity + investedCapital)) * 100;
}

export function calcEquityRatio(
  totalEquity: number | null,
  totalAssets: number | null,
): number | null {
  if (!totalEquity || !totalAssets || totalAssets === 0) return null;
  return (totalEquity / totalAssets) * 100;
}

/** Format a number for display: converts yen to 億/兆 */
export function formatYen(
  value: number | null | undefined,
  precision = 0,
): string {
  if (value == null) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(precision + 1)} 兆円`;
  if (abs >= 1e8)  return `${(value / 1e8).toFixed(precision)} 億円`;
  if (abs >= 1e4)  return `${(value / 1e4).toFixed(precision)} 万円`;
  return `${value.toLocaleString("ja-JP")} 円`;
}

/** Format percentage */
export function formatPct(value: number | null | undefined, precision = 1): string {
  if (value == null) return "—";
  return `${value.toFixed(precision)}%`;
}
