import type { Locale } from "@/i18n";

/**
 * Single source of truth for brand identity, the eight public menus, the app
 * catalogue, the game slate and the media channel seeds.
 *
 * In production these values come from `brand_settings`, `apps`,
 * `media_channels` and `projects` in Supabase (see docs/DATABASE_SCHEMA.sql).
 * This file is the typed default that the site renders when the database is
 * not connected — which is exactly how phase two and three run (zero config).
 */

export type Localized = Record<Locale, string>;

export type AppStatus = "live" | "beta" | "coming_soon" | "archived";
export type AppCategory = "social" | "community" | "game" | "culture" | "utility";
export type AppPlatform = "web" | "android";

/**
 * Two groups, one studio:
 * - `universe`    — the KOMI & MOMO character universe (K-culture IP + games)
 * - `independent` — standalone apps (social, reading, AI)
 */
export type AppGroup = "universe" | "independent";

export interface AppEntry {
  id: string;
  name: string;
  group: AppGroup;
  tagline: Localized;
  summary: Localized;
  category: AppCategory;
  platform: AppPlatform;
  status: AppStatus;
  /** Public URL. `null` renders as "coming soon" — never a guess. */
  url: string | null;
  /**
   * Locale-relative path of this site's own introduction page (`"apps/abi"`).
   * When set, the app row links inside the site instead of to `url`, and the
   * page `/{locale}/{detail}/` carries the full story.
   */
  detail?: string;
  repo: string | null;
  year: string;
}

/**
 * Where an app row points: the in-site introduction page when the app has one,
 * otherwise its own public URL. `null` means no destination yet — the caller
 * renders "coming soon" rather than a guessed link.
 */
export function appHref(app: AppEntry, locale: Locale): { href: string; external: boolean } | null {
  if (app.detail) return { href: `/${locale}/${app.detail.replace(/^\/+|\/+$/g, "")}/`, external: false };
  if (app.url) return { href: app.url, external: true };
  return null;
}

export type ChannelStatus = "active" | "preparing" | "paused";

/** Media is split the same way the content is made: at home in Korea, and abroad. */
export type ChannelScope = "domestic" | "global";

export interface ChannelEntry {
  id: string;
  platform: string;
  account: string;
  handle: string | null;
  /** Only URLs verifiable from the project record are filled in. */
  url: string | null;
  scope: ChannelScope;
  region: Localized;
  languages: string[];
  field: Localized;
  status: ChannelStatus;
  /** True when the URL was taken from the platform itself (not reconstructed from a name). */
  verified: boolean;
  note?: Localized;
}

export interface NewsEntry {
  id: string;
  date: string;
  title: Localized;
  excerpt: Localized;
  status: "published" | "draft";
}

export type MenuId = "home" | "about" | "apps" | "games" | "kCulture" | "media" | "news" | "contact";

export interface MenuItem {
  id: MenuId;
  /** Dictionary key under `nav`. */
  labelKey: MenuId;
  /** Path below the locale prefix; empty string is the locale home. */
  path: string;
}

export const brand = {
  /** Editable from Control Center → 브랜드 설정 once Supabase is connected. */
  name: "AjakStudio",
  shortName: "AjakStudio",
  monogram: "AjakStudio",
  tagline: {
    ko: "일반 앱과 코미·모모 앱, 한국형·글로벌 SNS가 한곳에 모인 스튜디오",
    en: "Everyday apps, KOMI & MOMO games, Korean and global social — one studio",
  } satisfies Localized,
  founded: "2026",
  base: { ko: "서울 · 대한민국", en: "Seoul · Republic of Korea" } satisfies Localized,
  /** Official inbox — rendered as a `mailto:` link on the contact page, home and footer. */
  email: "ajakstudio.lab@gmail.com" as string | null,
  domain: null as string | null,
  controlCenterPath: "/control-center",
} as const;

