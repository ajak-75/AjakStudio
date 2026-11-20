/**
 * CONTROL CENTER — data model.
 *
 * Everything the private admin edits lives in one `AdminData` document. It is
 * stored locally (IndexedDB, see `db.ts`) while Supabase is not connected, and
 * the same shape is what an export/import backup carries. Keeping one document
 * instead of fifteen ad-hoc stores is what makes the backup menu honest: one
 * JSON file is the whole database.
 */

export type Locale = "ko" | "en";
export type Bi = Record<Locale, string>;

export const bi = (ko: string, en: string): Bi => ({ ko, en });

export interface RecordBase {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------------- */
/* Catalogue                                                                  */
/* ------------------------------------------------------------------------- */

export type AppStatus = "live" | "beta" | "coming_soon" | "archived";
export type AppCategory = "social" | "community" | "game" | "culture" | "utility";
export type AppPlatform = "web" | "android" | "ios" | "both";

export interface AppRecord extends RecordBase {
  name: string;
  slug: string;
  tagline: Bi;
  summary: Bi;
  category: AppCategory;
  platform: AppPlatform;
  status: AppStatus;
  url: string | null;
  repo: string | null;
  year: string;
  sort: number;
  visible: boolean;
}

export type ChannelStatus = "active" | "preparing" | "paused";

export interface ChannelRecord extends RecordBase {
  platform: string;
  account: string;
  handle: string;
  url: string | null;
  region: Bi;
  languages: string[];
  field: Bi;
  status: ChannelStatus;
  verified: boolean;
  note: Bi;
  sort: number;
}

/* ------------------------------------------------------------------------- */
/* Content                                                                    */
/* ------------------------------------------------------------------------- */

export type ContentType = "copy" | "news" | "note";
export type ContentStatus = "draft" | "review" | "published" | "archived";
export type ContentSlot = "HOME" | "ABOUT" | "APPS" | "GAMES" | "K-CULTURE" | "MEDIA" | "NEWS" | "CONTACT";

export interface ContentRecord extends RecordBase {
  slot: ContentSlot;
  key: string;
  type: ContentType;
  title: Bi;
  body: Bi;
  status: ContentStatus;
  date: string;
  sort: number;
}

/* ------------------------------------------------------------------------- */
/* Archive                                                                    */
/* ------------------------------------------------------------------------- */

export type AssetKind = "jpeg" | "png" | "webp";

/** An uploaded image. The original bytes live in the `blobs` store, untouched. */
export interface ImageRecord extends RecordBase {
  title: string;
  alt: Bi;
  blobKey: string;
  mime: string;
  byteSize: number;
  width: number;
  height: number;
  /** Set when the image was archived; the row and its bytes are kept. */
  archivedAt: string | null;
  /** Public URL after a Supabase Storage upload, when connected. */
  publicUrl: string | null;
  tags: string[];
  source: "library" | "hero";
}

export type VideoProvider = "youtube" | "drive" | "vimeo" | "other";
export type VideoStatus = "published" | "draft" | "private";

export interface VideoRecord extends RecordBase {
  title: string;
  provider: VideoProvider;
  url: string;
  durationMin: number;
  sizeMb: number;
  status: VideoStatus;
  note: string;
}

export type DocKind = "plan" | "contract" | "guide" | "invoice" | "other";

export interface DocRecord extends RecordBase {
  title: string;
  kind: DocKind;
  url: string;
  memo: string;
  date: string;
}

export interface PromptRecord extends RecordBase {
  title: string;
  category: string;
  body: string;
  tags: string[];
  favorite: boolean;
  uses: number;
}

/* ------------------------------------------------------------------------- */
/* Work                                                                       */
/* ------------------------------------------------------------------------- */

export type ProjectStatus = "idea" | "in_progress" | "live" | "paused" | "archived";

export interface ProjectRecord extends RecordBase {
  title: string;
  goal: string;
  status: ProjectStatus;
  phase: number;
  owner: string;
  start: string;
  target: string;
  link: string;
  note: string;
  sort: number;
}

export type TaskStatus = "planned" | "doing" | "done" | "skipped";
export type TaskPriority = "high" | "normal" | "low";

export interface TaskRecord extends RecordBase {
  title: string;
  due: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  note: string;
}

/* ------------------------------------------------------------------------- */
/* Infrastructure                                                             */
/* ------------------------------------------------------------------------- */

export interface RepoRecord extends RecordBase {
  name: string;
  url: string;
  role: string;
  visibility: "public" | "private";
  branch: string;
  note: string;
}

export interface NotionDatabase {
  id: string;
  name: string;
  purpose: string;
  url: string;
}

export interface NotionInfo {
  workspace: string;
  url: string;
  connected: boolean;
  note: string;
  databases: NotionDatabase[];
}

/* ------------------------------------------------------------------------- */
/* Finance                                                                    */
/* ------------------------------------------------------------------------- */

export type FinanceDirection = "income" | "expense";

export interface FinanceRecord extends RecordBase {
  date: string;
  direction: FinanceDirection;
  category: string;
  item: string;
  amount: number;
  currency: "KRW" | "USD";
  note: string;
}

export interface BackupEntry {
  id: string;
  at: string;
  kind: "export" | "import";
  records: number;
  bytes: number;
  checksum: string;
  note: string;
}

/* ------------------------------------------------------------------------- */
/* Hero Studio                                                                */
/* ------------------------------------------------------------------------- */

export type HeroAspect = "16:9" | "4:3" | "1:1" | "free";
export type HeroAlign = "left" | "center" | "right";

export interface HeroCrop {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HeroLayer {
  id: string;
  assetId: string;
  /** Public URL from Supabase Storage; local preview uses the stored blob instead. */
  url: string | null;
  /** Layer centre, 0–1 of the frame. */
  x: number;
  y: number;
  /** 1 = the crop fills the frame. */
  scale: number;
  crop: HeroCrop;
  opacity: number;
  visible: boolean;
}

export interface HeroText {
  visible: boolean;
  kicker: string;
  headline: string;
  subcopy: string;
  /** Optional English copy; the Korean fields stay the source of truth. */
  kickerEn?: string;
  headlineEn?: string;
  subcopyEn?: string;
  /** Max text width as a fraction of the frame width (0.2–0.95). */
  maxWidth?: number;
  /** Anchor, 0–1 of the frame. */
  x: number;
  y: number;
  align: HeroAlign;
  color: string;
  /** Headline size as a fraction of the frame height. */
  headlineScale: number;
  /** Dark wash over the images, 0–1. */
  scrim: number;
}

export interface HeroFrame {
  aspect: HeroAspect;
  ratioW: number;
  ratioH: number;
  background: string;
  layers: HeroLayer[];
  text: HeroText;
}

export interface HeroSnapshot {
  schema: 1;
  pc: HeroFrame;
  mobile: HeroFrame;
}

export interface HeroLayout extends RecordBase {
  name: string;
  version: number;
  snapshot: HeroSnapshot;
  published: boolean;
  publishedAt: string | null;
  note: string;
}

/* ------------------------------------------------------------------------- */
/* Root document                                                              */
/* ------------------------------------------------------------------------- */

export interface AdminData {
  schemaVersion: 1;
  updatedAt: string;
  apps: AppRecord[];
  channels: ChannelRecord[];
  contents: ContentRecord[];
  images: ImageRecord[];
  videos: VideoRecord[];
  docs: DocRecord[];
  prompts: PromptRecord[];
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  repos: RepoRecord[];
  notion: NotionInfo;
  finance: FinanceRecord[];
  heroLayouts: HeroLayout[];
  backups: BackupEntry[];
}

/** Collections the generic table editor can drive. */
export const COLLECTIONS = [
  "apps",
  "channels",
  "contents",
  "images",
  "videos",
  "docs",
  "prompts",
  "projects",
  "tasks",
  "repos",
  "finance",
] as const;

export type CollectionKey = (typeof COLLECTIONS)[number];

export type Row = { id: string } & { [key: string]: unknown };

/* ------------------------------------------------------------------------- */
/* Field descriptors — every table, form and editor is generated from these    */
/* ------------------------------------------------------------------------- */

export type FieldKind =
  | "text"
  | "bi"
  | "textarea"
  | "biTextarea"
  | "number"
  | "select"
  | "url"
  | "date"
  | "tags"
  | "boolean"
  | "color";

export interface FieldOption {
  value: string;
  label: Bi;
}

export interface FieldDef {
  key: string;
  kind: FieldKind;
  label: Bi;
  options?: FieldOption[];
  /** Build the option list from another collection (e.g. a task's project). */
  optionsFrom?: CollectionKey;
  /** Field of the referenced row used as the option label. */
  optionLabel?: string;
  hint?: Bi;
  required?: boolean;
  /** Shown as a column in the list table. */
  list?: boolean;
  placeholder?: Bi;
  min?: number;
  max?: number;
  step?: number;
}

export interface EntityDef {
  key: CollectionKey;
  title: Bi;
  eyebrow: string;
  description: Bi;
  primary: string;
  fields: FieldDef[];
  searchKeys: string[];
}

/* ------------------------------------------------------------------------- */
/* Small coercion helpers for generic rows                                     */
/* ------------------------------------------------------------------------- */

export function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

export function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function asBool(value: unknown): boolean {
  return value === true || value === "true";
}

export function asTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((tag): tag is string => typeof tag === "string");
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

export function asBi(value: unknown): Bi {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return { ko: asString(record.ko), en: asString(record.en) };
  }
  const text = asString(value);
  return { ko: text, en: text };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${random.slice(0, 18)}`;
}
