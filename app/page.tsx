export default function Home() {
  return (
    <div
      className="flex-1 flex flex-col"
      style={{ minHeight: "calc(100vh - 56px - 1px)" }}
    >
      {/* Hero area — sparse, generous */}
      <section
        className="flex flex-col items-center justify-center flex-1 px-4 py-24 md:py-40 text-center expose"
        style={{ animationDelay: "0ms" }}
      >
        <p
          className="mb-4"
          style={{
            fontSize: "var(--text-label)",
            color: "var(--ink-tertiary)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Company Atlas
        </p>
        <h1
          className="heading-ja"
          style={{
            fontSize: "clamp(28px, 5vw, 44px)",
            color: "var(--ink)",
            lineHeight: 1.2,
            maxWidth: 560,
          }}
        >
          企業を、数字の構造で
          <br />
          <span style={{ color: "var(--ink-secondary)" }}>理解する。</span>
        </h1>
        <p
          className="mt-6"
          style={{
            fontSize: "var(--text-body)",
            color: "var(--ink-secondary)",
            maxWidth: 400,
            lineHeight: 1.7,
          }}
        >
          EDINET の財務データを X-Ray のように可視化する
          <br className="hidden sm:block" />
          企業理解 OS。気になる会社を検索、または業界から探す。
        </p>
      </section>

      {/* Placeholder sections — populated in subsequent steps */}
      <section
        className="px-4 md:px-6 pb-16 expose"
        style={{ maxWidth: 1280, margin: "0 auto", width: "100%", animationDelay: "80ms" }}
      >
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {[
            { label: "市場ダッシュボード", sub: "全上場企業の体温を掴む" },
            { label: "業界マップ",         sub: "33業種の数値感を一覧" },
            { label: "企業テーブル",       sub: "絞り込み・並び替え・比較" },
          ].map((item, i) => (
            <div
              key={item.label}
              className="card expose"
              style={{
                animationDelay: `${160 + i * 80}ms`,
                opacity: 0.6,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minHeight: 120,
                justifyContent: "center",
              }}
            >
              <p
                className="heading-ja"
                style={{ fontSize: "var(--text-h2)", color: "var(--ink)" }}
              >
                {item.label}
              </p>
              <p
                style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)" }}
              >
                {item.sub}
              </p>
              <p
                style={{
                  fontSize: "var(--text-caption)",
                  color: "var(--ink-tertiary)",
                  marginTop: 4,
                }}
              >
                — 次のSTEPで実装
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
