import type { AdminData, FinanceRecord, TaskRecord } from "./types";

/** Derived numbers for the overview, finance and archive panels. */

export interface OverviewMetrics {
  apps: number;
  liveApps: number;
  games: number;
  channels: number;
  activeChannels: number;
  publishedContents: number;
  contents: number;
  images: number;
  archivedImages: number;
  videos: number;
  docs: number;
  prompts: number;
  projects: number;
  activeProjects: number;
  tasks: number;
  openTasks: number;
  dueSoon: number;
  heroVersions: number;
  publishedHero: boolean;
  monthlyCost: number;
  monthlyIncome: number;
  storageMb: number;
}

const DAY = 24 * 60 * 60 * 1000;

export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function daysUntil(iso: string, from = todayIso()): number | null {
  if (!iso) return null;
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return null;
  const start = Date.parse(from);
  if (Number.isNaN(start)) return null;
  return Math.round((target - start) / DAY);
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function overviewMetrics(data: AdminData): OverviewMetrics {
  const month = new Date().toISOString().slice(0, 7);
  const finance = financeTotals(data.finance, month);
  const storageBytes = data.images.reduce((sum, image) => sum + (image.byteSize || 0), 0);

  return {
    apps: data.apps.length,
    liveApps: data.apps.filter((app) => app.status === "live").length,
    games: data.apps.filter((app) => app.category === "game").length,
    channels: data.channels.length,
    activeChannels: data.channels.filter((channel) => channel.status === "active").length,
    publishedContents: data.contents.filter((content) => content.status === "published").length,
    contents: data.contents.length,
    images: data.images.filter((image) => !image.archivedAt).length,
    archivedImages: data.images.filter((image) => image.archivedAt).length,
    videos: data.videos.length,
    docs: data.docs.length,
    prompts: data.prompts.length,
    projects: data.projects.length,
    activeProjects: data.projects.filter((project) => project.status === "in_progress").length,
    tasks: data.tasks.length,
    openTasks: data.tasks.filter((task) => task.status !== "done" && task.status !== "skipped").length,
    dueSoon: data.tasks.filter((task) => {
      if (task.status === "done" || task.status === "skipped") return false;
      const days = daysUntil(task.due);
      return days !== null && days <= 7;
    }).length,
    heroVersions: data.heroLayouts.length,
    publishedHero: data.heroLayouts.some((layout) => layout.published),
    monthlyCost: finance.expense,
    monthlyIncome: finance.income,
    storageMb: Math.round((storageBytes / (1024 * 1024)) * 10) / 10,
  };
}

export interface FinanceTotals {
  income: number;
  expense: number;
  net: number;
  /** KRW only; USD rows are listed separately and never mixed into a total. */
  foreign: number;
}

export function financeTotals(records: FinanceRecord[], month?: string): FinanceTotals {
  const scoped = month ? records.filter((record) => monthOf(record.date || "") === month) : records;
  let income = 0;
  let expense = 0;
  let foreign = 0;
  for (const record of scoped) {
    if (record.currency === "USD") {
      foreign += record.amount;
      continue;
    }
    if (record.direction === "income") income += record.amount;
    else expense += record.amount;
  }
  return { income, expense, net: income - expense, foreign };
}

export function groupFinanceByMonth(records: FinanceRecord[]): Array<{ month: string; totals: FinanceTotals; count: number }> {
  const months = Array.from(new Set(records.map((record) => monthOf(record.date || "")).filter(Boolean))).sort().reverse();
  return months.map((month) => ({
    month,
    totals: financeTotals(records, month),
    count: records.filter((record) => monthOf(record.date || "") === month).length,
  }));
}

export function formatKrw(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}₩${Math.abs(amount).toLocaleString("ko-KR")}`;
}

export function sortedTasks(tasks: TaskRecord[]): TaskRecord[] {
  const weight: Record<string, number> = { doing: 0, planned: 1, done: 2, skipped: 3 };
  return [...tasks].sort((a, b) => {
    const byStatus = (weight[a.status] ?? 9) - (weight[b.status] ?? 9);
    if (byStatus !== 0) return byStatus;
    return (a.due || "9999").localeCompare(b.due || "9999");
  });
}
