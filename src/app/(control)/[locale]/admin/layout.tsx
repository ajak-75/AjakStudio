import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Inter, Noto_Serif_KR } from "next/font/google";

import { getDictionary, isLocale, localeMeta, locales, type Locale } from "@/i18n";

import "../../../globals.css";

/**
 * CONTROL CENTER layout.
 *
 * The private admin deliberately shares the Editorial White tokens with the
 * public site but none of its chrome: no marketing header, no footer, and a
 * hard `noindex` so a search engine can never surface the operator screen.
 * A route group of its own means the public layout never has to branch on path.
 */

const serifLatin = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

const serifKorean = Noto_Serif_KR({
  weight: ["300", "400", "500"],
  variable: "--font-noto-serif-kr",
  display: "swap",
  preload: false,
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ko";
  const dict = getDictionary(locale);
  return {
    title: "CONTROL CENTER — AjakStudio",
    description: dict.meta.description,
    robots: { index: false, follow: false, nocache: true },
    alternates: { canonical: `/ko/admin/` },
  };
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  return (
    <html lang={localeMeta[locale].htmlLang} className={`${serifLatin.variable} ${serifKorean.variable} ${sans.variable}`}>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
