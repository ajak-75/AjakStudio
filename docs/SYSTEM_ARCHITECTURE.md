# SYSTEM ARCHITECTURE — GLOBAL DIGITAL UNIVERSE

Version 1.0 · 2026-11-20 · phase 2 deliverable
Companion documents: [DATABASE_SCHEMA.sql](./DATABASE_SCHEMA.sql) · [BRAND_DESIGN_SYSTEM.md](./BRAND_DESIGN_SYSTEM.md) · [FREE_INFRA_AND_LIMITS.md](./FREE_INFRA_AND_LIMITS.md)

> **요약 (Korean summary)**
> 공개 홈페이지(8개 메뉴, ko/en)는 Cloudflare Pages에 정적 파일로 배포되고, 비공개 Control Center(15개 메뉴)와 Hero Studio는 Supabase Free의 Postgres·Storage·Auth 위에서 동작합니다. 서버 런타임이 없으므로 브라우저는 anon 키와 RLS로만 데이터에 접근하고, service_role 키는 어디에도 두지 않습니다. Supabase가 멈추거나 키가 없어도 공개 페이지는 `src/config/brand.ts` 시드로 그대로 보이며, 히어로만 기본 에디토리얼 화면으로 대체됩니다. 이미지 원본은 삭제 불가(트리거)로 보존하고, 히어로 시안은 저장할 때마다 새 버전으로 쌓여 언제든 복원됩니다. 영상은 업로드하지 않고 유튜브·드라이브 링크로만 보관합니다.

---

## 1. Purpose and constraints

A single platform that does two jobs:

1. **Speak for the brand in public.** One official home for five independent apps, three games, K-culture content and eight media channels, in Korean and English, at a quality level that does not read as a template.
2. **Give the operator control without code.** A private Control Center with fifteen working menus, a Hero Studio that composes the home hero from uploaded images, and a database that never loses an original.

Non-negotiable constraints inherited from the brief:

| Constraint | Architectural consequence |
| --- | --- |
| ₩0 initial budget | Cloudflare Pages Free (static) + Supabase Free. No server runtime, no paid image/AI API, no paid fonts (open-source webfonts self-hosted at build). |
| Existing apps untouched | This project only *links* to `Ajak`, `KOMI-Diary`, `KOMI & MOMO POP`, `K-Sajoo`, `ABI`. No shared code, no shared database, no writes into their repositories. |
| Brand must not be bound to one character | Brand identity, menus and copy live in `brand_settings` + dictionaries, not in components. KOMI/MOMO are content, not the architecture. |
| No secrets in code | Browser-only Supabase access with the **anon key**; Row Level Security is the authority. A service-role key does not exist anywhere in this repository. |
| Works even when the database is unreachable | Every public surface renders from typed seeds in `src/config/brand.ts`; Supabase is an enhancement layer, never a hard dependency for the page to appear. |

---

## 2. System map

```
                         ┌──────────────────────────────────────────────┐
   Visitor (mobile / PC) │  Cloudflare Pages  (static export, free)      │
                         │  • /ko/…  /en/…  prerendered HTML + CSS       │
                         │  • 20,000 files · 25 MiB/file · ∞ requests    │
                         └───────────────┬──────────────────────────────┘
                                         │ HTTPS (anon key only)
                                         ▼
                 ┌────────────────────────────────────────────────────┐
                 │  Supabase Free                                      │
                 │  • Postgres 500 MB  (12 domain tables + admin)      │
                 │  • Storage 1 GB     (hero originals, archive)       │
                 │  • Auth 50k MAU     (magic link / email OTP)        │
                 │  • RLS on every table                               │
                 └───────────────┬────────────────────────────────────┘
                                 │
   Operator (owner) ─────────────┘
        │  Supabase session + admin_users allow-list
        ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  /control-center/  (private, client-rendered, no index)       │
   │  15 menus · Hero Studio · 자료실 · 재무 · 백업                 │
   └──────────────────────────────────────────────────────────────┘

   GitHub `ajak-75/AjakStudio`  ──push──▶  Cloudflare Pages build
   (source of truth for code)                `npm ci && npm run build` → out/

   Video is never uploaded: YouTube / Drive links live in archive_items.external_url.
```

### Runtime responsibilities

