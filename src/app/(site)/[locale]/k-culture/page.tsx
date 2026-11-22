import type { Metadata } from "next";
import Link from "next/link";

import { ArrowGlyph, PageHeader, SectionLabel } from "@/components/site/Editorial";
import { appHref, apps } from "@/config/brand";
import { getDictionary, isLocale, type Locale } from "@/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.kCulture.title,
    description: dict.kCulture.lead,
    alternates: { canonical: `/${locale}/k-culture/` },
  };
}

export default async function KCulturePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const cultureApps = apps.filter(
    (app) => app.group === "universe" || app.id === "k-sajoo",
  );

  return (
    <>
      <PageHeader eyebrow={dict.kCulture.eyebrow} title={dict.kCulture.title} lead={dict.kCulture.lead} />

      <section className="shell py-section">
        <SectionLabel>{dict.kCulture.pillarsLabel}</SectionLabel>
        <div className="mt-12 grid-12 gap-y-14">
          {dict.kCulture.pillars.map((pillar, index) => (
            <article key={pillar.title} className="col-span-12 md:col-span-4">
              <span className="font-serif text-[3rem] leading-none text-line">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-6 font-serif text-display-s text-ink">{pillar.title}</h2>
              <p className="mt-4 font-sans text-[0.875rem] leading-[1.8] text-graphite">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell pb-section">
        <SectionLabel>{dict.kCulture.appsLabel}</SectionLabel>
        <p className="mt-4 max-w-measure font-sans text-[0.8125rem] leading-relaxed text-muted">
          {dict.kCulture.appsNote}
        </p>
        <ul className="mt-8 border-t border-ink/80">
          {cultureApps.map((app) => {
            const link = appHref(app, locale);
            return (
              <li key={app.id} className="border-b border-line">
                <Link
                  href={link?.href ?? `/${locale}/apps/`}
                  {...(link?.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="project-row group flex items-baseline justify-between gap-4 px-2 py-4 md:px-4"
                >
                  <span className="font-serif text-[1.25rem] text-ink">{app.name}</span>
                  <span className="flex items-center gap-3 font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">
                    {app.tagline[locale]}
                    <ArrowGlyph />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-y border-line bg-porcelain">
        <div className="shell grid-12 gap-y-8 py-section">
          <blockquote className="col-span-12 md:col-span-8 md:col-start-3">
            <p className="font-serif text-display-m leading-[1.3] text-ink">
              {locale === "ko"
                ? "“번역이 아니라 다시 쓰는 일입니다. 같은 이야기를 그 나라의 문법으로 옮깁니다.”"
                : "“Not translation — rewriting. The same story, moved into each country's grammar.”"}
            </p>
          </blockquote>
        </div>
      </section>
    </>
  );
}
