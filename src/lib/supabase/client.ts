"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabaseConfig } from "@/lib/env";
import type { Database } from "./types";

/**
 * Browser client for public reads and (from phase four) admin sessions.
 *
 * Returns `null` when no keys are configured, so every caller can fall back to
 * the local seed data in `src/config/brand.ts`. That keeps `npm run build` and
 * local preview working with zero configuration — a hard requirement of the
 * zero-budget brief.
 */
let cached: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  if (cached) return cached;

  cached = createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "gdu.auth",
    },
    global: {
      headers: { "x-application-name": "global-digital-universe" },
    },
  });

  return cached;
}

/** Current session, or `null` when Supabase is not configured / not signed in. */
export async function getSession() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}
