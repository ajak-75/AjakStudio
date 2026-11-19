import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Inter, Noto_Serif_KR } from "next/font/google";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { brand } from "@/config/brand";
import { getDictionary, isLocale, localeMeta, locales, type Locale } from "@/i18n";
import { siteUrl } from "@/lib/env";

import "../../globals.css";

/**
 * Editorial pairing: a high-contrast serif for display, a neutral grotesque for
 * interface and body, and a Korean serif so Korean headlines keep the same
 * editorial weight as Latin ones. All self-hosted by next/font at build time —
 * no runtime request to a font CDN, no cookie banner consequence.
 */
const serifLatin = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

const serifKorean = Noto_Serif_KR({
  // Korean glyphs ship as many unicode-range files; next/font bundles them all
  // when no subset is declared. `preload: false` keeps the initial HTML light.
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(siteUrl || "http://localhost:3000"),
    title: {
      default: `${brand.name} — ${dict.meta.tagline}`,
      template: `%s — ${brand.name}`,
    },
    description: dict.meta.description,
    applicationName: brand.name,
    alternates: {
      canonical: `/${locale}/`,
      languages: {
        ko: "/ko/",
        en: "/en/",
        "x-default": "/ko/",
      },
    },
    openGraph: {
      type: "website",
      siteName: brand.name,
      locale: localeMeta[locale].ogLocale,
      title: `${brand.name} — ${dict.meta.tagline}`,
      description: dict.meta.description,
      url: `/${locale}/`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand.name} — ${dict.meta.tagline}`,
      description: dict.meta.description,
    },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  return (
    <html
      lang={localeMeta[locale].htmlLang}
      className={`${serifLatin.variable} ${serifKorean.variable} ${sans.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-paper text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-[0.75rem] focus:uppercase focus:tracking-[0.16em] focus:text-paper"
        >
          {locale === "ko" ? "본문으로" : "Skip to content"}
        </a>
        <Header locale={locale} dict={dict} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} dict={dict} />
      </body>
    </html>
  );
}
