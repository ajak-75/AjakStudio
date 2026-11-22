"use client";

import { Btn, Panel, SectionHead, Stat, Tag } from "@/components/admin/Ui";
import { supabaseEnabled } from "@/lib/admin/auth";
import { formatKrw, daysUntil, overviewMetrics, sortedTasks, todayIso } from "@/lib/admin/metrics";
import { formatBytes } from "@/lib/admin/backup";
import { useAdminData } from "@/lib/admin/store";
import { ADMIN_MENU } from "@/lib/admin/menu";
import { formatEditorialDate } from "@/lib/utils";

export function OverviewSection({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { data, storage, saveState, lastSavedAt } = useAdminData();
  const metrics = overviewMetrics(data);
  const publishedHero = data.heroLayouts.find((layout) => layout.published) ?? null;
  const openTasks = sortedTasks(data.tasks).filter((task) => task.status !== "done" && task.status !== "skipped");
  const upcoming = openTasks
    .map((task) => ({ task, days: daysUntil(task.due) }))
    .filter((entry) => entry.days !== null)
    .slice(0, 5);
  const lastBackup = [...data.backups].sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;

  const storageLabel =
    storage === "idb" ? "IndexedDB (브라우저)" : storage === "local" ? "localStorage (브라우저)" : "메모리 (휘발성)";

  return (
    <div className="space-y-6">
      <SectionHead
        no="01"
        eyebrow="THE CONTROL CENTER"
        title="전체 사업 현황"
        description="다섯 개 앱과 여덟 개 채널, 콘텐츠와 재무까지 한 화면에서 봅니다. 각 숫자를 누르면 해당 메뉴로 이동합니다."
        action={
          <Btn variant="primary" onClick={() => onNavigate("hero")}>
            Hero Studio 열기
          </Btn>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "APPS · LIVE", value: String(metrics.apps).padStart(2, "0"), note: `운영 중 ${metrics.liveApps} · 게임 ${metrics.games}`, id: "apps" },
          { label: "CHANNELS", value: String(metrics.channels).padStart(2, "0"), note: `운영 중 ${metrics.activeChannels}`, id: "channels" },
          { label: "CONTENT", value: String(metrics.contents).padStart(2, "0"), note: `게시 ${metrics.publishedContents}`, id: "contents" },
          { label: "OPEN TASKS", value: String(metrics.openTasks).padStart(2, "0"), note: `7일 내 마감 ${metrics.dueSoon}`, id: "tasks" },
          { label: "IMAGES", value: String(metrics.images).padStart(2, "0"), note: `보관 ${metrics.archivedImages} · ${metrics.storageMb} MB`, id: "images" },
          { label: "PROJECTS", value: String(metrics.projects).padStart(2, "0"), note: `진행 중 ${metrics.activeProjects}`, id: "projects" },
          { label: "PROMPTS", value: String(metrics.prompts).padStart(2, "0"), note: "AI 프롬프트 보관함", id: "prompts" },
          { label: "THIS MONTH", value: formatKrw(metrics.monthlyCost), note: `수입 ${formatKrw(metrics.monthlyIncome)}`, id: "finance" },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate(item.id)}
            className="border border-line bg-paper p-4 text-left transition-colors hover:border-ink"
          >
            <Stat label={item.label} value={item.value} note={item.note} />
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="히어로 게시 상태"
          note={publishedHero ? `v${publishedHero.version} 보관 중 · ${formatEditorialDate(publishedHero.publishedAt ?? publishedHero.createdAt)} — 공개 HOME은 고정 시그니처 히어로를 씁니다.` : "보관된 시안이 없습니다 — 공개 HOME은 고정 시그니처 히어로(까치 호랑이)를 씁니다."}
          action={
            <Btn variant="outline" onClick={() => onNavigate("hero")}>
              편집
            </Btn>
          }
        >
          {publishedHero ? (
            <div className="space-y-2">
              <p className="font-serif text-[1.375rem] text-ink">
                {publishedHero.snapshot.pc.text.headline.split("\n")[0] || "(헤드라인 없음)"}
              </p>
              <p className="font-sans text-[0.75rem] leading-relaxed text-muted">
                PC {publishedHero.snapshot.pc.aspect} · 모바일 {publishedHero.snapshot.mobile.aspect} · 이미지 레이어{" "}
                {publishedHero.snapshot.pc.layers.length}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href="/ko/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-rule font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-ink"
                >
                  공개 HOME 확인
                </a>
                <a
                  href="/en/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-rule font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-muted"
                >
                  EN
                </a>
              </div>
            </div>
          ) : (
            <p className="font-sans text-[0.8125rem] leading-relaxed text-graphite">
              Hero Studio는 시안을 버전으로 쌓아 두는 작업실입니다. 공개 HOME의 히어로는 고정 시그니처(까치 호랑이 + 움직이는 까치)로 운영되며, 저장한 시안은 공개 페이지에 자동 반영되지 않습니다.
            </p>
          )}
        </Panel>

        <Panel title="시스템 상태" note="0원 인프라 · 서버 런타임 없음">
          <dl className="space-y-2.5">
            <Row label="데이터 저장" value={storageLabel} tone={storage === "memory" ? "warn" : "ok"} />
            <Row
              label="자동 저장"
              value={saveState === "saving" ? "저장 중…" : saveState === "error" ? "저장 실패" : lastSavedAt ? `${formatEditorialDate(lastSavedAt)} ${new Date(lastSavedAt).toTimeString().slice(0, 5)}` : "대기"}
              tone={saveState === "error" ? "warn" : "ok"}
            />
            <Row
              label="Supabase"
              value={supabaseEnabled() ? "연결됨 (anon 키)" : "미연결 — 로컬 미리보기"}
              tone={supabaseEnabled() ? "ok" : "neutral"}
            />
            <Row label="공개 사이트" value="Next.js 정적 export · Cloudflare Pages Free" tone="neutral" />
            <Row
              label="최근 백업"
              value={lastBackup ? `${formatEditorialDate(lastBackup.at)} · ${formatBytes(lastBackup.bytes)}` : "백업 기록 없음"}
              tone={lastBackup ? "ok" : "neutral"}
            />
            <Row label="서버 비용" value={formatKrw(0)} tone="ok" />
          </dl>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
            <Btn variant="outline" onClick={() => onNavigate("backup")}>
              JSON 백업
            </Btn>
            <a
              href="https://github.com/ajak-75/AjakStudio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center border border-line px-4 py-2 font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-ink hover:border-ink"
            >
              저장소
            </a>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="마감이 가까운 할 일" note={`오늘 ${formatEditorialDate(todayIso())}`} action={<Btn variant="ghost" onClick={() => onNavigate("tasks")}>전체 보기</Btn>}>
          {upcoming.length === 0 ? (
            <p className="font-sans text-[0.8125rem] text-muted">예정된 마감이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map(({ task, days }) => (
                <li key={task.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="w-16 shrink-0 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-brass">
                    {days !== null && days < 0 ? `${Math.abs(days)}일 지남` : days === 0 ? "오늘" : `${days}일 뒤`}
                  </span>
                  <span className="min-w-0 flex-1 font-sans text-[0.8125rem] text-ink">{task.title}</span>
                  <Tag tone={task.priority === "high" ? "warn" : "line"}>{task.due || "—"}</Tag>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="메뉴 바로가기" note="15개 메뉴">
          <div className="grid grid-cols-2 gap-x-4">
            {ADMIN_MENU.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="flex items-baseline gap-2 border-b border-line py-2 text-left hover:text-brass"
              >
                <span className="w-5 shrink-0 font-sans text-[0.5625rem] tracking-[0.16em] text-brass">{item.no}</span>
                <span className="font-sans text-[0.75rem] text-graphite">{item.ko}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "neutral" }) {
  const dot = tone === "ok" ? "bg-brass" : tone === "warn" ? "bg-[#8a3c3c]" : "bg-muted";
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-sans text-[0.625rem] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="flex items-center gap-2 text-right font-sans text-[0.75rem] text-graphite">
        <span aria-hidden className={`h-1 w-1 rounded-full ${dot}`} />
        {value}
      </dd>
    </div>
  );
}
