import type { Metadata } from "next";
import { Noto_Sans_JP, Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { LevelProvider } from "@/components/ui/LevelSwitcher";
import { CompareProvider } from "@/lib/compare-store";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CompareTray } from "@/components/compare/CompareTray";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Company Atlas — 企業を理解する",
  description:
    "日本の上場企業の財務データを X-Ray のように可視化する企業理解 OS。EDINET 公開情報をもとに、企業の数字の構造を直感的に把握できます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${inter.variable} ${robotoMono.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-noto), 'Noto Sans JP', sans-serif" }}
      >
        <AuthProvider>
          <CompareProvider>
            <LevelProvider>
              <ToastProvider>
                <Header />
                <main className="flex-1" style={{ paddingBottom: "var(--tray-h, 0px)" }}>{children}</main>
                <Footer />
                <CompareTray />
              </ToastProvider>
            </LevelProvider>
          </CompareProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
