/**
 * EDINET 財務データ インポートスクリプト
 *
 * 使い方:
 *   npx tsx scripts/import-edinet.ts
 *
 * 必要な環境変数 (.env.local):
 *   EDINET_API_KEY             ← EDINET から無料取得
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  ← Supabase の service_role キー
 *
 * EDINET API キー取得:
 *   https://disclosure.edinet-fsa.go.jp/ → APIキー発行
 */

import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

const EDINET_KEY    = process.env.EDINET_API_KEY!;
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BASE_URL      = "https://disclosure.edinet-fsa.go.jp/api/v2";

if (!EDINET_KEY)   { console.error("❌ EDINET_API_KEY が未設定"); process.exit(1); }
if (!SUPABASE_URL) { console.error("❌ NEXT_PUBLIC_SUPABASE_URL が未設定"); process.exit(1); }

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── XBRL から財務数値を抽出するキー一覧 ──────────────────────────
// JP-GAAP 連結財務諸表の主要タグ（名前空間を除いたローカル名）
const XBRL_KEYS: Record<string, keyof FinancialRow> = {
  // PL
  "NetSales":                                   "net_sales",
  "NetSalesSummaryOfBusinessResults":            "net_sales",
  "RevenueIFRS":                                 "net_sales",
  "CostOfSales":                                 "cost_of_sales",
  "GrossProfit":                                 "gross_profit",
  "SellingGeneralAndAdministrativeExpenses":      "sga",
  "OperatingIncome":                             "operating_income",
  "OperatingProfit":                             "operating_income",
  "OrdinaryIncome":                              "ordinary_income",
  "ProfitLossAttributableToOwnersOfParent":      "net_income",
  "NetIncome":                                   "net_income",
  "ProfitLoss":                                  "net_income",
  // BS
  "Assets":                                      "total_assets",
  "CashAndDeposits":                             "cash_and_deposits",
  "Inventories":                                 "inventories",
  "PropertyPlantAndEquipment":                   "ppe",
  "Goodwill":                                    "goodwill",
  "InvestmentSecurities":                        "investment_secs",
  "NetAssets":                                   "total_equity",
  "Equity":                                      "total_equity",
  "RetainedEarnings":                            "retained_earnings",
  // CF
  "NetCashProvidedByUsedInOperatingActivities":  "cf_operating",
  "NetCashProvidedByUsedInInvestingActivities":  "cf_investing",
  "NetCashProvidedByUsedInFinancingActivities":  "cf_financing",
  "CashAndCashEquivalentsAtEndOfPeriod":         "cash_end",
  // 株主還元
  "DividendsPaid":                               "dividends_paid",
  "PurchaseOfTreasuryStock":                     "treasury_purchases",
  "DividendsPerShare":                           "dividend_per_share",
  // 予想
  "ForecastNetSales":                            "forecast_net_sales",
  "ForecastOperatingIncome":                     "forecast_operating_income",
  "ForecastNetIncome":                           "forecast_net_income",
};

interface FinancialRow {
  company_id: string;
  fiscal_year: number;
  period_type: string;
  consolidated: boolean;
  disclosed_at: string;
  doc_id: string;
  net_sales?: number | null;
  cost_of_sales?: number | null;
  gross_profit?: number | null;
  sga?: number | null;
  operating_income?: number | null;
  ordinary_income?: number | null;
  net_income?: number | null;
  total_assets?: number | null;
  cash_and_deposits?: number | null;
  inventories?: number | null;
  ppe?: number | null;
  goodwill?: number | null;
  investment_secs?: number | null;
  total_equity?: number | null;
  retained_earnings?: number | null;
  cf_operating?: number | null;
  cf_investing?: number | null;
  cf_financing?: number | null;
  cash_end?: number | null;
  dividends_paid?: number | null;
  treasury_purchases?: number | null;
  dividend_per_share?: number | null;
  forecast_net_sales?: number | null;
  forecast_operating_income?: number | null;
  forecast_net_income?: number | null;
}

// ─── EDINET API ────────────────────────────────────────────────────

