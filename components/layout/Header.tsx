"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchBox } from "@/components/ui/SearchBox";
import { LevelSwitcher } from "@/components/ui/LevelSwitcher";
import { AuthButton } from "@/components/auth/AuthButton";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(251,251,253,0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <div
        className="mx-auto flex items-center gap-3 px-4 md:px-6"
        style={{ height: 56, maxWidth: 1280 }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex-shrink-0 flex items-center gap-2 group"
          aria-label="Company Atlas トップへ"
        >
          <span
            aria-hidden="true"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "var(--ink)", fontSize: 11 }}
          >
            CA
          </span>
          <span
            className="hidden sm:block heading-ja text-sm font-bold"
            style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            Company Atlas
          </span>
        </Link>

        {/* Search — grows to fill center */}
        <div className="flex-1 min-w-0 max-w-xl mx-auto">
          <SearchBox />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <LevelSwitcher />
          <WatchlistButton />
          <AuthButton />
        </div>
      </div>

      {/* Mobile nav expansion placeholder */}
      {menuOpen && (
        <div
          className="md:hidden px-4 pb-3 pt-1"
          style={{ borderTop: "1px solid var(--hairline)" }}
        >
          <SearchBox autoFocus />
        </div>
      )}
    </header>
  );
}

function WatchlistButton() {
  return (
    <Link
      href="/watchlist"
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all"
      style={{
        color: "var(--ink-secondary)",
        border: "1px solid var(--hairline)",
        transitionDuration: "120ms",
        fontFamily: "var(--font-inter), Inter, sans-serif",
        fontSize: "var(--text-label)",
      }}
      aria-label="ウォッチリストを開く"
    >
      <span aria-hidden="true">☆</span>
      <span>ウォッチ</span>
    </Link>
  );
}
