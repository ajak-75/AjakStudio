import {
  newId,
  nowIso,
  type HeroAspect,
  type HeroFrame,
  type HeroLayout,
  type HeroLayer,
  type HeroSnapshot,
  type HeroText,
} from "./types";

/**
 * Hero geometry.
 *
 * Every position and size is stored in 0–1 units of the frame, so the same
 * snapshot draws identically into a 1600 px desktop canvas, a 375 px phone
 * canvas and the published HOME hero. The crop is a source rectangle in 0–1
 * units of the original image, which is why an original never has to be
 * rewritten to make a draft.
 */

export const ASPECTS: Record<HeroAspect, { ratioW: number; ratioH: number }> = {
  "16:9": { ratioW: 16, ratioH: 9 },
  "4:3": { ratioW: 4, ratioH: 3 },
  "1:1": { ratioW: 1, ratioH: 1 },
  free: { ratioW: 16, ratioH: 9 },
};

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function aspectOf(frame: HeroFrame): number {
  const preset = ASPECTS[frame.aspect];
  const w = frame.aspect === "free" ? frame.ratioW : preset.ratioW;
  const h = frame.aspect === "free" ? frame.ratioH : preset.ratioH;
  return w > 0 && h > 0 ? w / h : 16 / 9;
}

export function applyAspect(frame: HeroFrame, aspect: HeroAspect): HeroFrame {
  const preset = ASPECTS[aspect];
  return { ...frame, aspect, ratioW: preset.ratioW, ratioH: preset.ratioH };
}

export function defaultText(): HeroText {
  return {
    visible: true,
    kicker: "GLOBAL DIGITAL UNIVERSE",
    headline: "디지털 세계를\n하나의 브랜드로",
    subcopy: "앱과 채널을 하나의 브랜드로 잇는 본부.",
    x: 0.07,
    y: 0.3,
    align: "left",
    color: "#14140f",
    headlineScale: 0.075,
    scrim: 0,
    maxWidth: 0.62,
  };
}

export function createLayer(assetId: string, url: string | null = null): HeroLayer {
  return {
    id: newId("layer"),
    assetId,
    url,
    x: 0.5,
    y: 0.5,
    scale: 1,
    crop: { x: 0, y: 0, w: 1, h: 1 },
    opacity: 1,
    visible: true,
  };
}

export interface DrawRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/**
 * Destination rectangle for a layer: the crop is scaled to cover the frame at
 * `scale`, centred on (x, y). Aspect is preserved — images are never squashed.
 */
export function imageRect(
  layer: HeroLayer,
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
): DrawRect | null {
  if (imageWidth <= 0 || imageHeight <= 0) return null;

  const cropW = clamp(layer.crop.w, 0.02, 1);
  const cropH = clamp(layer.crop.h, 0.02, 1);
  const cropX = clamp(layer.crop.x, 0, 1 - cropW);
  const cropY = clamp(layer.crop.y, 0, 1 - cropH);

  const sx = cropX * imageWidth;
  const sy = cropY * imageHeight;
  const sw = cropW * imageWidth;
  const sh = cropH * imageHeight;

  const scale = clamp(layer.scale, 0.1, 6);
  let dw = frameWidth * scale;
  let dh = dw / (sw / sh);
  if (dh < frameHeight * scale) {
    dh = frameHeight * scale;
    dw = dh * (sw / sh);
  }

  return {
    sx,
    sy,
    sw,
    sh,
    dx: clamp(layer.x, -1, 2) * frameWidth - dw / 2,
    dy: clamp(layer.y, -1, 2) * frameHeight - dh / 2,
    dw,
    dh,
  };
}

/** Largest version number for a hero name, plus one. */
export function nextVersion(layouts: HeroLayout[], name = "home-hero"): number {
  return (
    layouts
      .filter((layout) => layout.name === name)
      .reduce((max, layout) => Math.max(max, layout.version), 0) + 1
  );
}

export function cloneLayout(layout: HeroLayout, version: number, note: string): HeroLayout {
  return {
    ...layout,
    id: newId("hero"),
    version,
    snapshot: JSON.parse(JSON.stringify(layout.snapshot)) as HeroSnapshot,
    published: false,
    publishedAt: null,
    note,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

/** Publishing one version unpublishes every other version of the same name. */
export function publishInList(layouts: HeroLayout[], id: string): HeroLayout[] {
  const target = layouts.find((layout) => layout.id === id);
  if (!target) return layouts;
  const at = nowIso();
  return layouts.map((layout) => {
    if (layout.id === id) return { ...layout, published: true, publishedAt: at, updatedAt: at };
    if (layout.name === target.name && layout.published) {
      return { ...layout, published: false, publishedAt: null, updatedAt: at };
    }
    return layout;
  });
}

export function unpublishInList(layouts: HeroLayout[], id: string): HeroLayout[] {
  const at = nowIso();
  return layouts.map((layout) =>
    layout.id === id ? { ...layout, published: false, publishedAt: null, updatedAt: at } : layout,
  );
}

/** Newest published layout, which is the one the public HOME renders. */
export function publishedLayout(layouts: HeroLayout[]): HeroLayout | null {
  const published = layouts.filter((layout) => layout.published);
  if (!published.length) return null;
  return published.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0] ?? null;
}

export function layerCount(snapshot: HeroSnapshot): number {
  return snapshot.pc.layers.length + snapshot.mobile.layers.length;
}

/** Summary line for the version list: “PC 1280×720 · 이미지 2 · 텍스트 1”. */
export function describeSnapshot(snapshot: HeroSnapshot): string {
  const frames = [snapshot.pc, snapshot.mobile];
  const images = frames.reduce((sum, frame) => sum + frame.layers.filter((l) => l.visible).length, 0);
  const texts = frames.filter((frame) => frame.text.visible && frame.text.headline.trim()).length;
  return `이미지 레이어 ${images} · 텍스트 ${texts} · PC ${snapshot.pc.aspect} / 모바일 ${snapshot.mobile.aspect}`;
}

export function emptySnapshot(): HeroSnapshot {
  return {
    schema: 1,
    pc: {
      aspect: "16:9",
      ratioW: 16,
      ratioH: 9,
      background: "#f2eee6",
      layers: [],
      text: { ...defaultText(), x: 0.06, y: 0.3, headlineScale: 0.072, maxWidth: 0.6 },
    },
    mobile: {
      aspect: "4:3",
      ratioW: 4,
      ratioH: 3,
      background: "#f2eee6",
      layers: [],
      text: { ...defaultText(), x: 0.07, y: 0.24, headlineScale: 0.1, maxWidth: 0.8 },
    },
  };
}
