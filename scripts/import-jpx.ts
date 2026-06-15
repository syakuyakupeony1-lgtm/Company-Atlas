/**
 * JPX 上場企業マスター インポートスクリプト
 *
 * 使い方:
 *   npx tsx scripts/import-jpx.ts
 *
 * 必要な環境変数 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  (or SUPABASE_SERVICE_ROLE_KEY for bulk insert)
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

// ─── Supabase ─────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ 環境変数 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── JPX データ取得 ────────────────────────────────────────────────
// JPX が毎営業日更新する上場企業一覧 Excel
const JPX_URL =
  "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls";

// 33業種コード → sectors テーブルの code に対応
// JPX の業種コードは2桁（例: "01"）、設計書は4桁（例: "0050"）
const SECTOR_CODE_MAP: Record<string, string> = {
  "50": "0050", "1050": "1050", "2050": "2050",
  "3050": "3050", "3100": "3100", "3150": "3150",
  "3200": "3200", "3250": "3250", "3300": "3300",
  "3350": "3350", "3400": "3400", "3450": "3450",
  "3500": "3500", "3550": "3550", "3600": "3600",
  "3650": "3650", "3700": "3700", "3750": "3750",
  "3800": "3800", "4050": "4050", "5050": "5050",
  "5100": "5100", "5150": "5150", "5200": "5200",
  "5250": "5250", "6050": "6050", "6100": "6100",
  "7050": "7050", "7100": "7100", "7150": "7150",
  "7200": "7200", "8050": "8050", "9050": "9050",
};

// 市場区分 → markets テーブルの code に対応
function toMarketCode(raw: string): string | null {
  const s = raw?.trim() ?? "";
  if (s.includes("プライム"))   return "prime";
  if (s.includes("スタンダード")) return "standard";
  if (s.includes("グロース"))   return "growth";
  if (s.includes("PRO"))       return "pro";
  return null;
}

async function main() {
  console.log("⬇️  JPX データをダウンロード中...");

  const res = await fetch(JPX_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://www.jpx.co.jp/markets/statistics-equities/misc/01.html",
      "Accept": "application/vnd.ms-excel,*/*",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JPX_URL}`);

  const buf = await res.arrayBuffer();
  const wb  = XLSX.read(buf, { type: "array" });
  const ws  = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

  console.log(`📋 取得行数: ${rows.length}`);

  // Excel の列名を確認（最初の行を表示）
  if (rows.length > 0) {
    console.log("列名サンプル:", Object.keys(rows[0]));
  }

  const companies = rows
    .filter((r) => {
      const code = String(r["コード"] ?? r["銘柄コード"] ?? "").trim();
      return code.length === 4 && /^\d{4}$/.test(code);
    })
    .map((r) => {
      const ticker     = String(r["コード"] ?? r["銘柄コード"]).trim();
      const name       = String(r["銘柄名"] ?? r["会社名"] ?? "").trim();
      const marketRaw  = String(r["市場・商品区分"] ?? r["市場区分"] ?? "").trim();
      const sectorCode = String(r["33業種コード"] ?? "").trim();
      const marketCode = toMarketCode(marketRaw);
      const sector     = SECTOR_CODE_MAP[sectorCode] ?? null;

      return {
        ticker,
        name,
        market_code:  marketCode,
        sector_code:  sector,
        is_active:    true,
        is_domestic:  true,
      };
    });

  console.log(`✅ 変換完了: ${companies.length} 社`);

  // バッチ upsert（500件ずつ）
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < companies.length; i += BATCH) {
    const chunk = companies.slice(i, i + BATCH);
    const { error } = await db
      .from("companies")
      .upsert(chunk, { onConflict: "ticker" });

    if (error) {
      console.error(`❌ upsert エラー (chunk ${i}):`, error.message);
    } else {
      inserted += chunk.length;
      process.stdout.write(`\r📥 ${inserted} / ${companies.length} 社 投入済み...`);
    }
  }

  console.log(`\n🎉 完了！ ${inserted} 社を companies テーブルに投入しました`);
}

main().catch((e) => {
  console.error("❌ エラー:", e);
  process.exit(1);
});
