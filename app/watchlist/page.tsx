import { EmptyState } from "@/components/ui/StateDisplay";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function WatchlistPage() {
  return (
    <div
      className="mx-auto px-4 md:px-6 py-10"
      style={{ maxWidth: 1280 }}
    >
      <Breadcrumb items={[{ label: "トップ", href: "/" }, { label: "ウォッチリスト" }]} />
      <h1
        className="heading-ja mt-6 mb-8"
        style={{ fontSize: "var(--text-h1)" }}
      >
        ウォッチリスト
      </h1>
      <EmptyState
        title="まだ企業が登録されていません"
        description="気になる企業を見つけたら ☆ から追加できます。就活の志望先、投資の候補などを記録しておきましょう。"
        action={
          <Link href="/">
            <Button variant="primary">企業を探す</Button>
          </Link>
        }
      />
    </div>
  );
}
