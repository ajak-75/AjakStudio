"use client";

import type { AdminData } from "./types";

/**
 * Local persistence.
 *
 * IndexedDB keeps the document and the original image blobs apart, so a 4 MB
 * photo never sits inside the JSON the editor rewrites on every keystroke.
 * localStorage is the fallback when IndexedDB is unavailable (private modes,
 * very old webviews); the shape of the document is identical.
 */

const DB_NAME = "gdu-control-center";
const DB_VERSION = 1;
const STORE_KV = "kv";
const STORE_BLOBS = "blobs";
const DATA_KEY = "database";
const LS_DATA = "gdu.admin.database";
const LS_BLOB_PREFIX = "gdu.admin.blob.";

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memoryBlobs = new Map<string, Blob>();

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV);
      if (!db.objectStoreNames.contains(STORE_BLOBS)) db.createObjectStore(STORE_BLOBS);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return dbPromise;
}

function tx<T>(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
  run: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(store, mode);
      const request = run(transaction.objectStore(store));
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => resolve(null);
      transaction.onabort = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function readData(): Promise<AdminData | null> {
  const db = await openDatabase();
  if (db) {
    const value = await tx<AdminData>(db, STORE_KV, "readonly", (store) => store.get(DATA_KEY));
    if (value && typeof value === "object" && "schemaVersion" in value) return value;
  }
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LS_DATA);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminData;
        if (parsed && parsed.schemaVersion === 1) return parsed;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export async function writeData(data: AdminData): Promise<boolean> {
  const db = await openDatabase();
  if (db) {
    const stored = await tx<IDBValidKey>(db, STORE_KV, "readwrite", (store) => store.put(data, DATA_KEY));
    if (stored !== null) return true;
  }
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(LS_DATA, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export async function putBlob(key: string, blob: Blob): Promise<boolean> {
  const db = await openDatabase();
  if (db) {
    const stored = await tx<IDBValidKey>(db, STORE_BLOBS, "readwrite", (store) => store.put(blob, key));
    if (stored !== null) return true;
  }
  memoryBlobs.set(key, blob);
  try {
    const dataUrl = await blobToDataUrl(blob);
    window.localStorage.setItem(LS_BLOB_PREFIX + key, dataUrl);
    return true;
  } catch {
    return memoryBlobs.has(key);
  }
}

export async function getBlob(key: string): Promise<Blob | null> {
  const db = await openDatabase();
  if (db) {
    const value = await tx<Blob>(db, STORE_BLOBS, "readonly", (store) => store.get(key));
    if (value instanceof Blob) return value;
  }
  const memory = memoryBlobs.get(key);
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(LS_BLOB_PREFIX + key);
    if (!raw) return null;
    return await dataUrlToBlob(raw);
  } catch {
    return null;
  }
}

export async function deleteBlob(key: string): Promise<void> {
  memoryBlobs.delete(key);
  const db = await openDatabase();
  if (db) await tx<undefined>(db, STORE_BLOBS, "readwrite", (store) => store.delete(key) as IDBRequest<undefined>);
  try {
    window.localStorage.removeItem(LS_BLOB_PREFIX + key);
  } catch {
    /* ignore */
  }
}

export async function clearBlobs(): Promise<void> {
  memoryBlobs.clear();
  const db = await openDatabase();
  if (db) await tx<undefined>(db, STORE_BLOBS, "readwrite", (store) => store.clear() as IDBRequest<undefined>);
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(LS_BLOB_PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const parts = dataUrl.split(",");
  const meta = parts[0] ?? "";
  const base64 = parts[1];
  const mime = /data:([^;]+)/.exec(meta)?.[1] || "application/octet-stream";
  if (!base64) return Promise.reject(new Error("empty data url"));
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return Promise.resolve(new Blob([bytes], { type: mime }));
}

export interface StorageEstimate {
  usedBytes: number;
  quotaBytes: number;
  persisted: boolean;
}

export async function storageEstimate(): Promise<StorageEstimate> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return { usedBytes: 0, quotaBytes: 0, persisted: false };
  }
  try {
    const estimate = await navigator.storage.estimate();
    return {
      usedBytes: estimate.usage ?? 0,
      quotaBytes: estimate.quota ?? 0,
      persisted: typeof navigator.storage.persisted === "function" ? await navigator.storage.persisted() : false,
    };
  } catch {
    return { usedBytes: 0, quotaBytes: 0, persisted: false };
  }
}

export async function requestPersistence(): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.storage?.persist !== "function") return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
