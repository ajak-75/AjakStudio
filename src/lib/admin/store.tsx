"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { hashString, serializeBackup, type BackupPayload, type ExportedImage } from "./backup";
import { blobToDataUrl, dataUrlToBlob, deleteBlob, getBlob, putBlob, readData, requestPersistence, writeData } from "./db";
import { cloneLayout, nextVersion, publishInList, unpublishInList } from "./hero";
import { createSeedData } from "./seed";
import {
  COLLECTIONS,
  newId,
  nowIso,
  type AdminData,
  type CollectionKey,
  type HeroLayout,
  type HeroSnapshot,
  type ImageRecord,
  type NotionInfo,
} from "./types";

export type StorageKind = "idb" | "local" | "memory";
export type SaveState = "idle" | "saving" | "saved" | "error";

export interface UploadResult {
  ok: boolean;
  error?: string;
  record?: ImageRecord;
}

export interface StoreValue {
  data: AdminData;
  storage: StorageKind;
  saveState: SaveState;
  lastSavedAt: string | null;
  notice: string | null;
  setNotice: (notice: string | null) => void;
  createRecord: (collection: CollectionKey, values: Record<string, unknown>) => string;
  updateRecord: (collection: CollectionKey, id: string, patch: Record<string, unknown>) => void;
  deleteRecord: (collection: CollectionKey, id: string) => void;
  moveRecord: (collection: CollectionKey, id: string, direction: -1 | 1) => void;
  setNotion: (info: NotionInfo) => void;
  addImage: (file: File, source?: ImageRecord["source"]) => Promise<UploadResult>;
  updateImage: (id: string, patch: Partial<ImageRecord>) => void;
  archiveImage: (id: string) => void;
  restoreImage: (id: string) => void;
  purgeImage: (id: string) => Promise<void>;
  saveHeroVersion: (snapshot: HeroSnapshot, name: string, note: string, basedOn?: string | null) => HeroLayout;
  restoreHeroVersion: (id: string) => HeroLayout | null;
  publishHero: (id: string) => HeroLayout | null;
  unpublishHero: (id: string) => void;
  deleteHeroVersion: (id: string) => void;
  exportBackup: (options: { includeImages: boolean }) => Promise<{ text: string; bytes: number; checksum: string; filename: string; images: number }>;
  importBackup: (payload: BackupPayload) => Promise<{ ok: boolean; error?: string; restoredImages: number }>;
  resetToSeed: () => Promise<void>;
  getAssetUrl: (blobKey: string | null) => string | null;
  resolveAssetUrl: (blobKey: string | null) => Promise<string | null>;
}

const StoreContext = createContext<StoreValue | null>(null);

const urlCache = new Map<string, string>();

/** Reads an image file's intrinsic size without touching the original bytes. */
function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return "JPG · PNG · WebP 이미지만 올릴 수 있습니다.";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return `5MB를 넘습니다 (${(file.size / (1024 * 1024)).toFixed(1)}MB).`;
  }
  if (file.size === 0) return "빈 파일입니다.";
  return null;
}

