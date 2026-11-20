"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { AdminRole } from "@/lib/supabase/types";

/**
 * Admin gate.
 *
 * Local preview mode: Supabase keys absent, so the Control Center runs on the
 * browser store and says so in the banner. Supabase mode: a real session plus
 * an active `admin_users` row. Both the browser client and the UI redirect are
 * convenience layers; RLS (`is_admin()`) is what actually protects the data.
 */

export type AdminAuthState =
  | { mode: "local" }
  | { mode: "supabase"; status: "anonymous" }
  | { mode: "supabase"; status: "forbidden"; email: string | null; userId: string | null }
  | {
      mode: "supabase";
      status: "authorized";
      email: string | null;
      userId: string;
      role: AdminRole;
      displayName: string | null;
    };

export function supabaseEnabled(): boolean {
  return isSupabaseConfigured;
}

export async function resolveAdminAuth(): Promise<AdminAuthState> {
  if (!isSupabaseConfigured) return { mode: "local" };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { mode: "local" };

  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData.session) return { mode: "supabase", status: "anonymous" };

  const session = sessionData.session;
  const { data: row, error: rowError } = await supabase
    .from("admin_users")
    .select("id, role, display_name, is_active")
    .eq("id", session.user.id)
    .maybeSingle();

  if (rowError || !row || !row.is_active) {
    return {
      mode: "supabase",
      status: "forbidden",
      email: session.user.email ?? null,
      userId: session.user.id,
    };
  }

  return {
    mode: "supabase",
    status: "authorized",
    email: session.user.email ?? null,
    userId: session.user.id,
    role: row.role,
    displayName: row.display_name,
  };
}

export async function signInWithPassword(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase가 연결되지 않았습니다." };
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, error: translateAuthError(error.message) };
  return { ok: true };
}

export async function sendMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase가 연결되지 않았습니다." };
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/ko/admin/` : undefined;
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo },
  });
  if (error) return { ok: false, error: translateAuthError(error.message) };
  return { ok: true };
}

export async function signOutAdmin(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    /* a stale session is cleared on the next load */
  }
}

function translateAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login")) return "이메일 또는 비밀번호가 맞지 않습니다.";
  if (text.includes("email not confirmed")) return "이메일 인증이 끝나지 않았습니다. 받은 편지함을 확인해 주세요.";
  if (text.includes("rate limit")) return "시도가 너무 잦습니다. 잠시 뒤에 다시 시도해 주세요.";
  if (text.includes("fetch")) return "Supabase에 연결하지 못했습니다. 네트워크와 프로젝트 URL을 확인해 주세요.";
  return message;
}
