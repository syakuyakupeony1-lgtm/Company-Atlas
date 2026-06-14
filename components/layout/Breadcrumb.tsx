import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="パンくずリスト">
      <ol
        className="flex items-center gap-1 flex-wrap"
        style={{ fontSize: "var(--text-label)" }}
      >
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span
                aria-hidden="true"
                style={{ color: "var(--ink-tertiary)" }}
              >
                ›
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors duration-100"
                style={{ color: "var(--ink-secondary)" }}
                aria-current={i === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span
                style={{ color: "var(--ink)" }}
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
