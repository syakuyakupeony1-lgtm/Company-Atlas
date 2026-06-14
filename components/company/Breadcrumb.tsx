import Link from "next/link";

interface BreadcrumbProps {
  sectorCode?: string | null;
  sectorLabel?: string | null;
  companyName: string;
}

export function Breadcrumb({ sectorCode, sectorLabel, companyName }: BreadcrumbProps) {
  return (
    <nav aria-label="パンくずリスト" className="mb-5">
      <ol
        className="flex items-center gap-1.5 flex-wrap"
        style={{ fontSize: "var(--text-label)", color: "var(--ink-secondary)", listStyle: "none", margin: 0, padding: 0 }}
      >
        <li>
          <Link
            href="/"
            style={{ color: "var(--ink-secondary)", textDecoration: "none" }}
            className="hover:underline"
          >
            ホーム
          </Link>
        </li>

        {sectorCode && sectorLabel && (
          <>
            <li aria-hidden="true" style={{ color: "var(--ink-tertiary)", userSelect: "none" }}>›</li>
            <li>
              {/* Link frame for /sector/[code] — implemented in STEP 7.5 */}
              <Link
                href={`/sector/${sectorCode}`}
                style={{ color: "var(--ink-secondary)", textDecoration: "none" }}
                className="hover:underline"
              >
                {sectorLabel}
              </Link>
            </li>
          </>
        )}

        <li aria-hidden="true" style={{ color: "var(--ink-tertiary)", userSelect: "none" }}>›</li>
        <li
          style={{ color: "var(--ink)", fontWeight: 500 }}
          aria-current="page"
        >
          {companyName}
        </li>
      </ol>
    </nav>
  );
}
