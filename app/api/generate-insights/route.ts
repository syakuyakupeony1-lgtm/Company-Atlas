/**
 * POST /api/generate-insights
 *
 * Pre-generation endpoint for AI insights.
 * Intended to be called by a batch job / admin script — NOT by end users.
 *
 * Strategy:
 *  - Only generates for companies that have no existing insight for the given report+kind+level
 *  - Uses Anthropic Batch API (50% cost reduction) + prompt caching
 *  - In Phase 1 (seed data), writes back to a local JSON store
 *  - In Phase 2+ (real DB), writes to the ai_insights table
 *
 * Auth: requires BATCH_SECRET header to match BATCH_API_SECRET env var.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCompanies, getReports, getInsights, saveInsight, getSectorStats } from "@/lib/db";
import { deriveAll } from "@/lib/metrics";
import { getSectors } from "@/lib/db";
import { benchFromSectorStat, computeSectorBench } from "@/lib/sector-bench";
import { generateKeyPointsBatch, type BatchRequest } from "@/lib/ai-client";
import { generateTemplateKeyPoints, generateSnapshotNarrative } from "@/lib/narrative";
import type { NarrativeContext } from "@/lib/narrative";
import type { FinancialReport } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min for batch polling

interface GenerateRequest {
  levels?: string[];   // default: ["easy", "standard", "pro"]
  tickerFilter?: string[];  // limit to specific tickers; omit = all
  dryRun?: boolean;    // if true, log but don't save
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Simple auth guard
  const secret = process.env.BATCH_API_SECRET;
  if (secret) {
    const header = req.headers.get("x-batch-secret");
    if (header !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body: GenerateRequest = await req.json().catch(() => ({}));
  const levels = body.levels ?? ["easy", "standard", "pro"];
  const dryRun = body.dryRun ?? false;

  const [companies, sectors] = await Promise.all([getCompanies(), getSectors()]);
  const filtered = body.tickerFilter
    ? companies.filter((c) => body.tickerFilter!.includes(c.ticker))
    : companies;

  const batchRequests: BatchRequest[] = [];
  const companyMeta: Record<string, { name: string; report: FinancialReport; derived: ReturnType<typeof deriveAll>; sectorLabel: string }> = {};

  for (const company of filtered) {
    const [reports] = await Promise.all([getReports(company.id, { periodType: "FY", limit: 1 })]);
    const report = reports[0];
    if (!report) continue;

    const derived = deriveAll(report);
    const sector = sectors.find((s) => s.code === company.sector_code);
    const sectorLabel = sector?.label_ja ?? "業種不明";

    // Fetch sector benches
    const fy = report.fiscal_year;
    const sectorStats = company.sector_code
      ? await getSectorStats({ sector: company.sector_code, fiscalYear: fy })
      : [];
    const opMarginStat = sectorStats.find((s) => s.metric_key === "op_margin");
    const roicStat = sectorStats.find((s) => s.metric_key === "roic");
    const benches = {
      op_margin: benchFromSectorStat(opMarginStat),
      roic: benchFromSectorStat(roicStat),
    };

    const metaKey = company.id;
    companyMeta[metaKey] = { name: company.name, report, derived, sectorLabel };

    for (const level of levels) {
      const existing = (await getInsights(company.id)).filter(
        (ins) => ins.report_id === report.id && ins.kind === "key_points" && ins.level === level,
      );
      if (existing.length > 0) continue; // already generated

      const customId = `${company.id}::key_points::${level}::${report.id}`;
      batchRequests.push({
        custom_id: customId,
        companyName: company.name,
        companyTicker: company.ticker,
        sectorLabel,
        report,
        derived,
        benches,
        level,
      });
    }
  }

  if (batchRequests.length === 0) {
    return NextResponse.json({ message: "Nothing to generate", generated: 0 });
  }

  if (dryRun) {
    return NextResponse.json({ message: "Dry run", would_generate: batchRequests.map((r) => r.custom_id) });
  }

  // Execute batch
  const results = await generateKeyPointsBatch(batchRequests);

  let saved = 0;
  let failed = 0;

  for (const { custom_id, result } of results) {
    const [companyId, kind, level, reportId] = custom_id.split("::");
    const meta = companyMeta[companyId];
    if (!meta) continue;

    // Use AI result or fall back to template
    const payload: Record<string, unknown> = (result as Record<string, unknown> | null) ?? {
      points: generateTemplateKeyPoints(
        {
          company: filtered.find((c) => c.id === companyId)!,
          report: meta.report,
          derived: meta.derived,
          sectorLabel: meta.sectorLabel,
        } as NarrativeContext,
        level,
      ),
    };

    await saveInsight({
      company_id: companyId,
      report_id: reportId,
      kind,
      level,
      content: payload,
      model: result ? "claude-haiku-4-5-20251001" : "template",
    });

    result ? saved++ : failed++;
  }

  return NextResponse.json({ generated: saved, template_fallback: failed });
}
