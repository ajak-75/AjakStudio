/**
 * Environment access.
 *
 * Only `NEXT_PUBLIC_*` values are read on the client — the Supabase anon key is
 * designed to be public because Row Level Security decides what it can touch
 * (docs/DATABASE_SCHEMA.sql §13). The service-role key is NEVER referenced in
 * this project: no server runtime, no place to keep it safely on the Free plan.
 */

const trimmed = (value: string | undefined): string => (value ?? "").trim();

export const supabaseConfig = {
  url: trimmed(process.env.NEXT_PUBLIC_SUPABASE_URL),
  anonKey: trimmed(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
} as const;

/** True only when both values look usable, so a missing key never breaks a build. */
export const isSupabaseConfigured =
  supabaseConfig.url.startsWith("https://") && supabaseConfig.anonKey.length > 20;

/** Canonical origin for absolute URLs (OG tags, canonical links). Optional. */
export const siteUrl = trimmed(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, "");

export const siteEnvironment = trimmed(process.env.NEXT_PUBLIC_SITE_ENV) || "development";
