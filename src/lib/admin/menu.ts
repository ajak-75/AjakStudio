/** The fifteen Control Center menus, in the order the brief lists them. */
export interface AdminMenuItem {
  id: string;
  no: string;
  ko: string;
  en: string;
  group: "FIELD" | "STUDIO" | "CONTENT" | "WORK" | "SYSTEM";
}

export const ADMIN_MENU: AdminMenuItem[] = [
  { id: "overview", no: "01", ko: "전체 사업 현황", en: "Overview", group: "FIELD" },
  { id: "apps", no: "02", ko: "앱 관리", en: "Apps", group: "FIELD" },
  { id: "channels", no: "03", ko: "SNS 채널", en: "SNS channels", group: "FIELD" },
  { id: "hero", no: "04", ko: "Hero Studio", en: "Hero Studio", group: "STUDIO" },
  { id: "contents", no: "05", ko: "콘텐츠", en: "Content", group: "CONTENT" },
  { id: "images", no: "06", ko: "이미지 자료실", en: "Images", group: "CONTENT" },
  { id: "videos", no: "07", ko: "영상 자료실", en: "Videos", group: "CONTENT" },
  { id: "docs", no: "08", ko: "문서 자료실", en: "Documents", group: "CONTENT" },
  { id: "prompts", no: "09", ko: "AI 프롬프트", en: "Prompt vault", group: "CONTENT" },
  { id: "projects", no: "10", ko: "프로젝트", en: "Projects", group: "WORK" },
  { id: "tasks", no: "11", ko: "작업 일정", en: "Schedule", group: "WORK" },
  { id: "github", no: "12", ko: "GitHub 저장소", en: "GitHub", group: "SYSTEM" },
  { id: "notion", no: "13", ko: "Notion 연결", en: "Notion", group: "SYSTEM" },
  { id: "finance", no: "14", ko: "매출 및 비용", en: "Finance", group: "SYSTEM" },
  { id: "backup", no: "15", ko: "백업 관리", en: "Backup", group: "SYSTEM" },
];

export const GROUP_LABEL: Record<AdminMenuItem["group"], { ko: string; en: string }> = {
  FIELD: { ko: "사업 현황", en: "The business" },
  STUDIO: { ko: "스튜디오", en: "Studio" },
  CONTENT: { ko: "콘텐츠", en: "Content" },
  WORK: { ko: "작업", en: "Work" },
  SYSTEM: { ko: "시스템", en: "System" },
};

export function isAdminSection(value: string): boolean {
  return ADMIN_MENU.some((item) => item.id === value);
}
