# FREE INFRASTRUCTURE AND LIMITS

Version 1.0 · 2026-11-20 · phase 2 deliverable
Figures verified against the providers' own pages on **2026-11-20**. Free tiers change; re-check
before a launch decision (sources at the end).

**Total recurring cost of this architecture: ₩0.**

> **요약 (Korean summary)**
> Cloudflare Pages Free는 정적 트래픽·대역폭이 무제한이고 월 500회 빌드·파일 20,000개·파일당 25MB 한도이며, 상업적 이용이 제한되지 않습니다. Supabase Free는 DB 500MB·스토리지 1GB·이그레스 5GB·MAU 5만이고, 7일 미사용 시 자동 일시정지되며 **자동 백업이 없습니다**. 그래서 (1) 공개 페이지는 DB 없이도 뜨게 만들고, (2) 주 1회 `pg_dump` 백업과 복구 절차를 문서화했으며, (3) 영상은 업로드하지 않고 유튜브·드라이브 링크만 저장합니다. 한도를 넘으면 자동 결제가 아니라 대안을 먼저 제시합니다.

---

## 1. What we use, and what we deliberately do not

| Layer | Chosen | Why | Rejected alternative |
| --- | --- | --- | --- |
| Hosting | **Cloudflare Pages — Free** | Static requests and bandwidth unmetered, commercial use not restricted, 100 custom domains | Vercel Hobby (commercial-use restriction), GitHub Pages (commercial/affiliate use restricted) |
| Database / Auth / Storage | **Supabase — Free** | Postgres + RLS + Auth + 1 GB storage in one project | Firebase (vendor lock, no SQL/RLS), a paid VPS |
| Framework | **Next.js 15 + TypeScript + Tailwind** | `output: "export"` produces pure static files — no server runtime to pay for | SSR runtime (needs a paid host or edge functions) |
| Fonts | Open-source webfonts via `next/font` | Self-hosted at build, no CDN call, no licence fee | Adobe Fonts, paid foundry licences |
| Images | Operator's own uploads, browser-composed | No paid image API, no automatic AI generation | Paid generation APIs |
| Video | **External links only** (YouTube / Drive) | 1 GB cannot hold video | Supabase video upload (would exhaust storage in one file) |
| Forms | Supabase tables + RLS | Cloudflare Pages has no form backend | Paid form services |

---

## 2. Cloudflare Pages — Free plan

| Limit | Free plan | Our usage / plan |
| --- | --- | --- |
| Static requests & bandwidth | **Unlimited** (static assets are free on every plan) | A traffic spike costs nothing |
| Builds per month | **500 per account** (not per project) | ~15–30/month expected; docs-only pushes must not trigger builds |
| Concurrent builds | 1 | Deploy one at a time |
| Build timeout | 20 minutes | Our build is ~40 s |
| Files per site | 20,000 | ~60 in phase 2 (fonts included), < 300 expected |
| Max file size | 25 MiB | Largest asset is a font slice (< 1 MB) |
| Custom domains | 100 per project | 1 planned, attached in phase 5 |
| Projects per account | 100 | 1 |
| Preview deployments | Unlimited | Use for design review before publishing |
| Pages Functions | Not used | SSR/Functions would consume the Workers free quota (100k requests/day) — avoided entirely |
| `_headers` rules | 100 | CSP and cache headers in phase 5 |
| `_redirects` rules | 2,000 static + 100 dynamic | Not needed (`trailingSlash` handles routing) |
| Commercial use | Not restricted by the Pages limits or terms | Business site is allowed |

**Notes that matter operationally**

- Every push to the connected branch triggers a build, and preview branches consume the same 500.
  Set *Build watch paths* so `docs/**` and `README.md` changes do not rebuild the site.
- When the monthly build quota is exhausted, **the deployed site keeps serving**; only new
  deploys are refused until the month rolls over.
- New accounts are rate-limited for the first 48 hours of project creation (anti-abuse), so create
  the Pages project ahead of a launch day.
- No built-in form handling and no server-side logic: the contact form (phase 4) writes to
  Supabase, not to Cloudflare.
- Free plan pages may not collect card payments directly; the site only links out to payment
  pages hosted elsewhere.

---

## 3. Supabase — Free plan

