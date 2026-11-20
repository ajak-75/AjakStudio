import { apps as brandApps, brand, channels as brandChannels, news } from "@/config/brand";
import { BUILTIN_HERO_IMAGES } from "./builtinImages";
import {
  bi,
  newId,
  nowIso,
  type AdminData,
  type AppRecord,
  type ChannelRecord,
  type ContentRecord,
  type DocRecord,
  type FinanceRecord,
  type HeroLayout,
  type HeroSnapshot,
  type ImageRecord,
  type NotionInfo,
  type ProjectRecord,
  type PromptRecord,
  type RepoRecord,
  type TaskRecord,
  type VideoRecord,
} from "./types";

/**
 * First-run seed. Every collection starts from the same typed records the
 * public site renders (`src/config/brand.ts`) plus the project facts we can
 * verify, so the Control Center is a real working database from the first
 * second — not an empty shell. Editing a row here never touches the public
 * fallback until a Hero/Publish action happens.
 */

const stamp = "2026-11-20T00:00:00.000Z";

function base(prefix: string, index: number) {
  const created = `2026-11-${String(10 + (index % 10)).padStart(2, "0")}T03:00:00.000Z`;
  return { id: newId(prefix), createdAt: created, updatedAt: created };
}

export const defaultHeroSnapshot: HeroSnapshot = {
  schema: 1,
  pc: {
    aspect: "16:9",
    ratioW: 16,
    ratioH: 9,
    background: "#fbfaf7",
    layers: [
      {
        id: "layer-default-hojakdo",
        assetId: "builtin-hojakdo",
        url: "/hero/hojakdo-clean.webp",
        x: 0.755,
        y: 0.5,
        scale: 0.46,
        crop: { x: 0, y: 0, w: 1, h: 1 },
        opacity: 1,
        visible: true,
      },
    ],
    text: {
      visible: true,
      kicker: "INDEPENDENT DIGITAL STUDIO — SEOUL, KOREA",
      headline: "디지털 세계를\n하나의 브랜드로\n엮어 갑니다",
      headlineEn: "The digital world,\nwoven into one brand",
      subcopy:
        "다섯 개의 앱, 여덟 개의 채널, 그리고 아직 이름 없는 다음 프로젝트까지. 흩어져 있던 디지털 사업을 한곳에 모아 세계에 보여 주는 본부를 만듭니다.",
      subcopyEn:
        "Five apps, eight channels, and a next project that has no name yet — one headquarters for a scattered digital business.",
      x: 0.055,
      y: 0.245,
      align: "left",
      color: "#14140f",
      headlineScale: 0.088,
      scrim: 0,
      maxWidth: 0.42,
    },
  },
  mobile: {
    aspect: "free",
    ratioW: 3,
    ratioH: 4,
    background: "#fbfaf7",
    layers: [
      {
        id: "layer-default-hojakdo-m",
        assetId: "builtin-hojakdo",
        url: "/hero/hojakdo-clean.webp",
        x: 0.5,
        y: 0.28,
        scale: 0.5,
        crop: { x: 0, y: 0, w: 1, h: 1 },
        opacity: 1,
        visible: true,
      },
    ],
    text: {
      visible: true,
      kicker: "GLOBAL DIGITAL UNIVERSE",
      headline: "디지털 세계를\n하나의 브랜드로\n엮어 갑니다",
      headlineEn: "The digital world,\ninto one brand",
      subcopy: "다섯 개의 앱, 여덟 개의 채널, 그리고 다음 프로젝트까지. 흩어진 디지털 사업을 한곳에 모읍니다.",
      subcopyEn: "Five apps, eight channels, and the next project — one place for a scattered digital business.",
      x: 0.07,
      y: 0.57,
      align: "left",
      color: "#14140f",
      headlineScale: 0.062,
      scrim: 0,
      maxWidth: 0.8,
    },
  },
};

function seedApps(): AppRecord[] {
  return brandApps.map((app, index) => ({
    ...base("app", index),
    name: app.name,
    slug: app.id,
    tagline: { ...app.tagline },
    summary: { ...app.summary },
    category: app.category,
    platform: app.platform,
    status: app.status,
    url: app.url,
    repo: app.repo,
    year: app.year,
    sort: index,
    visible: true,
  }));
}