| Layer | Owns | Does **not** own |
| --- | --- | --- |
| Cloudflare Pages | HTML, CSS, JS, fonts, favicon, static assets | Business data, sessions |
| Supabase Postgres | Brand settings, apps, channels, layouts, content, archive metadata, prompts, schedules, finance, backups | Rendering, layout composition |
| Supabase Storage | Original uploads (`hero-originals`), derived crops (`hero-derived`), brand assets, private archive | Public pages |
| Browser (Hero Studio) | Canvas composition, crop math, preview, snapshot JSON | The published truth (that lives in DB) |
| GitHub | Code history, review, rollback | Runtime data |

---

## 3. Public surface

### 3.1 Routes

| Route (per locale) | Menu | Rendering | Content source | Status in phase 2 |
| --- | --- | --- | --- | --- |
| `/` → `/ko/` | — | static meta refresh | — | done |
| `/{locale}/` | HOME | SSG | seeds → `apps`, `media_channels`, `content_items`, published `hero_layouts` | **hero + 6 sections drafted** |
| `/{locale}/about/` | ABOUT | SSG | `brand_settings` + dictionary | drafted with real copy |
| `/{locale}/apps/` | OUR APPS | SSG | `apps` | full list, 5 live |
| `/{locale}/games/` | GAMES | SSG | `apps` where category = game | 1 live + 2 in production |
| `/{locale}/k-culture/` | K-CULTURE | SSG | `content_items`, `projects` | three pillars drafted |
| `/{locale}/media/` | MEDIA | SSG | `media_channels` | 8 channels, notes on unverified handles |
| `/{locale}/news/` | NEWS | SSG | `content_items` where type = news | 1 published note |
| `/{locale}/contact/` | CONTACT | SSG | `brand_settings`, `media_channels` | channels + "email 준비 중" honest state |

`trailingSlash: true` means every route exports as `…/index.html`, so Cloudflare Pages serves it without rewrite rules.

### 3.2 Rendering model (static first, data second)

```
build time                     request time
──────────                     ────────────
brand.ts seeds  ──┐
                  ├─▶ prerendered HTML (always available)
Supabase rows   ──┘            hero snapshot JSON ─▶ client hydrate
   (optional)                   (published layout only)
```

- **Structure, copy, app list, channel list** are baked at build. A missing Supabase project changes nothing visible.
- **The hero scene** is the one thing the operator will change often. It is fetched at runtime from `hero_layouts` (published row) and composed in the browser; if the fetch fails or returns nothing, the static editorial hero renders instead. This keeps "히어로 교체" a 30-second action instead of a rebuild.
- Everything else that changes rarely goes through a Cloudflare **Deploy Hook** (free) triggered from the Control Center's "게시" action in phase 5 — one rebuild consumes one of 500 monthly builds.

### 3.3 Page composition rules

| Section | Grid | Rule |
| --- | --- | --- |
| Header | 12-col, sticky, 68 px | wordmark left, 8 menus centre-right, locale switch right |
| Hero | 7 / 4 (start 9) | display serif left, service index right, facts strip full width |
| Statement | 3 / 8 (start 5) | one paragraph of display serif, no card |
| Services | 6 / 3 / 2 / 1 | list rows, hairline separators, no boxes |
| Games | 6 / 5 (start 8) | one live game large, two pipeline items as a list |
| Media | 2 columns of list rows | platform, handle, region, arrow |
| News | 3 / 8 | date rail + title + excerpt |
| Contact | 7 / 4 | display serif + single underlined link |
| Footer | 4 / 3 / 3 / 2 | porcelain band, sitemap and channel index |

No section repeats the previous section's background: paper → porcelain → paper → porcelain. This is the only rhythm device used; there is no gradient, shadow or glass anywhere.

---

## 4. Private surface — CONTROL CENTER (15 menus)

Entry: `/{locale}/control-center/` (no public navigation, `noindex`, no sitemap entry).
Gate: Supabase session **and** an active row in `admin_users`. Both are enforced by RLS, not by the UI.

