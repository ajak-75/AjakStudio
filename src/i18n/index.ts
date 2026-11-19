import ko from "./ko.json";
import en from "./en.json";

/** The two locales shipped in the public dictionary. Add a file and one entry to extend. */
export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export type Dictionary = typeof ko;

const dictionaries: Record<Locale, Dictionary> = {
  ko,
  en: en as Dictionary,
};

export const localeMeta: Record<Locale, { label: string; htmlLang: string; ogLocale: string }> = {
  ko: { label: "한국어", htmlLang: "ko", ogLocale: "ko_KR" },
  en: { label: "English", htmlLang: "en", ogLocale: "en_US" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function toLocalePath(locale: Locale, path = ""): string {
  const normalised = path === "/" ? "" : path.replace(/^\/+/, "");
  return normalised ? `/${locale}/${normalised}/`.replace(/\/{2,}/g, "/") : `/${locale}/`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "ko" ? "en" : "ko";
}

export type { Dictionary as Messages };
