import Link from "next/link";

import { ArrowGlyph, StatusTag } from "@/components/site/Editorial";
import { apps } from "@/config/brand";
import type { Dictionary, Locale } from "@/i18n";
import { localeHref } from "@/lib/utils";

export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const liveApps = apps.filter((app) => app.status !== "archived");

  return (
    <section className="shell pb-16 pt-12 md:pb-20 md:pt-20">
      <div className="grid-12">
        <div className="col-span-12 lg:col-span-7">
          <div className="flex items-center gap-4">
            <span aria-hidden className="h-px w-10 bg-brass" />
            <p className="eyebrow text-graphite">{dict.home.eyebrow}</p>
          </div>

          <h1 className="mt-8 font-serif text-display-xl text-ink">
            {dict.home.titleLines.map((line, index) => (
              <span key={line} className="block">
                {line}
                {index === dict.home.titleLines.length - 1 ? (
                  <span aria-hidden className="ml-2 inline-block h-[0.14em] w-[0.14em] rounded-full bg-brass align-baseline" />
                ) : null}
              </span>
            ))}
          </h1>

          <p className="mt-8 max-w-measure-tight text-[1.0625rem] leading-[1.8] text-graphite">
            {dict.home.lead}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href={localeHref(locale, "apps")}
              className="inline-flex items-center gap-3 bg-ink px-6 py-3.5 whitespace-nowrap font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-brass"
            >
              {dict.home.primaryCta}
              <span aria-hidden>→</span>
            </Link>
            <Link
              href={localeHref(locale, "about")}
              className="link-rule font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ink"
            >
              {dict.home.secondaryCta}
            </Link>
          </div>
        </div>

        <aside className="col-span-12 mt-16 lg:col-span-4 lg:col-start-9 lg:mt-2" aria-label={dict.home.indexLabel}>
          <div className="flex items-baseline justify-between border-b border-line pb-3">
            <p className="eyebrow">{dict.home.indexLabel}</p>
            <p className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">
              {dict.home.indexNote}
            </p>
          </div>

          <ol className="mt-1">
            {liveApps.map((app, index) => {
              const body = (
                <>
                  <span className="flex items-baseline gap-4">
                    <span className="w-5 font-sans text-[0.5625rem] tracking-[0.18em] text-brass">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="whitespace-nowrap font-serif text-[1.125rem] leading-tight text-ink transition-transform duration-500 ease-editorial group-hover:translate-x-1">
                      {app.name}
                    </span>
                  </span>
                  <StatusTag status={app.status} label={dict.status[app.status]} />
                </>
              );

              return (
                <li key={app.id} className="border-b border-line">
                  {app.url ? (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-3 py-3.5"
                    >
                      {body}
                      <ArrowGlyph className="text-muted transition-colors group-hover:text-ink" />
                    </a>
                  ) : (
                    <div className="flex items-center justify-between gap-3 py-3.5 text-muted">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      <dl className="mt-16 grid grid-cols-2 gap-y-8 border-y border-line py-8 md:mt-24 md:grid-cols-4">
        {dict.home.facts.map((fact) => (
          <div key={fact.label}>
            <dt className="eyebrow">{fact.label}</dt>
            <dd className="mt-2 font-serif text-[2rem] leading-none text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