| # | Menu | Backing tables | Core actions | Phase |
| --- | --- | --- | --- | --- |
| 1 | 전체 사업 현황 | aggregate views over all tables | 5 apps / 8 channels / published hero / next schedule / monthly finance delta | 4 |
| 2 | 앱 5개 관리 | `apps` | add/edit app, set status (live/beta/coming soon), sort, hide, open URL | 4 |
| 3 | SNS 8개 채널 관리 | `media_channels` | add platform (any new platform), handle/URL, region, languages, status, notes | 4 |
| 4 | Hero Studio | `hero_assets`, `hero_layouts` | upload, compose, preview PC/mobile, save draft, publish, restore | 4 |
| 5 | 콘텐츠 관리 | `content_items` | news/pages per locale, draft → review → publish, schedule publish time | 4 |
| 6 | 이미지 자료실 | `archive_items` (kind=image), Storage | upload originals, tags, project link, thumbnail grid | 4 |
| 7 | 영상 자료실 | `archive_items` (kind=video, external_url) | register YouTube/Drive link, never upload the file | 4 |
| 8 | 문서 자료실 | `archive_items` (kind=document) | PDF/docx upload ≤ 50 MB, download, version note | 4 |
| 9 | AI 프롬프트 보관함 | `prompt_vault` | categories, tags, favourite, copy, usage counter | 4 |
| 10 | 프로젝트 관리 | `projects` | status, phase, dates, links, notes (roadmap behind the brand) | 4 |
| 11 | 작업 일정 | `schedules` | month view, milestones, reminder timestamp | 4 |
| 12 | GitHub 저장소 정보 | `projects.links`, static list | repo per app, last commit (read-only link out) | 4 |
| 13 | Notion 연결 정보 | `brand_settings.social_links`, env note | workspace id, database ids, connection status (read-only in phase 5) | 5 |
| 14 | 매출 및 비용 기록 | `finance_records` | income/expense rows, monthly totals, receipt file path | 4 |
| 15 | 백업 관리 | `backup_logs` | record backup runs, view last success, download new dump, restore checklist | 4 |

Every menu reads and writes real rows. No screen is a static mock-up — a menu that cannot yet write to the database is marked "phase 5" in the UI instead of pretending to save.

### 4.1 Route skeleton for phase 4

```
/{locale}/control-center/                  → dashboard
/{locale}/control-center/apps/
/{locale}/control-center/channels/
/{locale}/control-center/hero/             → asset library
/{locale}/control-center/hero/studio/      → canvas editor
/{locale}/control-center/content/
/{locale}/control-center/archive/{kind}/
/{locale}/control-center/prompts/
/{locale}/control-center/projects/
/{locale}/control-center/schedule/
/{locale}/control-center/integrations/     → GitHub + Notion
/{locale}/control-center/finance/
/{locale}/control-center/backup/
```

These routes are client components (`"use client"`) because they need a session and live queries. They are **not** prerendered with data; the static export ships the shell, and RLS refuses data without an authorised session.

---

## 5. Hero Studio

### 5.1 Concepts

| Object | Meaning |
| --- | --- |
| **Asset** (`hero_assets`) | An uploaded original. Immutable: path, checksum, dimensions, byte size. Never overwritten, never deleted (trigger-enforced). |
| **Layout** (`hero_layouts`) | A *version* of a hero scene: JSON snapshot + name + version. Every save is a new version. |
| **Published layout** | Exactly one per name, enforced by a partial unique index. |

### 5.2 Snapshot format (normalised 0–1 coordinates)

```json
{
  "canvas": { "aspect": "16:9", "background": "#F2EEE6" },
  "layers": [
    {
      "id": "l1",
      "assetId": "6f0c…",
      "src": "gdu/hero/2026/11/original-ab12.webp",
      "x": 0.46, "y": 0.0, "w": 0.54, "h": 1.0,
      "fit": "cover",
      "crop": { "x": 0.05, "y": 0, "w": 0.9, "h": 1 },
      "opacity": 1, "z": 10, "mask": "none"
    }
  ],
  "text": [
    { "id": "t1", "role": "display", "value": "…", "ko": "…", "en": "…",
      "x": 0.08, "y": 0.62, "size": 72, "color": "#14140F", "align": "left", "z": 30 }
  ],
  "devices": { "desktop": {}, "mobile": { "layers": [ … ] } }
}
```

Normalised coordinates mean one snapshot renders correctly at 390 px and 2560 px. Mobile may override positions rather than duplicating the whole scene.

### 5.3 Editor pipeline (all browser-side, ₩0)

1. **Upload** — `input[type=file]` accepts JPG/PNG/WebP ≤ 5 MB. Validate MIME by magic bytes, not extension. Upload to `hero-originals/{yyyy}/{mm}/{uuid}-{slug}.{ext}`.
2. **Record** — insert `hero_assets` row with width/height/byte size and SHA-256.
3. **Compose** — HTML5 Canvas (or CSS transform layers) for crop, scale, position, background colour, layer order, text blocks.
4. **Preview** — two iframes at 1440×900 and 390×844, same snapshot, different scale.
5. **Save draft** — insert new `hero_layouts` row with `version = max+1`, `is_published = false`.
6. **Publish** — call `publish_hero_layout(id)`: unpublishes the previous version and publishes this one atomically.
7. **Restore** — call `restore_hero_layout(id)`: clones the chosen version into a new version. History is never rewritten.