export const menus: readonly MenuItem[] = [
  { id: "home", labelKey: "home", path: "" },
  { id: "about", labelKey: "about", path: "about" },
  { id: "apps", labelKey: "apps", path: "apps" },
  { id: "games", labelKey: "games", path: "games" },
  { id: "kCulture", labelKey: "kCulture", path: "k-culture" },
  { id: "media", labelKey: "media", path: "media" },
  { id: "news", labelKey: "news", path: "news" },
  { id: "contact", labelKey: "contact", path: "contact" },
] as const;

/**
 * Seven apps in two groups.
 *
 * Group A — KOMI & MOMO Universe: the character IP, its diary app and its games.
 * Group B — Independent & agent apps: apps a visitor would never guess belong to the
 * same studio, which is the point of this site.
 */
export const apps: readonly AppEntry[] = [
  /* ── Group A · KOMI & MOMO Universe ─────────────────────────────────── */
  {
    id: "komi-diary",
    name: "KOMI-Diary",
    group: "universe",
    tagline: { ko: "코미의 K-컬처 팬덤 다이어리", en: "KOMI's K-culture fandom diary" },
    summary: {
      ko: "세계의 팬이 모이는 K-컬처 커뮤니티. 케미 매칭, 실시간 번역, 단청 스티커, 모모 샵을 한 앱에 담고 16개 언어로 엽니다.",
      en: "A K-culture community for a worldwide fandom: Kemi matching, live translation, dancheong stickers and the MOMO shop in one app, in sixteen languages.",
    },
    category: "community",
    platform: "web",
    status: "live",
    url: "https://ajak-75.github.io/KOMI-Diary/",
    repo: "https://github.com/ajak-75/KOMI-Diary",
    year: "2026",
  },
  {
    id: "komi-momo-pop",
    name: "KOMI & MOMO POP",
    group: "universe",
    tagline: { ko: "한붓그리기 팡! 스테이지 퍼즐", en: "One-stroke link & pop stage puzzle" },
    summary: {
      ko: "같은 코미·모모 유리 구슬을 3개 이상 한붓으로 이어 터뜨리는 퍼즐. 7개 이상 이으면 황금 폭탄이 터지고, 별·코인·도감을 모으며 스테이지를 깨 나갑니다.",
      en: "Link three or more matching Komi & Momo glass beads in one stroke to pop them. Connect seven or more for a golden bomb, and clear stages while collecting stars, coins and your album.",
    },
    category: "game",
    platform: "web",
    status: "live",
    url: "https://ajak-75.github.io/komi-pop/",
    repo: "https://github.com/ajak-75/ajak-75.github.io",
    year: "2026",
  },
  {
    id: "komi-momo-bubble-merge",
    name: "KOMI & MOMO BUBBLE MERGE",
    group: "universe",
    tagline: { ko: "손가락으로 조준해 터뜨리는 버블슈터", en: "Aim-and-shoot Komi & Momo bubble puzzle" },
    summary: {
      ko: "손가락으로 각도를 겨냥해 버블을 쏘아 올리고, 같은 색 코미·모모 버블을 3개 이상 맞춰 터뜨리는 슈팅 퍼즐. 벽 반사와 구슬 교체를 활용해 콤보를 이어 갑니다.",
      en: "Aim with your finger and shoot bubbles upward to match three or more of the same color. Use wall bounces and bubble swaps to keep your combo going.",
    },
    category: "game",
    platform: "web",
    status: "live",
    url: "https://ajak-75.github.io/komi-momo-bubble-merge/",
    repo: "https://github.com/ajak-75/komi-momo-bubble-merge",
    year: "2026",
  },
  {
    id: "momo-run",
    name: "MOMO ADVENTURE RUN",
    group: "universe",
    tagline: { ko: "명동·북촌·남산·부산 자갈치·제주를 달리는 러너", en: "A runner across Myeongdong, Bukchon, Namsan, Busan Jagalchi & Jeju" },
    summary: {
      ko: "모모가 한국의 다섯 명소를 달리는 세로형 2D 러너. 점프와 슬라이드로 장애물을 피하고 한국 길거리 음식을 먹으며 피버 질주와 신기록에 도전합니다.",
      en: "A portrait 2D runner starring Momo across five Korean landmarks. Jump and slide past obstacles, grab Korean street food, trigger Fever dashes and chase a new record.",
    },
    category: "game",
    platform: "web",
    status: "live",
    url: "https://ajak-75.github.io/momo-run/",
    repo: "https://github.com/ajak-75/momo-run",
    year: "2026",
  },

  /* ── Group B · Independent & agent apps ─────────────────────────────── */
  {
    id: "ajak",
    name: "Ajak",
    group: "independent",
    tagline: { ko: "가볍게 일상과 생각을 나누는 한국판 미니 SNS", en: "A light Korean mini social feed for everyday thoughts" },
    summary: {
      ko: "사진과 글로 가볍게 이어지는 스레드형 피드. 기기 언어를 자동으로 감지해 15개 언어로 열립니다.",
      en: "A threads-style feed for photos and words, opening in fifteen languages through automatic device-language detection.",
    },
    category: "social",
    platform: "web",
    status: "live",
    url: "https://ajak-75.github.io/diary/",
    repo: "https://github.com/ajak-75/diary",
    year: "2026",
  },
  {
    id: "k-sajoo",
    name: "K-Sajoo",
    group: "independent",
    tagline: { ko: "만세력으로 읽는 글로벌 사주", en: "Korean saju, read from the real calendar" },
    summary: {
      ko: "실제 만세력 계산으로 사주와 궁합을 풀어내는 글로벌 리딩 앱. 한자를 쓰지 않고 읽는 사람의 언어로 풀어냅니다.",
      en: "A global reading app that computes saju and compatibility from real astronomical calendars, without a single Chinese character.",
    },
    category: "culture",
    platform: "web",
    status: "live",
    url: "https://ajak-75.github.io/k-sajoo/",
    repo: "https://github.com/ajak-75/ajak-75.github.io",
    year: "2026",
  },
  {
    id: "abi",
    name: "ABI",
    group: "independent",
    tagline: { ko: "폰 안에서 기억하는 안드로이드 에이전트", en: "An Android agent that remembers on the phone" },
    summary: {
      ko: "대화·기억·작업 기록을 기기 안 SQLite에 두고 필요할 때만 클라우드로 넘기는 독립형 AI 에이전트. 1단계 APK로 배포됩니다.",
      en: "A standalone AI agent that keeps conversations, memory and tasks in the device's SQLite, syncing only when needed. Distributed as a phase-one APK.",
    },
    category: "utility",
    platform: "android",
    status: "beta",
    // The APK is not distributed through the store yet, so the row opens the
    // introduction page below instead of sending visitors straight to GitHub.
    url: null,
    detail: "apps/abi",
    repo: "https://github.com/ajak-75/ABI-ai-agent",
    year: "2026",
  },
] as const;

