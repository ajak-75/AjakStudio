"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabaseEnabled } from "@/lib/admin/auth";
import { pushHeroLayout, uploadHeroImage } from "@/lib/admin/remote";
import { applyAspect, aspectOf, clamp, createLayer, emptySnapshot } from "@/lib/admin/hero";
import { drawHero, readFontStacks, type FontStacks } from "@/lib/admin/heroCanvas";
import { useAdminData } from "@/lib/admin/store";
import type {
  HeroAspect,
  HeroFrame,
  HeroLayer,
  HeroLayout,
  HeroSnapshot,
  HeroText,
  ImageRecord,
} from "@/lib/admin/types";
import { cn, formatEditorialDate } from "@/lib/utils";

import { Btn, Panel, Tag } from "./Ui";

const ASPECT_OPTIONS: HeroAspect[] = ["16:9", "4:3", "1:1", "free"];

function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">
        {label}
        <span className="tabular-nums text-graphite">
          {suffix === "%" ? Math.round(value * 100) : Number(value.toFixed(2))}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full accent-[#8a6a3c]"
      />
    </label>
  );
}

function cropForAspect(imageAspect: number, target: number): HeroLayer["crop"] {
  if (!Number.isFinite(imageAspect) || imageAspect <= 0) return { x: 0, y: 0, w: 1, h: 1 };
  if (imageAspect >= target) {
    const width = target / imageAspect;
    return { x: (1 - width) / 2, y: 0, w: width, h: 1 };
  }
  const height = imageAspect / target;
  return { x: 0, y: (1 - height) / 2, w: 1, h: height };
}

function imageOf(images: ImageRecord[], assetId: string): ImageRecord | undefined {
  return images.find((image) => image.id === assetId);
}

