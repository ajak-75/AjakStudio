import type { SupabaseClient } from "@supabase/supabase-js";

import type { AdminRole, Database } from "./types";

/**
 * Admin access guard for the private Control Center (phase four).
 *
 * Two gates, both enforced server-side by RLS:
 *   1. a valid Supabase auth session,
 *   2. an active row in `admin_users` (owner / editor / viewer).
 *
 * A UI redirect is only a convenience — the same checks decide what data the
 * browser can actually read, so a tampered client gains nothing.
 */

export type AdminState =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "forbidden"; userId: string | null }
  | { status: "authorized"; userId: string; role: AdminRole; displayName: string | null };

export async function resolveAdminState(
  supabase: SupabaseClient<Database> | null,
): Promise<AdminState> {
  if (!supabase) return { status: "unconfigured" };

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) return { status: "anonymous" };

  const userId = sessionData.session.user.id;

  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !data.is_active) {
    return { status: "forbidden", userId };
  }

  return {
    status: "authorized",
    userId,
    role: data.role,
    displayName: data.display_name,
  };
}

/** Writes need editor or owner; viewers are read-only. */
export function canWrite(state: AdminState): boolean {
  return state.status === "authorized" && (state.role === "owner" || state.role === "editor");
}

/** Only the owner may change the allow-list, finance records or branding. */
export function canAdminister(state: AdminState): boolean {
  return state.status === "authorized" && state.role === "owner";
}
