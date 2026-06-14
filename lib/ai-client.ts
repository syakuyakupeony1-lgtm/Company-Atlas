/**
 * Haiku AI client for key_points generation.
 * Server-only — never imported by client components.
 *
 * Cost strategy:
 *  - Model: claude-haiku-4-5-20251001 (cheapest capable model)
 *  - Prompt caching: system prompt is marked ephemeral (↓ 90% after first call in window)
 *  - Batch API: use generateKeyPointsBatch() for pre-generation jobs
 *  - Browse-time cost: ZERO — reads from ai_insights cache; Haiku only called by /api/generate-insights
 */
import Anthropic from "@anthropic-ai/sdk";
import { formatBigNum, formatPct } from "./metrics";
import { approximatePercentile } from "./sector-bench";
import type { BenchResult } from "./sector-bench";
import type { FinancialReport, DerivedMetrics } from "./types";

export const HAIKU_MODEL = "claude-haiku-4-5-20251001";

// ─── JSON schema types ────────────────────────────────────────

export interface KeyPoint {
  question: string;
}

export interface KeyPointsPayload {
  points: KeyPoint[];
}

// ─── Shared (cacheable) system prompt ─────────────────────────

const SYSTEM_PROMPT = `あなたは日本の上場企業の財務データを読み解くアナリストです。

【必須制約 — 違反厳禁】
- 事実の提示と「確認すべき問い」の提示のみを行う
- 買い・売り・割安・割高・投資推奨・格付けは絶対に出力しない
- 経営者・経営判断の良否を評価しない
- 提示された数値・データ以外の情報を参照・推測しない
- データにない項目（欠損値）には言及しない
- 業種比較はデータとして渡された場合のみ使用する
- 問いは「答え」ではなく「確認すべき問い」の形にする

【出力フォーマット — 厳守】
必ずJSONのみを出力する。余分なテキスト・マークダウン不可。
{ "points": [ { "question": "問いの文字列（です・ますで終わる）" } ] }`;

// ─── User message builder ─────────────────────────────────────

function buildFactSection(
  report: FinancialReport,
  derived: DerivedMetrics,
  benches: { op_margin?: BenchResult | null; roic?: BenchResult | null } | null,
  sectorLabel: string,
): string {
  const lines: string[] = [
    `会計期: ${report.fiscal_year}年度`,
  ];

  if (report.net_sales != null) lines.push(`売上高: ${formatBigNum(report.net_sales)}`);
  if (report.operating_income != null) lines.push(`営業利益: ${formatBigNum(report.operating_income)}`);
  if (report.net_income != null) lines.push(`純利益: ${formatBigNum(report.net_income)}`);
  if (derived.op_margin != null) {
    const pos = benches?.op_margin
      ? ` （${sectorLabel}内: 約${approximatePercentile(derived.op_margin, benches.op_margin).toFixed(0)}パーセンタイル）`
      : "";
    lines.push(`営業利益率: ${formatPct(derived.op_margin)}${pos}`);
  }
  if (derived.roic != null) {
    const pos = benches?.roic
      ? ` （${sectorLabel}内: 約${approximatePercentile(derived.roic, benches.roic).toFixed(0)}パーセンタイル）`
      : "";
    lines.push(`ROIC（簡易）: ${formatPct(derived.roic)}${pos}`);
  }
  if (derived.equity_ratio != null) lines.push(`自己資本比率: ${formatPct(derived.equity_ratio, 0)}`);
  if (report.cf_operating != null) lines.push(`営業CF: ${formatBigNum(report.cf_operating)}`);
  if (report.cf_investing != null) lines.push(`投資CF: ${formatBigNum(report.cf_investing)}`);

  return lines.join("\n");
}

