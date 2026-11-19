import type { Metadata } from "next";

import { ArrowGlyph, PageHeader, StatusTag } from "@/components/site/Editorial";
import { games } from "@/config/brand";
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
    title: dict.games.title,
    description: dict.games.lead,
    alternates: { canonical: `/${locale}/games/` },
  };
}

export default async function GamesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader eyebrow={dict.games.eyebrow} title={dict.games.title} lead={dict.games.lead} />

      <section className="shell pb-section">
        <ul className="grid-12 gap-y-0 border-t border-ink/80">
          {games.map((game, index) => (
            <li key={game.id} className="col-span-12 border-b border-line">
              <div className="grid-12 items-center gap-4 py-10">
                <div className="col-span-12 md:col-span-2">
                  <span className="font-serif text-[2rem] leading-none text-line">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="col-span-12 md:col-span-6">
                  <StatusTag status={game.status} label={dict.status[game.status]} />
                  <h2 className="mt-3 font-serif text-display-s text-ink">{game.name}</h2>
                  <p className="mt-2 max-w-[40ch] font-sans text-[0.875rem] leading-relaxed text-graphite">
                    {game.tagline[locale]}
                  </p>
                </div>
                <div className="col-span-12 flex items-center justify-between md:col-span-4 md:justify-end md:gap-10">
                  <span className="font-sans text-[0.625rem] tracking-[0.18em] text-muted">{game.year}</span>
                  {game.url ? (
                    <a
                      href={game.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-rule inline-flex items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
                    >
                      {dict.games.play}
                      <ArrowGlyph />
                    </a>
                  ) : (
                    <span className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
                      {dict.games.inProduction}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