### 5.4 Why the original matters

Every crop, mask and composition is derivable from the original plus the snapshot JSON. If a future design needs a different crop, the Studio re-derives it; nothing has to be re-shot or re-uploaded. A delete trigger raises an exception unless a deliberate purge flag is set in the transaction, so an accidental click cannot destroy an asset.

### 5.5 Limits and behaviour

- 5 MB per image, 4 buckets, 1 GB total storage. At 2 MB average, roughly 500 originals — plenty for a hero that changes monthly.
- Allowed MIME types are restricted at the bucket level (`image/jpeg`, `image/png`, `image/webp`). SVG is excluded from upload buckets because it can carry script.
- Derived crops are stored in `hero-derived/`; the original is never re-encoded.

---

## 6. Data architecture

### 6.1 Tables

| Table | Rows (est.) | Public read? | Purpose |
| --- | --- | --- | --- |
| `admin_users` | 1–3 | no | allow-list + role |
| `brand_settings` | 1 | published only | brand name, tagline, contact, domain, locale |
| `apps` | 5 → n | visible only | app catalogue |
| `media_channels` | 8 → n | visible only | channel catalogue |
| `hero_assets` | ~50 | not archived | immutable originals |
| `hero_layouts` | ~100 | published only | versioned scenes |
| `projects` | ~10 | live only | roadmap |
| `content_items` | ~50 | published + due | news/pages per locale |
| `archive_items` | ~300 | no | image/video/doc library |
| `prompt_vault` | ~100 | no | AI prompts |
| `schedules` | ~200 | no | work calendar |
| `finance_records` | ~500 | no | income/expense |
| `backup_logs` | ~50 | no | backup audit trail |

### 6.2 Invariants

1. `hero_assets.storage_path` is written once. `archived_at` replaces deletion.
2. One published `hero_layouts` row per `name` (partial unique index).
3. `hero_layouts.version` is monotonic per name; restore clones, never overwrites.
4. `content_items (slug, locale)` is unique — a Korean and an English version of one article are two rows.
5. `archive_items` requires either a storage path or an external URL (video policy).
6. `finance_records.amount_krw ≥ 0`; direction carries the sign.
7. Every `updated_at` is maintained by trigger, never by the client.

### 6.3 RLS matrix (summary)

| Table | anon | authenticated (not admin) | admin (owner/editor/viewer) |
| --- | --- | --- | --- |
| `brand_settings` | SELECT where `is_published` | same | ALL |
| `apps` | SELECT visible, not archived | same | ALL |
| `media_channels` | SELECT visible | same | ALL |
| `hero_assets` | SELECT not archived | same | ALL |
| `hero_layouts` | SELECT published | same | ALL |
| `projects` | SELECT live | same | ALL |
| `content_items` | SELECT published & due | same | ALL |
| `archive_items` | ✗ | ✗ | ALL |
| `prompt_vault` | ✗ | ✗ | ALL |
| `schedules` | ✗ | ✗ | ALL |
| `finance_records` | ✗ | ✗ | ALL |
| `backup_logs` | ✗ | ✗ | ALL |
| `admin_users` | ✗ | SELECT own row (via policy) | ALL; only `owner` may write |

Storage: public read for `hero-originals`, `hero-derived`, `brand`; `archive` requires an admin session; insert/update require an admin; **no delete policy** exists.

---

## 7. Authentication and security

| Topic | Decision | Reason |
| --- | --- | --- |
| Auth provider | Supabase Auth, email magic link / OTP | Free (50k MAU), no password to store, no extra service |
| Authorisation | `admin_users` allow-list + role enum | A Supabase account alone must never reach the Control Center |
| Client credentials | anon key only | Public by design; RLS decides everything |
| Service role | **not used anywhere** | A static bundle cannot keep it; adding it would be the vulnerability |
| Admin indexing | `noindex` meta + no sitemap entry + no public link | Reduces discovery, not a substitute for RLS |
| Uploads | bucket MIME allow-list + size limit + magic-byte check | Prevents HTML/SVG smuggling into a public bucket |
| External links | `https` only, `rel="noopener noreferrer"` | Prevents tab-nabbing and `javascript:` injection |
| Content rendering | Markdown → sanitised HTML, no `dangerouslySetInnerHTML` on user input | XSS defence at the render layer |
| CSP (phase 5) | `default-src 'self'; img-src 'self' data: https://*.supabase.co; connect-src https://*.supabase.co; frame-ancestors 'none'` | Cloudflare `_headers` file, free |
| Rate limiting | Supabase Auth built-in throttling; no custom API | No server to protect; public pages are static |
| Backups | Weekly `pg_dump` + monthly storage manifest, logged in `backup_logs` | Free plan has **no** automatic backups |

