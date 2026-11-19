/**
 * Typed Supabase schema. Mirrors docs/DATABASE_SCHEMA.sql (v1.0).
 * Regenerate with `supabase gen types typescript` once the project exists;
 * until then this file keeps every query type-safe.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AdminRole = "owner" | "editor" | "viewer";

export type AdminUserRow = {
  id: string;
  display_name: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
};

export type BrandSettingRow = {
  id: string;
  brand_name: string;
  short_name: string;
  tagline_ko: string | null;
  tagline_en: string | null;
  description_ko: string | null;
  description_en: string | null;
  contact_email: string | null;
  domain: string | null;
  logo_path: string | null;
  primary_locale: "ko" | "en";
  social_links: Json;
  is_published: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AppRow = {
  id: string;
  slug: string;
  name: string;
  tagline_ko: string | null;
  tagline_en: string | null;
  summary_ko: string | null;
  summary_en: string | null;
  category: "social" | "community" | "game" | "culture" | "utility";
  platform: "web" | "android" | "ios" | "both";
  status: "live" | "beta" | "coming_soon" | "archived";
  url: string | null;
  repo_url: string | null;
  icon_path: string | null;
  launched_on: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type MediaChannelRow = {
  id: string;
  slug: string;
  platform: string;
  account_name: string | null;
  handle: string | null;
  url: string | null;
  region_ko: string | null;
  region_en: string | null;
  languages: string[];
  field_ko: string | null;
  field_en: string | null;
  status: "active" | "preparing" | "paused";
  notes_ko: string | null;
  notes_en: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type HeroAssetRow = {
  id: string;
  title: string;
  storage_path: string;
  bucket: string;
  public_url: string | null;
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  width: number | null;
  height: number | null;
  byte_size: number | null;
  checksum_sha256: string | null;
  alt_ko: string | null;
  alt_en: string | null;
  is_original: boolean;
  archived_at: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type HeroLayoutRow = {
  id: string;
  name: string;
  version: number;
  parent_layout_id: string | null;
  snapshot: Json;
  is_published: boolean;
  published_at: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary_ko: string | null;
  summary_en: string | null;
  status: "idea" | "in_progress" | "live" | "paused" | "archived";
  phase: number | null;
  owner: string | null;
  starts_on: string | null;
  target_on: string | null;
  links: Json;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ContentItemRow = {
  id: string;
  slug: string;
  type: "news" | "page" | "article" | "note";
  locale: "ko" | "en";
  title: string;
  excerpt: string | null;
  body_md: string | null;
  status: "draft" | "review" | "published" | "archived";
  published_at: string | null;
  author: string | null;
  cover_asset_id: string | null;
  seo: Json;
  created_at: string;
  updated_at: string;
};

export type ArchiveItemRow = {
  id: string;
  kind: "image" | "video" | "document" | "design" | "prompt" | "other";
  title: string;
  description: string | null;
  bucket: string | null;
  storage_path: string | null;
  external_url: string | null;
  provider: "supabase" | "youtube" | "drive" | "github" | "other";
  mime_type: string | null;
  byte_size: number | null;
  checksum_sha256: string | null;
  original_filename: string | null;
  tags: string[];
  project_id: string | null;
  is_original: boolean;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PromptVaultRow = {
  id: string;
  title: string;
  category: string;
  body: string;
  model_hint: string | null;
  language: "ko" | "en";
  tags: string[];
  is_favorite: boolean;
  uses: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleRow = {
  id: string;
  title: string;
  kind: "task" | "publish" | "maintenance" | "release";
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  status: "planned" | "done" | "skipped";
  related_project_id: string | null;
  notes: string | null;
  reminder_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FinanceRecordRow = {
  id: string;
  occurred_on: string;
  direction: "income" | "expense";
  category: string;
  item: string;
  amount_krw: number;
  currency: string;
  fx_rate: number | null;
  counterparty: string | null;
  project_id: string | null;
  note: string | null;
  receipt_path: string | null;
  created_at: string;
  updated_at: string;
};

export type BackupLogRow = {
  id: string;
  scope: "database" | "storage" | "github" | "notion" | "full";
  status: "success" | "partial" | "failed";
  started_at: string;
  finished_at: string | null;
  destination: string | null;
  size_bytes: number | null;
  checksum: string | null;
  record_count: number | null;
  notes: string | null;
  created_at: string;
};

type TableDefinition<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      admin_users: TableDefinition<AdminUserRow>;
      brand_settings: TableDefinition<BrandSettingRow>;
      apps: TableDefinition<AppRow>;
      media_channels: TableDefinition<MediaChannelRow>;
      hero_assets: TableDefinition<HeroAssetRow>;
      hero_layouts: TableDefinition<HeroLayoutRow>;
      projects: TableDefinition<ProjectRow>;
      content_items: TableDefinition<ContentItemRow>;
      archive_items: TableDefinition<ArchiveItemRow>;
      prompt_vault: TableDefinition<PromptVaultRow>;
      schedules: TableDefinition<ScheduleRow>;
      finance_records: TableDefinition<FinanceRecordRow>;
      backup_logs: TableDefinition<BackupLogRow>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      has_role: { Args: { required: string }; Returns: boolean };
      publish_hero_layout: { Args: { target_id: string }; Returns: HeroLayoutRow };
      restore_hero_layout: { Args: { source_id: string }; Returns: HeroLayoutRow };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type PublicSchema = Database["public"];
export type TableName = keyof PublicSchema["Tables"];