/** 指定日に提出された書類一覧を取得 (type=2: 有価証券報告書) */
async function fetchDocList(date: string): Promise<EdinetDoc[]> {
  const url = `${BASE_URL}/documents.json?date=${date}&type=2&Subscription-Key=${EDINET_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json() as { results?: EdinetDoc[] };
  return json.results ?? [];
}

interface EdinetDoc {
  docID: string;
  edinetCode: string;
  filerName: string;
  periodEnd: string;       // "YYYY-MM-DD"
  docTypeCode: string;     // "120" = 有価証券報告書
  submitDateTime: string;
  isConsolidated?: string; // "1" = 連結あり
}

/** XBRL ZIP をダウンロードして解凍、XML を返す */
async function fetchXbrl(docId: string): Promise<string | null> {
  const url = `${BASE_URL}/documents/${docId}?type=5&Subscription-Key=${EDINET_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  // XBRL インスタンス文書（.xbrl 拡張子）を探す
  for (const [name, file] of Object.entries(zip.files)) {
    if (name.endsWith(".xbrl") && !name.includes("lab") && !name.includes("def")) {
      return await file.async("string");
    }
  }
  return null;
}

/** XBRL XML から財務数値を抽出 */
function parseXbrl(xml: string): Partial<FinancialRow> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return {};
  }

  const result: Partial<FinancialRow> = {};

  function traverse(obj: unknown) {
    if (!obj || typeof obj !== "object") return;
    for (const [rawKey, val] of Object.entries(obj as Record<string, unknown>)) {
      // 名前空間を除いたローカル名を取得（例: "jpcrp_cor:NetSales" → "NetSales"）
      const localName = rawKey.includes(":") ? rawKey.split(":")[1] : rawKey;
      const field = XBRL_KEYS[localName];

      if (field && val !== null && val !== undefined) {
        // contextRef が "CurrentYearDuration" または "CurrentYearInstant" のものを優先
        if (typeof val === "object" && !Array.isArray(val)) {
          const vObj = val as Record<string, unknown>;
          const ctx = String(vObj["@_contextRef"] ?? "");
          if (ctx.includes("CurrentYear") || ctx.includes("FilingDate")) {
            const num = parseFloat(String(vObj["#text"] ?? vObj));
            if (!isNaN(num)) (result as Record<string, unknown>)[field] = Math.round(num);
          }
        } else if (Array.isArray(val)) {
          for (const item of val) {
            const ctx = String((item as Record<string, unknown>)["@_contextRef"] ?? "");
            if (ctx.includes("CurrentYear")) {
              const num = parseFloat(String((item as Record<string, unknown>)["#text"] ?? item));
              if (!isNaN(num)) (result as Record<string, unknown>)[field] = Math.round(num);
              break;
            }
          }
        }
      }
      traverse(val);
    }
  }

  traverse(parsed);
  return result;
}

// ─── メイン処理 ────────────────────────────────────────────────────

async function main() {
  // 過去1年分の有価証券報告書を取得（毎日の提出分をまとめて処理）
  // 実運用では cron で毎日差分取得する
  const days = generateDateRange(365);
  console.log(`📅 ${days.length} 日分の書類を処理します`);

  // Supabase から ticker → company_id マッピングを取得
  const { data: companies } = await db.from("companies").select("id, ticker");
  const tickerMap = new Map<string, string>(
    (companies ?? []).map((c: { ticker: string; id: string }) => [c.ticker, c.id])
  );

  // EDINET のfilinName → ticker のマッピングは直接ないため
  // edinetCode から ticker を探す補助テーブルが理想だが、
  // ここでは filerName を使った簡易マッチング
  const nameToId = new Map<string, string>(
    (companies ?? []).map((c: { ticker: string; id: string }) => {
      // ticker 4桁をキーとしても持たせる（書類内に記載される場合）
      return [c.ticker, c.id];
    })
  );
  void tickerMap; // 後で使用

  let processed = 0;
  let inserted  = 0;

  for (const date of days) {
    const docs = await fetchDocList(date);
    const annualReports = docs.filter((d) => d.docTypeCode === "120");

    for (const doc of annualReports) {
      // 会社を特定（EDINETコードと社名から）
      // より正確には edinet_code カラムを companies テーブルに追加するのが理想
      const companyId = findCompanyId(doc, nameToId);
      if (!companyId) continue;

      const xml = await fetchXbrl(doc.docID);
      if (!xml) continue;

      const financials = parseXbrl(xml);
      const periodEnd  = doc.periodEnd; // "YYYY-MM-DD"
      const fiscalYear = parseInt(periodEnd.slice(0, 4));

      const row: FinancialRow = {
        company_id:   companyId,
        fiscal_year:  fiscalYear,
        period_type:  "FY",
        consolidated: doc.isConsolidated === "1",
        disclosed_at: doc.submitDateTime,
        doc_id:       doc.docID,
        ...financials,
      };

      const { error } = await db
        .from("financial_reports")
        .upsert(row, { onConflict: "company_id,fiscal_year,period_type,consolidated,doc_id" });

      if (!error) inserted++;
      processed++;

      if (processed % 10 === 0) {
        process.stdout.write(`\r📊 処理: ${processed} 件 / 投入: ${inserted} 件...`);
      }

      // API レート制限対策（500ms 待機）
      await sleep(500);
    }
  }

  console.log(`\n🎉 完了！ ${inserted} 件の財務データを投入しました`);
}

// ─── ヘルパー ──────────────────────────────────────────────────────

function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // 土日を除く
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function findCompanyId(
  doc: EdinetDoc,
  nameToId: Map<string, string>,
): string | null {
  // edinetCode の末尾 → ticker の近似（"E00001" → 不一致なので filerName で探す）
  // 理想的には companies テーブルに edinet_code カラムを追加する
  for (const [key, id] of nameToId) {
    if (doc.filerName?.includes(key)) return id;
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error("❌ エラー:", e);
  process.exit(1);
});
