"use client";

import { useEffect, useRef, useState } from "react";

import { formatBytes, parseBackup, type ParseResult } from "@/lib/admin/backup";
import { storageEstimate, type StorageEstimate } from "@/lib/admin/db";
import { useAdminData } from "@/lib/admin/store";
import { Btn, Panel, SectionHead, Tag } from "@/components/admin/Ui";
import { formatEditorialDate } from "@/lib/utils";

const COLLECTION_KO: Record<string, string> = {
  apps: "앱",
  channels: "채널",
  contents: "콘텐츠",
  images: "이미지",
  videos: "영상",
  docs: "문서",
  prompts: "프롬프트",
  projects: "프로젝트",
  tasks: "할 일",
  repos: "저장소",
  finance: "재무",
  heroLayouts: "히어로 시안",
  backups: "백업 기록",
};

export function BackupSection() {
  const { data, exportBackup, importBackup, resetToSeed } = useAdminData();
  const [includeImages, setIncludeImages] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<(ParseResult & { fileName?: string }) | null>(null);
  const [importing, setImporting] = useState(false);
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void storageEstimate().then(setEstimate);
  }, [data.updatedAt]);

  const download = async () => {
    setExporting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await exportBackup({ includeImages });
      const blob = new Blob([result.text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setMessage(
        `${result.filename} · ${formatBytes(result.bytes)} · 이미지 ${result.images}개 포함 · 체크섬 ${result.checksum}`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "내보내기에 실패했습니다.");
    } finally {
      setExporting(false);
    }
  };

  const readFile = async (file: File) => {
    setError(null);
    setMessage(null);
    const text = await file.text();
    const result = parseBackup(text);
    setParsed({ ...result, fileName: file.name });
  };

  const runImport = async () => {
    if (!parsed?.ok || !parsed.payload) return;
    setImporting(true);
    const result = await importBackup(parsed.payload);
    setImporting(false);
    if (!result.ok) {
      setError(result.error ?? "복구에 실패했습니다.");
      return;
    }
    setMessage(`복구 완료 — 이미지 ${result.restoredImages}개를 포함해 데이터를 되돌렸습니다.`);
    setParsed(null);
  };

  const history = [...data.backups].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);

  return (
    <div className="space-y-6">
      <SectionHead
        no="15"
        eyebrow="MENU 15 · BACKUP"
        title="백업 관리"
        description="전체 데이터를 JSON 한 파일로 내려받고, 같은 파일로 복구합니다. Supabase Free는 자동 백업이 없어서 이 메뉴가 유일한 안전장치입니다."
      />

      {message ? (
        <p className="border-l-2 border-brass bg-brass-soft/40 px-3 py-2 font-sans text-[0.75rem] leading-relaxed text-graphite">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="border-l-2 border-[#8a3c3c] bg-[#8a3c3c]/5 px-3 py-2 font-sans text-[0.75rem] text-[#8a3c3c]">{error}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="내보내기" note="JSON · 이 프로젝트의 모든 컬렉션">
          <label className="flex items-center gap-2 font-sans text-[0.75rem] text-graphite">
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(event) => setIncludeImages(event.target.checked)}
              className="h-4 w-4 accent-[#8a6a3c]"
            />
            이미지 원본 포함 (base64 · 파일이 커집니다)
          </label>
          <p className="mt-2 font-sans text-[0.625rem] leading-relaxed text-muted">
            이미지는 원본 바이트를 그대로 넣습니다. 5MB 사진 여러 장이면 수십 MB가 될 수 있으니, 자주 하는 백업은 이미지 제외로 두고
            원본은 별도로 보관하는 편이 안전합니다.
          </p>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-3">
            {Object.entries({
              앱: data.apps.length,
              채널: data.channels.length,
              콘텐츠: data.contents.length,
              이미지: data.images.length,
              "히어로 시안": data.heroLayouts.length,
              프로젝트: data.projects.length,
              "할 일": data.tasks.length,
              재무: data.finance.length,
            }).map(([label, count]) => (
              <div key={label} className="flex justify-between font-sans text-[0.6875rem]">
                <dt className="text-muted">{label}</dt>
                <dd className="tabular-nums text-graphite">{count}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Btn variant="primary" onClick={() => void download()} disabled={exporting}>
              {exporting ? "만드는 중…" : "JSON 내보내기"}
            </Btn>
            <span className="font-sans text-[0.625rem] text-muted">
              {estimate
                ? `브라우저 사용량 ${formatBytes(estimate.usedBytes)}${estimate.quotaBytes ? ` / ${formatBytes(estimate.quotaBytes)}` : ""}`
                : "저장소 확인 중…"}
            </span>
          </div>
        </Panel>

        <Panel title="가져오기 (복구)" note="내보낸 JSON을 그대로 검사한 뒤 복구합니다">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readFile(file);
              event.target.value = "";
            }}
          />
          <div
            className="border border-dashed border-line px-4 py-6 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer?.files?.[0];
              if (file) void readFile(file);
            }}
          >
            <p className="font-sans text-[0.75rem] text-graphite">JSON 파일을 끌어다 놓거나</p>
            <div className="mt-2 flex justify-center">
              <Btn onClick={() => fileRef.current?.click()}>파일 선택</Btn>
            </div>
          </div>

          {parsed ? (
            parsed.ok && parsed.payload && parsed.summary ? (
              <div className="mt-4 border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-sans text-[0.75rem] text-ink">{parsed.fileName}</p>
                  <Tag tone="brass">검사 통과</Tag>
                </div>
                <p className="mt-1 font-sans text-[0.625rem] text-muted">
                  내보낸 시각 {parsed.payload.exportedAt ? formatEditorialDate(parsed.payload.exportedAt) : "—"} · 레코드{" "}
                  {parsed.summary.total}건 · 히어로 시안 {parsed.summary.heroVersions}개 · 이미지 {parsed.summary.images}개
                  {parsed.summary.publishedHero ? " · 공개 시안 포함" : ""}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-2">
                  {Object.entries(parsed.summary.counts).map(([key, count]) => (
                    <div key={key} className="flex justify-between font-sans text-[0.625rem]">
                      <span className="text-muted">{COLLECTION_KO[key] ?? key}</span>
                      <span className="tabular-nums text-graphite">{count}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 font-sans text-[0.625rem] leading-relaxed text-[#8a3c3c]">
                  복구하면 지금 데이터가 이 파일로 교체됩니다. 먼저 현재 상태를 내보내 두는 것을 권합니다.
                </p>
                <div className="mt-3 flex gap-2">
                  <Btn variant="primary" onClick={() => void runImport()} disabled={importing}>
                    {importing ? "복구 중…" : "이 파일로 복구"}
                  </Btn>
                  <Btn variant="ghost" onClick={() => setParsed(null)}>
                    취소
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="mt-4 border border-[#8a3c3c]/40 bg-[#8a3c3c]/5 p-3">
                <p className="font-sans text-[0.75rem] text-[#8a3c3c]">복구할 수 없습니다</p>
                <p className="mt-1 font-sans text-[0.625rem] text-[#8a3c3c]">{parsed.error}</p>
                <Btn variant="ghost" onClick={() => setParsed(null)}>
                  닫기
                </Btn>
              </div>
            )
          ) : null}
        </Panel>
      </div>

      <Panel title="백업 기록" note="최근 12건">
        {history.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-muted">아직 백업 기록이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="w-24 shrink-0 font-sans text-[0.6875rem] tabular-nums text-graphite">
                  {formatEditorialDate(entry.at)}
                </span>
                <Tag tone={entry.kind === "export" ? "brass" : "ink"}>{entry.kind === "export" ? "내보내기" : "가져오기"}</Tag>
                <span className="flex-1 font-sans text-[0.6875rem] text-muted">
                  {entry.note || "—"} · {entry.records}건 {entry.bytes ? `· ${formatBytes(entry.bytes)}` : ""}
                </span>
                <span className="font-sans text-[0.5625rem] uppercase tracking-[0.12em] text-muted">#{entry.checksum}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="초기 상태로 되돌리기" note="시드 데이터로 재설정 — 되돌릴 수 없습니다">
        <div className="flex flex-wrap items-center gap-3">
          {resetArmed ? (
            <>
              <p className="font-sans text-[0.75rem] text-[#8a3c3c]">정말 초기 시드로 되돌릴까요? 지금 데이터는 사라집니다.</p>
              <Btn
                variant="danger"
                onClick={() => {
                  void resetToSeed();
                  setResetArmed(false);
                  setMessage("초기 시드로 재설정했습니다.");
                }}
              >
                초기화 실행
              </Btn>
              <Btn variant="ghost" onClick={() => setResetArmed(false)}>
                취소
              </Btn>
            </>
          ) : (
            <>
              <p className="font-sans text-[0.75rem] leading-relaxed text-muted">
                처음 화면(앱 5 · 채널 8 · 시드 콘텐츠)으로 돌아갑니다. 먼저 JSON을 내려받아 두세요.
              </p>
              <Btn variant="outline" onClick={() => setResetArmed(true)}>
                초기화
              </Btn>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