export function AdminDataProvider({ children, initialData }: { children: ReactNode; initialData?: AdminData | null }) {
  const [data, setData] = useState<AdminData | null>(initialData ?? null);
  const dataRef = useRef<AdminData | null>(initialData ?? null);
  const [storage, setStorage] = useState<StorageKind>("memory");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const queued = useRef<AdminData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    const pending = queued.current;
    if (!pending) return;
    queued.current = null;
    setSaveState("saving");
    const ok = await writeData(pending);
    setSaveState(ok ? "saved" : "error");
    if (ok) setLastSavedAt(new Date().toISOString());
  }, []);

  const schedule = useCallback(
    (next: AdminData) => {
      queued.current = next;
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, 350);
    },
    [flush],
  );

  useEffect(() => {
    if (initialData) return;
    let active = true;
    (async () => {
      const stored = await readData();
      if (!active) return;
      if (stored) {
        dataRef.current = stored;
        setData(stored);
        setStorage(typeof indexedDB !== "undefined" ? "idb" : "local");
      } else {
        const seeded = createSeedData();
        dataRef.current = seeded;
        setData(seeded);
        const ok = await writeData(seeded);
        setStorage(ok ? (typeof indexedDB !== "undefined" ? "idb" : "local") : "memory");
      }
      void requestPersistence();
    })();
    return () => {
      active = false;
    };
  }, [initialData]);

  useEffect(() => {
    const onUnload = () => {
      if (queued.current) void writeData(queued.current);
    };
    window.addEventListener("pagehide", onUnload);
    return () => window.removeEventListener("pagehide", onUnload);
  }, []);

  const commit = useCallback(
    (producer: (current: AdminData) => AdminData) => {
      const current = dataRef.current;
      if (!current) return;
      const next = { ...producer(current), updatedAt: nowIso() };
      dataRef.current = next;
      setData(next);
      schedule(next);
    },
    [schedule],
  );

  const createRecord = useCallback(
    (collection: CollectionKey, values: Record<string, unknown>): string => {
      const id = newId(collection.slice(0, 2));
      const stamp = nowIso();
      commit((current) => {
        const rows = current[collection] as unknown as Array<Record<string, unknown>>;
        const sort = collection === "apps" || collection === "channels" || collection === "projects" || collection === "contents"
          ? rows.length
          : undefined;
        const row = { id, title: "", createdAt: stamp, updatedAt: stamp, ...(sort === undefined ? {} : { sort }), ...values };
        return {
          ...current,
          [collection]: [...rows, row],
        } as AdminData;
      });
      return id;
    },
    [commit],
  );

  const updateRecord = useCallback(
    (collection: CollectionKey, id: string, patch: Record<string, unknown>) => {
      commit((current) => {
        const rows = current[collection] as unknown as Array<Record<string, unknown>>;
        return {
          ...current,
          [collection]: rows.map((row) => (row.id === id ? { ...row, ...patch, updatedAt: nowIso() } : row)),
        } as AdminData;
      });
    },
    [commit],
  );

  const deleteRecord = useCallback(
    (collection: CollectionKey, id: string) => {
      commit((current) => {
        const rows = current[collection] as unknown as Array<Record<string, unknown>>;
        return {
          ...current,
          [collection]: rows.filter((row) => row.id !== id),
        } as AdminData;
      });
    },
    [commit],
  );

  const moveRecord = useCallback(
    (collection: CollectionKey, id: string, direction: -1 | 1) => {
      commit((current) => {
        const rows = [...(current[collection] as unknown as Array<Record<string, unknown>>)];
        const index = rows.findIndex((row) => row.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= rows.length) return current;
        const [moved] = rows.splice(index, 1);
        if (!moved) return current;
        rows.splice(target, 0, moved);
        return {
          ...current,
          [collection]: rows.map((row, order) => ({ ...row, sort: order })),
        } as AdminData;
      });
    },
    [commit],
  );

  const setNotion = useCallback(
    (info: NotionInfo) => {
      commit((current) => ({ ...current, notion: info }));
    },
    [commit],
  );

  const addImage = useCallback(
    async (file: File, source: ImageRecord["source"] = "library"): Promise<UploadResult> => {
      const error = validateImageFile(file);
      if (error) return { ok: false, error };
      const id = newId("img");
      const blobKey = `blob_${id}`;
      const [stored, size] = await Promise.all([putBlob(blobKey, file), readImageSize(file)]);
      if (!stored) return { ok: false, error: "브라우저 저장소에 이미지를 쓰지 못했습니다. 저장 공간을 확인해 주세요." };
      const stamp = nowIso();
      const record: ImageRecord = {
        id,
        createdAt: stamp,
        updatedAt: stamp,
        title: file.name.replace(/\.[^.]+$/, ""),
        alt: { ko: "", en: "" },
        blobKey,
        mime: file.type,
        byteSize: file.size,
        width: size.width,
        height: size.height,
        archivedAt: null,
        publicUrl: null,
        tags: [],
        source,
      };
      commit((current) => ({ ...current, images: [record, ...current.images] }));
      return { ok: true, record };
    },
    [commit],
  );

  const updateImage = useCallback(
    (id: string, patch: Partial<ImageRecord>) => {
      commit((current) => ({
        ...current,
        images: current.images.map((image) => (image.id === id ? { ...image, ...patch, updatedAt: nowIso() } : image)),
      }));
    },
    [commit],
  );

  const archiveImage = useCallback(
    (id: string) => {
      commit((current) => ({
        ...current,
        images: current.images.map((image) =>
          image.id === id ? { ...image, archivedAt: nowIso(), updatedAt: nowIso() } : image,
        ),
      }));
    },
    [commit],
  );

  const restoreImage = useCallback(
    (id: string) => {
      commit((current) => ({
        ...current,
        images: current.images.map((image) =>
          image.id === id ? { ...image, archivedAt: null, updatedAt: nowIso() } : image,
        ),
      }));
    },
    [commit],
  );

  /** A deliberate purge — the only path that removes original bytes. */
  const purgeImage = useCallback(
    async (id: string) => {
      const image = data?.images.find((row) => row.id === id);
      if (!image) return;
      await deleteBlob(image.blobKey);
      const cached = urlCache.get(image.blobKey);
      if (cached) {
        URL.revokeObjectURL(cached);
        urlCache.delete(image.blobKey);
      }
      commit((current) => ({ ...current, images: current.images.filter((row) => row.id !== id) }));
    },
    [commit, data],
  );

  const saveHeroVersion = useCallback(
    (snapshot: HeroSnapshot, name: string, note: string, basedOn: string | null = null): HeroLayout => {
      const stamp = nowIso();
      const version = nextVersion(dataRef.current?.heroLayouts ?? [], name);
      const created: HeroLayout = {
        id: newId("hero"),
        createdAt: stamp,
        updatedAt: stamp,
        name,
        version,
        snapshot: JSON.parse(JSON.stringify(snapshot)) as HeroSnapshot,
        published: false,
        publishedAt: null,
        note: basedOn ? `${note}${note ? " · " : ""}이전 시안 v${version - 1} 기반` : note,
      };
      commit((current) => ({ ...current, heroLayouts: [created, ...current.heroLayouts] }));
      return created;
    },
    [commit],
  );

  const restoreHeroVersion = useCallback(
    (id: string): HeroLayout | null => {
      const source = dataRef.current?.heroLayouts.find((layout) => layout.id === id);
      if (!source) return null;
      const version = nextVersion(dataRef.current?.heroLayouts ?? [], source.name);
      const cloned = cloneLayout(source, version, `v${source.version} 복원`);
      commit((current) => ({ ...current, heroLayouts: [cloned, ...current.heroLayouts] }));
      return cloned;
    },
    [commit],
  );

  const publishHero = useCallback(
    (id: string): HeroLayout | null => {
      const target = dataRef.current?.heroLayouts.find((layout) => layout.id === id) ?? null;
      commit((current) => ({ ...current, heroLayouts: publishInList(current.heroLayouts, id) }));
      return target ? { ...target, published: true, publishedAt: nowIso(), updatedAt: nowIso() } : null;
    },
    [commit],
  );

  const unpublishHero = useCallback(
    (id: string) => {
      commit((current) => ({ ...current, heroLayouts: unpublishInList(current.heroLayouts, id) }));
    },
    [commit],
  );

  const deleteHeroVersion = useCallback(
    (id: string) => {
      commit((current) => ({ ...current, heroLayouts: current.heroLayouts.filter((layout) => layout.id !== id) }));
    },
    [commit],
  );

  const exportBackup = useCallback(
    async (options: { includeImages: boolean }) => {
      const source = dataRef.current;
      if (!source) throw new Error("데이터가 아직 준비되지 않았습니다.");
      let images: ExportedImage[] | undefined;
      if (options.includeImages) {
        images = [];
        for (const image of source.images) {
          const blob = await getBlob(image.blobKey);
          if (!blob) continue;
          images.push({ id: image.id, dataUrl: await blobToDataUrl(blob) });
        }
      }
      const text = serializeBackup(source, images);
      const bytes = new TextEncoder().encode(text).length;
      const checksum = hashString(text);
      const stamp = new Date();
      const pad = (value: number) => String(value).padStart(2, "0");
      const filename = `gdu-control-center-${stamp.getFullYear()}-${pad(stamp.getMonth() + 1)}-${pad(
        stamp.getDate(),
      )}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}.json`;
      commit((current) => ({
        ...current,
        backups: [
          {
            id: newId("bk"),
            at: new Date().toISOString(),
            kind: "export" as const,
            records: Object.values(current).reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0),
            bytes,
            checksum,
            note: options.includeImages ? "이미지 원본 포함" : "이미지 제외",
          },
          ...current.backups,
        ].slice(0, 30),
      }));
      return { text, bytes, checksum, filename, images: images?.length ?? 0 };
    },
    [commit],
  );

  const importBackup = useCallback(
    async (payload: BackupPayload): Promise<{ ok: boolean; error?: string; restoredImages: number }> => {
      let restoredImages = 0;
      if (payload.images?.length) {
        for (const image of payload.images) {
          try {
            const blob = await dataUrlToBlob(image.dataUrl);
            await putBlob(`blob_${image.id}`, blob);
            restoredImages += 1;
          } catch {
            return { ok: false, error: "이미지 데이터를 복원하지 못했습니다. 파일이 잘렸을 수 있습니다.", restoredImages };
          }
        }
      }
      const stamp = nowIso();
      const restored: AdminData = {
        ...payload.data,
        updatedAt: stamp,
        backups: [
          {
            id: newId("bk"),
            at: stamp,
            kind: "import" as const,
            records: Object.values(payload.counts ?? {}).reduce((sum, value) => sum + value, 0),
            bytes: 0,
            checksum: hashString(JSON.stringify(payload.data)),
            note: "JSON 가져오기 복구",
          },
          ...(payload.data.backups ?? []),
        ].slice(0, 30),
      };
      dataRef.current = restored;
      setData(restored);
      schedule(restored);
      await flush();
      return { ok: true, restoredImages };
    },
    [flush, schedule],
  );

  const resetToSeed = useCallback(async () => {
    const seeded = createSeedData();
    dataRef.current = seeded;
    setData(seeded);
    schedule(seeded);
    await flush();
  }, [flush, schedule]);

  const getAssetUrl = useCallback((blobKey: string | null): string | null => {
    if (!blobKey) return null;
    return urlCache.get(blobKey) ?? null;
  }, []);

  const resolveAssetUrl = useCallback(async (blobKey: string | null): Promise<string | null> => {
    if (!blobKey) return null;
    const cached = urlCache.get(blobKey);
    if (cached) return cached;
    const blob = await getBlob(blobKey);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(blobKey, url);
    return url;
  }, []);

  // Warm the object-URL cache for every stored image, once per new blob key.
  useEffect(() => {
    if (!data) return;
    let active = true;
    (async () => {
      for (const image of data.images) {
        if (!active) return;
        if (urlCache.has(image.blobKey)) continue;
        const blob = await getBlob(image.blobKey);
        if (blob && active && !urlCache.has(image.blobKey)) {
          urlCache.set(image.blobKey, URL.createObjectURL(blob));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [data]);

  const value = useMemo<StoreValue | null>(() => {
    if (!data) return null;
    return {
      data,
      storage,
      saveState,
      lastSavedAt,
      notice,
      setNotice,
      createRecord,
      updateRecord,
      deleteRecord,
      moveRecord,
      setNotion,
      addImage,
      updateImage,
      archiveImage,
      restoreImage,
      purgeImage,
      saveHeroVersion,
      restoreHeroVersion,
      publishHero,
      unpublishHero,
      deleteHeroVersion,
      exportBackup,
      importBackup,
      resetToSeed,
      getAssetUrl,
      resolveAssetUrl,
    };
  }, [
    data,
    storage,
    saveState,
    lastSavedAt,
    notice,
    createRecord,
    updateRecord,
    deleteRecord,
    moveRecord,
    setNotion,
    addImage,
    updateImage,
    archiveImage,
    restoreImage,
    purgeImage,
    saveHeroVersion,
    restoreHeroVersion,
    publishHero,
    unpublishHero,
    deleteHeroVersion,
    exportBackup,
    importBackup,
    resetToSeed,
    getAssetUrl,
    resolveAssetUrl,
  ]);

  if (!value) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <p className="eyebrow text-brass">CONTROL CENTER</p>
          <p className="mt-4 font-serif text-[1.5rem] text-ink">데이터를 불러오는 중입니다</p>
          <p className="mt-2 font-sans text-[0.75rem] text-muted">브라우저 저장소를 여는 중…</p>
        </div>
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAdminData(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useAdminData must be used inside AdminDataProvider");
  return value;
}

/** Latest known object URL for an image; re-renders once the blob is warmed. */
export function useAssetUrl(blobKey: string | null): string | null {
  const { getAssetUrl, data } = useAdminData();
  const [url, setUrl] = useState<string | null>(() => getAssetUrl(blobKey));

  useEffect(() => {
    if (!blobKey) {
      setUrl(null);
      return;
    }
    const cached = getAssetUrl(blobKey);
    if (cached) {
      setUrl(cached);
      return;
    }
    let active = true;
    (async () => {
      const blob = await getBlob(blobKey);
      if (!active || !blob) return;
      if (!urlCache.has(blobKey)) urlCache.set(blobKey, URL.createObjectURL(blob));
      setUrl(urlCache.get(blobKey) ?? null);
    })();
    return () => {
      active = false;
    };
  }, [blobKey, getAssetUrl, data.images]);

  return url;
}

export const ALL_COLLECTIONS = COLLECTIONS;