/** Games slate: all three are playable — the universe reaches past the app. */
export const games = [
  {
    id: "komi-momo-pop",
    name: "KOMI & MOMO POP",
    tagline: {
      ko: "한붓그리기 팡! 스테이지 퍼즐",
      en: "One-stroke link & pop stage puzzle",
    } satisfies Localized,
    status: "live" as AppStatus,
    url: "https://ajak-75.github.io/komi-pop/",
    year: "2026",
  },
  {
    id: "komi-momo-bubble-merge",
    name: "KOMI & MOMO BUBBLE MERGE",
    tagline: {
      ko: "손가락으로 조준해 터뜨리는 버블슈터",
      en: "Aim-and-shoot Komi & Momo bubble puzzle",
    } satisfies Localized,
    status: "live" as AppStatus,
    url: "https://ajak-75.github.io/komi-momo-bubble-merge/",
    year: "2026",
  },
  {
    id: "momo-run",
    name: "MOMO ADVENTURE RUN",
    tagline: {
      ko: "명동·북촌·남산·부산 자갈치·제주를 달리는 러너",
      en: "A runner across Myeongdong, Bukchon, Namsan, Busan Jagalchi & Jeju",
    } satisfies Localized,
    status: "live" as AppStatus,
    url: "https://ajak-75.github.io/momo-run/",
    year: "2026",
  },
] as const;