| Resource | Free plan | Our budget |
| --- | --- | --- |
| Database size | **500 MB** | Content and metadata only; est. < 20 MB in year 1 |
| File storage | **1 GB** | Hero originals + derived crops + archive; see §6 |
| Egress | **5 GB / month** (plus 5 GB cached egress) | Hero images are the only heavy asset; keep each < 400 kB |
| Monthly active users | 50,000 | Admin only (1–3) in year 1 |
| API requests | Unlimited | — |
| Edge function invocations | 500,000 / month | 0 planned |
| Realtime | 2M messages, 200 peak connections | 0 planned |
| Active projects | 2 | 1 production (+1 optional staging) |
| Max upload size | 50 MB | We cap uploads at 5 MB in the app and at the bucket |
| Automatic backups | **Not included** | Weekly manual `pg_dump` (§7) |
| Inactivity pausing | **Paused after 1 week of low activity** | Mitigation §4 |
| Image transformations | Not available | No transform URLs; pre-size images in the browser |
| SLA / support | Community only | Acceptable for a static public site |

**Commercial use.** Supabase's pricing page targets production use on every tier, and its Terms
license the service "for Customer's internal business purposes" — running your own business is
exactly that; reselling Supabase itself is not. Two practical consequences we accept:

1. No uptime SLA on Free. The public site must never depend on the database to render (it does not).
2. If the site later becomes revenue-critical (payments, live accounts for customers), move the
   database to Pro ($25/month) — a decision for the owner, never an automatic upgrade.

**Hard rules we do not break on Free:**

- No service-role key in the browser bundle.
- No storage of payment card data (Supabase requires written approval; we never do it).
- No protected health information.
- No video files.

---

## 4. The 7-day pause — behaviour and response

Free projects with too few user queries over a week are paused. Our design treats this as an
expected state, not an outage.

**What the visitor sees:** nothing changes. Public pages are static HTML on Cloudflare; the hero
falls back to the built-in editorial layout. No error page, no spinner.

**What the operator sees:** the Control Center cannot load data and shows
"DB 일시정지 — Supabase 대시보드에서 복구 필요". No writes are attempted.

**Prevention (monthly routine, ~2 minutes):**

1. Open the Control Center or the Supabase dashboard twice a week (a dashboard visit counts as
   activity).
2. Keep Supabase pause-warning emails enabled; a warning arrives roughly a week before pausing.
3. If a holiday or a long break is expected, open the dashboard once per week or pause the project
   deliberately (a paused project does not count against the 2-project limit).

**Recovery:**

1. Supabase Dashboard → organisation → the paused project → **Resume project**.
2. Data and configuration return exactly as they were; restoration is possible **up to 1 year**
   after pausing.
3. No redeploy is needed — the static site never stopped, and the browser re-queries on the next
   load.

---

## 5. Video policy

| Rule | Reason |
| --- | --- |
| Video is **never uploaded** to Supabase | A single short clip can exceed 1 GB; uploads also consume 50 MB/file and egress |
| Store a link: `archive_items.provider` = `youtube` / `drive`, `external_url` = the link | Searchable library without storage cost |
| Thumbnails may be uploaded as JPEG/WebP ≤ 300 kB | Keeps the library visual |
| Do not hotlink platform CDN images | URLs expire and break the library |
| Privacy: use unlisted YouTube links for anything not meant for the public | A listed link becomes public content |

Video therefore contributes **0 bytes** to storage and near-zero to egress; the only cost is the
thumbnail.

---

## 6. Storage budget (1 GB) — allocation and guardrails

| Bucket | Contents | Budget | Guardrail |
| --- | --- | --- | --- |
| `hero-originals` | Immutable uploads (JPG/PNG/WebP ≤ 5 MB) | 600 MB | Warn at 400 originals or 80 % |
| `hero-derived` | Crops and resized copies generated in the browser | 200 MB | Delete derived files freely — originals are the source |
| `brand` | Logo, favicons, OG images | 20 MB | — |
| `archive` | Documents, design files, private assets (≤ 50 MB each) | 180 MB | Warn at 150 MB |

When 80 % is reached: (1) delete derived crops, (2) move old documents to the owner's Google Drive
and keep the link in `archive_items.external_url`, (3) only then consider Cloudflare R2 (10 GB
free) or Pro. **Never auto-upgrade and never delete an original.**

Egress guardrail: hero image target ≤ 400 kB WebP, three images per scene maximum. At 10,000 hero
views per month that is ~4 GB — inside the 5 GB allowance; a viral month would exceed it, and the
correct response is to reduce image weight, not to upgrade during the spike.

---

## 7. Backup and restore

### 7.1 What is backed up, where, how often