Threat model in one line: the only privileged place is the database, every privileged read/write is decided there, and the browser is assumed hostile.

---

## 8. Internationalisation

```
src/i18n/
├─ ko.json     ← source of truth for the dictionary shape
├─ en.json     ← same keys, English values
└─ index.ts    ← locales, defaultLocale, getDictionary(), toLocalePath()
```

- Routes are prefixed: `/ko/…`, `/en/…`. `/` forwards to `/ko/`.
- `Dictionary = typeof ko` — a missing key in `en.json` is a type error, not a runtime blank.
- Copy that belongs to *content* (app summaries, channel fields) is stored as `*_ko` / `*_en` columns, so the operator edits it without touching JSON.
- Adding a locale = one JSON file + one `locales` entry + one column pair per content table + one line in `generateStaticParams`.
- Korean typography is handled at the CSS level: `word-break: keep-all`, slightly taller line-height for `:lang(ko)`.
- `hreflang` alternates are emitted for `ko`, `en` and `x-default`.

---

## 9. Performance and quality budgets

| Budget | Target | Current (phase 2) |
| --- | --- | --- |
| First-load JS (shared) | ≤ 130 kB gzip | 103 kB |
| Route JS | ≤ 10 kB | 0.16 kB (all static) |
| Fonts | Latin subsets + Korean serif, self-hosted | 6.6 MB all weights (see note) |
| LCP (mobile, 4G) | ≤ 2.5 s | untested on device — phase 5 |
| CLS | < 0.02 | no async media above the fold |
| Lighthouse a11y | ≥ 95 | to be measured phase 5 |

Font note: the Korean serif ships as many unicode-range slices, and only the slices a page needs are downloaded by the browser. If measurement shows a problem, phase 5 options are (a) drop weight 500 from the Korean face, (b) subset to the ~2,500 most common syllables, (c) switch Korean display text to the sans face.

---

## 10. Phase plan and exit criteria

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| **2 (this)** | Docs, schema, project scaffold, i18n, design tokens, 9 public routes drafted | `tsc --noEmit` 0 errors, `npm run build` 0 errors, 20 static pages |
| **3** | Final public site: hero with real content, 5 app pages, 8 channels, K-culture, news, contact | Mobile 390 px and desktop 1440 px reviewed; no placeholder text without an honest "준비 중" label |
| **4** | Control Center 15 menus + Hero Studio, Supabase project created, schema applied | Owner can log in, edit an app, upload an image, publish a hero, see it live without a rebuild |
| **5** | Notion read-only integration, CSP, backups, Lighthouse, free-limit audit, custom domain | Security headers verified, backup restore rehearsed, quota headroom documented |

### Definition of done for a menu (applies to every phase)

1. Reads real rows (no hard-coded sample data).
2. Writes persist after reload.
3. Refuses gracefully when Supabase is not configured, with a visible reason.
4. Mobile layout usable at 390 px.
5. Nothing it does can delete an original.

---

## 11. Failure modes

| Failure | Symptom | Designed behaviour |
| --- | --- | --- |
| Supabase Free paused (7 days idle) | queries fail | Public pages unaffected (static). Hero falls back to the editorial default. Dashboard shows "DB 일시정지 — 복구 필요". |
| Storage 1 GB reached | upload rejected | Studio blocks new uploads and tells the operator to archive or move to R2; never auto-upgrades |
| Build quota (500/mo) reached | deploy refused | Already-deployed site keeps serving; docs-only commits must not trigger builds (Cloudflare build watch paths) |
| Missing env var | no DB | Build succeeds; site renders seeds; banner in Control Center |
| Supabase project deleted accidentally | data gone | Weekly `pg_dump` + storage manifest restore procedure (FREE_INFRA_AND_LIMITS §7) |
| Bad hero published | wrong first impression | `restore_hero_layout` returns to any previous version in one click |

---

## 12. File map (phase 2)