/**
 * Ten external channels in two shelves — five at home in Korea under 단짠살림
 * and KFN, five abroad under KOMI's Unnie and AjakStudio. A URL appears only
 * when it is documented in the project record; anything unconfirmed stays
 * `null` and renders as "확인 중".
 */
export const channels: readonly ChannelEntry[] = [
  /* ── 국내 · 단짠살림 & KFN ─────────────────────────────────────────── */
  {
    id: "naver-cafe",
    platform: "NAVER CAFE",
    account: "단짠살림",
    handle: "danjjansallim",
    url: "https://cafe.naver.com/danjjansallim",
    scope: "domestic",
    region: { ko: "대한민국", en: "Korea" },
    languages: ["ko"],
    field: { ko: "커뮤니티", en: "Community" },
    status: "active",
    verified: true,
  },
  {
    id: "naver-blog",
    platform: "NAVER BLOG 01",
    account: "단짠살림",
    handle: "songja75",
    url: "https://blog.naver.com/songja75",
    scope: "domestic",
    region: { ko: "대한민국", en: "Korea" },
    languages: ["ko"],
    field: { ko: "살림 · 절약", en: "Home & saving" },
    status: "active",
    verified: true,
  },
  {
    id: "naver-blog-kfn",
    platform: "NAVER BLOG 02",
    account: "KFN 미디어 팩트",
    handle: "sjwson12",
    url: "https://blog.naver.com/sjwson12",
    scope: "domestic",
    region: { ko: "대한민국", en: "Korea" },
    languages: ["ko"],
    field: { ko: "방송 · 드라마 팩트", en: "Broadcast & drama facts" },
    status: "active",
    verified: true,
  },
  {
    id: "naver-creator-shop",
    platform: "NAVER CREATOR SHOP",
    account: "단짠살림",
    handle: "danjjan",
    url: "https://cshop.naver.com/danjjan",
    scope: "domestic",
    region: { ko: "대한민국", en: "Korea" },
    languages: ["ko"],
    field: { ko: "공동구매 · 큐레이션", en: "Group buying" },
    status: "active",
    verified: true,
  },
  {
    id: "naver-smartstore",
    platform: "NAVER SMARTSTORE",
    account: "단짠살림",
    handle: "danjjansallim",
    url: "https://smartstore.naver.com/danjjansallim",
    scope: "domestic",
    region: { ko: "대한민국", en: "Korea" },
    languages: ["ko"],
    field: { ko: "생활 · 주방 상품", en: "Home & kitchen goods" },
    status: "active",
    verified: true,
  },

  /* ── 국외 · 글로벌 (KOMI's Unnie · AjakStudio) ────────────────────── */
  {
    id: "instagram",
    platform: "INSTAGRAM",
    account: "KOMI's Unnie",
    handle: "@ajakstudio.lab",
    url: "https://www.instagram.com/ajakstudio.lab/",
    scope: "global",
    region: { ko: "글로벌", en: "Global" },
    languages: ["ko", "en", "th", "ja", "ar", "tl", "vi"],
    field: { ko: "K-라이프", en: "K-life" },
    status: "active",
    verified: true,
    note: {
      ko: "필리핀·베트남·일본·두바이 위성 계정 4개의 핸들은 확인 후 등록합니다.",
      en: "Handles for the four satellite accounts (Philippines, Vietnam, Japan, Dubai) are pending verification.",
    },
  },
  {
    id: "threads",
    platform: "THREADS",
    account: "단짠살림 · KOMI's Unnie",
    handle: "@ajakstudio.lab",
    url: "https://www.threads.net/@ajakstudio.lab",
    scope: "global",
    region: { ko: "글로벌", en: "Global" },
    languages: ["ko", "en"],
    field: { ko: "일상 · 바이럴", en: "Daily life" },
    status: "active",
    verified: true,
  },
  {
    id: "tiktok",
    platform: "TIKTOK",
    account: "AjakStudio",
    handle: "@komi_0520",
    url: "https://www.tiktok.com/@komi_0520",
    scope: "global",
    region: { ko: "글로벌", en: "Global" },
    languages: ["en", "th"],
    field: { ko: "숏폼", en: "Short video" },
    status: "active",
    verified: true,
  },
  {
    id: "youtube",
    platform: "YOUTUBE",
    account: "AjakStudioKFN",
    handle: "@K-컬처박스75",
    url: "https://www.youtube.com/@K-컬처박스75",
    scope: "global",
    region: { ko: "글로벌", en: "Global" },
    languages: ["ko", "en"],
    field: { ko: "쇼츠 · K-컬처", en: "Shorts · K-culture" },
    status: "active",
    verified: true,
    note: {
      ko: "채널명과 달리 고유 핸들은 옛 주소를 유지합니다.",
      en: "The unique handle keeps the original address, separate from the channel name.",
    },
  },
  {
    id: "xiaohongshu",
    platform: "XIAOHONGSHU",
    account: "komi_88",
    handle: "komi_88",
    url: "https://xhslink.cn/o/4MnsV7lTcNU",
    scope: "global",
    region: { ko: "중국", en: "China" },
    languages: ["zh"],
    field: { ko: "K-라이프", en: "K-life" },
    status: "active",
    verified: true,
    note: {
      ko: "외부 링크·유도 문구 없이 계정 성장용으로만 운영합니다.",
      en: "Kept free of outbound links and calls to action; used purely for account growth.",
    },
  },
] as const;

