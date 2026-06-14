"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="w-full max-w-sm"
        style={{
          background: "var(--surface-sunken)",
          borderRadius: "var(--r-card)",
          padding: "32px 28px",
          border: "1px solid var(--hairline)",
        }}
      >
        {/* Logo mark */}
        <div className="flex items-center gap-2 mb-6">
          <span
            style={{
              width: 32, height: 32,
              borderRadius: 8,
              background: "var(--ink)",
              color: "#fff",
              fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            CA
          </span>
          <span style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--ink)" }}>
            Company Atlas
          </span>
        </div>

        {sent ? (
          <div>
            <h1
              className="heading-ja mb-3"
              style={{ fontSize: "var(--text-h2)", color: "var(--ink)" }}
            >
              メールを送信しました
            </h1>
            <p style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)", lineHeight: 1.6 }}>
              <strong>{email}</strong> にログインリンクを送りました。メールのリンクをクリックするとログインできます。
            </p>
            <p className="mt-4" style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>
              届かない場合は迷惑メールフォルダをご確認ください。
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-6 w-full py-2 rounded-lg text-sm transition-all"
              style={{
                border: "1px solid var(--hairline)",
                background: "transparent",
                color: "var(--ink-secondary)",
                cursor: "pointer",
              }}
            >
              別のメールアドレスで試す
            </button>
          </div>
        ) : (
          <>
            <h1
              className="heading-ja mb-2"
              style={{ fontSize: "var(--text-h2)", color: "var(--ink)" }}
            >
              ログイン
            </h1>
            <p className="mb-6" style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)" }}>
              ウォッチリストの保存・表示設定の記憶にはログインが必要です。
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label style={{ fontSize: "var(--text-caption)", color: "var(--ink-secondary)", fontWeight: 500 }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="px-3 py-2 rounded-lg outline-none transition-all"
                style={{
                  border: "1.5px solid var(--hairline)",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  fontSize: "var(--text-label)",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  // @ts-expect-error focus handled by global CSS
                  "--focus-ring": "var(--accent)",
                }}
              />

              {error && (
                <p style={{ fontSize: "var(--text-caption)", color: "var(--neg)" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="py-2.5 rounded-lg font-medium transition-all mt-1"
                style={{
                  background: loading ? "var(--ink-tertiary)" : "var(--accent)",
                  color: "#fff",
                  border: "none",
                  cursor: loading ? "default" : "pointer",
                  fontSize: "var(--text-label)",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  transitionDuration: "120ms",
                }}
              >
                {loading ? "送信中…" : "マジックリンクを送る"}
              </button>
            </form>

            <p className="mt-5 text-center" style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>
              パスワード不要。メールのリンクをクリックするだけです。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
