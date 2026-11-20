import type { Metadata } from "next";
import Link from "next/link";

import { ArrowGlyph, PageHeader, SectionLabel, StatusTag } from "@/components/site/Editorial";
import { apps } from "@/config/brand";
import { getDictionary, isLocale, type Locale } from "@/i18n";
import { localeHref } from "@/lib/utils";

/**
 * ABI introduction — `/ko/apps/abi/`, `/en/apps/abi/`.
 *
 * ABI ships as an Android APK rather than a web app, so the app catalogue links
 * here instead of to GitHub: the page tells the whole story (on-device SQLite,
 * the hybrid local/cloud route, the phase-one beta scope, how to install the
 * APK) and keeps the repository as a reference at the bottom. Every fact below
 * is taken from the ABI repository's README, not assumed.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.abi.title,
    description: dict.abi.lead,
    alternates: {
      canonical: `/${locale}/apps/abi/`,
      languages: { ko: "/ko/apps/abi/", en: "/en/apps/abi/", "x-default": "/ko/apps/abi/" },
    },
  };
}

export default async function AbiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const abi = apps.find((app) => app.id === "abi");

  return (
    <>
      <PageHeader eyebrow={dict.abi.eyebrow} title={dict.abi.title} lead={dict.abi.lead} />

      {/* Fact strip ------------------------------------------------------- */}
      <section className="shell pb-section">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {abi ? <StatusTag status={abi.status} label={dict.status[abi.status]} /> : null}
          <span className="font-sans text-[0.625rem] uppercase tracking-[0.16em] text-muted">
            {abi?.year ?? "2026"}
          </span>
          <span aria-hidden className="h-px flex-1 bg-line" />
        </div>

        <dl className="mt-10 grid grid-cols-1 gap-y-6 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {dict.abi.meta.map((item) => (
            <div key={item.label} className="lg:pr-6">
              <dt className="eyebrow">{item.label}</dt>
              <dd className="mt-2 font-sans text-[0.875rem] leading-relaxed text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Why ------------------------------------------------------------- */}
      <section className="border-y border-line bg-porcelain">
        <div className="shell grid-12 gap-y-8 py-section">
          <div className="col-span-12 md:col-span-3">
            <SectionLabel>{dict.abi.whyLabel}</SectionLabel>
          </div>
          <div className="col-span-12 md:col-span-8 md:col-start-5">
            <h2 className="font-serif text-display-m text-ink">{dict.abi.whyTitle}</h2>
            <p className="mt-6 max-w-measure font-sans text-[0.9375rem] leading-[1.85] text-graphite">
              {dict.abi.whyBody}
            </p>
          </div>
        </div>
      </section>

      {/* Architecture --------------------------------------------------- */}
      <section className="shell py-section">
        <div className="grid-12 gap-y-8">
          <div className="col-span-12 md:col-span-3">
            <SectionLabel>{dict.abi.architectureLabel}</SectionLabel>
          </div>
          <div className="col-span-12 md:col-span-8 md:col-start-5">
            <h2 className="font-serif text-display-m text-ink">{dict.abi.architectureTitle}</h2>
            <p className="mt-6 max-w-measure font-sans text-[0.9375rem] leading-[1.85] text-graphite">
              {dict.abi.architectureLead}
            </p>
          </div>
        </div>

        <ol className="mt-14 border-t border-ink/80">
          {dict.abi.layers.map((layer, index) => (
            <li key={layer.title} className="grid-12 items-start gap-y-3 border-b border-line py-9">
              <div className="col-span-12 flex items-baseline gap-4 md:col-span-4">
                <span className="font-sans text-[0.625rem] tracking-[0.18em] text-brass">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-[1.375rem] leading-tight text-ink">{layer.title}</h3>
              </div>
              <p className="col-span-12 max-w-measure font-sans text-[0.875rem] leading-[1.85] text-graphite md:col-span-7 md:col-start-6">
                {layer.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Phase one scope ------------------------------------------------- */}
      <section className="border-y border-line bg-porcelain">
        <div className="shell py-section">
          <SectionLabel>{dict.abi.phaseLabel}</SectionLabel>
          <h2 className="mt-6 max-w-[24ch] font-serif text-display-m text-ink">{dict.abi.phaseTitle}</h2>

          <div className="grid-12 mt-12 gap-y-12">
            <div className="col-span-12 md:col-span-6">
              <h3 className="eyebrow text-brass">{dict.abi.phaseInTitle}</h3>
              <ul className="mt-4 border-t border-line">
                {dict.abi.phaseIn.map((item) => (
                  <li
                    key={item}
                    className="border-b border-line py-3 font-sans text-[0.875rem] leading-[1.7] text-ink"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-12 md:col-span-6">
              <h3 className="eyebrow">{dict.abi.phaseOutTitle}</h3>
              <ul className="mt-4 border-t border-line">
                {dict.abi.phaseOut.map((item) => (
                  <li
                    key={item}
                    className="border-b border-line py-3 font-sans text-[0.875rem] leading-[1.7] text-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-10 max-w-measure font-sans text-[0.8125rem] leading-relaxed text-muted">
            {dict.abi.phaseNote}
          </p>
        </div>
      </section>

      {/* APK install ---------------------------------------------------- */}
      <section className="shell py-section">
        <div className="grid-12 gap-y-8">
          <div className="col-span-12 md:col-span-3">
            <SectionLabel>{dict.abi.installLabel}</SectionLabel>
          </div>
          <div className="col-span-12 md:col-span-8 md:col-start-5">
            <h2 className="font-serif text-display-m text-ink">{dict.abi.installTitle}</h2>
          </div>
        </div>

        <ol className="mt-12 border-t border-ink/80">
          {dict.abi.installSteps.map((step, index) => (
            <li key={step} className="grid-12 items-baseline gap-y-2 border-b border-line py-5">
              <span className="col-span-2 font-sans text-[0.625rem] tracking-[0.18em] text-brass">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="col-span-10 font-sans text-[0.875rem] leading-[1.75] text-graphite">{step}</p>
            </li>
          ))}
        </ol>

        <p className="mt-8 max-w-measure font-sans text-[0.8125rem] leading-relaxed text-muted">
          {dict.abi.installNote}
        </p>
      </section>

      {/* Reference repository ------------------------------------------- */}
      <section className="border-t border-line">
        <div className="shell grid-12 gap-y-8 py-16 md:py-20">
          <div className="col-span-12 md:col-span-3">
            <SectionLabel>{dict.abi.repoLabel}</SectionLabel>
          </div>
          <div className="col-span-12 md:col-span-8 md:col-start-5">
            <h2 className="font-serif text-display-s text-ink">{dict.abi.repoTitle}</h2>
            <p className="mt-4 max-w-measure font-sans text-[0.875rem] leading-[1.85] text-graphite">
              {dict.abi.repoBody}
            </p>

            {abi?.repo ? (
              <a
                href={abi.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="link-rule mt-8 inline-flex items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
              >
                {dict.abi.repoCta}
                <ArrowGlyph />
              </a>
            ) : null}
            {abi?.repo ? (
              <p className="mt-3 font-sans text-[0.75rem] break-all text-muted">{abi.repo}</p>
            ) : null}

            <div className="mt-12 border-t border-line pt-6">
              <Link
                href={localeHref(locale, "apps")}
                className="link-rule inline-flex items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
              >
                {dict.abi.backToApps}
                <ArrowGlyph />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
