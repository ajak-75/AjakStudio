import type { Metadata } from "next";
import Link from "next/link";

import { ArrowGlyph, SectionLabel, StatusTag } from "@/components/site/Editorial";
import { Hero } from "@/components/home/Hero";
import { HomeHero } from "@/components/home/HomeHero";
import { apps, brand, channels, games, news } from "@/config/brand";
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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  const publishedNews = news.filter((item) => item.status === "published");
  const liveGame = games.find((game) => game.status === "live");
  const pipeline = games.filter((game) => game.status !== "live");

  return (
    <>
      <HomeHero locale={locale} fallback={<Hero locale={locale} dict={dict} />} />

      {/* Statement ------------------------------------------------------- */}
      <section className="border-t border-line bg-porcelain">
        <div className="shell grid-12 py-section">
          <div className="col-span-12 md:col-span-3">
            <SectionLabel index="01">{dict.home.statementLabel}</SectionLabel>
          </div>
          <div className="col-span-12 mt-8 md:col-span-8 md:col-start-5 md:mt-0">
            <p className="max-w-[24ch] font-serif text-[clamp(1.5rem,2.7vw,2.25rem)] leading-[1.5] text-ink md:max-w-none">{dict.home.statement}</p>
            <p className="mt-8 font-sans text-[0.8125rem] leading-relaxed text-muted">
              {dict.home.statementFootnote}
            </p>
          </div>
        </div>
      </section>

      {/* Services -------------------------------------------------------- */}
      <section className="shell py-section" id="services">
        <div className="grid-12 items-end gap-y-6">
          <div className="col-span-12 md:col-span-7">
            <SectionLabel index="02">{dict.home.servicesLabel}</SectionLabel>
            <h2 className="mt-6 font-serif text-display-m text-ink">{dict.home.servicesTitle}</h2>
          </div>
          <p className="col-span-12 max-w-measure-tight font-sans text-[0.8125rem] leading-relaxed text-muted md:col-span-4 md:col-start-9">
            {dict.home.servicesNote}
          </p>
        </div>

        <ol className="mt-12 border-t border-ink/80">
          {apps.map((app, index) => {
            const row = (
              <>
                <div className="col-span-12 flex items-baseline gap-5 md:col-span-6">
                  <span className="w-6 font-sans text-[0.625rem] tracking-[0.18em] text-brass">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <span className="font-serif text-[1.625rem] leading-tight text-ink transition-transform duration-500 ease-editorial group-hover:translate-x-1 md:text-[1.75rem]">
                      {app.name}
                    </span>
                    <p className="mt-1.5 font-sans text-[0.8125rem] text-graphite">{app.tagline[locale]}</p>
                  </div>
                </div>
                <p className="col-span-3 hidden max-w-[34ch] font-sans text-[0.8125rem] leading-relaxed text-muted md:block">
                  {app.summary[locale]}
                </p>
                <div className="col-span-2 hidden md:block">
                  <StatusTag status={app.status} label={dict.status[app.status]} />
                </div>
                <div className="hidden justify-end md:col-span-1 md:flex">
                  <ArrowGlyph className="text-muted transition-colors group-hover:text-ink" />
                </div>
              </>
            );

            return (
              <li key={app.id} className="border-b border-line">
                {app.url ? (
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-row group grid grid-cols-12 items-center gap-4 px-2 py-6 md:px-4"
                  >
                    {row}
                  </a>
                ) : (
                  <div className="grid grid-cols-12 items-center gap-4 px-2 py-6 text-muted md:px-4">
                    {row}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex justify-end">
          <Link
            href={localeHref(locale, "apps")}
            className="link-rule font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
          >
            {dict.common.allApps}
          </Link>
        </div>
      </section>

      {/* Games ----------------------------------------------------------- */}
      <section className="border-y border-line bg-porcelain">
        <div className="shell py-section">
          <div className="grid-12 gap-y-12">
            <div className="col-span-12 md:col-span-6">
              <SectionLabel index="03">{dict.home.gamesLabel}</SectionLabel>
              <h2 className="mt-6 max-w-[16ch] font-serif text-display-m text-ink">
                {dict.home.gamesTitle}
              </h2>
              <p className="mt-6 max-w-measure-tight font-sans text-[0.8125rem] leading-relaxed text-muted">
                {dict.home.gamesNote}
              </p>

              {liveGame ? (
                <div className="mt-10 border-t border-ink/80 pt-6">
                  <div className="flex items-center justify-between">
                    <StatusTag status={liveGame.status} label={dict.status[liveGame.status]} />
                    <span className="font-sans text-[0.625rem] tracking-[0.18em] text-muted">
                      {liveGame.year}
                    </span>
                  </div>
                  <Link
                    href={liveGame.url ?? localeHref(locale, "games")}
                    className="group mt-4 block"
                    {...(liveGame.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <span className="font-serif text-display-s text-ink transition-colors group-hover:text-brass">
                      {liveGame.name}
                    </span>
                    <p className="mt-2 max-w-[28ch] font-sans text-[0.9375rem] leading-relaxed text-graphite">
                      {liveGame.tagline[locale]}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em]">
                      {dict.games.play}
                      <ArrowGlyph />
                    </span>
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="col-span-12 md:col-span-5 md:col-start-8">
              <p className="eyebrow">{dict.games.inProduction}</p>
              <ul className="mt-5 border-t border-line">
                {pipeline.map((game, index) => (
                  <li key={game.id} className="border-b border-line py-6">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-sans text-[0.625rem] tracking-[0.18em] text-brass">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 font-serif text-[1.375rem] leading-tight text-ink">
                        {game.name}
                      </span>
                      <span className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">
                        {dict.status[game.status]}
                      </span>
                    </div>
                    <p className="mt-2 pl-9 font-sans text-[0.8125rem] leading-relaxed text-muted">
                      {game.tagline[locale]}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                href={localeHref(locale, "games")}
                className="link-rule mt-8 inline-block font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
              >
                {dict.nav.games}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Media ----------------------------------------------------------- */}
      <section className="shell py-section">
        <div className="grid-12 items-end gap-y-6">
          <div className="col-span-12 md:col-span-7">
            <SectionLabel index="04">{dict.home.mediaLabel}</SectionLabel>
            <h2 className="mt-6 font-serif text-display-m text-ink">{dict.home.mediaTitle}</h2>
          </div>
          <p className="col-span-12 max-w-measure-tight font-sans text-[0.8125rem] leading-relaxed text-muted md:col-span-4 md:col-start-9">
            {dict.home.mediaNote}
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-x-14 border-t border-ink/80 md:grid-cols-2">
          {channels.map((channel, index) => (
            <li key={channel.id} className="border-b border-line">
              {channel.url ? (
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-baseline justify-between gap-4 py-5"
                >
                  <span className="flex min-w-0 items-baseline gap-4">
                    <span className="w-5 shrink-0 font-sans text-[0.5625rem] tracking-[0.18em] text-brass">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block whitespace-nowrap font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ink">
                        {channel.platform}
                      </span>
                      <span className="mt-1 block whitespace-nowrap font-sans text-[0.75rem] text-muted">
                        {channel.handle ?? channel.account}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 whitespace-nowrap font-sans text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                    {channel.region[locale]}
                    <ArrowGlyph className="transition-colors group-hover:text-ink" />
                  </span>
                </a>
              ) : (
                <div className="flex items-baseline justify-between gap-4 py-5 text-muted">
                  <span className="font-sans text-[0.6875rem] uppercase tracking-[0.16em]">
                    {channel.platform}
                  </span>
                  <span className="font-sans text-[0.625rem] uppercase tracking-[0.14em]">
                    {dict.media.unverified}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex justify-end">
          <Link
            href={localeHref(locale, "media")}
            className="link-rule font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
          >
            {dict.common.allChannels}
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
