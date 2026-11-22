"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { brand, menus } from "@/config/brand";
import { AutoTranslate } from "@/components/site/AutoTranslate";
import type { Dictionary, Locale } from "@/i18n";
import { localeMeta, locales } from "@/i18n";
import { cn, localeHref } from "@/lib/utils";

interface HeaderProps {
  locale: Locale;
  dict: Dictionary;
}

export function Header({ locale, dict }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the panel on route change and lock the page behind it.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes the panel; the closed panel is also removed from the tab order
  // with `inert` so keyboard users never land inside an invisible menu.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActive = (path: string): boolean => {
    const href = localeHref(locale, path);
    if (!path) return pathname === href || pathname === `/${locale}`;
    return pathname === href || pathname.startsWith(href);
  };

  const alternate = locale === "ko" ? "en" : "ko";
  const alternateHref = (() => {
    const prefix = `/${locale}`;
    const rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
    return `/${alternate}${rest}`;
  })();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <div className="shell flex h-[var(--gdu-header-h)] items-center justify-between gap-6">
        <Link
          href={localeHref(locale)}
          className="group flex items-baseline gap-3"
          aria-label={`${brand.name} — ${dict.nav.home}`}
        >
          <span className="font-serif text-[1.2rem] leading-none tracking-[-0.01em] md:hidden">
            {brand.shortName}
          </span>
          <span className="hidden font-sans text-[0.8125rem] font-medium leading-none tracking-[0.14em] md:block">
            {brand.shortName}
          </span>
        </Link>

        <nav aria-label={dict.common.menu} className="hidden xl:block">
          <ul className="flex items-center gap-6 xl:gap-7">
            {menus.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.id}>
                  <Link
                    href={localeHref(locale, item.path)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block whitespace-nowrap py-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em] transition-colors duration-300",
                      active ? "text-ink" : "text-graphite hover:text-ink",
                    )}
                  >
                    {dict.nav[item.labelKey]}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -bottom-px left-0 h-px w-full origin-left bg-ink transition-transform duration-500 ease-editorial",
                        active ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-5">
          <AutoTranslate locale={locale} />
          <div className="hidden items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-[0.14em] sm:flex">
            {locales.map((code, index) => (
              <span key={code} className="flex items-center gap-2">
                {index > 0 && <span className="text-line">/</span>}
                {code === locale ? (
                  <span aria-current="true" className="text-ink">
                    {code.toUpperCase()}
                  </span>
                ) : (
                  <Link
                    href={code === alternate ? alternateHref : localeHref(code)}
                    hrefLang={code}
                    className="text-muted transition-colors hover:text-ink"
                  >
                    {code.toUpperCase()}
                  </Link>
                )}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-3 py-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ink xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {dict.common.menu}
            <span aria-hidden className="flex h-3 w-5 flex-col justify-between">
              <span className="h-px w-full bg-ink" />
              <span className="h-px w-full bg-ink" />
              <span className="h-px w-full bg-ink" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 z-50 bg-paper transition-opacity duration-500 ease-editorial xl:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="shell flex h-[var(--gdu-header-h)] items-center justify-between border-b border-line">
          <span className="font-serif text-[1.35rem]">{brand.shortName}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-sans text-[0.6875rem] uppercase tracking-[0.16em]"
          >
            {dict.common.close}
          </button>
        </div>
        <nav aria-label={dict.common.menu} className="shell mt-10">
          <ul className="flex flex-col">
            {menus.map((item, index) => (
              <li key={item.id} className="border-b border-line">
                <Link
                  href={localeHref(locale, item.path)}
                  className="flex items-baseline justify-between py-4"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-serif text-[1.75rem] leading-tight">
                    {dict.nav[item.labelKey]}
                  </span>
                  <span className="font-sans text-[0.625rem] tracking-[0.2em] text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-center justify-between">
            <AutoTranslate locale={locale} />
            <span className="font-sans text-[0.625rem] uppercase tracking-[0.16em] text-muted">
              {brand.founded} · {locale === "ko" ? "서울" : "Seoul"}
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
