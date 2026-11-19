/** Tiny class-name joiner — avoids a dependency for one function. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Formats an ISO date as `2026.11.20` for editorial captions. */
export function formatEditorialDate(iso: string, locale: "ko" | "en" = "ko"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return locale === "ko" ? `${y}.${m}.${d}` : `${y}.${m}.${d}`;
}

/** Joins a locale and a menu path into a stable href (`/ko/apps/`). */
export function localeHref(locale: "ko" | "en", path = ""): string {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}
