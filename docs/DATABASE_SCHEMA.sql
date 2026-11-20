-- ============================================================================
-- GLOBAL DIGITAL UNIVERSE — Supabase (PostgreSQL) schema
-- Version: 1.0 · 2026-11-20 · phase 2
--
-- Run order is top to bottom in the Supabase SQL editor. The file is
-- idempotent enough to re-run on a fresh project; it never drops data.
--
-- Design rules encoded below:
--   1. Originals are never destroyed. hero_assets / archive_items keep the
--      original file path, checksum and size; a trigger blocks hard deletes.
--   2. Drafts are versions. hero_layouts keeps every saved variation and lets
--      one version be published; restoring a preview clones it into a new
--      version instead of overwriting history.
--   3. The public can read only published / visible rows. Everything else is
--      owner-only through the `admin_users` allow-list.
--   4. No service-role key ever ships to the browser. All access uses the
--      anon key plus these RLS policies.
--
-- 요약 (Korean): 테이블 12개 + admin_users. 공개 읽기는 published/visible 행만
-- 허용하고, 자료실·프롬프트·일정·재무·백업은 관리자만 접근합니다. 이미지 원본은
-- DELETE 트리거가 막고 archived_at으로만 보관하며, 히어로 시안은 (name, version)
-- 으로 쌓이고 이름당 1개만 게시됩니다. 복원은 덮어쓰지 않고 새 버전을 만듭니다.
-- 실행: Supabase SQL Editor에서 파일 전체를 위에서 아래로 1회 실행.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 0. Shared helpers
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Admin allow-list. A Supabase auth user becomes an operator only when a row
-- here marks them active. Seeded manually from the SQL editor (service role).
create table if not exists public.admin_users (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role         text not null default 'editor'
               check (role in ('owner', 'editor', 'viewer')),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.id = auth.uid()
      and au.is_active
  );
$$;

create or replace function public.has_role(required text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.id = auth.uid()
      and au.is_active
      and (au.role = 'owner' or au.role = required)
  );
$$;

-- ----------------------------------------------------------------------------
-- 1. brand_settings — the site's identity, editable without a deploy
-- ----------------------------------------------------------------------------

