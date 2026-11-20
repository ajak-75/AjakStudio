import { bi, type EntityDef } from "./types";

/** Column + form definitions for every generic collection. */

const appStatus = [
  { value: "live", label: bi("운영 중", "Live") },
  { value: "beta", label: bi("베타", "Beta") },
  { value: "coming_soon", label: bi("준비 중", "Coming soon") },
  { value: "archived", label: bi("보관", "Archived") },
];

const appCategory = [
  { value: "social", label: bi("소셜", "Social") },
  { value: "community", label: bi("커뮤니티", "Community") },
  { value: "game", label: bi("게임", "Game") },
  { value: "culture", label: bi("컬처", "Culture") },
  { value: "utility", label: bi("유틸리티", "Utility") },
];

const appPlatform = [
  { value: "web", label: bi("웹", "Web") },
  { value: "android", label: bi("안드로이드", "Android") },
  { value: "ios", label: bi("iOS", "iOS") },
  { value: "both", label: bi("웹+iOS", "Web + iOS") },
];

const channelStatus = [
  { value: "active", label: bi("운영 중", "Active") },
  { value: "preparing", label: bi("준비 중", "Preparing") },
  { value: "paused", label: bi("휴면", "Paused") },
];

const contentStatus = [
  { value: "draft", label: bi("초안", "Draft") },
  { value: "review", label: bi("검수", "Review") },
  { value: "published", label: bi("게시", "Published") },
  { value: "archived", label: bi("보관", "Archived") },
];

const contentSlot = [
  { value: "HOME", label: bi("HOME", "HOME") },
  { value: "ABOUT", label: bi("ABOUT", "ABOUT") },
  { value: "APPS", label: bi("OUR APPS", "OUR APPS") },
  { value: "GAMES", label: bi("GAMES", "GAMES") },
  { value: "K-CULTURE", label: bi("K-CULTURE", "K-CULTURE") },
  { value: "MEDIA", label: bi("MEDIA", "MEDIA") },
  { value: "NEWS", label: bi("NEWS", "NEWS") },
  { value: "CONTACT", label: bi("CONTACT", "CONTACT") },
];

const contentType = [
  { value: "copy", label: bi("페이지 문구", "Page copy") },
  { value: "news", label: bi("소식", "News") },
  { value: "note", label: bi("메모", "Note") },
];

const projectStatus = [
  { value: "idea", label: bi("아이디어", "Idea") },
  { value: "in_progress", label: bi("진행 중", "In progress") },
  { value: "live", label: bi("운영 중", "Live") },
  { value: "paused", label: bi("보류", "Paused") },
  { value: "archived", label: bi("보관", "Archived") },
];

const taskStatus = [
  { value: "planned", label: bi("예정", "Planned") },
  { value: "doing", label: bi("진행 중", "Doing") },
  { value: "done", label: bi("완료", "Done") },
  { value: "skipped", label: bi("건너뜀", "Skipped") },
];

const priority = [
  { value: "high", label: bi("높음", "High") },
  { value: "normal", label: bi("보통", "Normal") },
  { value: "low", label: bi("낮음", "Low") },
];

const videoProvider = [
  { value: "youtube", label: bi("YouTube", "YouTube") },
  { value: "drive", label: bi("Google Drive", "Google Drive") },
  { value: "vimeo", label: bi("Vimeo", "Vimeo") },
  { value: "other", label: bi("기타", "Other") },
];

const videoStatus = [
  { value: "published", label: bi("공개", "Published") },
  { value: "draft", label: bi("비공개 초안", "Draft") },
  { value: "private", label: bi("링크 전용", "Link only") },
];

const docKind = [
  { value: "plan", label: bi("기획서", "Plan") },
  { value: "contract", label: bi("계약", "Contract") },
  { value: "guide", label: bi("가이드", "Guide") },
  { value: "invoice", label: bi("정산", "Invoice") },
  { value: "other", label: bi("기타", "Other") },
];