function seedChannels(): ChannelRecord[] {
  return brandChannels.map((channel, index) => ({
    ...base("ch", index),
    platform: channel.platform,
    account: channel.account,
    handle: channel.handle ?? "",
    url: channel.url,
    region: { ...channel.region },
    languages: [...channel.languages],
    field: { ...channel.field },
    status: channel.status,
    verified: channel.verified,
    note: channel.note ? { ...channel.note } : { ko: "", en: "" },
    sort: index,
  }));
}

function seedContents(): ContentRecord[] {
  const homeCopy: Array<{ key: string; ko: string; en: string; slot: ContentRecord["slot"] }> = [
    {
      key: "hero.title",
      slot: "HOME",
      ko: "디지털 세계를 하나의 브랜드로 엮어 갑니다",
      en: "We tie the digital world into one brand",
    },
    {
      key: "hero.lead",
      slot: "HOME",
      ko: "다섯 개의 앱, 여덟 개의 채널, 그리고 아직 이름 없는 다음 프로젝트까지.",
      en: "Five apps, eight channels, and a next project that has no name yet.",
    },
    {
      key: "about.lead",
      slot: "ABOUT",
      ko: "한 사람의 20년 아이디어에서 출발한 디지털 사업 본부입니다.",
      en: "A digital business headquarters that began with one person's twenty-year idea.",
    },
    {
      key: "contact.lead",
      slot: "CONTACT",
      ko: "협업, 제휴, 인터뷰 문의를 기다립니다.",
      en: "We welcome collaboration, partnership and interview enquiries.",
    },
  ];

  const copyRows: ContentRecord[] = homeCopy.map((row, index) => ({
    ...base("ct", index),
    slot: row.slot,
    key: row.key,
    type: "copy",
    title: bi(row.key, row.key),
    body: bi(row.ko, row.en),
    status: "published",
    date: "2026-11-20",
    sort: index,
  }));

  const newsRows: ContentRecord[] = news.map((item, index) => ({
    ...base("ct", index + 10),
    slot: "NEWS",
    key: item.id,
    type: "news",
    title: { ...item.title },
    body: { ...item.excerpt },
    status: item.status === "published" ? "published" : "draft",
    date: item.date,
    sort: index,
  }));

  return [...copyRows, ...newsRows];
}

function seedPrompts(): PromptRecord[] {
  const rows: Array<Omit<PromptRecord, "id" | "createdAt" | "updatedAt" | "uses">> = [
    {
      title: "히어로 시안 검수 (Editorial White)",
      category: "디자인",
      body:
        "다음 히어로 시안을 에디토리얼 화이트 원칙으로 검수해 줘.\n1) 포슬린 배경 위 먹색 하나·놋쇠색 하나만 쓰였는지\n2) 제목 세리프와 정보 산세리프가 역할대로 나뉘었는지\n3) 375px에서 제목 3줄이 넘지 않는지, 좌우 여백이 20px 이상인지\n4) 이미지가 글자를 이기지 않는지(스크림·대비)\n문제만 번호로 짚고, 고칠 값을 구체적으로 제시해 줘.",
      tags: ["hero", "design", "review"],
      favorite: true,
    },
    {
      title: "상품 소싱 검증 (0원·불만리뷰)",
      category: "커머스",
      body:
        "상품 후보를 소싱 철칙으로 검증해 줘: ① 단일 직링크 도매가 ② 쿠팡 최저가 대비 마진 ③ 불만 리뷰 3개 이상의 공통 불편 ④ 배송비·부피·계절성 ⑤ 내 브랜드(PB)로 갈 수 있는지. 부적합이면 '패스'라고 먼저 쓰고 이유를 한 줄로.",
      tags: ["sourcing", "coupang"],
      favorite: false,
    },
    {
      title: "블로그 톤 리라이팅",
      category: "콘텐츠",
      body:
        "아래 글을 사람이 쉽고 다정하고 유머러스하게 다시 써 줘. 보도자료 같은 문장은 풀고, 문단은 2~3문장으로 끊고, 숫자와 실제 경험만 남겨. 과장·느낌표·이모지는 빼고, 마지막에 한 줄 요약을 붙여.",
      tags: ["blog", "tone"],
      favorite: true,
    },
  ];

  return rows.map((row, index) => ({
    ...base("pr", index),
    ...row,
    uses: 0,
  }));
}

