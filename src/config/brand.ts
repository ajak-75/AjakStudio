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

export interface AppEntry {
  id: string;
  name: string;
  tagline: Localized;
  summary: Localized;
  category: AppCategory;
  platform: AppPlatform;
  status: AppStatus;
  /** Public URL. `null` renders as "coming soon" — never a guess. */
  url: string | null;
  repo: string | null;
  year: string;
}

export type ChannelStatus = "active" | "preparing" | "paused";

export interface ChannelEntry {
  id: string;
  platform: string;
  account: string;
  handle: string | null;
  /** Only URLs verifiable from the project record are filled in. */
  url: string | null;
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
  name: "GLOBAL DIGITAL UNIVERSE",
  shortName: "GDU",
  monogram: "GDU",
  tagline: {
    ko: "글로벌 디지털 사업의 새로운 본부",
    en: "The new headquarters for a global digital business",
  } satisfies Localized,
  founded: "2026",
  base: { ko: "서울 · 대한민국", en: "Seoul · Republic of Korea" } satisfies Localized,
  /** Official inbox is not public yet; the contact page says so instead of inventing one. */
  email: null as string | null,
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

/** Five live services. Repositories are never modified by this site. */
export const apps: readonly AppEntry[] = [
  {
    id: "ajak",
    name: "Ajak",
    tagline: { ko: "한국형 소셜, 아작", en: "A Korean social feed, Ajak" },
    summary: {
      ko: "사진과 글로 가볍게 이어지는 소셜 피드. 기기 언어를 자동으로 감지해 15개 언어로 열립니다.",
      en: "A light social feed for photos and words, opening in fifteen languages through automatic device-language detection.",
    },
    category: "social",
    platform: "web",
    status: "live",
    url: "https://ajak-75.github.io/diary/",
    repo: "https://github.com/ajak-75/diary",
    year: "2026",
  },
  {
    id: "komi-diary",
    name: "KOMI-Diary",
    tagline: { ko: "코미의 K-컬처 다이어리", en: "KOMI's K-culture diary" },
    summary: {
      ko: "세계의 팬이 모이는 K-컬처 커뮤니티. 케미, 실시간 번역, 단청 스티커, 모모 샵까지 한 앱에 담았습니다.",
      en: "A K-culture community for a worldwide fandom: Kemi matching, live translation, dancheong stickers and the MOMO shop in one app.",
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
    tagline: { ko: "코미와 모모의 합치기 퍼즐", en: "A merge puzzle with KOMI and MOMO" },
    summary: {
      ko: "3D 캐릭터를 합쳐 점수를 쌓는 캐주얼 퍼즐. 열 가지 의상과 단청 꽃이 차례로 등장합니다.",
      en: "A casual merge puzzle: drop, combine and grow through ten character costumes and dancheong blossoms.",
    },
    category: "game",
    platform: "web",
    status: "live",
    url: "https://ajak-75.github.io/komi-pop/",
    repo: "https://github.com/ajak-75/ajak-75.github.io",
    year: "2026",
  },
  {
    id: "k-sajoo",
    name: "K-Sajoo",
    tagline: { ko: "글로벌 사주 리딩", en: "Korean saju, read globally" },
    summary: {
      ko: "실제 만세력 계산으로 사주와 궁합을 풀어내는 글로벌 리딩 앱. 한자 대신 각 나라의 언어로 읽힙니다.",
      en: "A global reading app that computes saju and compatibility from real astronomical calendars, in the reader's language and without Chinese characters.",
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
    tagline: { ko: "안드로이드 AI 비서", en: "An Android AI assistant" },
    summary: {
      ko: "대화·기억·작업 기록을 기기 안 SQLite에 두고 필요할 때만 클라우드로 넘기는 독립형 AI 에이전트. 1단계 APK로 배포됩니다.",
      en: "A standalone AI agent that keeps conversations, memory and tasks in the device's SQLite, syncing only when needed. Distributed as a phase-one APK.",
    },
    category: "utility",
    platform: "android",
    status: "beta",
    url: "https://github.com/ajak-75/ABI-ai-agent",
    repo: "https://github.com/ajak-75/ABI-ai-agent",
    year: "2026",
  },
] as const;

/** Games slate: one playable, two in production (names stay editable in the admin). */
export const games = [
  {
    id: "komi-momo-pop",
    name: "KOMI & MOMO POP",
    tagline: {
      ko: "떨어뜨리고, 합치고, 커지는 캐주얼 퍼즐",
      en: "Drop, merge, and grow — a casual puzzle",
    } satisfies Localized,
    status: "live" as AppStatus,
    url: "https://ajak-75.github.io/komi-pop/",
    year: "2026",
  },
  {
    id: "momo-run",
    name: "MOMO'S ADVENTURE RUN",
    tagline: {
      ko: "모모가 달리는 사이드 스크롤 러너",
      en: "A side-scrolling runner starring MOMO",
    } satisfies Localized,
    status: "coming_soon" as AppStatus,
    url: null,
    year: "—",
  },
  {
    id: "game-03",
    name: "GAME 03",
    tagline: {
      ko: "이름을 준비 중인 세 번째 게임",
      en: "A third game, still unnamed",
    } satisfies Localized,
    status: "coming_soon" as AppStatus,
    url: null,
    year: "—",
  },
] as const;

/**
 * Eight external channels. A URL appears only when it is documented in the
 * project record; anything unconfirmed stays `null` and renders as "확인 중".
 */
export const channels: readonly ChannelEntry[] = [
  {
    id: "naver-blog",
    platform: "NAVER BLOG",
    account: "단짠살림",
    handle: "songja75",
    url: "https://blog.naver.com/songja75",
    region: { ko: "대한민국", en: "Korea" },
    languages: ["ko"],
    field: { ko: "살림 · 절약", en: "Home & saving" },
    status: "active",
    verified: true,
    note: {
      ko: "두 번째 블로그 KFN 미디어 팩트(sjwson12)도 함께 운영합니다.",
      en: "A second blog, KFN Media Fact (sjwson12), runs alongside.",
    },
  },
  {
    id: "naver-cafe",
    platform: "NAVER CAFE",
    account: "단짠살림",
    handle: "danjjansallim",
    url: "https://cafe.naver.com/danjjansallim",
    region: { ko: "대한민국", en: "Korea" },
    languages: ["ko"],
    field: { ko: "커뮤니티", en: "Community" },
    status: "active",
    verified: true,
  },
  {
    id: "instagram",
    platform: "INSTAGRAM",
    account: "KOMI's Unnie",
    handle: "@ajakstudio.lab",
    url: "https://www.instagram.com/ajakstudio.lab/",
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
    region: { ko: "대한민국", en: "Korea" },
    languages: ["ko"],
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
  {
    id: "showcase",
    platform: "SHOWCASE",
    account: "Ajak Studio",
    handle: "ajak-75.github.io",
    url: "https://ajak-75.github.io/",
    region: { ko: "글로벌", en: "Global" },
    languages: ["ko", "en"],
    field: { ko: "앱 쇼케이스", en: "App showcase" },
    status: "active",
    verified: true,
    note: {
      ko: "GLOBAL DIGITAL UNIVERSE가 완성되면 이 사이트가 쇼케이스 역할을 이어받습니다.",
      en: "Once this site is complete, it takes over the showcase role.",
    },
  },
] as const;

/** News seeds — only published rows render on the public site. */
export const news: readonly NewsEntry[] = [
  {
    id: "site-build-01",
    date: "2026-11-20",
    title: {
      ko: "GLOBAL DIGITAL UNIVERSE, 공식 사이트 구축을 시작합니다",
      en: "GLOBAL DIGITAL UNIVERSE begins building its official site",
    },
    excerpt: {
      ko: "다섯 개 앱과 여덟 개 채널을 하나로 잇는 공식 사이트의 설계와 기반 공사를 시작했습니다. 에디토리얼 화이트 디자인 시스템, Supabase 데이터 구조, 무료 인프라 기준을 먼저 세웁니다.",
      en: "Design and groundwork have started for an official site that connects five apps and eight channels: an Editorial White design system, a Supabase data structure and a free-infrastructure baseline come first.",
    },
    status: "published",
  },
] as const;

export const siteFacts = [
  { value: "05", labelKey: "SERVICES" },
  { value: "08", labelKey: "CHANNELS" },
  { value: "03", labelKey: "GAMES" },
  { value: "₩0", labelKey: "INFRASTRUCTURE COST" },
] as const;
