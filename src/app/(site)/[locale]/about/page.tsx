import type { Metadata } from "next";

import { PageHeader, SectionLabel } from "@/components/site/Editorial";
import { brand } from "@/config/brand";
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

  return (
    <>
      <PageHeader eyebrow={dict.about.eyebrow} title={dict.about.title} lead={dict.about.lead} />

      <section className="shell py-section">
        <div className="grid-12 gap-y-14">
          {dict.about.blocks.map((block, index) => (
            <article key={block.label} className="col-span-12 md:col-span-4">
              <SectionLabel index={String(index + 1).padStart(2, "0")}>{block.label}</SectionLabel>
              <h2 className="mt-6 font-serif text-display-s text-ink">{block.title}</h2>
              <p className="mt-4 font-sans text-[0.875rem] leading-[1.8] text-graphite">{block.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-porcelain">
        <div className="shell grid-12 gap-y-10 py-section">
          <div className="col-span-12 md:col-span-3">
            <SectionLabel>{dict.about.principlesLabel}</SectionLabel>
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

      <section className="shell py-section">
        <div className="grid-12 gap-y-6">
          <div className="col-span-12 md:col-span-4">
            <p className="eyebrow">{locale === "ko" ? "STUDIO" : "STUDIO"}</p>
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