```
work/global-digital-universe/
├─ docs/
│  ├─ SYSTEM_ARCHITECTURE.md      ← this file
│  ├─ BRAND_DESIGN_SYSTEM.md
│  ├─ DATABASE_SCHEMA.sql
│  └─ FREE_INFRA_AND_LIMITS.md
├─ public/favicon.svg
├─ src/
│  ├─ app/
│  │  ├─ (root)/                  ← "/" → /ko/ static forward
│  │  ├─ (site)/[locale]/
│  │  │  ├─ layout.tsx            ← fonts, header, footer, metadata, hreflang
│  │  │  ├─ page.tsx              ← HOME: hero + 6 sections
│  │  │  ├─ about/ apps/ games/ k-culture/ media/ news/ contact/
│  │  ├─ globals.css              ← design tokens (single source)
│  ├─ components/
│  │  ├─ home/Hero.tsx
│  │  └─ site/{Header,Footer,Editorial}.tsx
│  ├─ config/brand.ts             ← brand, 8 menus, 5 apps, 3 games, 8 channels, news seeds
│  ├─ i18n/{ko.json,en.json,index.ts}
│  └─ lib/
│     ├─ env.ts                   ← public env, no secrets
│     ├─ utils.ts
│     └─ supabase/{client,server,types,guard}.ts
├─ next.config.ts                 ← output: "export", trailingSlash
├─ tailwind.config.ts
├─ tsconfig.json
├─ .env.example
└─ package.json
```

---

## 13. Deliberate non-goals

- **No CMS server.** The Control Center *is* the CMS.
- **No paid image generation.** Hero composition works entirely with uploaded images; AI generation, if ever offered, must be a free, verified, optional connection — never an automatic paid call.
- **No video hosting.** 1 GB cannot hold video; YouTube/Drive links are the policy, and the archive stores the link plus metadata.
- **No character-led brand.** KOMI and MOMO can appear in content; the site's identity does not depend on them.
- **No modification of the five existing apps.** They are linked, not integrated.

---

## 14. Phase 4 — what was actually built

### 14.1 Routes

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/{ko,en}/admin/` | static shell + client app | the fifteen menus |
| `/admin/` | static meta refresh | forwards to `/ko/admin/` |

The admin lives in its own route group `(control)` with its own root layout, so the public
header/footer never wrap it and both can share `globals.css` without branching on path.

### 14.2 Data path

```
browser (operator)
  ├─ Supabase keys absent  → local preview mode
  │     IndexedDB `gdu-control-center`  (kv: one AdminData JSON, blobs: original images)
  │     localStorage fallback when IndexedDB is unavailable
  └─ Supabase keys present → Auth session + admin_users row (owner/editor/viewer)
        RLS is_admin() is the real gate; the UI redirect is convenience
        hero publish → hero_layouts (+ publish_hero_layout RPC), image → hero-originals bucket
```

An `AdminData` document holds every collection (`apps`, `channels`, `contents`, `images`,
`videos`, `docs`, `prompts`, `projects`, `tasks`, `repos`, `finance`, `heroLayouts`, `backups`)
plus `notion`. One document is why a backup is one JSON file.

**Known limit, stated plainly:** in local mode the fifteen menus persist to the browser only.
Hero publishing is the one path that also writes to Supabase when keys exist. Table-by-table
sync of the remaining collections is a phase-5 task; the admin banner says so instead of
claiming an automatic sync that does not exist yet.

### 14.3 Hero rendering

- `src/lib/admin/hero.ts` — pure geometry: crop → source rect, cover fit, scale, normalised
  coordinates, version numbering, publish/unpublish, restore-as-clone.
- `src/lib/admin/heroCanvas.ts` — one `drawHero()` used by the editor canvas and the public
  HOME canvas. Fonts are read from the live next/font stacks so canvas text matches the page.
- `src/components/home/HomeHero.tsx` — server-rendered editorial hero as fallback, upgraded to
  the published canvas only when a published layout is found (local first, then Supabase).

### 14.4 Default artwork

`까치 호랑이 클린본` is the confirmed default hero plate (PNG original + WebP delivery in
`public/hero/`). `일월오봉도 클린본` ships alongside as the second built-in image. Both are
seeded into the image library (`src/lib/admin/builtinImages.ts`) so the studio can use them
without an upload.

### 14.5 Verification

`npm run typecheck` · `npm run test:admin` (81 checks) · `npm run test:render` (15 screens) ·
`npm run build` (23 static pages). Click-through of upload/publish/download remains a manual
check in a real browser after deploy, because the build environment has no display server.
