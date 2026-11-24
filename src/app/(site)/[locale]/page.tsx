import type { Metadata } from "next";
import Link from "next/link";

import { ArrowGlyph, SectionLabel, StatusTag } from "@/components/site/Editorial";
import { Hero } from "@/components/home/Hero";
import {
  appHref,
  apps,
  brand,
  domesticChannels,
  games,
  globalChannels,
  news,
  showcase,
} from "@/config/brand";
import { getDictionary, isLocale, type Locale } from "@/i18n";
import { formatEditorialDate, localeHref } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: `${brand.name} — ${dict.meta.tagline}`,
    description: dict.meta.description,
  };
}

const universeApps = apps.filter((app) => app.group === "universe");
const independentApps = apps.filter((app) => app.group === "independent");

/** Which section each of the three axes opens into. */
const worldLinks = ["apps", "apps", "media"] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  const publishedNews = news.filter((item) => item.status === "published");

  return (
    <>
      <Hero locale={locale} dict={dict} />

      {/* Ajak Showcase — the live shelf, straight under the hero ---------- */}
      <section
        aria-labelledby="showcase-title"
        className="showcase-band relative isolate overflow-hidden border-y border-brass/40"
      >
        {/*
         * One sheet, edge to edge: the dark hanji, the camellias and the red
         * 아작 스튜디오 seal are a single artwork now, so nothing here is a
         * cut-out laid on a second material. It is anchored to the lower-right
         * corner, which keeps the seal and the heavy branch on the sheet; only
         * the far side of the sheet runs off the frame.
         */}
        <div aria-hidden className="showcase-plate">
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet="/art/showcase-camellia-1124-1024.webp"
              type="image/webp"
            />
            <source srcSet="/art/showcase-camellia-1124.webp" type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/art/showcase-camellia-1124.jpg"
              alt=""
              width={2048}
              height={1039}
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
        {/* Only on a phone, where the words sit over the plate. */}
        <div aria-hidden className="showcase-veil" />

        <div className="relative z-10 shell">
          <div className="grid-12 items-center gap-y-10 py-[clamp(3rem,5.6vw,5rem)]">
            <div className="col-span-12 lg:col-span-7">
              <div className="flex items-center gap-4">
                <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass-soft" />
                <p className="font-sans text-[0.625rem] uppercase tracking-[0.22em] text-brass-soft">
                  {dict.home.showcaseLabel}
                </p>
              </div>
              <h2
                id="showcase-title"
                className="mt-3 text-[clamp(2.75rem,6.2vw,5.25rem)] font-brush leading-[1.06] text-paper"
              >
                {dict.home.showcaseTitle}
              </h2>
              <p className="mt-5 max-w-[34rem] font-sans text-[0.9375rem] leading-[1.9] text-[#ddd3be] text-pretty">
                {dict.home.showcaseNote}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
                <a
                  href={showcase.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-5 border border-brass-soft/70 px-7 py-4 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-brass-soft hover:text-ink"
                >
                  {dict.home.showcaseCta}
                  <span
                    aria-hidden
                    className="text-[0.9375rem] leading-none transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  >
                    ↗
                  </span>
                </a>
                <p className="font-sans text-[0.5625rem] uppercase tracking-[0.18em] text-[#a2947a]">
                  {dict.home.showcaseMeta}
                </p>
              </div>
            </div>

            {/* The plate is the backdrop on every size, so this column only
                keeps the words off the flowers on the narrowest screens. */}
            <div aria-hidden className="col-span-12 hidden lg:block lg:col-span-5" />
          </div>
        </div>

      </section>

      {/* The universe — three axes --------------------------------------- */}
      <section className="border-b border-line bg-porcelain" id="worlds">
        <div className="shell py-section">
          <div className="grid-12 items-end gap-y-6">
            <div className="col-span-12 md:col-span-7">
              <SectionLabel index="01">{dict.home.worldsLabel}</SectionLabel>
              <h2 className="mt-6 font-serif text-display-m text-ink">{dict.home.worldsTitle}</h2>
            </div>
            <p className="col-span-12 max-w-measure-tight font-sans text-[0.8125rem] leading-relaxed text-muted md:col-span-4 md:col-start-9">
              {dict.home.worldsNote}
            </p>
          </div>

          <ol className="mt-12 grid-12 gap-y-12 border-t border-ink/80 pt-10 md:gap-y-0">
            {dict.home.worlds.map((world, index) => (
              <li key={world.title} className="col-span-12 md:col-span-4 md:pr-6">
                <div className="flex items-baseline gap-4">
                  <span className="font-serif text-[2.25rem] leading-none text-line">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-sans text-[0.5625rem] uppercase tracking-[0.18em] text-brass">
                    {world.kicker}
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-display-s text-ink">{world.title}</h3>
                <p className="mt-3 max-w-[40ch] font-sans text-[0.875rem] leading-[1.85] text-graphite">
                  {world.body}
                </p>
                <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-line pt-3">
                  <span className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">
                    {world.meta}
                  </span>
                  <Link
                    href={localeHref(locale, worldLinks[index] ?? "apps")}
                    className="link-rule inline-flex items-center gap-2 font-sans text-[0.625rem] uppercase tracking-[0.16em] text-ink"
                  >
                    {dict.common.view}
                    <ArrowGlyph />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Apps — two shelves ---------------------------------------------- */}
      <section className="shell py-section" id="apps">
        <div className="grid-12 items-end gap-y-6">
          <div className="col-span-12 md:col-span-7">
            <SectionLabel index="02">{dict.home.servicesLabel}</SectionLabel>
            <h2 className="mt-6 font-serif text-display-m text-ink">{dict.home.servicesTitle}</h2>
          </div>
          <p className="col-span-12 max-w-measure-tight font-sans text-[0.8125rem] leading-relaxed text-muted md:col-span-4 md:col-start-9">
            {dict.home.servicesNote}
          </p>
        </div>

        {[
          { key: "universe", list: universeApps, title: dict.home.groupUniverse, note: dict.home.groupUniverseNote },
          { key: "independent", list: independentApps, title: dict.home.groupIndependent, note: dict.home.groupIndependentNote },
        ].map((group, groupIndex) => (
          <div key={group.key} className="mt-14">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/80 pb-3">
              <p className="font-sans text-[0.625rem] uppercase tracking-[0.18em] text-ink">{group.title}</p>
              <p className="font-sans text-[0.6875rem] text-muted">{group.note}</p>
            </div>

            <ol>
              {group.list.map((app, index) => {
                const link = appHref(app, locale);
                const row = (
                  <>
                    <div className="col-span-12 flex items-baseline gap-4 md:col-span-5">
                      <span className="w-6 shrink-0 font-sans text-[0.625rem] tracking-[0.18em] text-brass">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <span className="font-serif text-[1.5rem] leading-tight text-ink transition-transform duration-500 ease-editorial group-hover:translate-x-1 md:text-[1.625rem]">
                          {app.name}
                        </span>
                        <p className="mt-1.5 font-sans text-[0.8125rem] text-graphite">{app.tagline[locale]}</p>
                      </div>
                    </div>
                    <p className="col-span-3 hidden font-sans text-[0.8125rem] leading-relaxed text-muted md:block">
                      {app.summary[locale]}
                    </p>
                    <div className="col-span-2 hidden md:block">
                      <StatusTag status={app.status} label={dict.status[app.status]} />
                    </div>
                    <div className="hidden justify-end md:col-span-2 md:flex">
                      <ArrowGlyph className="text-muted transition-colors group-hover:text-ink" />
                    </div>
                  </>
                );

                return (
                  <li key={app.id} className="border-b border-line">
                    {link ? (
                      link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-row group grid grid-cols-12 items-center gap-4 px-2 py-5 md:px-4"
                        >
                          {row}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="project-row group grid grid-cols-12 items-center gap-4 px-2 py-5 md:px-4"
                        >
                          {row}
                        </Link>
                      )
                    ) : (
                      <div className="grid grid-cols-12 items-center gap-4 px-2 py-5 text-muted md:px-4">{row}</div>
                    )}
                  </li>
                );
              })}
            </ol>

            {groupIndex === 1 ? (
              <div className="mt-6 flex justify-end">
                <Link
                  href={localeHref(locale, "apps")}
                  className="link-rule inline-flex items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
                >
                  {dict.common.allApps}
                  <ArrowGlyph />
                </Link>
              </div>
            ) : null}
          </div>
        ))}
      </section>

      {/* Games ----------------------------------------------------------- */}
      <section className="border-y border-line bg-porcelain" id="games">
        <div className="shell py-section">
          <div className="grid-12 items-end gap-y-6">
            <div className="col-span-12 md:col-span-7">
              <SectionLabel index="03">{dict.home.gamesLabel}</SectionLabel>
              <h2 className="mt-6 max-w-[20ch] font-serif text-display-m text-ink">{dict.home.gamesTitle}</h2>
            </div>
            <p className="col-span-12 max-w-measure-tight font-sans text-[0.8125rem] leading-relaxed text-muted md:col-span-4 md:col-start-9">
              {dict.home.gamesNote}
            </p>
          </div>

          <ul className="mt-12 grid-12 gap-y-8 border-t border-ink/80 pt-8">
            {games.map((game, index) => (
              <li key={game.id} className="col-span-12 md:col-span-4 md:pr-6">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[0.625rem] tracking-[0.18em] text-brass">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <StatusTag status={game.status} label={dict.status[game.status]} />
                </div>
                <a
                  href={game.url ?? localeHref(locale, "games")}
                  {...(game.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group mt-4 block"
                >
                  <span className="block font-serif text-[1.5rem] leading-tight text-ink transition-colors group-hover:text-brass">
                    {game.name}
                  </span>
                  <p className="mt-2 max-w-[30ch] font-sans text-[0.8125rem] leading-relaxed text-graphite">
                    {game.tagline[locale]}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 font-sans text-[0.625rem] uppercase tracking-[0.16em] text-ink">
                    {dict.games.play}
                    <ArrowGlyph />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Media — Korea / Overseas ---------------------------------------- */}
      <section className="shell py-section" id="media">
        <div className="grid-12 items-end gap-y-6">
          <div className="col-span-12 md:col-span-7">
            <SectionLabel index="04">{dict.home.mediaLabel}</SectionLabel>
            <h2 className="mt-6 font-serif text-display-m text-ink">{dict.home.mediaTitle}</h2>
          </div>
          <p className="col-span-12 max-w-measure-tight font-sans text-[0.8125rem] leading-relaxed text-muted md:col-span-4 md:col-start-9">
            {dict.home.mediaNote}
          </p>
        </div>

        <div className="mt-12 grid-12 gap-y-12 border-t border-ink/80 pt-8 md:gap-x-14">
          {[
            { key: "domestic", list: domesticChannels, title: dict.home.domestic, note: dict.home.domesticNote },
            { key: "global", list: globalChannels, title: dict.home.global, note: dict.home.globalNote },
          ].map((group) => (
            <div key={group.key} className="col-span-12 md:col-span-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-sans text-[0.625rem] uppercase tracking-[0.18em] text-ink">{group.title}</p>
              </div>
              <p className="mt-2 font-sans text-[0.6875rem] leading-relaxed text-muted">{group.note}</p>

              <ul className="mt-4">
                {group.list.map((channel, index) => (
                  <li key={channel.id} className="border-t border-line last:border-b">
                    {channel.url ? (
                      <a
                        href={channel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-row group flex items-baseline justify-between gap-3 px-1 py-3.5"
                      >
                        <span className="flex min-w-0 items-baseline gap-3">
                          <span className="w-4 shrink-0 font-sans text-[0.5rem] tracking-[0.16em] text-brass">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-sans text-[0.625rem] uppercase tracking-[0.16em] text-ink">
                              {channel.platform}
                            </span>
                            <span className="mt-0.5 block truncate font-sans text-[0.75rem] text-muted">
                              {channel.account}
                              {channel.handle ? ` · ${channel.handle}` : ""}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2 font-sans text-[0.5625rem] uppercase tracking-[0.12em] text-muted">
                          {channel.region[locale]}
                          <ArrowGlyph className="transition-colors group-hover:text-ink" />
                        </span>
                      </a>
                    ) : (
                      <div className="flex items-baseline justify-between gap-4 py-3.5 text-muted">
                        <span className="font-sans text-[0.625rem] uppercase tracking-[0.16em]">
                          {channel.platform}
                        </span>
                        <span className="font-sans text-[0.5625rem] uppercase tracking-[0.12em]">
                          {dict.media.unverified}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Link
            href={localeHref(locale, "media")}
            className="link-rule inline-flex items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
          >
            {dict.common.allChannels}
            <ArrowGlyph />
          </Link>
        </div>
      </section>

      {/* News ------------------------------------------------------------ */}
      <section className="border-y border-line bg-porcelain">
        <div className="shell grid-12 gap-y-10 py-section">
          <div className="col-span-12 md:col-span-3">
            <SectionLabel index="05">{dict.home.newsLabel}</SectionLabel>
          </div>
          <div className="col-span-12 md:col-span-8 md:col-start-5">
            {publishedNews.length > 0 ? (
              <ul>
                {publishedNews.slice(0, 3).map((item) => (
                  <li key={item.id} className="border-b border-line pb-8 last:border-b-0 last:pb-0">
                    <div className="flex items-baseline gap-5">
                      <time
                        dateTime={item.date}
                        className="font-sans text-[0.625rem] tracking-[0.18em] text-muted"
                      >
                        {formatEditorialDate(item.date, locale)}
                      </time>
                      <span className="h-px flex-1 bg-line" aria-hidden />
                    </div>
                    <p className="mt-4 font-serif text-[1.5rem] leading-snug text-ink">{item.title[locale]}</p>
                    <p className="mt-3 max-w-measure font-sans text-[0.875rem] leading-relaxed text-graphite">
                      {item.excerpt[locale]}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-sans text-[0.875rem] text-muted">{dict.news.empty}</p>
            )}
            <Link
              href={localeHref(locale, "news")}
              className="link-rule mt-8 inline-block font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
            >
              {dict.nav.news}
            </Link>
          </div>
        </div>
      </section>

      {/* Contact --------------------------------------------------------- */}
      <section className="shell py-section">
        <div className="grid-12 items-end gap-y-8">
          <div className="col-span-12 md:col-span-7">
            <SectionLabel index="06">{dict.home.contactLabel}</SectionLabel>
            <h2 className="mt-6 font-serif text-display-l text-ink">{dict.home.contactTitle}</h2>
            <p className="mt-6 max-w-measure font-sans text-[0.9375rem] leading-relaxed text-graphite">
              {dict.home.contactBody}
            </p>
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-9 md:text-right">
            <Link
              href={localeHref(locale, "contact")}
              className="link-rule font-sans text-[0.75rem] uppercase tracking-[0.16em]"
            >
              {dict.home.contactCta}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
