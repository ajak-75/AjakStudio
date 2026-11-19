/**
 * Server-side helper. With `output: "export"` there is no Node runtime at
 * request time, so this is used only during the static build (e.g. reading
 * published rows to prerender a page). It holds no elevated credentials —
 * the anon key plus RLS is the whole authority model.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabaseConfig } from "@/lib/env";
import type { Database } from "./types";

let cached: SupabaseClient<Database> | null = null;

export function getSupabaseServerClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  if (cached) return cached;

  cached = createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "global-digital-universe-build" } },
  });

  return cached;
}
