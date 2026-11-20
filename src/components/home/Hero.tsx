import Link from "next/link";

import { ArrowGlyph, StatusTag } from "@/components/site/Editorial";
import { appHref, apps } from "@/config/brand";
import type { Dictionary, Locale } from "@/i18n";
import { localeHref } from "@/lib/utils";

/**
 * Default HOME hero (server-rendered).
 *
 * The plate on the right is the confirmed artwork — `까치 호랑이`, the frameless
 * version on warm hanji paper — shown
 * as an unframed editorial plate: one hairline, a caption, no shadow. It is the
 * fallback only: once a Hero Studio 시안 is published, `HomeHero` replaces this
 * whole section with the composed canvas.
 */
export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const liveApps = apps.filter((app) => app.status !== "archived");

  return (
    <section className="shell pb-16 pt-12 md:pb-20 md:pt-20">
      <div className="grid-12 items-start">
        <div className="col-span-12 lg:col-span-6">
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

          <p className="mt-8 max-w-measure-tight text-[1.0625rem] leading-[1.8] text-graphite">{dict.home.lead}</p>

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

        <figure className="col-span-12 mt-12 lg:col-span-5 lg:col-start-8 lg:mt-1">
          <div className="relative">
            <span aria-hidden className="absolute -left-6 top-0 hidden h-px w-4 bg-brass lg:block" />
            <picture>
              <source srcSet="/hero/hojakdo-clean.webp" type="image/webp" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero/hojakdo-clean.png"
                alt={dict.home.plate.alt}
                width={1100}
                height={1100}
                fetchPriority="high"
                className="block w-full border border-line bg-porcelain"
              />
            </picture>
          </div>
          <figcaption className="mt-3 flex items-baseline justify-between gap-4 border-t border-line pt-2.5">
            <span className="eyebrow text-graphite">{dict.home.plate.title}</span>
            <span className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">{dict.home.plate.meta}</span>
          </figcaption>
        </figure>
      </div>

      <ul className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-line py-4 md:mt-20">
        {liveApps.map((app, index) => {
          const link = appHref(app, locale);
          const label = (
            <>
              {app.name}
              <ArrowGlyph className="translate-y-[1px] text-muted transition-colors group-hover:text-ink" />
            </>
          );

          return (
            <li key={app.id} className="flex items-baseline gap-2">
              <span className="font-sans text-[0.5rem] tracking-[0.18em] text-brass">
                {String(index + 1).padStart(2, "0")}
              </span>
              {link ? (
                link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-baseline gap-2 whitespace-nowrap font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-ink"
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="group inline-flex items-baseline gap-2 whitespace-nowrap font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-ink"
                  >
                    {label}
                  </Link>
                )
              ) : (
                <span className="whitespace-nowrap font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
                  {app.name}
                </span>
              )}
              <StatusTag status={app.status} label={dict.status[app.status]} />
            </li>
          );
        })}
      </ul>

      <dl className="mt-10 grid grid-cols-2 gap-y-8 border-b border-line pb-8 md:grid-cols-4">
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