function buildUserMessage(
  companyName: string,
  companyTicker: string,
  sectorLabel: string,
  report: FinancialReport,
  derived: DerivedMetrics,
  benches: { op_margin?: BenchResult | null; roic?: BenchResult | null } | null,
  level: string,
): string {
  const count = level === "easy" ? 2 : level === "pro" ? 5 : 3;
  const audienceGuide =
    level === "easy"
      ? "財務知識のない一般読者向けに、平易な言葉で"
      : level === "pro"
      ? "財務・投資の専門知識を持つ読者向けに、詳細な分析視点から"
      : "財務の基礎知識を持つ読者向けに";

  const facts = buildFactSection(report, derived, benches, sectorLabel);

  return `企業名: ${companyName}（${companyTicker}）
業種: ${sectorLabel}

【財務データ】
${facts}

上記データに基づき、${audienceGuide}${count}点の「確認すべき問い」をJSON形式で出力してください。
評価・推奨は含めないこと。問いは「〜はなぜですか？」「〜はどのような影響を与えますか？」などの形で記述してください。`;
}

// ─── Single call (for on-demand generation stubs) ─────────────

export async function generateKeyPoints(opts: {
  companyName: string;
  companyTicker: string;
  sectorLabel: string;
  report: FinancialReport;
  derived: DerivedMetrics;
  benches?: { op_margin?: BenchResult | null; roic?: BenchResult | null } | null;
  level: string;
}): Promise<KeyPointsPayload | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const { companyName, companyTicker, sectorLabel, report, derived, benches = null, level } = opts;

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        } as Parameters<Anthropic["messages"]["create"]>[0]["system"] extends (infer T)[] ? T : never,
      ],
      messages: [
        {
          role: "user",
          content: buildUserMessage(
            companyName, companyTicker, sectorLabel,
            report, derived, benches, level,
          ),
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as KeyPointsPayload;
    if (!Array.isArray(parsed.points)) return null;
    parsed.points = parsed.points.filter((p) => typeof p.question === "string" && p.question.length > 0);
    return parsed;
  } catch {
    return null;
  }
}

// ─── Batch generation (for /api/generate-insights) ────────────

export interface BatchRequest {
  custom_id: string;
  companyName: string;
  companyTicker: string;
  sectorLabel: string;
  report: FinancialReport;
  derived: DerivedMetrics;
  benches?: { op_margin?: BenchResult | null; roic?: BenchResult | null } | null;
  level: string;
}

export interface BatchResultItem {
  custom_id: string;
  result: KeyPointsPayload | null;
}

/**
 * Batch-generate key_points for multiple company/level combinations.
 * Uses Anthropic's Message Batches API for 50% cost reduction.
 * System prompt is cached via cache_control: ephemeral.
 */
export async function generateKeyPointsBatch(
  requests: BatchRequest[],
): Promise<BatchResultItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || requests.length === 0) return [];

  const client = new Anthropic({ apiKey });

  const batchRequests = requests.map((req) => ({
    custom_id: req.custom_id,
    params: {
      model: HAIKU_MODEL,
      max_tokens: 600,
      system: [
        {
          type: "text" as const,
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [
        {
          role: "user" as const,
          content: buildUserMessage(
            req.companyName, req.companyTicker, req.sectorLabel,
            req.report, req.derived, req.benches ?? null, req.level,
          ),
        },
      ],
    },
  }));

  const batch = await client.messages.batches.create({ requests: batchRequests });

  // Poll until complete (for sync usage in admin scripts)
  let status = batch;
  while (status.processing_status === "in_progress") {
    await new Promise((r) => setTimeout(r, 3000));
    status = await client.messages.batches.retrieve(batch.id);
  }

  const results: BatchResultItem[] = [];
  for await (const result of await client.messages.batches.results(batch.id)) {
    if (result.result.type !== "succeeded") {
      results.push({ custom_id: result.custom_id, result: null });
      continue;
    }
    const text = result.result.message.content[0]?.type === "text"
      ? result.result.message.content[0].text.trim()
      : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      results.push({ custom_id: result.custom_id, result: null });
      continue;
    }
    try {
      const parsed = JSON.parse(match[0]) as KeyPointsPayload;
      results.push({ custom_id: result.custom_id, result: parsed });
    } catch {
      results.push({ custom_id: result.custom_id, result: null });
    }
  }

  return results;
}
