"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { HeroSnapshot, HeroLayout } from "./types";

/**
 * Supabase bridge — optional by design.
 *
 * The Control Center is fully usable before Supabase exists. When keys are
 * present and the operator is signed in, two paths light up:
 *   • a published hero saved in `hero_layouts` is what public visitors read,
 *   • a publish in the studio is pushed to that table (best effort, and the UI
 *     reports the exact result instead of assuming success).
 * Uploads go to the `hero-originals` bucket with the anon key; a private
 * bucket simply returns no public URL and the local bytes keep working.
 */

export interface RemoteHero {
  snapshot: HeroSnapshot;
  name: string;
  publishedAt: string | null;
}

const BUCKET = "hero-originals";

export async function fetchPublishedHeroRemote(): Promise<RemoteHero | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("hero_layouts")
      .select("name, snapshot, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const snapshot = data.snapshot as unknown as HeroSnapshot;
    if (!snapshot || !snapshot.pc || !snapshot.mobile) return null;
    return { snapshot, name: data.name ?? "home-hero", publishedAt: data.published_at ?? null };
  } catch {
    return null;
  }
}

export interface PushResult {
  ok: boolean;
  message: string;
}

export async function pushHeroLayout(layout: HeroLayout): Promise<PushResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase 미연결 — 로컬에만 게시했습니다." };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Supabase 클라이언트를 만들지 못했습니다." };

  try {
    const { data: existing, error: findError } = await supabase
      .from("hero_layouts")
      .select("id")
      .eq("name", layout.name)
      .eq("version", layout.version)
      .maybeSingle();

    let rowId = existing?.id ?? null;

    if (findError && findError.code !== "PGRST116") {
      return { ok: false, message: `조회 실패: ${findError.message}` };
    }

    if (!rowId) {
      const { data: inserted, error: insertError } = await supabase
        .from("hero_layouts")
        .insert({
          name: layout.name,
          version: layout.version,
          snapshot: layout.snapshot as unknown as never,
          note: layout.note,
          is_published: false,
        })
        .select("id")
        .maybeSingle();
      if (insertError) return { ok: false, message: `저장 실패: ${insertError.message}` };
      rowId = inserted?.id ?? null;
    }

    if (!rowId) return { ok: false, message: "행 id를 받지 못했습니다." };

    const { error: publishError } = await supabase.rpc("publish_hero_layout", { target_id: rowId });
    if (publishError) return { ok: false, message: `게시 실패: ${publishError.message}` };

    return { ok: true, message: "Supabase hero_layouts에 게시했습니다." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "알 수 없는 오류" };
  }
}

export async function uploadHeroImage(file: File, assetId: string): Promise<{ url: string | null; message: string }> {
  if (!isSupabaseConfigured) return { url: null, message: "Supabase 미연결 — 로컬 원본만 보관합니다." };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { url: null, message: "Supabase 클라이언트를 만들지 못했습니다." };

  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${assetId}.${extension}`;
  try {
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });
    if (error) return { url: null, message: `업로드 실패: ${error.message}` };
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl ?? null, message: data.publicUrl ? "Storage 업로드 완료" : "업로드됨 (비공개 버킷)" };
  } catch (error) {
    return { url: null, message: error instanceof Error ? error.message : "업로드 오류" };
  }
}
