"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { getBlob } from "@/lib/admin/db";
import { aspectOf, publishedLayout } from "@/lib/admin/hero";
import { drawHero, loadImageElement, readFontStacks } from "@/lib/admin/heroCanvas";
import { fetchPublishedHeroRemote } from "@/lib/admin/remote";
import { readData } from "@/lib/admin/db";
import type { HeroSnapshot } from "@/lib/admin/types";
import { getDictionary, type Locale } from "@/i18n";
import { localeHref } from "@/lib/utils";

/**
 * HOME hero.
 *
 * The default editorial hero is server-rendered and passed in as `fallback`, so
 * the page is complete before any JavaScript runs and stays complete when no
 * hero has been published. When a published 시안 exists (local preview first,
 * then Supabase), the same snapshot the studio showed is drawn to a canvas here
 * — identical geometry, one renderer.
 */
export function HomeHero({ locale, fallback }: { locale: Locale; fallback: ReactNode }) {
  const dict = getDictionary(locale);
  const [snapshot, setSnapshot] = useState<HeroSnapshot | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const local = await readData();
        const layout = local ? publishedLayout(local.heroLayouts) : null;
        if (layout) {
          const map: Record<string, string> = {};
          for (const layer of [...layout.snapshot.pc.layers, ...layout.snapshot.mobile.layers]) {
            if (map[layer.assetId]) continue;
            if (layer.url) {
              map[layer.assetId] = layer.url;
              continue;
            }
            const image = local?.images.find((row) => row.id === layer.assetId);
            if (!image) continue;
            const blob = await getBlob(image.blobKey);
            if (blob) map[layer.assetId] = URL.createObjectURL(blob);
          }
          if (active) {
            setSnapshot(layout.snapshot);
            setUrls(map);
            setResolved(true);
          }
          return;
        }

        const remote = await fetchPublishedHeroRemote();
        if (remote) {
          const map: Record<string, string> = {};
          for (const layer of [...remote.snapshot.pc.layers, ...remote.snapshot.mobile.layers]) {
            if (layer.url) map[layer.assetId] = layer.url;
          }
          if (active) {
            setSnapshot(remote.snapshot);
            setUrls(map);
            setResolved(true);
          }
          return;
        }
      } catch {
        /* a failed lookup always falls back to the editorial hero */
      }
      if (active) setResolved(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!snapshot) {
    return <>{fallback}</>;
  }

  return (
    <section className="border-b border-line">
      <div className="sr-only">
        <h1>{headlineFor(snapshot, locale)}</h1>
        <p>{subcopyFor(snapshot, locale)}</p>
      </div>
      <PublishedHero snapshot={snapshot} urls={urls} locale={locale} />
      <div className="shell flex flex-wrap items-center justify-between gap-4 py-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href={localeHref(locale, "apps")}
            className="inline-flex items-center gap-3 bg-ink px-6 py-3 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-brass"
          >
            {dict.home.primaryCta}
            <span aria-hidden>→</span>
          </Link>
          <Link href={localeHref(locale, "about")} className="link-rule font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ink">
            {dict.home.secondaryCta}
          </Link>
        </div>
        <p className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">{dict.home.eyebrow}</p>
      </div>
    </section>
  );
}

function headlineFor(snapshot: HeroSnapshot, locale: Locale): string {
  const text = snapshot.pc.text;
  const source = locale === "en" && text.headlineEn?.trim() ? text.headlineEn : text.headline;
  return source.replace(/\n/g, " ");
}

function subcopyFor(snapshot: HeroSnapshot, locale: Locale): string {
  const text = snapshot.pc.text;
  return locale === "en" && text.subcopyEn?.trim() ? text.subcopyEn : text.subcopy;
}

function PublishedHero({ snapshot, urls, locale }: { snapshot: HeroSnapshot; urls: Record<string, string>; locale: Locale }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const frame = isMobile ? snapshot.mobile : snapshot.pc;

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    const update = () => {
      setWidth(element.clientWidth);
      setIsMobile(element.clientWidth < 768);
    };
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;
    const ratio = aspectOf(frame);
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    const internalWidth = Math.min(2400, Math.max(720, Math.round(width * dpr)));
    const internalHeight = Math.max(1, Math.round(internalWidth / ratio));
    if (canvas.width !== internalWidth || canvas.height !== internalHeight) {
      canvas.width = internalWidth;
      canvas.height = internalHeight;
    }
    let cancelled = false;

    (async () => {
      const map = new Map<string, HTMLImageElement>();
      await Promise.all(
        frame.layers
          .filter((layer) => layer.visible)
          .map(async (layer) => {
            const url = urls[layer.assetId] ?? layer.url;
            if (!url) return;
            const image = await loadImageElement(url);
            if (image) map.set(layer.assetId, image);
          }),
      );
      if (typeof document !== "undefined" && document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          /* draw with the fallback stack */
        }
      }
      if (cancelled) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawHero(ctx, frame, internalWidth, internalHeight, map, readFontStacks(), locale);
    })();

    return () => {
      cancelled = true;
    };
  }, [frame, width, urls]);

  return (
    <div ref={wrapRef} className="w-full bg-porcelain">
      <canvas
        ref={canvasRef}
        aria-hidden
        className="block w-full"
        style={{ aspectRatio: `${aspectOf(frame)}` }}
      />
    </div>
  );
}
