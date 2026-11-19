import type { Metadata } from "next";

import { PageHeader } from "@/components/site/Editorial";
import { news } from "@/config/brand";
import { getDictionary, isLocale, type Locale } from "@/i18n";
import { formatEditorialDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.news.title,
    description: dict.news.lead,
    alternates: { canonical: `/${locale}/news/` },
  };
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const published = news.filter((item) => item.status === "published");

  return (
    <>
      <PageHeader eyebrow={dict.news.eyebrow} title={dict.news.title} lead={dict.news.lead} />

      <section className="shell pb-section">
        {published.length === 0 ? (
          <p className="py-20 font-sans text-[0.875rem] text-muted">{dict.news.empty}</p>
        ) : (
          <ul className="border-t border-ink/80">
            {published.map((item) => (
              <li key={item.id} className="border-b border-line py-10">
                <div className="grid-12 gap-y-5">
                  <div className="col-span-12 md:col-span-2">
                    <time dateTime={item.date} className="font-sans text-[0.625rem] tracking-[0.18em] text-muted">
                      {formatEditorialDate(item.date, locale)}
                    </time>
                  </div>
                  <article className="col-span-12 md:col-span-7">
                    <h2 className="font-serif text-[1.75rem] leading-snug text-ink">{item.title[locale]}</h2>
                    <p className="mt-4 max-w-measure font-sans text-[0.9375rem] leading-[1.8] text-graphite">
                      {item.excerpt[locale]}
                    </p>
                  </article>
                  <div className="col-span-12 md:col-span-2 md:col-start-11">
                    <span className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">
                      {dict.news.latest}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
