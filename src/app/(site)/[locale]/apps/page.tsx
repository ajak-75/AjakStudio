import type { Metadata } from "next";
import Link from "next/link";

import { ArrowGlyph, PageHeader, SectionLabel, StatusTag } from "@/components/site/Editorial";
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
    title: dict.apps.title,
    description: dict.apps.lead,
    alternates: { canonical: `/${locale}/apps/` },
  };
}

export default async function AppsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  const groups = [
    {
      key: "universe",
      list: apps.filter((app) => app.group === "universe"),
      title: dict.apps.groupUniverse,
      note: dict.apps.groupUniverseNote,
    },
    {
      key: "independent",
      list: apps.filter((app) => app.group === "independent"),
      title: dict.apps.groupIndependent,
      note: dict.apps.groupIndependentNote,
    },
  ];

  return (
    <>
      <PageHeader eyebrow={dict.apps.eyebrow} title={dict.apps.title} lead={dict.apps.lead} />

      <section className="shell pb-section">
        {groups.map((group) => (
          <div key={group.key} className="mb-16 last:mb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/80 pb-3">
              <SectionLabel className="flex-1">{group.title}</SectionLabel>
            </div>
            <p className="mt-3 max-w-measure font-sans text-[0.75rem] leading-relaxed text-muted">
              {group.note}
            </p>

            <div className="mt-6 grid-12 gap-y-14">
              {group.list.map((app, index) => {
                // An app with its own page in this site (`ABI`) links inward; the rest
                // still open their own service in a new tab.
                const link = appHref(app, locale);

                return (
                  <article key={app.id} className="col-span-12">
                    <div className="grid-12 gap-y-8 border-t border-line pt-8">
                      <div className="col-span-12 md:col-span-6">
                        <div className="flex items-baseline gap-4">
                          <span className="font-sans text-[0.625rem] tracking-[0.18em] text-brass">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <StatusTag status={app.status} label={dict.status[app.status]} />
                        </div>
                        <h2 className="mt-5 font-serif text-display-m text-ink">{app.name}</h2>
                        <p className="mt-3 font-sans text-[0.9375rem] text-graphite">{app.tagline[locale]}</p>
                      </div>

                      <div className="col-span-12 md:col-span-5 md:col-start-8">
                        <p className="font-sans text-[0.875rem] leading-[1.8] text-graphite">
                          {app.summary[locale]}
                        </p>

                        <dl className="mt-8 space-y-2 border-t border-line pt-4 font-sans text-[0.75rem]">
                          <div className="flex justify-between gap-4">
                            <dt className="uppercase tracking-[0.14em] text-muted">{dict.apps.labels.platform}</dt>
                            <dd className="text-ink">{dict.apps.platforms[app.platform]}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="uppercase tracking-[0.14em] text-muted">{dict.apps.labels.category}</dt>
                            <dd className="text-ink">{dict.apps.categories[app.category]}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="uppercase tracking-[0.14em] text-muted">{dict.apps.labels.status}</dt>
                            <dd className="text-ink">{dict.status[app.status]}</dd>
                          </div>
                        </dl>

                        {link ? (
                          link.external ? (
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-rule mt-8 inline-flex items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
                            >
                              {dict.apps.labels.open}
                              <ArrowGlyph />
                            </a>
                          ) : (
                            <Link
                              href={link.href}
                              className="link-rule mt-8 inline-flex items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
                            >
                              {dict.apps.labels.detail}
                              <ArrowGlyph />
                            </Link>
                          )
                        ) : (
                          <p className="mt-8 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
                            {dict.common.comingSoon}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}

        <p className="mt-16 border-t border-line pt-6 font-sans text-[0.75rem] leading-relaxed text-muted">
          {dict.apps.note}
        </p>
      </section>
    </>
  );
}
