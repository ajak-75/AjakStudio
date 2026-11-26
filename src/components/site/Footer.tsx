import Link from "next/link";

import { brand, domesticChannels, globalChannels, menus, showcase } from "@/config/brand";
import type { Dictionary, Locale } from "@/i18n";
import { localeHref } from "@/lib/utils";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

export function Footer({ locale, dict }: FooterProps) {
  const year = new Date().getFullYear();

  const shelves = [
    { key: "domestic", label: dict.footer.domestic, list: domesticChannels },
    { key: "global", label: dict.footer.global, list: globalChannels },
  ];

  return (
    <footer className="border-t border-line bg-porcelain">
      <div className="shell py-16 md:py-20">
        <div className="grid-12 gap-y-12">
          <div className="col-span-12 lg:col-span-4">
            <p className="font-sans text-[0.8125rem] font-medium leading-[1.6] tracking-[0.14em]">
              {brand.name}
            </p>
            <p className="mt-6 max-w-[22rem] font-serif text-[1.5rem] leading-[1.25] text-ink">
              {dict.footer.tagline}
            </p>
            <p className="mt-6 font-sans text-[0.75rem] leading-relaxed text-muted">
              {brand.base[locale]} · {brand.founded}
            </p>
          </div>

          <nav className="col-span-6 sm:col-span-4 lg:col-span-2" aria-label={dict.footer.sitemap}>
            <h2 className="eyebrow">{dict.footer.sitemap}</h2>
            <ul className="mt-5 space-y-2.5">
              {menus.map((item) => (
                <li key={item.id}>
                  <Link
                    href={localeHref(locale, item.path)}
                    className="font-sans text-[0.75rem] uppercase tracking-[0.12em] text-graphite transition-colors hover:text-ink"
                  >
                    {dict.nav[item.labelKey]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <h2 className="eyebrow">{dict.footer.channels}</h2>
            <div className="mt-5 grid gap-x-6 gap-y-6 sm:grid-cols-2">
              {shelves.map((shelf) => (
                <div key={shelf.key}>
                  <p className="font-sans text-[0.5rem] uppercase tracking-[0.18em] text-brass">
                    {shelf.label} — {String(shelf.list.length).padStart(2, "0")}
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {shelf.list.map((channel) => (
                      <li key={channel.id}>
                        {channel.url ? (
                          <a
                            href={channel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-[0.6875rem] uppercase tracking-[0.1em] text-graphite transition-colors hover:text-ink"
                          >
                            {channel.platform}
                          </a>
                        ) : (
                          <span className="font-sans text-[0.6875rem] uppercase tracking-[0.1em] text-muted">
                            {channel.platform}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-2">
            <h2 className="eyebrow">{dict.footer.studio}</h2>
            <ul className="mt-5 space-y-2.5 font-sans text-[0.75rem] leading-relaxed text-graphite">
              <li>{brand.name}</li>
              {brand.email ? (
                <li>
                  <a
                    href={`mailto:${brand.email}`}
                    className="break-all transition-colors hover:text-ink"
                  >
                    {brand.email}
                  </a>
                </li>
              ) : null}
              <li>
                <a
                  href={showcase.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-ink"
                >
                  {dict.footer.showcase}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <p className="font-sans text-[0.625rem] uppercase tracking-[0.16em] text-muted">
            © {year} {brand.name}. {locale === "ko" ? "ALL RIGHTS RESERVED." : "ALL RIGHTS RESERVED."}
          </p>
          <p className="font-sans text-[0.625rem] uppercase tracking-[0.16em] text-muted">
            {dict.footer.builtLine}
          </p>
        </div>
      </div>
    </footer>
  );
}