| Asset | Method | Frequency | Retention | Location |
| --- | --- | --- | --- | --- |
| Code & schema | Git push to `ajak-75/AjakStudio` | every change | full history | GitHub |
| Database data | `pg_dump -Fc` (custom format) | **weekly** | 8 weeks rolling | workspace `backups/` + owner's Google Drive (private) |
| Storage originals | Folder sync / `supabase storage` download | **monthly** + before any bulk change | latest two copies | owner's Google Drive (private, 15 GB free) |
| Finance records | CSV export from `finance_records` | monthly | permanent | Google Drive |
| Free-plan safety net | `backup_logs` rows | each run | permanent | Supabase table |

Never place a dump in a public repository — it contains finance records and personal notes.

### 7.2 Weekly database dump

```bash
# Connection string: Supabase → Project settings → Database → URI (session mode)
export GDU_DB_URL='postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres'
mkdir -p backups
pg_dump "$GDU_DB_URL" -Fc --no-owner --no-privileges \
  -f "backups/gdu-$(date +%Y-%m-%d).dump"
sha256sum "backups/gdu-$(date +%Y-%m-%d).dump"
```

Then record the run:

```sql
insert into public.backup_logs (scope, status, finished_at, destination, size_bytes, checksum, notes)
values ('database', 'success', now(), 'workspace + Drive',
        <bytes>, '<sha256>', 'weekly dump');
```

If the CLI is unavailable, use the Supabase dashboard's database backup/export option or
`supabase db dump` from the CLI; the outcome recorded in `backup_logs` is what matters.

### 7.3 Restore procedure (target: under 1 hour)

1. Create (or resume) a Supabase project.
2. Restore the dump:
   ```bash
   pg_restore --no-owner --no-privileges -d "$NEW_DB_URL" backups/gdu-YYYY-MM-DD.dump
   ```
3. Recreate the storage buckets and policies (they are in `docs/DATABASE_SCHEMA.sql` §14) and
   upload the originals for the current hero.
4. Update `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` in Cloudflare Pages → Settings → Environment
   variables, then trigger a deploy (this consumes one build).
5. Sign in, open Control Center → 전체 사업 현황, confirm row counts, publish the last known hero.
6. Write a `backup_logs` row with `scope = 'full'`, note "restore drill".
7. Record RPO/RTO in the log: **RPO ≤ 7 days** (weekly dump), **RTO ≤ 1 hour** for a first restore.

Rehearse this once before phase 5 ends; a backup that has never been restored is a hope, not a
backup.

---

## 8. Cost guardrails

- No card is attached to either account; there is nothing to charge automatically.
- A limit is never resolved by upgrading. It is resolved by reducing usage, or reported to the
  owner with the actual numbers and options.

| Trigger | First action (₩0) | Escalation (owner's decision) |
| --- | --- | --- |
| Storage > 80 % | Delete derived crops, move documents to Drive | R2 10 GB free, then Pro $25/mo |
| DB > 70 % (350 MB) | Archive old `content_items`, prune `backup_logs` | Pro $25/mo (8 GB) |
| Egress > 70 % | Compress hero to ≤ 200 kB, reduce scenes | Pro (250 GB egress) |
| Builds > 400/mo | Add build watch paths, batch doc commits | Pro $20/mo (5,000 builds) |
| MAU > 40,000 | Not expected on an admin-only login | Pro (100k MAU) |

Note for context: Pro raises Supabase to $25/month including 8 GB of database and 250 GB of
egress; Cloudflare Pages Pro is $20/month with 5,000 builds. Neither is needed for the current
scale, and neither is part of phase 2–4.

---

## 9. Monthly operations checklist

- [ ] Supabase dashboard visited this week (keeps the project active)
- [ ] Database size, storage size, egress read from the Supabase usage page
- [ ] Cloudflare Pages build count read from the dashboard
- [ ] Weekly dump produced, checksum recorded in `backup_logs`
- [ ] The published hero opens correctly on a phone (390 px) and a desktop
- [ ] Pause-warning email check (Supabase account inbox)
- [ ] Any 404s or broken channel links reported by visitors

---

## Sources (checked 2026-11-20)

- Cloudflare Pages limits — <https://developers.cloudflare.com/pages/platform/limits/>
- Cloudflare Pages pricing / static assets free — <https://developers.cloudflare.com/pages/functions/pricing/>
- Supabase pricing and Free tier quotas — <https://supabase.com/pricing>
- Supabase Free project pausing — <https://supabase.com/docs/guides/platform/free-project-pausing>
- Supabase billing and usage quotas — <https://supabase.com/docs/guides/platform/billing-on-supabase>
- Supabase Terms of Service (usage scope, backups, data responsibility) — <https://supabase.com/terms>
