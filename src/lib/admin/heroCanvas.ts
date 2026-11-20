"use client";

import { aspectOf, clamp, imageRect } from "./hero";
import type { HeroFrame } from "./types";

/**
 * One renderer for both surfaces.
 *
 * The studio preview and the published HOME hero draw the same snapshot through
 * this function, so what the operator approves is exactly what a visitor sees.
 * All geometry is normalised (0–1); the caller supplies the pixel size.
 */

export interface FontStacks {
  serif: string;
  sans: string;
}

const FALLBACK_STACKS: FontStacks = {
  serif: '"Cormorant Garamond", "Noto Serif KR", Georgia, serif',
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

/** Reads the real (hashed) next/font stacks from an element using the tokens. */
export function readFontStacks(): FontStacks {
  if (typeof window === "undefined") return FALLBACK_STACKS;
  try {
    const serifProbe = document.createElement("span");
    serifProbe.className = "font-serif";
    serifProbe.style.position = "absolute";
    serifProbe.style.visibility = "hidden";
    const sansProbe = document.createElement("span");
    sansProbe.className = "font-sans";
    sansProbe.style.position = "absolute";
    sansProbe.style.visibility = "hidden";
    document.body.append(serifProbe, sansProbe);
    const serif = getComputedStyle(serifProbe).fontFamily || FALLBACK_STACKS.serif;
    const sans = getComputedStyle(sansProbe).fontFamily || FALLBACK_STACKS.sans;
    serifProbe.remove();
    sansProbe.remove();
    return { serif, sans };
  } catch {
    return FALLBACK_STACKS;
  }
}

export async function loadImageElement(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export async function loadImages(urls: string[]): Promise<Map<string, HTMLImageElement>> {
  const entries = await Promise.all(
    urls.map(async (url) => [url, await loadImageElement(url)] as const),
  );
  const map = new Map<string, HTMLImageElement>();
  for (const [url, image] of entries) if (image) map.set(url, image);
  return map;
}

export function framePixelSize(frame: HeroFrame, width: number): { width: number; height: number } {
  const ratio = aspectOf(frame);
  return { width, height: Math.round(width / ratio) };
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const output: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      output.push("");
      continue;
    }
    const words = paragraph.split(/(\s+)/).filter((token) => token.length > 0);
    let line = "";
    for (const word of words) {
      const candidate = line + word;
      if (ctx.measureText(candidate).width > maxWidth && line.trim()) {
        output.push(line.trimEnd());
        line = word.trimStart();
      } else {
        line = candidate;
      }
    }
    if (line.trim()) output.push(line.trimEnd());
  }
  return output;
}

export function drawHero(
  ctx: CanvasRenderingContext2D,
  frame: HeroFrame,
  width: number,
  height: number,
  images: Map<string, HTMLImageElement>,
  fonts: FontStacks = FALLBACK_STACKS,
  locale: "ko" | "en" = "ko",
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = frame.background || "#f2eee6";
  ctx.fillRect(0, 0, width, height);

  for (const layer of frame.layers) {
    if (!layer.visible) continue;
    const image = images.get(layer.assetId) ?? (layer.url ? images.get(layer.url) : undefined);
    if (!image) continue;
    const rect = imageRect(layer, width, height, image.naturalWidth, image.naturalHeight);
    if (!rect) continue;
    ctx.save();
    ctx.globalAlpha = clamp(layer.opacity, 0, 1);
    ctx.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, rect.dx, rect.dy, rect.dw, rect.dh);
    ctx.restore();
  }

  const text = frame.text;
  if (!text.visible) {
    ctx.restore();
    return;
  }

  const scrim = clamp(text.scrim, 0, 1);
  if (scrim > 0.01) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `rgba(12, 12, 9, ${scrim * 0.55})`);
    gradient.addColorStop(0.55, `rgba(12, 12, 9, ${scrim * 0.72})`);
    gradient.addColorStop(1, `rgba(12, 12, 9, ${scrim})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  const pick = (ko: string, en?: string) => (locale === "en" && en && en.trim() ? en : ko);
  const kicker = pick(text.kicker, text.kickerEn);
  const headline = pick(text.headline, text.headlineEn);
  const subcopy = pick(text.subcopy, text.subcopyEn);

  const anchorX = clamp(text.x, 0, 1) * width;
  const anchorY = clamp(text.y, 0, 1) * height;
  const headlineSize = Math.max(12, height * clamp(text.headlineScale, 0.01, 0.5));
  const maxWidth = width * clamp(text.maxWidth ?? (height > width ? 0.86 : 0.62), 0.2, 0.95);
  const align: CanvasTextAlign = text.align === "center" ? "center" : text.align === "right" ? "right" : "left";

  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillStyle = text.color || "#14140f";

  let cursorY = anchorY;

  if (kicker.trim()) {
    ctx.save();
    ctx.font = `500 ${Math.max(9, headlineSize * 0.2)}px ${fonts.sans}`;
    if ("letterSpacing" in ctx) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0.18em";
    }
    ctx.globalAlpha = 0.86;
    ctx.fillText(kicker.trim().toUpperCase(), anchorX, cursorY);
    cursorY += Math.max(9, headlineSize * 0.2) * 2.1;
    ctx.restore();
  }

  if (headline.trim()) {
    ctx.font = `300 ${headlineSize}px ${fonts.serif}`;
    const lines = wrapLines(ctx, headline, maxWidth);
    const lineHeight = headlineSize * 1.14;
    for (const line of lines) {
      ctx.fillText(line, anchorX, cursorY);
      cursorY += lineHeight;
    }
    cursorY += headlineSize * 0.32;
  }

  if (subcopy.trim()) {
    const subSize = Math.max(10, headlineSize * 0.28);
    ctx.save();
    ctx.font = `400 ${subSize}px ${fonts.sans}`;
    ctx.globalAlpha = 0.88;
    const lines = wrapLines(ctx, subcopy, Math.min(maxWidth * 1.15, width * 0.9));
    const lineHeight = subSize * 1.62;
    for (const line of lines) {
      ctx.fillText(line, anchorX, cursorY);
      cursorY += lineHeight;
    }
    ctx.restore();
  }

  ctx.restore();
}

/** Text block height estimate for the studio ruler (not used for drawing). */
export function estimateTextHeight(frame: HeroFrame, height: number): number {
  const headlineSize = Math.max(12, height * clamp(frame.text.headlineScale, 0.01, 0.5));
  const lines = frame.text.headline.split("\n").length;
  const subLines = frame.text.subcopy ? 2.4 : 0;
  return headlineSize * 1.14 * lines + headlineSize * 0.26 * 1.62 * subLines;
}
