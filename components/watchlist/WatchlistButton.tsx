"use client";

import { useState, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { toggleWatchlistAction } from "@/lib/actions/watchlist";

const LOCAL_KEY = "company-atlas-watchlist-local";

function getLocalIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function toggleLocal(companyId: string): boolean {
  const ids = getLocalIds();
  const idx = ids.indexOf(companyId);
  if (idx >= 0) {
    ids.splice(idx, 1);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
    return false;
  }
  ids.push(companyId);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  return true;
}

interface WatchlistButtonProps {
  companyId: string;
  companyName: string;
  /** Whether this company is already in the watchlist (server-fetched) */
  isWatched: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

export function WatchlistButton({
  companyId,
  companyName,
  isWatched: initialIsWatched,
  size = "md",
}: WatchlistButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [optimisticWatched, setOptimisticWatched] = useOptimistic(initialIsWatched);
  const [loading, setLoading] = useState(false);
  const [burst, setBurst] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);

    if (!user) {
      // Guest mode: use localStorage
      const added = toggleLocal(companyId);
      setOptimisticWatched(added);
      if (added) triggerBurst();
      setLoading(false);
      return;
    }

    // Optimistic update
    setOptimisticWatched(!optimisticWatched);
    if (!optimisticWatched) triggerBurst();

    const result = await toggleWatchlistAction(companyId);
    if (result.error) {
      // Revert
      setOptimisticWatched(optimisticWatched);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  function triggerBurst() {
    setBurst(true);
    setTimeout(() => setBurst(false), 600);
  }

  const filled = optimisticWatched;
  const dim = size === "sm" ? 18 : 22;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={filled}
      aria-label={filled ? `${companyName}をウォッチリストから削除` : `${companyName}をウォッチリストに追加`}
      title={!user ? "ログインすると保存できます" : undefined}
      style={{
        background: "none", border: "none", cursor: loading ? "default" : "pointer",
        padding: size === "sm" ? 2 : 4,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Star */}
      <svg
        width={dim} height={dim}
        viewBox="0 0 24 24"
        fill={filled ? "#F5A623" : "none"}
        stroke={filled ? "#F5A623" : "var(--ink-tertiary)"}
        strokeWidth={1.8}
        strokeLinejoin="round"
        style={{
          transition: "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), fill 180ms",
          transform: burst ? "scale(1.35)" : "scale(1)",
        }}
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>

      {/* Burst particles */}
      {burst && (
        <span
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <span
              key={deg}
              style={{
                position: "absolute",
                width: 4, height: 4,
                borderRadius: "50%",
                background: "#F5A623",
                top: "50%", left: "50%",
                transform: `rotate(${deg}deg) translateX(12px) translate(-50%, -50%)`,
                animation: "burst-fade 500ms forwards",
              }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
