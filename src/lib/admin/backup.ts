import type { AdminData } from "./types";
import { COLLECTIONS } from "./types";

/**
 * Backup format.
 *
 * One JSON document is the whole Control Center: collections, the Notion
 * record, hero layouts and — optionally — the original image bytes as data
 * URLs. Import validates the envelope before touching anything, and the store
 * keeps the previous state so a bad file cannot silently wipe the database.
 */

export const BACKUP_FORMAT = "global-digital-universe.control-center";
export const BACKUP_VERSION = 1;

export interface ExportedImage {
  id: string;
  dataUrl: string;
}

export interface BackupPayload {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  app: "global-digital-universe";
  counts: Record<string, number>;
  data: AdminData;
  images?: ExportedImage[];
}

export interface BackupSummary {
  counts: Record<string, number>;
  total: number;
  heroVersions: number;
  publishedHero: boolean;
  images: number;
  /** True when the file carries image bytes. */
  withImages: boolean;
}

/** FNV-1a 32-bit. Fast, dependency-free, and good enough to spot a truncated file. */
export function hashString(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function countRecords(data: AdminData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of COLLECTIONS) {
    const value = data[key];
    counts[key] = Array.isArray(value) ? value.length : 0;
  }
  counts.heroLayouts = data.heroLayouts.length;
  counts.backups = data.backups.length;
  return counts;
}

export function totalRecords(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

export function summarizeBackup(payload: BackupPayload): BackupSummary {
  const counts = payload.counts ?? countRecords(payload.data);
  return {
    counts,
    total: totalRecords(counts),
    heroVersions: payload.data?.heroLayouts?.length ?? 0,
    publishedHero: Boolean(payload.data?.heroLayouts?.some((layout) => layout.published)),
    images: payload.images?.length ?? payload.data?.images?.length ?? 0,
    withImages: Boolean(payload.images && payload.images.length > 0),
  };
}

export function serializeBackup(data: AdminData, images?: ExportedImage[]): string {
  const payload: BackupPayload = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: "global-digital-universe",
    counts: countRecords(data),
    data,
    ...(images && images.length ? { images } : {}),
  };
  return JSON.stringify(payload, null, 2);
}

export interface ParseResult {
  ok: boolean;
  error?: string;
  payload?: BackupPayload;
  summary?: BackupSummary;
}

/** Shape checks only — nothing is applied until the store accepts it. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON을 읽을 수 없습니다. 파일이 손상되었거나 JSON이 아닙니다." };
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "최상위가 객체가 아닙니다." };
  }

  const payload = raw as Partial<BackupPayload>;
  if (payload.format !== BACKUP_FORMAT) {
    return { ok: false, error: "이 프로젝트의 백업 파일이 아닙니다 (format 불일치)." };
  }
  if (typeof payload.version !== "number" || payload.version > BACKUP_VERSION) {
    return { ok: false, error: `지원하지 않는 백업 버전입니다 (v${String(payload.version)}).` };
  }
  const data = payload.data;
  if (!data || typeof data !== "object") {
    return { ok: false, error: "data 블록이 없습니다." };
  }
  if (data.schemaVersion !== 1) {
    return { ok: false, error: "data.schemaVersion이 1이 아닙니다." };
  }

  const missing = COLLECTIONS.filter((key) => !Array.isArray(data[key]));
  if (missing.length) {
    return { ok: false, error: `누락된 컬렉션: ${missing.join(", ")}` };
  }
  if (!Array.isArray(data.heroLayouts)) {
    return { ok: false, error: "heroLayouts가 없습니다." };
  }
  if (!data.notion || typeof data.notion !== "object" || !Array.isArray((data.notion as { databases?: unknown }).databases)) {
    return { ok: false, error: "notion 블록이 없거나 형식이 다릅니다." };
  }

  if (payload.images) {
    if (!Array.isArray(payload.images)) return { ok: false, error: "images가 배열이 아닙니다." };
    const broken = payload.images.find(
      (image) => !image || typeof image.id !== "string" || typeof image.dataUrl !== "string",
    );
    if (broken) return { ok: false, error: "이미지 항목 형식이 올바르지 않습니다." };
  }

  const complete = payload as BackupPayload;
  return { ok: true, payload: complete, summary: summarizeBackup(complete) };
}

/** File-name friendly stamp: 2026-11-20-0855. */
export function backupFileStamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  const shown = value >= 10 || exponent === 0 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, "");
  return `${shown} ${units[exponent]}`;
}