export function HeroStudio() {
  const {
    data,
    addImage,
    updateImage,
    saveHeroVersion,
    restoreHeroVersion,
    publishHero,
    unpublishHero,
    deleteHeroVersion,
    resolveAssetUrl,
    getAssetUrl,
  } = useAdminData();

  const [name, setName] = useState("home-hero");
  const latest = useMemo(
    () => [...data.heroLayouts].filter((layout) => layout.name === name).sort((a, b) => b.version - a.version)[0],
    [data.heroLayouts, name],
  );

  const [draft, setDraft] = useState<HeroSnapshot>(() =>
    latest?.snapshot ? JSON.parse(JSON.stringify(latest.snapshot)) : emptySnapshot(),
  );
  const [viewport, setViewport] = useState<"pc" | "mobile">("pc");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [fonts, setFonts] = useState<FontStacks | undefined>(undefined);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ layerId: string; startX: number; startY: number; baseX: number; baseY: number; width: number; height: number } | null>(null);

  const frame = draft[viewport];
  const selectedLayer = frame.layers.find((layer) => layer.id === selectedLayerId) ?? null;
  const activeImages = useMemo(() => data.images.filter((image) => !image.archivedAt), [data.images]);

  useEffect(() => {
    setFonts(readFontStacks());
    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(() => setFonts(readFontStacks()));
    }
  }, []);

  const setFrame = useCallback(
    (next: HeroFrame) => {
      setDraft((current) => ({ ...current, [viewport]: next }));
      setDirty(true);
    },
    [viewport],
  );

  const patchFrame = useCallback(
    (patch: Partial<HeroFrame>) => {
      setFrame({ ...frame, ...patch });
    },
    [frame, setFrame],
  );

  const patchText = useCallback(
    (patch: Partial<HeroText>) => {
      setFrame({ ...frame, text: { ...frame.text, ...patch } });
    },
    [frame, setFrame],
  );

  const patchLayer = useCallback(
    (id: string, patch: Partial<HeroLayer>) => {
      setFrame({
        ...frame,
        layers: frame.layers.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)),
      });
    },
    [frame, setFrame],
  );

  // Resolve object URLs for every distinct asset in the draft.
  const assetKey = useMemo(
    () =>
      Array.from(new Set([...draft.pc.layers, ...draft.mobile.layers].map((layer) => `${layer.assetId}:${layer.url ?? ""}`)))
        .sort()
        .join("|"),
    [draft],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const layers = [...draft.pc.layers, ...draft.mobile.layers];
      const next: Record<string, string> = {};
      for (const layer of layers) {
        if (next[layer.assetId]) continue;
        if (layer.url) {
          next[layer.assetId] = layer.url;
          continue;
        }
        const image = imageOf(data.images, layer.assetId);
        if (!image) continue;
        const url = getAssetUrl(image.blobKey) ?? (await resolveAssetUrl(image.blobKey));
        if (url) next[layer.assetId] = url;
      }
      if (active) setAssetUrls(next);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetKey, data.images]);

  // Draw the current frame into the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = viewport === "pc" ? 1600 : 900;
    const ratio = aspectOf(frame);
    const height = Math.round(width / ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let cancelled = false;

    (async () => {
      const map = new Map<string, HTMLImageElement>();
      await Promise.all(
        frame.layers.map(async (layer) => {
          const url = assetUrls[layer.assetId] ?? layer.url;
          if (!url) return;
          const image = await new Promise<HTMLImageElement | null>((resolve) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => resolve(null);
            element.src = url;
          });
          if (image) map.set(layer.assetId, image);
        }),
      );
      if (cancelled) return;
      drawHero(ctx, frame, width, height, map, fonts);
    })();

    return () => {
      cancelled = true;
    };
  }, [frame, viewport, assetUrls, fonts]);

  /* ---------------------------------------------------------------- layers */

  const addLayerFor = (image: ImageRecord) => {
    const make = () => createLayer(image.id, image.publicUrl ?? null);
    const pcLayer = make();
    const mobileLayer = make();
    setDraft((current) => ({
      ...current,
      pc: { ...current.pc, layers: [...current.pc.layers, pcLayer] },
      mobile: { ...current.mobile, layers: [...current.mobile.layers, mobileLayer] },
    }));
    setSelectedLayerId(viewport === "pc" ? pcLayer.id : mobileLayer.id);
    setDirty(true);
  };

  const handleFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    const list = Array.from(files);
    for (const file of list) {
      const result = await addImage(file, "hero");
      if (!result.ok || !result.record) {
        setUploadError(result.error ?? "업로드하지 못했습니다.");
        continue;
      }
      addLayerFor(result.record);
      setStatus(`${file.name} 등록 · 원본 보존됨`);
      if (supabaseEnabled()) {
        const upload = await uploadHeroImage(file, result.record.id);
        if (upload.url) {
          updateImage(result.record.id, { publicUrl: upload.url });
          setDraft((current) => ({
            ...current,
            pc: {
              ...current.pc,
              layers: current.pc.layers.map((layer) =>
                layer.assetId === result.record?.id ? { ...layer, url: upload.url } : layer,
              ),
            },
            mobile: {
              ...current.mobile,
              layers: current.mobile.layers.map((layer) =>
                layer.assetId === result.record?.id ? { ...layer, url: upload.url } : layer,
              ),
            },
          }));
        }
        setStatus((current) => `${current ?? ""} · ${upload.message}`.trim());
      }
    }
  };

  const moveLayer = (id: string, direction: -1 | 1) => {
    const index = frame.layers.findIndex((layer) => layer.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= frame.layers.length) return;
    const layers = [...frame.layers];
    const [moved] = layers.splice(index, 1);
    if (!moved) return;
    layers.splice(target, 0, moved);
    patchFrame({ layers });
  };

  const removeLayer = (id: string) => {
    patchFrame({ layers: frame.layers.filter((layer) => layer.id !== id) });
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const applyCrop = (target: number) => {
    if (!selectedLayer) return;
    const image = imageOf(data.images, selectedLayer.assetId);
    if (!image || !image.width || !image.height) return;
    patchLayer(selectedLayer.id, { crop: cropForAspect(image.width / image.height, target) });
  };

  /* --------------------------------------------------------------- pointer */

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!selectedLayer) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      layerId: selectedLayer.id,
      startX: event.clientX,
      startY: event.clientY,
      baseX: selectedLayer.x,
      baseY: selectedLayer.y,
      width: rect.width,
      height: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / drag.width;
    const dy = (event.clientY - drag.startY) / drag.height;
    patchLayer(drag.layerId, {
      x: clamp(drag.baseX + dx, 0, 1),
      y: clamp(drag.baseY + dy, 0, 1),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
    dragRef.current = null;
  };

  /* ------------------------------------------------------------- versions */

  const onSave = () => {
    const saved = saveHeroVersion(draft, name.trim() || "home-hero", note.trim());
    setStatus(`v${saved.version} 저장 완료 — 버전으로 보관했습니다.`);
    setDirty(false);
    setNote("");
  };

  const onPublish = async (id: string) => {
    const published = publishHero(id);
    if (!published) return;
    if (supabaseEnabled()) {
      const result = await pushHeroLayout(published);
      setStatus(`${result.message}${result.ok ? "" : " (로컬 게시는 완료)"}`);
    } else {
      setStatus(`v${published.version} 게시 표시 — 공개 HOME은 고정 히어로를 씁니다.`);
    }
  };

  const onRestore = (id: string) => {
    const cloned = restoreHeroVersion(id);
    if (!cloned) return;
    setDraft(JSON.parse(JSON.stringify(cloned.snapshot)) as HeroSnapshot);
    setDirty(true);
    setStatus(`이전 시안을 v${cloned.version}으로 복제했습니다. (원본 유지)`);
  };

  const layouts = useMemo(
    () => [...data.heroLayouts].filter((layout) => layout.name === name).sort((a, b) => b.version - a.version),
    [data.heroLayouts, name],
  );
  const publishedLayout = layouts.find((layout) => layout.published) ?? null;

  return (
    <div className="space-y-6">
      {/* Toolbar ---------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-paper px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">미리보기</span>
          {(["pc", "mobile"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setViewport(mode);
                setSelectedLayerId(null);
              }}
              className={cn(
                "border px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] transition-colors",
                viewport === mode ? "border-ink bg-ink text-paper" : "border-line text-graphite hover:border-ink",
              )}
            >
              {mode === "pc" ? "PC 1280" : "모바일 375"}
            </button>
          ))}
          <span className="mx-2 hidden h-4 w-px bg-line sm:block" />
          <span className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">비율</span>
          <select
            value={frame.aspect}
            onChange={(event) => patchFrame(applyAspect(frame, event.target.value as HeroAspect))}
            className="border border-line bg-paper px-2 py-1.5 font-sans text-[0.6875rem] text-ink"
          >
            {ASPECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "free" ? "자유" : option}
              </option>
            ))}
          </select>
          {frame.aspect === "free" ? (
            <span className="flex items-center gap-1 font-sans text-[0.625rem] text-muted">
              <input
                type="number"
                min={1}
                value={frame.ratioW}
                onChange={(event) => patchFrame({ ratioW: Math.max(1, Number(event.target.value)) })}
                className="w-14 border border-line px-1 py-1 text-center"
              />
              :
              <input
                type="number"
                min={1}
                value={frame.ratioH}
                onChange={(event) => patchFrame({ ratioH: Math.max(1, Number(event.target.value)) })}
                className="w-14 border border-line px-1 py-1 text-center"
              />
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dirty ? <Tag tone="warn">저장 안 됨</Tag> : <Tag>저장됨</Tag>}
          <Btn onClick={() => fileRef.current?.click()}>+ 이미지 업로드</Btn>
          <Btn variant="primary" onClick={onSave}>
            시안 저장
          </Btn>
        </div>
      </div>

      {status ? (
        <p className="border-l-2 border-brass bg-brass-soft/40 px-3 py-2 font-sans text-[0.75rem] text-graphite">{status}</p>
      ) : null}
      {uploadError ? (
        <p className="border-l-2 border-[#8a3c3c] bg-[#8a3c3c]/5 px-3 py-2 font-sans text-[0.75rem] text-[#8a3c3c]">
          {uploadError}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Canvas --------------------------------------------------------- */}
        <div className="min-w-0">
          <div
            className={cn(
              "border border-line bg-porcelain p-3",
              viewport === "mobile" && "mx-auto max-w-[420px]",
            )}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (event.dataTransfer?.files?.length) void handleFiles(event.dataTransfer.files);
            }}
          >
            {viewport === "mobile" ? (
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="font-sans text-[0.5rem] uppercase tracking-[0.16em] text-muted">375 PX</span>
                <span className="font-sans text-[0.5rem] uppercase tracking-[0.16em] text-muted">MOBILE</span>
              </div>
            ) : null}
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className={cn("block w-full touch-none border border-line bg-paper", selectedLayer && "cursor-move")}
              style={{ aspectRatio: `${aspectOf(frame)}`, height: "auto" }}
              aria-label="히어로 편집 캔버스"
            />
          </div>
          <p className="mt-2 font-sans text-[0.625rem] leading-relaxed text-muted">
            캔버스를 드래그하면 선택한 이미지가 움직입니다. 이미지·JPG·PNG·WebP·5MB 이하, 끌어다 놓아도 됩니다.
            원본 파일은 자르지 않고 그대로 보관합니다.
          </p>
        </div>

        {/* Inspector ------------------------------------------------------ */}
        <div className="space-y-4">
          <Panel title="이미지 레이어" note={`${frame.layers.length}개 · 위에 있는 레이어가 앞에 그려집니다`}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.length) void handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
            {frame.layers.length === 0 ? (
              <p className="border border-dashed border-line px-3 py-6 text-center font-sans text-[0.6875rem] text-muted">
                이미지를 올리면 여기에 쌓입니다.
                <br />
                아래 보관함에서 바로 추가할 수도 있습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {[...frame.layers].reverse().map((layer) => {
                  const image = imageOf(data.images, layer.assetId);
                  const url = assetUrls[layer.assetId];
                  const active = layer.id === selectedLayerId;
                  return (
                    <li
                      key={layer.id}
                      className={cn("border p-2", active ? "border-ink" : "border-line")}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLayerId(layer.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="h-10 w-10 shrink-0 border border-line bg-porcelain">
                            {url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={url} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-sans text-[0.6875rem] text-ink">
                              {image?.title ?? layer.assetId}
                            </span>
                            <span className="block font-sans text-[0.5625rem] uppercase tracking-[0.12em] text-muted">
                              {Math.round(layer.scale * 100)}% · x {Math.round(layer.x * 100)} y {Math.round(layer.y * 100)}
                            </span>
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveLayer(layer.id, 1)}
                            className="px-1 font-sans text-[0.625rem] text-muted hover:text-ink"
                            title="앞으로"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLayer(layer.id, -1)}
                            className="px-1 font-sans text-[0.625rem] text-muted hover:text-ink"
                            title="뒤로"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => patchLayer(layer.id, { visible: !layer.visible })}
                            className="px-1 font-sans text-[0.625rem] text-muted hover:text-ink"
                            title="보이기/숨기기"
                          >
                            {layer.visible ? "◉" : "○"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLayer(layer.id)}
                            className="px-1 font-sans text-[0.625rem] text-muted hover:text-[#8a3c3c]"
                            title="레이어 제거"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {activeImages.length > 0 ? (
              <div className="mt-3 border-t border-line pt-3">
                <p className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">보관함에서 추가</p>
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {activeImages.slice(0, 15).map((image) => {
                    const url = assetUrls[image.id] ?? getAssetUrl(image.blobKey) ?? image.publicUrl;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => addLayerFor(image)}
                        title={image.title}
                        className="aspect-square border border-line bg-porcelain hover:border-ink"
                      >
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={image.title} className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-sans text-[0.5rem] text-muted">IMG</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <p className="mt-3 border-t border-line pt-2 font-sans text-[0.5625rem] leading-relaxed text-muted">
              AI 이미지 생성은 연결되어 있지 않습니다. 업로드한 이미지만으로 100% 동작합니다 (0원 원칙).
            </p>
          </Panel>

          {selectedLayer ? (
            <Panel
              title="이미지 조정"
              note={imageOf(data.images, selectedLayer.assetId)?.title}
              action={
                <Btn variant="ghost" onClick={() => removeLayer(selectedLayer.id)}>
                  레이어 제거
                </Btn>
              }
            >
              <div className="space-y-3">
                <Range label="크기 (Scale)" value={selectedLayer.scale} min={0.4} max={3} step={0.01} onChange={(value) => patchLayer(selectedLayer.id, { scale: value })} suffix="x" />
                <Range label="위치 X" value={selectedLayer.x} min={0} max={1} step={0.005} onChange={(value) => patchLayer(selectedLayer.id, { x: value })} suffix="%" />
                <Range label="위치 Y" value={selectedLayer.y} min={0} max={1} step={0.005} onChange={(value) => patchLayer(selectedLayer.id, { y: value })} suffix="%" />
                <Range label="불투명도" value={selectedLayer.opacity} min={0.1} max={1} step={0.01} onChange={(value) => patchLayer(selectedLayer.id, { opacity: value })} suffix="%" />

                <div>
                  <p className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">크롭 비율</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[
                      { label: "16:9", value: 16 / 9 },
                      { label: "4:3", value: 4 / 3 },
                      { label: "1:1", value: 1 },
                      { label: "원본", value: 0 },
                    ].map((option) => (
                      <Btn
                        key={option.label}
                        variant="outline"
                        onClick={() => {
                          if (option.value === 0) patchLayer(selectedLayer.id, { crop: { x: 0, y: 0, w: 1, h: 1 } });
                          else applyCrop(option.value);
                        }}
                      >
                        {option.label}
                      </Btn>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-line pt-2">
                  <Range label="크롭 X" value={selectedLayer.crop.x} min={0} max={0.9} step={0.01} onChange={(value) => patchLayer(selectedLayer.id, { crop: { ...selectedLayer.crop, x: value } })} suffix="%" />
                  <Range label="크롭 Y" value={selectedLayer.crop.y} min={0} max={0.9} step={0.01} onChange={(value) => patchLayer(selectedLayer.id, { crop: { ...selectedLayer.crop, y: value } })} suffix="%" />
                  <Range label="크롭 폭" value={selectedLayer.crop.w} min={0.1} max={1} step={0.01} onChange={(value) => patchLayer(selectedLayer.id, { crop: { ...selectedLayer.crop, w: value } })} suffix="%" />
                  <Range label="크롭 높이" value={selectedLayer.crop.h} min={0.1} max={1} step={0.01} onChange={(value) => patchLayer(selectedLayer.id, { crop: { ...selectedLayer.crop, h: value } })} suffix="%" />
                </div>
                <p className="font-sans text-[0.5625rem] text-muted">
                  원본 {imageOf(data.images, selectedLayer.assetId)?.width ?? "?"}×
                  {imageOf(data.images, selectedLayer.assetId)?.height ?? "?"}px · 저장 시 크롭 값만 기록하고 원본은 유지합니다.
                </p>
              </div>
            </Panel>
          ) : null}

          <Panel title="텍스트" note="헤드라인은 세리프, 정보는 산세리프 — 디자인 시스템 고정">
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="font-sans text-[0.625rem] uppercase tracking-[0.14em] text-graphite">텍스트 표시</span>
                <input
                  type="checkbox"
                  checked={frame.text.visible}
                  onChange={(event) => patchText({ visible: event.target.checked })}
                  className="h-4 w-4 accent-[#8a6a3c]"
                />
              </label>
              <label className="block">
                <span className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">킥커</span>
                <input
                  value={frame.text.kicker}
                  onChange={(event) => patchText({ kicker: event.target.value })}
                  className="mt-1 w-full border border-line px-2 py-1.5 font-sans text-[0.75rem] text-ink"
                />
              </label>
              <label className="block">
                <span className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">헤드라인</span>
                <textarea
                  value={frame.text.headline}
                  rows={3}
                  onChange={(event) => patchText({ headline: event.target.value })}
                  className="mt-1 w-full resize-y border border-line px-2 py-1.5 font-serif text-[0.9375rem] leading-snug text-ink"
                />
              </label>
              <label className="block">
                <span className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">서브카피</span>
                <textarea
                  value={frame.text.subcopy}
                  rows={3}
                  onChange={(event) => patchText({ subcopy: event.target.value })}
                  className="mt-1 w-full resize-y border border-line px-2 py-1.5 font-sans text-[0.75rem] leading-relaxed text-ink"
                />
              </label>

              <div className="border-t border-line pt-3">
                <p className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">ENGLISH · /en/ 전용</p>
                <input
                  value={frame.text.kickerEn ?? ""}
                  onChange={(event) => patchText({ kickerEn: event.target.value })}
                  placeholder="Kicker (EN)"
                  className="mt-1.5 w-full border border-line px-2 py-1.5 font-sans text-[0.6875rem] text-ink"
                />
                <textarea
                  value={frame.text.headlineEn ?? ""}
                  rows={2}
                  onChange={(event) => patchText({ headlineEn: event.target.value })}
                  placeholder="Headline (EN)"
                  className="mt-1.5 w-full resize-y border border-line px-2 py-1.5 font-serif text-[0.875rem] leading-snug text-ink"
                />
                <textarea
                  value={frame.text.subcopyEn ?? ""}
                  rows={2}
                  onChange={(event) => patchText({ subcopyEn: event.target.value })}
                  placeholder="Sub copy (EN)"
                  className="mt-1.5 w-full resize-y border border-line px-2 py-1.5 font-sans text-[0.6875rem] leading-relaxed text-ink"
                />
                <p className="mt-1 font-sans text-[0.5625rem] text-muted">비워 두면 한국어 문구가 그대로 쓰입니다.</p>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => patchText({ align })}
                    className={cn(
                      "border py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.12em]",
                      frame.text.align === align ? "border-ink bg-ink text-paper" : "border-line text-graphite",
                    )}
                  >
                    {align === "left" ? "왼쪽" : align === "center" ? "가운데" : "오른쪽"}
                  </button>
                ))}
              </div>

              <Range label="텍스트 X" value={frame.text.x} min={0} max={1} step={0.005} onChange={(value) => patchText({ x: value })} suffix="%" />
              <Range label="텍스트 Y" value={frame.text.y} min={0} max={0.95} step={0.005} onChange={(value) => patchText({ y: value })} suffix="%" />
              <Range label="헤드라인 크기" value={frame.text.headlineScale} min={0.03} max={0.2} step={0.001} onChange={(value) => patchText({ headlineScale: value })} suffix="%" />
              <Range label="텍스트 폭" value={frame.text.maxWidth ?? 0.62} min={0.25} max={0.95} step={0.01} onChange={(value) => patchText({ maxWidth: value })} suffix="%" />
              <Range label="가독성 스크림" value={frame.text.scrim} min={0} max={1} step={0.01} onChange={(value) => patchText({ scrim: value })} suffix="%" />

              <div className="flex items-center gap-3">
                <span className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">글자색</span>
                <input
                  type="color"
                  value={frame.text.color}
                  onChange={(event) => patchText({ color: event.target.value })}
                  className="h-8 w-12 border border-line bg-paper p-0.5"
                />
                <span className="font-sans text-[0.625rem] text-graphite">{frame.text.color}</span>
              </div>
              <div className="flex items-center gap-3 border-t border-line pt-2">
                <span className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">배경색</span>
                <input
                  type="color"
                  value={frame.background}
                  onChange={(event) => patchFrame({ background: event.target.value })}
                  className="h-8 w-12 border border-line bg-paper p-0.5"
                />
                <span className="font-sans text-[0.625rem] text-graphite">{frame.background}</span>
              </div>
            </div>
          </Panel>

          <Panel title="버전 저장">
            <div className="space-y-2">
              <label className="block">
                <span className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">히어로 이름</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full border border-line px-2 py-1.5 font-sans text-[0.75rem]"
                />
              </label>
              <label className="block">
                <span className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">메모 (선택)</span>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="예: 가을 캠페인 1차"
                  className="mt-1 w-full border border-line px-2 py-1.5 font-sans text-[0.75rem]"
                />
              </label>
              <div className="flex gap-2">
                <Btn variant="primary" onClick={onSave} className="flex-1">
                  v{layouts[0] ? layouts[0].version + 1 : 1} 저장
                </Btn>
                {layouts[0] ? (
                  <Btn
                    variant="brass"
                    onClick={async () => {
                      const saved = saveHeroVersion(draft, name.trim() || "home-hero", note.trim());
                      setDirty(false);
                      await onPublish(saved.id);
                    }}
                  >
                    저장 후 게시
                  </Btn>
                ) : null}
              </div>
              <p className="font-sans text-[0.5625rem] leading-relaxed text-muted">
                저장은 새 버전을 쌓습니다. 공개 HOME의 히어로는 고정 시그니처로 운영되며, 이전 시안은 사라지지 않습니다.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      {/* Versions --------------------------------------------------------- */}
      <Panel
        title="시안 버전"
        note={`${name} · ${layouts.length}개 버전${publishedLayout ? ` · 공개 중 v${publishedLayout.version}` : " · 게시된 시안 없음"}`}
        action={
          <a href="/ko/" target="_blank" rel="noopener noreferrer" className="link-rule font-sans text-[0.625rem] uppercase tracking-[0.14em] text-ink">
            공개 HOME 열기
          </a>
        }
      >
        {layouts.length === 0 ? (
          <p className="font-sans text-[0.75rem] text-muted">저장된 시안이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {layouts.map((layout: HeroLayout) => (
              <li key={layout.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="w-10 shrink-0 font-serif text-[1.125rem] leading-none text-ink">v{layout.version}</span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-sans text-[0.75rem] text-ink">
                      {formatEditorialDate(layout.createdAt)}
                      {layout.published ? <Tag tone="brass">공개 중</Tag> : null}
                    </p>
                    <p className="truncate font-sans text-[0.625rem] text-muted">
                      {layout.note || "메모 없음"} · PC {layout.snapshot.pc.aspect} / 모바일 {layout.snapshot.mobile.aspect} · 이미지{" "}
                      {layout.snapshot.pc.layers.length}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Btn
                    variant="ghost"
                    onClick={() => {
                      setDraft(JSON.parse(JSON.stringify(layout.snapshot)) as HeroSnapshot);
                      setDirty(true);
                      setStatus(`v${layout.version}을(를) 편집기에 불러왔습니다.`);
                    }}
                  >
                    불러오기
                  </Btn>
                  <Btn variant="ghost" onClick={() => onRestore(layout.id)}>
                    복원
                  </Btn>
                  {layout.published ? (
                    <Btn
                      variant="ghost"
                      onClick={() => {
                        unpublishHero(layout.id);
                        setStatus("게시 표시를 취소했습니다. 공개 HOME은 고정 히어로를 씁니다.");
                      }}
                    >
                      게시 취소
                    </Btn>
                  ) : (
                    <Btn variant="outline" onClick={() => void onPublish(layout.id)}>
                      게시
                    </Btn>
                  )}
                  {confirmDelete === layout.id ? (
                    <>
                      <Btn
                        variant="danger"
                        onClick={() => {
                          deleteHeroVersion(layout.id);
                          setConfirmDelete(null);
                        }}
                      >
                        삭제 확인
                      </Btn>
                      <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>
                        취소
                      </Btn>
                    </>
                  ) : (
                    <Btn variant="ghost" onClick={() => setConfirmDelete(layout.id)} disabled={layout.published}>
                      삭제
                    </Btn>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
