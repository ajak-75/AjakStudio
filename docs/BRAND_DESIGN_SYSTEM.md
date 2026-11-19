# BRAND DESIGN SYSTEM — Editorial White

Version 1.0 · 2026-11-20 · phase 2 deliverable
Selected direction: **A안 · 에디토리얼 화이트 (넓은 여백 · 정교한 타이포 · 프리미엄 스튜디오)**

> **요약 (Korean summary)**
> 포슬린빛 배경(#FBFAF7) 위에 먹색 하나, 놋쇠색 액센트 하나(#8A6A3C, 화면의 2% 이하), 1px 괘선 하나로만 구성합니다. 제목은 세리프(Cormorant Garamond + Noto Serif KR), 정보는 산세리프(Inter)가 맡고, 12컬럼 그리드·1280px 최대폭·동일한 섹션 여백을 모든 페이지가 공유합니다. 그림자·그라데이션·유리 효과·둥근 모서리·동일한 카드 3개 반복은 전부 금지입니다.

The token source of truth is `src/app/globals.css` (`:root`). `tailwind.config.ts` only maps those
variables to utility names, so changing a colour or a clamp range never requires a code sweep.
This document explains *why* each token exists and what is not allowed.

---

## 1. Concept

A private studio's printed portfolio, moved to the screen: porcelain paper, one ink, one brass
hairline, a serif that carries the voice, and a grotesque that carries the information. Nothing
shouts. Space is the main material; type does the work that images usually do.

Three words guide every decision: **quiet, exact, expensive.**
"Expensive" is achieved through restraint — one accent, one hairline weight, one radius (zero) —
not through effects.

**Anti-reference.** The site must not look like a generated AI landing page: no purple gradient
hero, no floating glass cards, no 3D blob, no identical three-up card grid, no emoji icons, no
stock-photo people shaking hands.

---

## 2. Tokens

### 2.1 Colour

| Token | Value | Role | Area budget |
| --- | --- | --- | --- |
| `--gdu-paper` | `#FBFAF7` | Page background. Warm off-white, never `#FFFFFF`. | 55–65 % |
| `--gdu-porcelain` | `#F2EEE6` | Alternating section band, footer, cards-with-a-border | 20–30 % |
| `--gdu-ink` | `#14140F` | Display type, primary button fill, active underline | 8–12 % |
| `--gdu-graphite` | `#43433C` | Body copy, secondary links | 5–8 % |
| `--gdu-muted` | `#6B6862` | Captions, metadata, inactive nav (≥ 5.3:1 on paper) | ≤ 5 % |
| `--gdu-line` | `#DDD7CB` | The single hairline (1 px) for every divider | structure only |
| `--gdu-brass` | `#8A6A3C` | Accent: index numbers, small labels, active status, the hero period | **≤ 2 %** |
| `--gdu-brass-soft` | `#ECE3D2` | Text selection, hover wash | ≤ 1 % |

Measured contrast on paper: ink 16.9:1 · graphite 10.0:1 · muted 5.3:1 · brass 4.8:1.
No colour is used to carry meaning alone — status always has a word beside the dot.

**Forbidden:** pure white backgrounds, more than one accent, gradients of any kind, coloured
shadows, translucent panels, dark mode inversion in phase 2.

### 2.2 Typography

| Family | Use | Weights | Loading |
| --- | --- | --- | --- |
| Cormorant Garamond (`--font-cormorant`) | Latin display & statement serif | 300 / 400 / 500 | `next/font` self-hosted |
| Noto Serif KR (`--font-noto-serif-kr`) | Korean display & statement serif | 300 / 400 / 500 | `next/font` self-hosted, `preload: false` |
| Inter (`--font-inter`) | Interface, labels, body, tables | variable | `next/font` self-hosted |

**Scale** (fluid where marked):

| Token | Size | Line height | Tracking | Use |
| --- | --- | --- | --- | --- |
| `display-xl` | `clamp(2.5rem, 6vw, 5.75rem)` | 1.02 | −0.03em | hero headline only, once per page |
| `display-l` | `clamp(2.25rem, 5.2vw, 4.5rem)` | 1.04 | −0.025em | page title, closing statement |
| `display-m` | `clamp(1.75rem, 3.4vw, 2.75rem)` | 1.12 | −0.02em | section headline |
| `display-s` | `clamp(1.375rem, 2.2vw, 1.875rem)` | 1.22 | −0.015em | item title in a section |
| `eyebrow` | 11 px | 1.2 | 0.18em, uppercase, 500 | section labels, nav, meta labels |
| `body` | 16 px | 1.75 | 0 | paragraphs (Korean 1.8, `keep-all`) |
| `body-sm` | 14 px | 1.65 | 0 | captions, notes, table cells |

Rules:

1. **Serif speaks, sans informs.** A sentence that sounds like the brand is serif; a label, a
   value, a date or a link is sans.
2. **Uppercase exists only in the eyebrow and the nav.** Never uppercase a sentence, never
   letter-space Korean headings (it breaks syllable grouping).
3. **One display element per section.** Two competing headlines flatten the hierarchy.
4. **No type below 12 px** except the index numerals inside list rows (10 px, decorative +
   always paired with a readable name).
5. **Numbers** in indexes use leading zeros (`01`–`05`) for a printed-catalogue feel.
6. Korean and English share the same scale; the Korean serif is optically larger, so Korean
   display lines are limited to ~12 syllables per line.

### 2.3 Grid and space

| Token | Value | Notes |
| --- | --- | --- |
| Container | `max-width: 1280px`, centred | editorial measure, not full-bleed |
| Page gutter | `clamp(1.25rem, 4.4vw, 4.5rem)` | 20 px on 390 px, 72 px on 1440 px |
| Columns | 12 | `display: grid`, `column-gap: clamp(1rem, 2vw, 1.75rem)` |
| Section rhythm | `clamp(4.5rem, 9vw, 9rem)` top and bottom | one value for the whole site |
| Header height | 68 px | sticky, hairline bottom |
| Row padding | 24 px vertical (list rows) | hairline separator instead of a card |
| Radius | **0** everywhere except the 2 px status dot | squared corners are the brand |

Column recipes used by the public pages: hero 7 + 4 (start 9) · statement 3 + 8 (start 5) ·
services 6 + 3 + 2 + 1 · games 6 + 5 (start 8) · news 3 + 8 · contact 7 + 4 · footer 4 + 3 + 3 + 2.

### 2.4 Motion

| Token | Value |
| --- | --- |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` (`ease-editorial`) |
| Fast | 300 ms (colour) |
| Medium | 420 ms (hairline underline drawing) |
| Slow | 500 ms (row hover, arrow colour) |
| Entrance | 900 ms once, hero only (`rise-in`, 14 px rise + fade) |

Motion may only do three things: draw a hairline, shift an item 4 px, change a colour. Anything
that loops, bounces, parallaxes or animates on scroll is out. `prefers-reduced-motion: reduce`
disables all of it globally.

### 2.5 Elevation and edges

- **Shadow: none.** Depth comes from the paper/porcelain alternation and hairline rules.
- **Border: 1 px `--gdu-line`** only, never darker except the top rule of a list section
  (`--gdu-ink` at 80 %), which marks "a list starts here".
- **Radius: 0.** Buttons, inputs, cards, images: square. The only circle is a 2 px status dot.

---

## 3. Components

### 3.1 Header

- 68 px, sticky, solid paper, 1 px bottom hairline.
- Wordmark: two-line sans, 11 px, 0.24em tracking (`GLOBAL DIGITAL / UNIVERSE`); mobile shows
  the `GDU` monogram in serif instead.
- Eight menus, 11 px uppercase, 0.16em; active item = ink colour + a 1 px underline that scales
  from the left. Inactive = graphite, hover to ink.
- Locale switch `KO / EN` at the right, current locale in ink, the other a link.
- Below 1280 px the menus collapse into a full-screen paper panel: serif menu names at 28 px,
  index numbers 01–08 on the right, locale switch and "2026 · Seoul" at the bottom.
- No logo image, no icon set, no search box in phase 2.

### 3.2 Hero

- Left 7 columns: eyebrow with a 40 px brass rule, three-line serif headline, one lead
  paragraph (≤ 48 ch), one filled button + one underlined link.
- The headline's final line ends with a brass period (a 0.14em dot) — the only decorative mark
  in the design.
- Right 4 columns: **INDEX — SERVICES**, a five-row list of app names with index numbers and a
  status word; the arrow appears at the row's end.
- Below: four facts separated by a single top and bottom hairline (05 SERVICES · 08 CHANNELS ·
  03 GAMES · ₩0 INFRASTRUCTURE COST).

### 3.3 List row (the workhorse)

Used for services, games pipeline, channels and news. Anatomy:

```
01 │  Service name            │  one-line description      │  ● 운영 중   │ ↗
6 col│  (serif, 26–28 px)      │  (sans 13 px, muted)       │  (brass dot)│
```

Rules: full-width hairline between rows; no card, no shadow; hover washes the row with porcelain
at 62 % and moves the name 4 px right; the whole row is one link when a URL exists; a row with no
URL keeps the same rhythm but muted, and says why (준비 중 / 확인 중).

### 3.4 Section label

`01 ──── OUR APPS` : brass index (10 px) + muted eyebrow (11 px uppercase) + a hairline that
runs to the right edge. It opens every section and never carries a description.

### 3.5 Status tag

A 2 px dot + a word (운영 중 / 베타 / 준비 중 / 기획 중 / 휴면). Brass for live/active, muted for
everything else. Never a coloured pill, never a badge with a background.

### 3.6 Button and link

- **Primary:** ink fill, paper text, 11 px uppercase, 0.16em, padding 24 × 14, square corners,
  hover to brass fill, 300 ms.
- **Secondary:** text + 1 px underline that draws from the left on hover (420 ms).
- **External:** a 12 px arrow glyph `↗` after the label; `target="_blank"` and
  `rel="noopener noreferrer"` always.
- No outlined "ghost" buttons, no rounded pills.

### 3.7 Footer

Porcelain band, four columns: wordmark + one serif line of positioning + base/year · sitemap ·
channels · studio. Bottom hairline then `© 2026 …` and `SEOUL · KOREA — DESIGNED AND BUILT
IN-HOUSE` at 10 px, 0.16em. The Control Center is **not** linked publicly; the footer states that
it opens in phase 4.

### 3.8 Images (hero and content)

- Real photography, warm and high-key, one subject per frame; no AI faces, no collages.
- Hero: 16:9 desktop, 4:5 mobile crop of the *same* original; the original is never re-encoded.
- Images sit edge-to-edge inside their column, square corners, no border, no shadow, no overlay
  gradient. If text must sit over an image, use a solid porcelain block beside it instead of a
  scrim.
- Alt text in both languages, one sentence, describing what is visible.

---

## 4. Copy and voice

| Do | Don't |
| --- | --- |
| "다섯 개의 앱, 여덟 개의 채널" — concrete numbers | "혁신적인 시너지" — abstraction |
| Short declarative Korean, one idea per sentence | Buzzwords, exclamation marks |
| English sentence case in body; uppercase only in labels | Title Case Everywhere |
| Honest states: "준비 중", "확인 중", "공식 문의 주소 준비 중" | Invented email addresses, fake launch dates |
| Name things the way the owner does (Ajak, KOMI-Diary, K-Sajoo, ABI) | Renaming existing products for the site |
| Korean uses `keep-all` and generous line breaks | Justified Korean text |

Bilingual parity: the Korean version is the source; the English version is rewritten, not
translated word for word. Both must carry the same facts and the same level of certainty.

---

## 5. Accessibility baseline

| Item | Standard |
| --- | --- |
| Text contrast | ≥ 4.5:1 for body/labels (all tokens pass: 4.8–16.9) |
| Focus | 1 px ink outline, 4 px offset, visible on every interactive element |
| Skip link | First focusable element, jumps to `#main` |
| Language | `<html lang>` per locale; Korean line-breaking tuned separately |
| Touch targets | ≥ 44 px height for rows, buttons and the menu trigger |
| Motion | Globally disabled under `prefers-reduced-motion: reduce` |
| Images | `alt` in the page language; decorative rules and dots marked `aria-hidden` |
| Headings | One `h1` per page; sections use `h2`; no heading inside a link |
| External links | Announced by the arrow glyph plus `rel` attributes; no new-tab surprises on mobile |

---

## 6. Implementation map

| Design token | CSS variable | Tailwind utility |
| --- | --- | --- |
| Paper | `--gdu-paper` | `bg-paper` |
| Porcelain | `--gdu-porcelain` | `bg-porcelain` |
| Ink | `--gdu-ink` | `text-ink`, `bg-ink`, `border-ink/80` |
| Graphite | `--gdu-graphite` | `text-graphite` |
| Muted | `--gdu-muted` | `text-muted` |
| Hairline | `--gdu-line` | `border-line` |
| Brass | `--gdu-brass` | `text-brass`, `bg-brass` |
| Section rhythm | `--gdu-section-y` | `py-section` |
| Page gutter | `--gdu-gutter` | `.shell` (padding-inline) |
| 12-col grid | — | `.grid-12` |

Adding a colour means adding it to `:root`, to `tailwind.config.ts` and to the table above — in
that order. Adding a component means checking it against §2.5 (shadow none, radius 0, one
hairline) before it ships.

---

## 7. Checklist before publishing a screen

1. Does the first viewport show exactly one display headline, one lead, and one primary action?
2. Is the accent under 2 % of the visible area?
3. Are there any gradients, shadows, rounded corners, or glass panels? (must be zero)
4. Is every divider 1 px `--gdu-line`, and is the section rhythm identical to the previous one?
5. At 390 px, does anything overflow, wrap awkwardly, or shrink below 12 px?
6. Are all "coming soon" states honest, and is no URL present that we did not verify?
7. Does the page still render with Supabase unreachable?
