"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  if (loading) return <div style={{ width: 28, height: 28 }} />;

  if (!user) {
    return (
      <Link
        href="/auth"
        className="px-3 py-1.5 rounded-full text-sm transition-all"
        style={{
          color: "var(--accent)",
          border: "1px solid var(--accent)",
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontWeight: 500,
          transitionDuration: "120ms",
        }}
      >
        ログイン
      </Link>
    );
  }

  return (
    <button
      onClick={async () => {
        setSigningOut(true);
        await signOut();
        setSigningOut(false);
      }}
      disabled={signingOut}
      className="px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5"
      style={{
        color: "var(--ink-secondary)",
        border: "1px solid var(--hairline)",
        fontFamily: "var(--font-inter), Inter, sans-serif",
        background: "transparent",
        cursor: "pointer",
        transitionDuration: "120ms",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "var(--accent-weak)",
          color: "var(--accent)",
          fontSize: 10,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {user.email?.[0]?.toUpperCase() ?? "U"}
      </span>
      <span className="hidden sm:block">{signingOut ? "…" : "ログアウト"}</span>
    </button>
  );
}