create table if not exists public.brand_settings (
  id             uuid primary key default gen_random_uuid(),
  brand_name     text not null default 'GLOBAL DIGITAL UNIVERSE',
  short_name     text not null default 'GDU',
  tagline_ko     text,
  tagline_en     text,
  description_ko text,
  description_en text,
  contact_email  text,
  domain         text,
  logo_path      text,
  primary_locale text not null default 'ko' check (primary_locale in ('ko', 'en')),
  social_links   jsonb not null default '{}'::jsonb,
  is_published   boolean not null default false,
  updated_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists trg_brand_settings_updated on public.brand_settings;
create trigger trg_brand_settings_updated
  before update on public.brand_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. apps — the five services (+ any future app)
-- ----------------------------------------------------------------------------

create table if not exists public.apps (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  tagline_ko  text,
  tagline_en  text,
  summary_ko  text,
  summary_en  text,
  category    text not null default 'utility'
              check (category in ('social', 'community', 'game', 'culture', 'utility')),
  platform    text not null default 'web' check (platform in ('web', 'android', 'ios', 'both')),
  status      text not null default 'coming_soon'
              check (status in ('live', 'beta', 'coming_soon', 'archived')),
  url         text,
  repo_url    text,
  icon_path   text,
  launched_on date,
  sort_order  integer not null default 100,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_apps_visible_order on public.apps (is_visible, sort_order);

drop trigger if exists trg_apps_updated on public.apps;
create trigger trg_apps_updated
  before update on public.apps
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. media_channels — the eight external platforms
-- ----------------------------------------------------------------------------

create table if not exists public.media_channels (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  platform     text not null,
  account_name text,
  handle       text,
  url          text,
  region_ko    text,
  region_en    text,
  languages    text[] not null default '{}'::text[],
  field_ko     text,
  field_en     text,
  status       text not null default 'active'
               check (status in ('active', 'preparing', 'paused')),
  notes_ko     text,
  notes_en     text,
  sort_order   integer not null default 100,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_media_channels_order on public.media_channels (is_visible, sort_order);

drop trigger if exists trg_media_channels_updated on public.media_channels;
create trigger trg_media_channels_updated
  before update on public.media_channels
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. hero_assets — uploaded originals, preserved forever
-- ----------------------------------------------------------------------------
-- storage_path points at the ORIGINAL file in the `hero-originals` bucket.
-- Nothing rewrites it: the Editor writes derived crops into `hero-derived`
-- and records them in hero_layouts.snapshot. The original is the fallback that
-- every 시안 can be rebuilt from.

create table if not exists public.hero_assets (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  storage_path    text not null,
  bucket          text not null default 'hero-originals',
  public_url      text,
  mime_type       text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  width           integer check (width is null or width > 0),
  height          integer check (height is null or height > 0),
  byte_size       bigint check (byte_size is null or byte_size > 0),
  checksum_sha256 text,
  alt_ko          text,
  alt_en          text,
  is_original     boolean not null default true,
  archived_at     timestamptz,
  uploaded_by     uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint hero_assets_storage_path_unique unique (bucket, storage_path)
);

create index if not exists idx_hero_assets_live
  on public.hero_assets (created_at desc)
  where archived_at is null;

drop trigger if exists trg_hero_assets_updated on public.hero_assets;
create trigger trg_hero_assets_updated
  before update on public.hero_assets
  for each row execute function public.set_updated_at();

-- Hard delete protection: originals may only be archived (archived_at), never
-- removed, unless an operator explicitly opts in for a single transaction with
--   set local gdu.allow_hard_delete = 'on';
create or replace function public.protect_original_asset()
returns trigger
language plpgsql
as $$
begin
  if current_setting('gdu.allow_hard_delete', true) is distinct from 'on' then
    raise exception
      'GDU: original assets cannot be deleted. Set archived_at instead (or set gdu.allow_hard_delete=on for a deliberate purge).';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_hero_assets_protect on public.hero_assets;
create trigger trg_hero_assets_protect
  before delete on public.hero_assets
  for each row execute function public.protect_original_asset();

-- ----------------------------------------------------------------------------
-- 5. hero_layouts — every saved 시안, with one published version
-- ----------------------------------------------------------------------------
-- snapshot is the complete, versioned scene description (v1.1 · phase 4):
-- {
--   "schema": 1,
--   "pc": {
--     "aspect": "16:9", "ratioW": 16, "ratioH": 9, "background": "#fbfaf7",
--     "layers": [
--       { "id": "layer_…", "assetId": "<hero_assets.id | builtin-hojakdo>",
--         "url": "/hero/hojakdo-clean.webp", "x": 0.755, "y": 0.5,
--         "scale": 0.46, "crop": { "x": 0, "y": 0, "w": 1, "h": 1 },
--         "opacity": 1, "visible": true }
--     ],
--     "text": { "visible": true, "kicker": "…", "headline": "…", "subcopy": "…",
--               "headlineEn": "…", "subcopyEn": "…", "x": 0.055, "y": 0.245,
--               "align": "left", "color": "#14140f", "headlineScale": 0.088,
--               "scrim": 0, "maxWidth": 0.42 }
--   },
--   "mobile": { … same shape, portrait 3:4 … }
-- }
-- Every position and size is 0–1 of the frame, so one snapshot renders on
-- desktop, phone and the published HOME through the same drawHero(). Crops are
-- values only: the original file is never rewritten.

create table if not exists public.hero_layouts (
  id               uuid primary key default gen_random_uuid(),
  name             text not null default 'home-hero',
  version          integer not null default 1 check (version > 0),
  parent_layout_id uuid references public.hero_layouts (id) on delete set null,
  snapshot         jsonb not null default '{}'::jsonb,
  is_published     boolean not null default false,
  published_at     timestamptz,
  note             text,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint hero_layouts_name_version_unique unique (name, version)
);

-- Only one published version per hero name.
create unique index if not exists uq_hero_layouts_published
  on public.hero_layouts (name)
  where is_published;

create index if not exists idx_hero_layouts_history
  on public.hero_layouts (name, version desc);

drop trigger if exists trg_hero_layouts_updated on public.hero_layouts;
create trigger trg_hero_layouts_updated
  before update on public.hero_layouts
  for each row execute function public.set_updated_at();

-- Publishing a version unpublishes the previous one atomically.
create or replace function public.publish_hero_layout(target_id uuid)
returns public.hero_layouts
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.hero_layouts;
begin
  if not public.is_admin() then
    raise exception 'GDU: admin role required';
  end if;

  select * into target from public.hero_layouts where id = target_id for update;
  if not found then
    raise exception 'GDU: layout % not found', target_id;
  end if;

  update public.hero_layouts
     set is_published = false
   where name = target.name
     and id <> target.id
     and is_published;

  update public.hero_layouts
     set is_published = true,
         published_at = now()
   where id = target.id;

  select * into target from public.hero_layouts where id = target_id;
  return target;
end;
$$;

-- "이전 시안 복원" never overwrites: it clones the chosen version as the next
-- version number, leaving history intact.
create or replace function public.restore_hero_layout(source_id uuid)
returns public.hero_layouts
language plpgsql
security definer
set search_path = public
as $$
declare
  source public.hero_layouts;
  next_version integer;
  created public.hero_layouts;
begin
  if not public.is_admin() then
    raise exception 'GDU: admin role required';
  end if;

  select * into source from public.hero_layouts where id = source_id;
  if not found then
    raise exception 'GDU: layout % not found', source_id;
  end if;

  select coalesce(max(version), 0) + 1 into next_version
    from public.hero_layouts
   where name = source.name;

  insert into public.hero_layouts (name, version, parent_layout_id, snapshot, is_published, note, created_by)
  values (
    source.name,
    next_version,
    source.id,
    source.snapshot,
    false,
    format('restored from v%s', source.version),
    auth.uid()
  )
  returning * into created;

  return created;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. projects — the roadmap behind the brand
-- ----------------------------------------------------------------------------

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  summary_ko  text,
  summary_en  text,
  status      text not null default 'idea'
              check (status in ('idea', 'in_progress', 'live', 'paused', 'archived')),
  phase       integer,
  owner       text,
  starts_on   date,
  target_on   date,
  links       jsonb not null default '{}'::jsonb,
  notes       text,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_projects_status on public.projects (status, sort_order);

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. content_items — news, pages, articles per locale
-- ----------------------------------------------------------------------------

create table if not exists public.content_items (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null,
  type           text not null default 'news'
                 check (type in ('news', 'page', 'article', 'note')),
  locale         text not null default 'ko' check (locale in ('ko', 'en')),
  title          text not null,
  excerpt        text,
  body_md        text,
  status         text not null default 'draft'
                 check (status in ('draft', 'review', 'published', 'archived')),
  published_at   timestamptz,
  author         text,
  cover_asset_id uuid references public.hero_assets (id) on delete set null,
  seo            jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint content_items_slug_locale_unique unique (slug, locale)
);

create index if not exists idx_content_items_published
  on public.content_items (type, published_at desc)
  where status = 'published';

drop trigger if exists trg_content_items_updated on public.content_items;
create trigger trg_content_items_updated
  before update on public.content_items
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. archive_items — 이미지 / 영상 / 문서 자료실 (admin only)
-- ----------------------------------------------------------------------------
-- Video policy: files are NOT uploaded to Supabase (1 GB Free limit). Rows keep
-- an external_url (YouTube / Drive) and provider, so the library is searchable
-- without spending storage.

create table if not exists public.archive_items (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null
                    check (kind in ('image', 'video', 'document', 'design', 'prompt', 'other')),
  title             text not null,
  description       text,
  bucket            text,
  storage_path      text,
  external_url      text,
  provider          text not null default 'supabase'
                    check (provider in ('supabase', 'youtube', 'drive', 'github', 'other')),
  mime_type         text,
  byte_size         bigint check (byte_size is null or byte_size >= 0),
  checksum_sha256   text,
  original_filename text,
  tags              text[] not null default '{}'::text[],
  project_id        uuid references public.projects (id) on delete set null,
  is_original       boolean not null default true,
  archived_at       timestamptz,
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint archive_items_location_check check (
    (storage_path is not null) or (external_url is not null)
  )
);

create index if not exists idx_archive_items_kind on public.archive_items (kind, created_at desc);
create index if not exists idx_archive_items_tags on public.archive_items using gin (tags);

drop trigger if exists trg_archive_items_updated on public.archive_items;
create trigger trg_archive_items_updated
  before update on public.archive_items
  for each row execute function public.set_updated_at();

drop trigger if exists trg_archive_items_protect on public.archive_items;
create trigger trg_archive_items_protect
  before delete on public.archive_items
  for each row execute function public.protect_original_asset();

-- ----------------------------------------------------------------------------
-- 9. prompt_vault — AI 프롬프트 보관함
-- ----------------------------------------------------------------------------

create table if not exists public.prompt_vault (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category     text not null default 'general',
  body         text not null,
  model_hint   text,
  language     text not null default 'ko' check (language in ('ko', 'en')),
  tags         text[] not null default '{}'::text[],
  is_favorite  boolean not null default false,
  uses         integer not null default 0 check (uses >= 0),
  last_used_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_prompt_vault_category on public.prompt_vault (category, is_favorite);

drop trigger if exists trg_prompt_vault_updated on public.prompt_vault;
create trigger trg_prompt_vault_updated
  before update on public.prompt_vault
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 10. schedules — 작업 일정
-- ----------------------------------------------------------------------------

create table if not exists public.schedules (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  kind               text not null default 'task'
                     check (kind in ('task', 'publish', 'maintenance', 'release')),
  starts_at          timestamptz not null,
  ends_at            timestamptz,
  all_day            boolean not null default false,
  status             text not null default 'planned'
                     check (status in ('planned', 'done', 'skipped')),
  related_project_id uuid references public.projects (id) on delete set null,
  notes              text,
  reminder_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint schedules_time_check check (ends_at is null or ends_at >= starts_at)
);

create index if not exists idx_schedules_upcoming on public.schedules (status, starts_at);

drop trigger if exists trg_schedules_updated on public.schedules;
create trigger trg_schedules_updated
  before update on public.schedules
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 11. finance_records — 매출 및 비용
-- ----------------------------------------------------------------------------

create table if not exists public.finance_records (
  id           uuid primary key default gen_random_uuid(),
  occurred_on  date not null default current_date,
  direction    text not null check (direction in ('income', 'expense')),
  category     text not null default 'other',
  item         text not null,
  amount_krw   numeric(14, 2) not null check (amount_krw >= 0),
  currency     text not null default 'KRW',
  fx_rate      numeric(12, 6) check (fx_rate is null or fx_rate > 0),
  counterparty text,
  project_id   uuid references public.projects (id) on delete set null,
  note         text,
  receipt_path text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_finance_records_month on public.finance_records (occurred_on desc, direction);

drop trigger if exists trg_finance_records_updated on public.finance_records;
create trigger trg_finance_records_updated
  before update on public.finance_records
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 12. backup_logs — 백업 관리
-- ----------------------------------------------------------------------------

create table if not exists public.backup_logs (
  id           uuid primary key default gen_random_uuid(),
  scope        text not null
               check (scope in ('database', 'storage', 'github', 'notion', 'full')),
  status       text not null default 'success'
               check (status in ('success', 'partial', 'failed')),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  destination  text,
  size_bytes   bigint check (size_bytes is null or size_bytes >= 0),
  checksum     text,
  record_count integer check (record_count is null or record_count >= 0),
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_backup_logs_recent on public.backup_logs (started_at desc);

-- ----------------------------------------------------------------------------
-- 13. Row Level Security
-- ----------------------------------------------------------------------------

alter table public.admin_users      enable row level security;
alter table public.brand_settings   enable row level security;
alter table public.apps             enable row level security;
alter table public.media_channels   enable row level security;
alter table public.hero_assets      enable row level security;
alter table public.hero_layouts     enable row level security;
alter table public.projects         enable row level security;
alter table public.content_items    enable row level security;
alter table public.archive_items    enable row level security;
alter table public.prompt_vault     enable row level security;
alter table public.schedules        enable row level security;
alter table public.finance_records  enable row level security;
alter table public.backup_logs      enable row level security;

-- admin_users: an operator sees the roster; only the owner edits it.
drop policy if exists admin_users_read on public.admin_users;
create policy admin_users_read on public.admin_users
  for select to authenticated
  using (public.is_admin());

drop policy if exists admin_users_owner_write on public.admin_users;
create policy admin_users_owner_write on public.admin_users
  for all to authenticated
  using (public.has_role('owner'))
  with check (public.has_role('owner'));

-- brand_settings
drop policy if exists brand_settings_public_read on public.brand_settings;
create policy brand_settings_public_read on public.brand_settings
  for select to anon, authenticated
  using (is_published);

drop policy if exists brand_settings_admin_all on public.brand_settings;
create policy brand_settings_admin_all on public.brand_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- apps
drop policy if exists apps_public_read on public.apps;
create policy apps_public_read on public.apps
  for select to anon, authenticated
  using (is_visible and status <> 'archived');

drop policy if exists apps_admin_all on public.apps;
create policy apps_admin_all on public.apps
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- media_channels
drop policy if exists media_channels_public_read on public.media_channels;
create policy media_channels_public_read on public.media_channels
  for select to anon, authenticated
  using (is_visible);

drop policy if exists media_channels_admin_all on public.media_channels;
create policy media_channels_admin_all on public.media_channels
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- hero_assets: the public may only read images that are not archived.
drop policy if exists hero_assets_public_read on public.hero_assets;
create policy hero_assets_public_read on public.hero_assets
  for select to anon, authenticated
  using (archived_at is null);

drop policy if exists hero_assets_admin_all on public.hero_assets;
create policy hero_assets_admin_all on public.hero_assets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- hero_layouts: only the published snapshot is public.
drop policy if exists hero_layouts_public_read on public.hero_layouts;
create policy hero_layouts_public_read on public.hero_layouts
  for select to anon, authenticated
  using (is_published);

drop policy if exists hero_layouts_admin_all on public.hero_layouts;
create policy hero_layouts_admin_all on public.hero_layouts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- projects: only live projects are public.
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects
  for select to anon, authenticated
  using (status = 'live');

drop policy if exists projects_admin_all on public.projects;
create policy projects_admin_all on public.projects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- content_items: published only, and only when the publish time has passed.
drop policy if exists content_items_public_read on public.content_items;
create policy content_items_public_read on public.content_items
  for select to anon, authenticated
  using (status = 'published' and (published_at is null or published_at <= now()));

drop policy if exists content_items_admin_all on public.content_items;
create policy content_items_admin_all on public.content_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Private surfaces: no anon policy at all.
drop policy if exists archive_items_admin_all on public.archive_items;
create policy archive_items_admin_all on public.archive_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists prompt_vault_admin_all on public.prompt_vault;
create policy prompt_vault_admin_all on public.prompt_vault
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists schedules_admin_all on public.schedules;
create policy schedules_admin_all on public.schedules
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists finance_records_owner_all on public.finance_records;
create policy finance_records_owner_all on public.finance_records
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists backup_logs_admin_all on public.backup_logs;
create policy backup_logs_admin_all on public.backup_logs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 14. Storage buckets and policies
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('hero-originals', 'hero-originals', true,  5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('hero-derived',   'hero-derived',   true,  5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('brand',          'brand',          true,  2097152,  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('archive',        'archive',        false, 52428800, null)
on conflict (id) do nothing;

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('hero-originals', 'hero-derived', 'brand'));

drop policy if exists storage_archive_admin_read on storage.objects;
create policy storage_archive_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'archive' and public.is_admin());

drop policy if exists storage_admin_insert on storage.objects;
create policy storage_admin_insert on storage.objects
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists storage_admin_update on storage.objects;
create policy storage_admin_update on storage.objects
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No delete policy on storage.objects: a file can only be removed by the
-- service role in a deliberate, logged purge. This is what keeps originals.

-- ----------------------------------------------------------------------------
-- 15. Seed — mirrors src/config/brand.ts so a fresh project renders the site
-- ----------------------------------------------------------------------------

insert into public.brand_settings
  (brand_name, short_name, tagline_ko, tagline_en, description_ko, description_en, primary_locale, is_published)
values
  ('GLOBAL DIGITAL UNIVERSE', 'GDU',
   '글로벌 디지털 사업의 새로운 본부',
   'The new headquarters for a global digital business',
   '앱, 게임, K-컬처, 미디어 채널을 하나로 잇는 글로벌 디지털 사업 플랫폼.',
   'One platform connecting apps, games, K-culture and media channels across the world.',
   'ko', true)
on conflict do nothing;

insert into public.apps
  (slug, name, tagline_ko, tagline_en, summary_ko, summary_en, category, platform, status, url, repo_url, launched_on, sort_order)
values
  ('ajak', 'Ajak', '한국형 소셜, 아작', 'A Korean social feed, Ajak',
   '사진과 글로 가볍게 이어지는 소셜 피드. 기기 언어를 자동으로 감지해 15개 언어로 열립니다.',
   'A light social feed for photos and words, in fifteen languages.',
   'social', 'web', 'live', 'https://ajak-75.github.io/diary/', 'https://github.com/ajak-75/diary', '2026-11-18', 10),
  ('komi-diary', 'KOMI-Diary', '코미의 K-컬처 다이어리', 'KOMI''s K-culture diary',
   '세계의 팬이 모이는 K-컬처 커뮤니티. 케미, 실시간 번역, 단청 스티커, 모모 샵까지 한 앱에 담았습니다.',
   'A K-culture community for a worldwide fandom.',
   'community', 'web', 'live', 'https://ajak-75.github.io/KOMI-Diary/', 'https://github.com/ajak-75/KOMI-Diary', '2026-11-16', 20),
  ('komi-momo-pop', 'KOMI & MOMO POP', '코미와 모모의 합치기 퍼즐', 'A merge puzzle with KOMI and MOMO',
   '3D 캐릭터를 합쳐 점수를 쌓는 캐주얼 퍼즐.',
   'A casual merge puzzle: drop, combine and grow.',
   'game', 'web', 'live', 'https://ajak-75.github.io/komi-pop/', 'https://github.com/ajak-75/ajak-75.github.io', '2026-11-18', 30),
  ('k-sajoo', 'K-Sajoo', '글로벌 사주 리딩', 'Korean saju, read globally',
   '실제 만세력 계산으로 사주와 궁합을 풀어내는 글로벌 리딩 앱.',
   'A global saju reading app built on real astronomical calendars.',
   'culture', 'web', 'live', 'https://ajak-75.github.io/k-sajoo/', 'https://github.com/ajak-75/ajak-75.github.io', '2026-11-19', 40),
  ('abi', 'ABI', '안드로이드 AI 비서', 'An Android AI assistant',
   '대화·기억·작업 기록을 기기 안 SQLite에 두는 독립형 AI 에이전트. 1단계 APK.',
   'A standalone AI agent keeping its memory on the device.',
   'utility', 'android', 'beta', 'https://github.com/ajak-75/ABI-ai-agent', 'https://github.com/ajak-75/ABI-ai-agent', '2026-11-20', 50)
on conflict (slug) do nothing;

insert into public.media_channels
  (slug, platform, account_name, handle, url, region_ko, region_en, languages, field_ko, field_en, status, sort_order)
values
  ('naver-blog', 'NAVER BLOG', '단짠살림', 'songja75', 'https://blog.naver.com/songja75', '대한민국', 'Korea', array['ko'], '살림 · 절약', 'Home & saving', 'active', 10),
  ('naver-cafe', 'NAVER CAFE', '단짠살림', 'danjjansallim', 'https://cafe.naver.com/danjjansallim', '대한민국', 'Korea', array['ko'], '커뮤니티', 'Community', 'active', 20),
  ('instagram', 'INSTAGRAM', 'KOMI''s Unnie', '@ajakstudio.lab', 'https://www.instagram.com/ajakstudio.lab/', '글로벌', 'Global', array['ko','en','th','ja','ar','tl','vi'], 'K-라이프', 'K-life', 'active', 30),
  ('threads', 'THREADS', '단짠살림 · KOMI''s Unnie', '@ajakstudio.lab', 'https://www.threads.net/@ajakstudio.lab', '대한민국', 'Korea', array['ko'], '일상 · 바이럴', 'Daily life', 'active', 40),
  ('tiktok', 'TIKTOK', 'AjakStudio', '@komi_0520', 'https://www.tiktok.com/@komi_0520', '글로벌', 'Global', array['en','th'], '숏폼', 'Short video', 'active', 50),
  ('youtube', 'YOUTUBE', 'AjakStudioKFN', '@K-컬처박스75', 'https://www.youtube.com/@K-컬처박스75', '글로벌', 'Global', array['ko','en'], '쇼츠 · K-컬처', 'Shorts · K-culture', 'active', 60),
  ('xiaohongshu', 'XIAOHONGSHU', 'komi_88', 'komi_88', 'https://xhslink.cn/o/4MnsV7lTcNU', '중국', 'China', array['zh'], 'K-라이프', 'K-life', 'active', 70),
  ('showcase', 'SHOWCASE', 'Ajak Studio', 'ajak-75.github.io', 'https://ajak-75.github.io/', '글로벌', 'Global', array['ko','en'], '앱 쇼케이스', 'App showcase', 'active', 80)
on conflict (slug) do nothing;

insert into public.projects (slug, title, summary_ko, summary_en, status, phase, sort_order)
values
  ('global-digital-universe', 'GLOBAL DIGITAL UNIVERSE',
   '다섯 앱과 여덟 채널을 잇는 공식 사이트와 비공개 관리자 시스템.',
   'The official site and private control centre connecting five apps and eight channels.',
   'in_progress', 2, 10)
on conflict (slug) do nothing;

insert into public.content_items (slug, type, locale, title, excerpt, status, published_at, author)
values
  ('site-build-01', 'news', 'ko',
   'GLOBAL DIGITAL UNIVERSE, 공식 사이트 구축을 시작합니다',
   '다섯 개 앱과 여덟 개 채널을 하나로 잇는 공식 사이트의 설계와 기반 공사를 시작했습니다.',
   'published', '2026-11-20T00:00:00+09:00', 'GDU Studio')
on conflict (slug, locale) do nothing;

-- Bootstrap the first operator (replace the UUID with the auth user's id):
--   insert into public.admin_users (id, display_name, role)
--   values ('00000000-0000-0000-0000-000000000000', 'Owner', 'owner');
--
-- Verify RLS from the anon role:
--   set role anon;
--   select count(*) from public.apps;            -- 5
--   select count(*) from public.finance_records; -- permission denied
--   reset role;
