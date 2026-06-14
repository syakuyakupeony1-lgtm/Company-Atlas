import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="mt-auto"
      style={{ borderTop: "1px solid var(--hairline)" }}
    >
      <div
        className="mx-auto px-4 md:px-6 py-10 md:py-12"
        style={{ maxWidth: 1280 }}
      >
        <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-16">
          {/* Brand + disclaimer */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm mb-4 leading-relaxed"
              style={{ color: "var(--ink-secondary)" }}
            >
              Company Atlas は、公開情報をもとに企業の数字を分かりやすく示すためのサービスです。
              特定の企業を評価・批判する意図はなく、また投資や就職などの判断を勧めるものではありません。
              掲載内容は参考情報であり、実際の判断はご自身で、必要に応じて専門家にご相談ください。
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--ink-tertiary)" }}
            >
              出典は各社の有価証券報告書・半期報告書（
              <Link
                href="https://disclosure2.edinet-fsa.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
                style={{ color: "var(--ink-secondary)" }}
              >
                EDINET
              </Link>
              ）および東京証券取引所（
              <Link
                href="https://www.jpx.co.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
                style={{ color: "var(--ink-secondary)" }}
              >
                JPX
              </Link>
              ）等の公開情報です。数字は最新の開示時点のもので、一部は簡易計算を含みます。
            </p>
          </div>

          {/* Links */}
          <nav
            className="flex flex-col gap-2 flex-shrink-0"
            aria-label="フッターナビゲーション"
          >
            <p
              className="text-xs font-medium mb-1"
              style={{
                color: "var(--ink-tertiary)",
                fontFamily: "var(--font-inter), Inter, sans-serif",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Company Atlas
            </p>
            <FooterLink href="/">企業を探す</FooterLink>
            <FooterLink href="/watchlist">ウォッチリスト</FooterLink>
          </nav>
        </div>

        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          style={{ borderTop: "1px solid var(--hairline)" }}
        >
          <p className="text-xs" style={{ color: "var(--ink-tertiary)" }}>
            © {new Date().getFullYear()} Company Atlas
          </p>
          <p className="text-xs" style={{ color: "var(--ink-tertiary)" }}>
            財務データ: EDINET（金融庁）&nbsp;·&nbsp;企業マスタ: JPX（東証）
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm transition-colors duration-100"
      style={{ color: "var(--ink-secondary)" }}
    >
      {children}
    </Link>
  );
}