function seedProjects(): ProjectRecord[] {
  const rows: Array<{
    title: string;
    goal: string;
    status: ProjectRecord["status"];
    phase: number;
    target: string;
    link: string;
    note: string;
  }> = [
    {
      title: "GLOBAL DIGITAL UNIVERSE 공식 사이트",
      goal: "5개 앱·8개 채널을 잇는 공개 사이트와 비공개 Control Center를 0원 인프라로 운영",
      status: "in_progress",
      phase: 4,
      target: "2026-11-30",
      link: "https://github.com/ajak-75/AjakStudio",
      note: "4단계: 관리자 15개 메뉴 + Hero Studio. 5단계에서 Cloudflare Pages·Supabase 연결.",
    },
    {
      title: "Hero Studio 첫 게시",
      goal: "실제 업로드 이미지로 HOME 히어로를 게시해 공개 페이지에 반영",
      status: "in_progress",
      phase: 1,
      target: "2026-11-22",
      link: "",
      note: "촬영·보유 이미지 중 세로·가로 비율이 모두 살아나는 컷으로 시작.",
    },
    {
      title: "Ajak (한국형 소셜)",
      goal: "사진과 글로 이어지는 가벼운 소셜 피드, 15개 언어 자동",
      status: "live",
      phase: 6,
      target: "",
      link: "https://ajak-75.github.io/diary/",
      note: "Supabase 공용 DB 전환은 이용자 반응을 본 뒤.",
    },
    {
      title: "KOMI-Diary",
      goal: "세계 팬이 모이는 K-컬처 커뮤니티",
      status: "live",
      phase: 31,
      target: "",
      link: "https://ajak-75.github.io/KOMI-Diary/",
      note: "케미·실시간 번역·단청 스티커·모모 샵.",
    },
    {
      title: "KOMI & MOMO POP",
      goal: "코미·모모 합치기 퍼즐의 v3 캐릭터 배포",
      status: "live",
      phase: 3,
      target: "",
      link: "https://ajak-75.github.io/komi-pop/",
      note: "남은 검증: 게임 오버 → 결과 → 다시하기 실화면.",
    },
    {
      title: "K-Sajoo",
      goal: "한자 없는 글로벌 사주 리딩, 실제 만세력 계산",
      status: "live",
      phase: 2,
      target: "",
      link: "https://ajak-75.github.io/k-sajoo/",
      note: "121/121 유닛 테스트 통과. 음력 변환표는 추후.",
    },
    {
      title: "ABI — Android AI Agent",
      goal: "기기 안 SQLite에 기억을 두는 독립형 AI 비서",
      status: "in_progress",
      phase: 1,
      target: "",
      link: "https://github.com/ajak-75/ABI-ai-agent",
      note: "1단계 APK 배포.",
    },
    {
      title: "단짠살림 스마트스토어",
      goal: "저가 상품에 지친 구매자를 위한 7종 셀렉션, 이후 PB",
      status: "in_progress",
      phase: 7,
      target: "",
      link: "",
      note: "사업자 전환은 11-17 보류 결정.",
    },
  ];

  return rows.map((row, index) => ({ ...base("pj", index), ...row, owner: "진아", start: "2026-11-07", sort: index }));
}

function seedTasks(): TaskRecord[] {
  const rows: Array<{ title: string; due: string; status: TaskRecord["status"]; priority: TaskRecord["priority"]; note: string }> = [
    { title: "4단계 관리자 15개 메뉴 실사용 점검", due: "2026-11-20", status: "doing", priority: "high", note: "로컬 미리보기에서 행 추가·수정·삭제 확인" },
    { title: "Hero Studio 첫 시안 저장·게시", due: "2026-11-21", status: "planned", priority: "high", note: "PC 16:9 / 모바일 4:3 각각 확인" },
    { title: "Supabase 프로젝트 생성 + 스키마 실행", due: "2026-11-24", status: "planned", priority: "normal", note: "DATABASE_SCHEMA.sql 1회 실행" },
    { title: "Cloudflare Pages 연결 (5단계)", due: "2026-11-27", status: "planned", priority: "normal", note: "빌드 출력 out/, 환경변수 3개" },
    { title: "주 1회 JSON 백업", due: "2026-11-27", status: "planned", priority: "low", note: "백업 관리 → 내보내기" },
  ];

  return rows.map((row, index) => ({
    ...base("tk", index),
    ...row,
    projectId: "",
  }));
}

