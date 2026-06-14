import { type NextRequest, NextResponse } from "next/server";
import { seedCompanies } from "@/lib/seed";

export interface SearchResult {
  ticker: string;
  name: string;
  market_code: string | undefined;
  sector_code: string | undefined;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length === 0) return NextResponse.json([]);

  const lower = q.toLowerCase();

  const results: SearchResult[] = seedCompanies
    .filter((c) => c.is_active)
    .filter(
      (c) =>
        c.ticker.toLowerCase().includes(lower) ||
        c.name.toLowerCase().includes(lower) ||
        (c.name_en?.toLowerCase().includes(lower) ?? false),
    )
    .slice(0, 8)
    .map((c) => ({
      ticker: c.ticker,
      name: c.name,
      market_code: c.market_code,
      sector_code: c.sector_code,
    }));

  return NextResponse.json(results);
}
