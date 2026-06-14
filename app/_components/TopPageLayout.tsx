"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLevelContext } from "@/components/ui/LevelSwitcher";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { MarketDashboard } from "@/components/dashboard/MarketDashboard";
import { SectorMap } from "@/components/dashboard/SectorMap";
import type { MarketStat, MarketSummaryRow, Sector, SectorStat } from "@/lib/types";

interface TopPageLayoutProps {
  marketStats: MarketStat[];
  marketSummary: MarketSummaryRow[];
  sectors: Sector[];
  sectorStats: SectorStat[];
  selectedMarkets: string[];
  selectedSector: string | undefined;
  fiscalYear: number;
}

export default function TopPageLayout({
  marketStats,
  marketSummary,
  sectors,
  sectorStats,
  selectedMarkets,
  selectedSector,
  fiscalYear,
}: TopPageLayoutProps) {
  const { level } = useLevelContext();

  // Pro users see both layers collapsed by default; others open
  const defaultCollapsed = level === "pro";
  const [layer1Collapsed, setLayer1Collapsed] = useState(defaultCollapsed);
  const [layer2Collapsed, setLayer2Collapsed] = useState(defaultCollapsed);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pushSector = useCallback(
    (code: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (code === undefined || code === "") {
        params.delete("sector");
      } else {
        params.set("sector", code);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return (
    <>
      <OnboardingBanner />

      <MarketDashboard
        stats={marketStats}
        summary={marketSummary}
        selectedMarkets={selectedMarkets}
        fiscalYear={fiscalYear}
        collapsed={layer1Collapsed}
        onToggle={() => setLayer1Collapsed((c) => !c)}
      />

      <SectorMap
        sectors={sectors}
        sectorStats={sectorStats}
        selectedSector={selectedSector}
        onSelectSector={pushSector}
        fiscalYear={fiscalYear}
        collapsed={layer2Collapsed}
        onToggle={() => setLayer2Collapsed((c) => !c)}
      />
    </>
  );
}