/** Domestic and overseas shelves, in menu order. */
export const domesticChannels = channels.filter((channel) => channel.scope === "domestic");
export const globalChannels = channels.filter((channel) => channel.scope === "global");

/** The GitHub showcase is not a social channel; the footer and About carry it. */
export const showcase = {
  name: "아작 쇼케이스",
  handle: "ajak-75.github.io",
  url: "https://ajak-75.github.io/",
  note: {
    ko: "아작 쇼케이스 — 새 앱과 게임이 가장 먼저 올라오는 실시간 공간입니다.",
    en: "Ajak Showcase — the live space where new apps and games land first.",
  } satisfies Localized,
};

/** News seeds — only published rows render on the public site. */
export const news: readonly NewsEntry[] = [
  {
    id: "site-build-02",
    date: "2026-11-22",
    title: {
      ko: "앱과 채널을 두 갈래로 나눠 홈페이지를 다시 엮었습니다",
      en: "Apps and channels put on two shelves — the site is rewoven",
    },
    excerpt: {
      ko: "코미·모모 유니버스와 독립 앱, 단짠살림의 국내 채널과 글로벌 채널을 한눈에 나눠 담았습니다. 모모 어드벤처 런이 라이브로 합류했습니다.",
      en: "The KOMI & MOMO universe and the independent apps, the Korean and the global channels — each on its own shelf. MOMO ADVENTURE RUN joins as a live game.",
    },
    status: "published",
  },
  {
    id: "site-build-01",
    date: "2026-11-20",
    title: {
      ko: "아작스튜디오, 공식 사이트를 열었습니다",
      en: "AjakStudio opens its official site",
    },
    excerpt: {
      ko: "흩어져 있던 앱과 게임, 국내외 채널을 한곳에서 만날 수 있도록 공식 사이트를 열었습니다. 코미와 모모의 세계가 이제 한 주소에서 시작됩니다.",
      en: "The scattered apps, games and channels now meet in one place — the official site is open. The world of KOMI and MOMO begins at a single address.",
    },
    status: "published",
  },
] as const;

/** Brand axes, not tallies — the list keeps growing, so no fixed counts here. */
export const siteFacts = [
  { value: "KOMI & MOMO", labelKey: "UNIVERSE" },
  { value: "APPS & AGENT", labelKey: "TOOLS" },
  { value: "KR & GLOBAL", labelKey: "CHANNELS" },
] as const;
