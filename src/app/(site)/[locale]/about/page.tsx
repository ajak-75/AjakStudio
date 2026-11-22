import type { Metadata } from "next";
import Link from "next/link";

import { ArrowGlyph, PageHeader, SectionLabel } from "@/components/site/Editorial";
import { appHref, apps, brand } from "@/config/brand";
import { getDictionary, isLocale, type Locale } from "@/i18n";
import { localeHref } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.about.title,
    description: dict.about.lead,
    alternates: { canonical: `/${locale}/about/` },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  const universe = apps.filter((app) => app.group === "universe");

  return (
    <>
      <PageHeader eyebrow={dict.about.eyebrow} title={dict.about.title} lead={dict.about.lead} />

      {/* Story ------------------------------------------------------------ */}
      <section className="shell py-section">
        <div className="grid-12 gap-y-8">
          <div className="col-span-12 md:col-span-3">
            <SectionLabel index="01">{dict.about.storyLabel}</SectionLabel>
          </div>
          <div className="col-span-12 md:col-span-8 md:col-start-5">
            <h2 className="max-w-[22ch] font-serif text-display-m leading-tight text-ink">
              {dict.about.storyTitle}
            </h2>
            <div className="mt-8 space-y-5 border-t border-line pt-8">
              {dict.about.story.map((paragraph, index) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className={
                    index === 0
                      ? "max-w-measure font-serif text-[1.25rem] leading-[1.75] text-ink"
                      : "max-w-measure font-sans text-[0.9375rem] leading-[1.9] text-graphite"
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Facts ------------------------------------------------------------ */}
      <section className="border-y border-line bg-porcelain">
        <div className="shell py-12 md:py-14">
          <SectionLabel index="02">{dict.about.factsLabel}</SectionLabel>
          <dl className="mt-8 grid grid-cols-2 gap-y-8 md:grid-cols-4">
            {dict.about.facts.map((fact) => (
              <div key={fact.label}>
                <dd className="font-serif text-[1.5rem] leading-tight text-ink">{fact.value}</dd>
                <dt className="mt-2 font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">
                  {fact.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How we work ------------------------------------------------------ */}
      <section className="shell py-section">
        <div className="grid-12 gap-y-14">
          {dict.about.blocks.map((block, index) => (
            <article key={block.label} className="col-span-12 md:col-span-4">
              <SectionLabel index={String(index + 3).padStart(2, "0")}>{block.label}</SectionLabel>
              <h2 className="mt-6 font-serif text-display-s text-ink">{block.title}</h2>
              <p className="mt-4 font-sans text-[0.875rem] leading-[1.8] text-graphite">{block.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* The universe, at a glance ---------------------------------------- */}
      <section className="border-y border-line bg-porcelain">
        <div className="shell py-section">
          <div className="grid-12 items-end gap-y-6">
            <div className="col-span-12 md:col-span-7">
              <SectionLabel index="06">{dict.home.worldsLabel}</SectionLabel>
              <h2 className="mt-6 font-serif text-display-m text-ink">{dict.home.worldsTitle}</h2>
            </div>
            <p className="col-span-12 max-w-measure-tight font-sans text-[0.8125rem] leading-relaxed text-muted md:col-span-4 md:col-start-9">
              {dict.home.worldsNote}
            </p>
          </div>

          <ul className="mt-10 border-t border-ink/80">
            {universe.map((app) => {
              const link = appHref(app, locale);
              return (
                <li key={app.id} className="border-b border-line">
                  <Link
                    href={link?.href ?? localeHref(locale, "apps")}
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

          <div className="mt-8 flex justify-end">
            <Link
              href={localeHref(locale, "apps")}
              className="link-rule inline-flex items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
            >
              {dict.common.allApps}
              <ArrowGlyph />
            </Link>
          </div>
        </div>
      </section>

      {/* Principles ------------------------------------------------------- */}
      <section className="shell py-section">
        <div className="grid-12 gap-y-10">
          <div className="col-span-12 md:col-span-3">
            <SectionLabel index="07">{dict.about.principlesLabel}</SectionLabel>
          </div>
          <ol className="col-span-12 md:col-span-8 md:col-start-5">
            {dict.about.principles.map((principle, index) => (
              <li
                key={principle}
                className="flex items-baseline gap-6 border-b border-line py-5 first:border-t first:border-line"
              >
                <span className="font-sans text-[0.625rem] tracking-[0.18em] text-brass">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-[1.25rem] leading-snug text-ink">{principle}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line bg-porcelain">
        <div className="shell grid-12 gap-y-6 py-section">
          <div className="col-span-12 md:col-span-4">
            <p className="eyebrow">STUDIO</p>
            <p className="mt-4 font-sans text-[0.875rem] text-graphite">
              {brand.name} · {brand.base[locale]}
            </p>
          </div>
          <div className="col-span-12 md:col-span-7 md:col-start-6">
            <p className="font-serif text-display-s leading-snug text-ink">
              {locale === "ko"
                ? "“작게 시작해서, 오래 가는 것을 만듭니다.”"
                : "“Start small. Build what lasts.”"}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