export const entityDefs: Record<string, EntityDef> = {
  apps: {
    key: "apps",
    eyebrow: "MENU 02 · APP CATALOGUE",
    title: bi("앱 관리", "Apps"),
    description: bi(
      "공개 사이트의 OUR APPS·GAMES 목록과 같은 레코드입니다. 새 앱이나 게임을 추가하면 이 목록이 기준이 됩니다.",
      "The same records that feed OUR APPS and GAMES. A new app or game starts here.",
    ),
    primary: "name",
    searchKeys: ["name", "slug", "url"],
    fields: [
      { key: "name", kind: "text", label: bi("이름", "Name"), required: true, list: true },
      { key: "slug", kind: "text", label: bi("슬러그", "Slug"), hint: bi("URL·저장소에 쓰는 짧은 이름", "Short id used in URLs") },
      { key: "tagline", kind: "bi", label: bi("한 줄 소개", "Tagline"), list: true },
      { key: "summary", kind: "biTextarea", label: bi("설명", "Summary") },
      { key: "category", kind: "select", label: bi("분류", "Category"), options: appCategory, list: true },
      { key: "platform", kind: "select", label: bi("플랫폼", "Platform"), options: appPlatform },
      { key: "status", kind: "select", label: bi("상태", "Status"), options: appStatus, list: true },
      { key: "url", kind: "url", label: bi("공개 주소", "Public URL"), list: true, hint: bi("없으면 비워 두세요 — 사이트는 '준비 중'으로 표시합니다", "Leave empty to show “coming soon”") },
      { key: "repo", kind: "url", label: bi("저장소", "Repository") },
      { key: "year", kind: "text", label: bi("연도", "Year") },
      { key: "sort", kind: "number", label: bi("정렬", "Order"), min: 0, step: 1 },
      { key: "visible", kind: "boolean", label: bi("공개", "Visible") },
    ],
  },
  channels: {
    key: "channels",
    eyebrow: "MENU 03 · MEDIA CHANNELS",
    title: bi("SNS 채널", "SNS channels"),
    description: bi(
      "여덟 개 채널의 주소·프로필·국가·언어·분야·상태를 관리합니다. 새 플랫폼도 추가할 수 있습니다.",
      "Address, profile, region, language, field and status for all eight channels — plus any new platform.",
    ),
    primary: "platform",
    searchKeys: ["platform", "account", "handle", "url"],
    fields: [
      { key: "platform", kind: "text", label: bi("플랫폼", "Platform"), required: true, list: true },
      { key: "account", kind: "text", label: bi("계정명", "Account"), list: true },
      { key: "handle", kind: "text", label: bi("핸들", "Handle") },
      { key: "url", kind: "url", label: bi("주소", "URL"), list: true },
      { key: "region", kind: "bi", label: bi("국가", "Region") },
      { key: "languages", kind: "tags", label: bi("언어", "Languages"), hint: bi("쉼표로 구분: ko, en, zh", "Comma separated") },
      { key: "field", kind: "bi", label: bi("분야", "Field") },
      { key: "status", kind: "select", label: bi("상태", "Status"), options: channelStatus, list: true },
      { key: "verified", kind: "boolean", label: bi("주소 확인됨", "Verified URL") },
      { key: "note", kind: "biTextarea", label: bi("메모", "Note") },
      { key: "sort", kind: "number", label: bi("정렬", "Order"), min: 0, step: 1 },
    ],
  },
  contents: {
    key: "contents",
    eyebrow: "MENU 05 · CONTENT",
    title: bi("콘텐츠", "Content"),
    description: bi(
      "HOME·ABOUT·NEWS 등 페이지 문구와 게시물을 관리합니다. 상태가 '게시'인 소식만 공개 사이트에 나옵니다.",
      "Copy and posts for HOME, ABOUT, NEWS. Only published news rows appear on the public site.",
    ),
    primary: "key",
    searchKeys: ["key", "slot"],
    fields: [
      { key: "slot", kind: "select", label: bi("위치", "Slot"), options: contentSlot, list: true },
      { key: "key", kind: "text", label: bi("키", "Key"), required: true, list: true },
      { key: "type", kind: "select", label: bi("종류", "Type"), options: contentType, list: true },
      { key: "title", kind: "bi", label: bi("제목", "Title"), list: true },
      { key: "body", kind: "biTextarea", label: bi("본문", "Body") },
      { key: "status", kind: "select", label: bi("상태", "Status"), options: contentStatus, list: true },
      { key: "date", kind: "date", label: bi("날짜", "Date"), list: true },
      { key: "sort", kind: "number", label: bi("정렬", "Order"), min: 0, step: 1 },
    ],
  },
  videos: {
    key: "videos",
    eyebrow: "MENU 07 · VIDEO ARCHIVE",
    title: bi("영상 자료실", "Video archive"),
    description: bi(
      "영상은 업로드하지 않고 외부 링크로만 보관합니다. Supabase 무료 스토리지 1GB 안내가 함께 표시됩니다.",
      "Videos are linked, never uploaded. The 1 GB free Storage budget is shown alongside.",
    ),
    primary: "title",
    searchKeys: ["title", "url", "provider"],
    fields: [
      { key: "title", kind: "text", label: bi("제목", "Title"), required: true, list: true },
      { key: "provider", kind: "select", label: bi("플랫폼", "Provider"), options: videoProvider, list: true },
      { key: "url", kind: "url", label: bi("링크", "Link"), list: true },
      { key: "durationMin", kind: "number", label: bi("길이(분)", "Minutes"), min: 0, step: 1 },
      { key: "sizeMb", kind: "number", label: bi("원본 용량(MB)", "Source MB"), min: 0, step: 1, hint: bi("스토리지에 올리지 않으므로 참고값입니다", "Reference only — nothing is uploaded") },
      { key: "status", kind: "select", label: bi("공개 범위", "Visibility"), options: videoStatus, list: true },
      { key: "note", kind: "textarea", label: bi("메모", "Note") },
    ],
  },
  docs: {
    key: "docs",
    eyebrow: "MENU 08 · DOCUMENT ARCHIVE",
    title: bi("문서 자료실", "Document archive"),
    description: bi(
      "기획서·계약·가이드 문서를 링크와 메모로 관리합니다. 원본은 각 저장소(드라이브·노션·깃허브)에 둡니다.",
      "Plans, contracts and guides, kept as links and notes. Originals stay in Drive, Notion or GitHub.",
    ),
    primary: "title",
    searchKeys: ["title", "kind", "memo"],
    fields: [
      { key: "title", kind: "text", label: bi("문서명", "Title"), required: true, list: true },
      { key: "kind", kind: "select", label: bi("분류", "Kind"), options: docKind, list: true },
      { key: "url", kind: "url", label: bi("링크", "Link"), list: true },
      { key: "date", kind: "date", label: bi("날짜", "Date"), list: true },
      { key: "memo", kind: "textarea", label: bi("메모", "Memo") },
    ],
  },
  projects: {
    key: "projects",
    eyebrow: "MENU 10 · PROJECTS",
    title: bi("프로젝트", "Projects"),
    description: bi(
      "진행 상태와 목표를 한 표에서 봅니다. 작업 일정의 할 일이 이 프로젝트에 연결됩니다.",
      "Status and goal in one table; tasks link to these projects.",
    ),
    primary: "title",
    searchKeys: ["title", "goal", "owner"],
    fields: [
      { key: "title", kind: "text", label: bi("프로젝트", "Project"), required: true, list: true },
      { key: "goal", kind: "textarea", label: bi("목표", "Goal") },
      { key: "status", kind: "select", label: bi("상태", "Status"), options: projectStatus, list: true },
      { key: "phase", kind: "number", label: bi("단계", "Phase"), min: 0, step: 1, list: true },
      { key: "owner", kind: "text", label: bi("담당", "Owner") },
      { key: "start", kind: "date", label: bi("시작", "Start") },
      { key: "target", kind: "date", label: bi("목표일", "Target"), list: true },
      { key: "link", kind: "url", label: bi("링크", "Link") },
      { key: "note", kind: "textarea", label: bi("메모", "Note") },
      { key: "sort", kind: "number", label: bi("정렬", "Order"), min: 0, step: 1 },
    ],
  },
  tasks: {
    key: "tasks",
    eyebrow: "MENU 11 · SCHEDULE",
    title: bi("작업 일정", "Work schedule"),
    description: bi(
      "할 일과 마감일을 관리합니다. 마감이 7일 안으로 다가온 항목은 현황판에 함께 표시됩니다.",
      "Tasks and deadlines. Anything due within seven days is surfaced on the overview.",
    ),
    primary: "title",
    searchKeys: ["title", "note"],
    fields: [
      { key: "title", kind: "text", label: bi("할 일", "Task"), required: true, list: true },
      { key: "due", kind: "date", label: bi("마감", "Due"), list: true },
      { key: "status", kind: "select", label: bi("상태", "Status"), options: taskStatus, list: true },
      { key: "priority", kind: "select", label: bi("우선순위", "Priority"), options: priority, list: true },
      { key: "projectId", kind: "select", label: bi("프로젝트", "Project"), optionsFrom: "projects", optionLabel: "title" },
      { key: "note", kind: "textarea", label: bi("메모", "Note") },
    ],
  },
  repos: {
    key: "repos",
    eyebrow: "MENU 12 · GITHUB",
    title: bi("GitHub 저장소", "GitHub repositories"),
    description: bi(
      "이 사이트가 연결하는 저장소 목록입니다. 기존 앱 저장소는 링크만 걸고 수정하지 않습니다.",
      "Repositories this site links to. Existing app repositories are linked, never modified.",
    ),
    primary: "name",
    searchKeys: ["name", "role", "url"],
    fields: [
      { key: "name", kind: "text", label: bi("저장소", "Repository"), required: true, list: true },
      { key: "role", kind: "text", label: bi("역할", "Role"), list: true },
      { key: "url", kind: "url", label: bi("주소", "URL"), list: true },
      { key: "visibility", kind: "select", label: bi("공개 범위", "Visibility"), options: [
        { value: "public", label: bi("공개", "Public") },
        { value: "private", label: bi("비공개", "Private") },
      ], list: true },
      { key: "branch", kind: "text", label: bi("브랜치", "Branch") },
      { key: "note", kind: "textarea", label: bi("메모", "Note") },
    ],
  },
  finance: {
    key: "finance",
    eyebrow: "MENU 14 · FINANCE",
    title: bi("매출 및 비용", "Revenue & cost"),
    description: bi(
      "수입과 지출을 기록하고 월별 합계를 봅니다. 인프라 고정비 목표는 ₩0입니다.",
      "Record income and expenses, with monthly totals. The infrastructure cost target is ₩0.",
    ),
    primary: "item",
    searchKeys: ["item", "category", "note"],
    fields: [
      { key: "date", kind: "date", label: bi("날짜", "Date"), list: true, required: true },
      { key: "direction", kind: "select", label: bi("구분", "Direction"), options: [
        { value: "income", label: bi("수입", "Income") },
        { value: "expense", label: bi("지출", "Expense") },
      ], list: true },
      { key: "category", kind: "text", label: bi("분류", "Category"), list: true },
      { key: "item", kind: "text", label: bi("항목", "Item"), required: true, list: true },
      { key: "amount", kind: "number", label: bi("금액", "Amount"), min: 0, step: 1, list: true },
      { key: "currency", kind: "select", label: bi("통화", "Currency"), options: [
        { value: "KRW", label: bi("원 (KRW)", "KRW") },
        { value: "USD", label: bi("달러 (USD)", "USD") },
      ] },
      { key: "note", kind: "textarea", label: bi("메모", "Note") },
    ],
  },
};

/** Non-optional lookup for the sections, which are keyed by menu id. */
export function defFor(key: string): EntityDef {
  const def = entityDefs[key];
  if (!def) throw new Error(`Unknown entity definition: ${key}`);
  return def;
}
