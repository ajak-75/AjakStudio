import Link from "next/link";

import { ArrowGlyph } from "@/components/site/Editorial";
import type { Dictionary, Locale } from "@/i18n";
import { localeHref } from "@/lib/utils";

/**
 * Signature HOME hero (server-rendered, always shown).
 *
 * Left: the frameless hojakdo plate — `hojakdo-base` is the painting with the
 * magpie removed and the branch healed underneath, and `hojakdo-magpie` is the
 * bird cut out as its own transparent layer. The bird is nudged by one CSS
 * keyframe (globals.css → `.hero-magpie`), so the page ships no runtime script
 * and still breathes. Overlap geometry is expressed in percentages of the
 * plate, so the two images stay aligned at every width.
 *
 * Right: the story — the worldview this studio is building, not a list.
 */
export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const MAGPIE = { left: "32.30%", top: "17.46%", width: "14.04%" };

  return (
    <section className="hanji-hero relative overflow-hidden border-b border-line">
      <div className="shell">
        <div className="grid-12 items-center gap-y-7 pb-8 pt-6 md:pb-10 md:pt-9">
          {/* Plate — left on desktop, above the words on a phone ---------- */}
          <figure className="col-span-12 lg:col-span-6">
            <div className="relative mx-auto w-full max-w-[30rem] lg:mr-auto lg:max-w-[33rem]">
              <picture>
                <source srcSet="/hero/hojakdo-base.webp" type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero/hojakdo-base.png"
                  alt={dict.home.plate.alt}
                  width={1254}
                  height={1254}
                  fetchPriority="high"
                  className="block w-full select-none"
                />
              </picture>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero/hojakdo-magpie.png"
                alt=""
                aria-hidden
                width={176}
                height={179}
                className="hero-magpie pointer-events-none absolute select-none"
                style={{ left: MAGPIE.left, top: MAGPIE.top, width: MAGPIE.width }}
              />
            </div>
            <figcaption className="mx-auto mt-1 flex max-w-[30rem] items-baseline justify-between gap-4 border-t border-line pt-2.5 lg:max-w-[33rem]">
              <span className="eyebrow text-graphite">{dict.home.plate.title}</span>
              <span className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">
                {dict.home.plate.meta}
              </span>
            </figcaption>
          </figure>

          {/* Words — right on desktop, below the plate on a phone ---------- */}
          <div className="col-span-12 lg:col-span-6 lg:pl-2">
            <div className="flex items-center gap-4">
              <span aria-hidden className="h-px w-8 bg-brass" />
              <p className="eyebrow text-graphite">{dict.home.eyebrow}</p>
            </div>

            <h1 className="mt-6 font-serif text-[clamp(1.95rem,3.9vw,3.25rem)] leading-[1.14] tracking-[-0.025em] text-ink">
              {dict.home.titleLines.map((line, index) => (
                <span key={line} className="block">
                  {line}
                  {index === dict.home.titleLines.length - 1 ? (
                    <span
                      aria-hidden
                      className="ml-2 inline-block h-[0.13em] w-[0.13em] rounded-full bg-brass align-baseline"
                    />
                  ) : null}
                </span>
              ))}
            </h1>

            <p className="mt-5 max-w-[44ch] font-sans text-[0.9375rem] leading-[1.8] text-graphite md:text-[1rem]">
              {dict.home.lead}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                href={localeHref(locale, "apps")}
                className="inline-flex items-center gap-3 whitespace-nowrap bg-ink px-6 py-3.5 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-brass"
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

            <p className="mt-6 font-sans text-[0.5625rem] uppercase tracking-[0.18em] text-muted">
              {dict.home.heroNote}
            </p>
          </div>
        </div>

        {/* Numbers + scroll cue ------------------------------------------ */}
        <div className="flex flex-col gap-6 border-t border-line py-5 md:flex-row md:items-center md:justify-between">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:flex md:items-baseline md:gap-x-9">
            {dict.home.facts.map((fact) => (
              <div key={fact.label} className="flex flex-col gap-0.5">
                <dd className="whitespace-nowrap font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-ink">
                  {fact.value}
                </dd>
                <dt className="font-sans text-[0.5rem] uppercase leading-tight tracking-[0.16em] text-muted">
                  {fact.label}
                </dt>
              </div>
            ))}
          </dl>

          <a
            href="#worlds"
            className="group inline-flex items-center gap-3 self-start font-sans text-[0.625rem] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink md:self-auto"
          >
            <span className="scroll-cue" aria-hidden>
              <span />
            </span>
            {dict.home.scrollCue}
            <ArrowGlyph className="rotate-90" />
          </a>
        </div>
      </div>
    </section>
  );
}
