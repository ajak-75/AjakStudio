import Link from "next/link";

import { ArrowGlyph } from "@/components/site/Editorial";
import type { Dictionary, Locale } from "@/i18n";
import { localeHref } from "@/lib/utils";

/**
 * The hojakdo plate: one square canvas holding the clay pine and tiger as a
 * transparent cut-out, with the magpie laid over it as four separately hinged
 * pieces (tail, torso, head, wing) so it can turn its head and sway on the twig.
 * Percentages are the source artwork's own 800 × 800 geometry.
 */
function HojakdoPlate({ alt, className = "" }: { alt: string; className?: string }) {
  return (
    <div className={`magpie-plate ${className}`}>
      <picture>
        <source srcSet="/hero/hojakdo-plate.webp" type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="magpie-base"
          src="/hero/hojakdo-plate.png"
          alt={alt}
          width={1600}
          height={1600}
          fetchPriority="high"
        />
      </picture>

      <div className="magpie-anim" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="magpie-piece magpie-tail" src="/hero/magpie-tail.webp" alt="" width={272} height={182} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="magpie-piece magpie-torso" src="/hero/magpie-body.webp" alt="" width={204} height={190} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="magpie-piece magpie-head" src="/hero/magpie-head.webp" alt="" width={152} height={180} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="magpie-piece magpie-wing" src="/hero/magpie-wing.webp" alt="" width={252} height={152} />
      </div>
    </div>
  );
}

/**
 * Signature HOME hero (server-rendered, always shown).
 *
 * The plate lies directly on this page's warm hanji — no card, no frame, no
 * seam. On a phone it runs edge to edge under the header; from `lg` it is
 * anchored to the left and bottom and is tall enough to leave through the top
 * edge, with the story in the right half.
 *
 * Right: the story — the worldview this studio is building, not a list.
 */
export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="hanji-hero relative isolate overflow-hidden border-b border-line">
      {/* Phone plate — full width, flush under the header --------------------- */}
      <figure className="relative lg:hidden">
        <HojakdoPlate alt={dict.home.plate.alt} />
        <figcaption className="border-t border-line">
          <div className="shell flex items-baseline justify-between gap-4 py-2.5">
            <span className="eyebrow text-graphite">{dict.home.plate.title}</span>
            <span className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">
              {dict.home.plate.meta}
            </span>
          </div>
        </figcaption>
      </figure>

      <div className="relative">
        {/* Desktop plate — leaves through the left and top edges ------------- */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 hidden aspect-square h-[102%] max-h-[min(44rem,52vw)] select-none lg:block"
        >
          <HojakdoPlate alt="" />
        </div>

        {/* Words — right on desktop, below the plate on a phone -------------- */}
        <div className="shell relative">
          <div className="grid-12 gap-y-7 pb-8 pt-5 md:pb-10 md:pt-7 lg:items-center lg:py-12">
            <div className="hidden lg:col-span-6 lg:block" aria-hidden />
            <div className="col-span-12 lg:col-span-6">
              <div className="flex items-center gap-4">
                <span aria-hidden className="h-px w-8 shrink-0 bg-brass" />
                <p className="eyebrow whitespace-nowrap text-graphite max-[430px]:text-[0.5rem] max-[430px]:tracking-[0.12em]">
                  {dict.home.eyebrow}
                </p>
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
        </div>
      </div>

      {/* Numbers + scroll cue ------------------------------------------------ */}
      <div className="shell">
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