function seedRepos(): RepoRecord[] {
  const rows: Array<{ name: string; url: string; role: string; visibility: RepoRecord["visibility"]; branch: string; note: string }> = [
    {
      name: "ajak-75/AjakStudio",
      url: "https://github.com/ajak-75/AjakStudio",
      role: "GLOBAL DIGITAL UNIVERSE (이 사이트 + Control Center)",
      visibility: "private",
      branch: "main",
      note: "Next.js 정적 export · 이 저장소만 이 프로젝트에서 수정합니다.",
    },
    {
      name: "ajak-75/diary",
      url: "https://github.com/ajak-75/diary",
      role: "Ajak — 한국형 소셜 앱",
      visibility: "public",
      branch: "main",
      note: "GitHub Pages /diary/ · 읽기 전용 링크",
    },
    {
      name: "ajak-75/KOMI-Diary",
      url: "https://github.com/ajak-75/KOMI-Diary",
      role: "KOMI-Diary — K-컬처 커뮤니티",
      visibility: "public",
      branch: "main",
      note: "GitHub Pages /KOMI-Diary/ · 읽기 전용 링크",
    },
    {
      name: "ajak-75/ajak-75.github.io",
      url: "https://github.com/ajak-75/ajak-75.github.io",
      role: "Ajak Studio 쇼케이스 · komi-pop/ · k-sajoo/",
      visibility: "public",
      branch: "main",
      note: "GitHub Pages 루트 · 읽기 전용 링크",
    },
    {
      name: "ajak-75/ABI-ai-agent",
      url: "https://github.com/ajak-75/ABI-ai-agent",
      role: "ABI — Android AI Agent",
      visibility: "private",
      branch: "main",
      note: "APK 배포 저장소",
    },
    {
      name: "ajak-75/personalstylist-studio",
      url: "https://github.com/ajak-75/personalstylist-studio",
      role: "11-08 첫 소셜 앱 초안 (보관)",
      visibility: "private",
      branch: "main",
      note: "실제 앱은 diary로 새로 제작. 저장소명 변경 여부 미확인.",
    },
  ];

  return rows.map((row, index) => ({ ...base("rp", index), ...row }));
}

function seedNotion(): NotionInfo {
  return {
    workspace: "진아 송님의 워크스페이스",
    url: "",
    connected: true,
    note:
      "연결은 Pickle 앱의 Notion 연결로 관리합니다. Control Center는 링크·메모만 보관하고, 노션 원본을 수정하지 않습니다.",
    databases: [],
  };
}

export function createSeedData(): AdminData {
  const layouts: HeroLayout[] = [
    {
      ...base("hero", 1),
      name: "home-hero",
      version: 1,
      snapshot: structuredCloneSafe(defaultHeroSnapshot),
      published: false,
      publishedAt: null,
      note: "기본 시안 — 까치 호랑이 클린본. 수정 후 저장하면 v2가 됩니다.",
    },
  ];

  const videos: VideoRecord[] = [];
  const docs: DocRecord[] = [];
  const images: ImageRecord[] = BUILTIN_HERO_IMAGES.map((image) => structuredCloneSafe(image));
  const finance: FinanceRecord[] = [];

  return {
    schemaVersion: 1,
    updatedAt: nowIso(),
    apps: seedApps(),
    channels: seedChannels(),
    contents: seedContents(),
    images,
    videos,
    docs,
    prompts: seedPrompts(),
    projects: seedProjects(),
    tasks: seedTasks(),
    repos: seedRepos(),
    notion: seedNotion(),
    finance,
    heroLayouts: layouts,
    backups: [],
  };
}

/** `structuredClone` is not in every static-export runtime; JSON is enough here. */
export function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const BRAND_SEED = {
  name: brand.name,
  tagline: brand.tagline,
  controlCenterPath: brand.controlCenterPath,
  seededAt: stamp,
};
