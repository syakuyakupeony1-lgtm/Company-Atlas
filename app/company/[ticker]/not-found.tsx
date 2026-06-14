import Link from "next/link";

export default function CompanyNotFound() {
  return (
    <div
      className="mx-auto px-4 md:px-6 py-20 md:py-32 flex flex-col items-center text-center"
      style={{ maxWidth: 480 }}
    >
      <p
        className="num mb-4"
        style={{ fontSize: 64, fontWeight: 700, color: "var(--hairline)", lineHeight: 1 }}
        aria-hidden="true"
      >
        404
      </p>
      <h1
        className="heading-ja mb-2"
        style={{ fontSize: "var(--text-h1)", color: "var(--ink)" }}
      >
        企業が見つかりません
      </h1>
      <p style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
        証券コードまたは企業名が正しいか確認してください。上場廃止・コード変更の可能性もあります。
      </p>
      <Link
        href="/"
        className="px-4 py-2"
        style={{
          background: "var(--accent)",
          color: "#fff",
          borderRadius: "var(--r-control)",
          fontSize: "var(--text-label)",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        企業一覧へ戻る
      </Link>
    </div>
  );
}
