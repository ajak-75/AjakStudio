"use client";

import { useEffect, useState } from "react";

import { defFor } from "@/lib/admin/defs";
import { useAdminData } from "@/lib/admin/store";
import type { NotionInfo } from "@/lib/admin/types";
import { RecordTable } from "@/components/admin/RecordTable";
import { Btn, CopyButton, Field, Panel, SectionHead, Switch, Tag, TextArea, TextInput } from "@/components/admin/Ui";

export function GitHubSection() {
  const { data } = useAdminData();
  const def = defFor("repos");
  const publicCount = data.repos.filter((repo) => repo.visibility === "public").length;

  return (
    <div className="space-y-6">
      <SectionHead
        no="12"
        eyebrow="MENU 12 · GITHUB"
        title="GitHub 저장소 정보"
        description="이 사이트와 연결된 저장소 목록입니다. 다른 앱 저장소는 링크와 정보만 보관하고, 이 프로젝트는 그 저장소들을 수정하지 않습니다."
        action={
          <a
            href="https://github.com/ajak-75"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center border border-line px-4 py-2 font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-ink hover:border-ink"
          >
            GitHub 열기
          </a>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel title="저장소">
          <p className="font-serif text-[2rem] leading-none text-ink">{String(data.repos.length).padStart(2, "0")}</p>
          <p className="mt-2 font-sans text-[0.625rem] text-muted">공개 {publicCount} · 비공개 {data.repos.length - publicCount}</p>
        </Panel>
        <Panel title="이 사이트">
          <p className="font-sans text-[0.75rem] text-graphite">ajak-75/AjakStudio</p>
          <p className="mt-1 font-sans text-[0.625rem] text-muted">main · Next.js 정적 export</p>
          <div className="mt-3">
            <CopyButton text="git clone https://github.com/ajak-75/AjakStudio.git" label="clone 복사" />
          </div>
        </Panel>
        <Panel title="자동 배포 (5단계)">
          <p className="font-sans text-[0.6875rem] leading-relaxed text-graphite">
            main에 push → Cloudflare Pages가 <code className="font-sans text-ink">npm ci &amp;&amp; npm run build</code> 후{" "}
            <code className="font-sans text-ink">out/</code>를 배포합니다.
          </p>
          <div className="mt-2">
            <Tag>Functions 0회</Tag>
          </div>
        </Panel>
      </div>

      <div className="border border-line bg-paper p-5">
        <RecordTable def={def} />
      </div>

      <Panel title="지켜야 할 경계" note="이 저장소가 다른 앱을 건드리지 않는 이유">
        <ul className="space-y-2 font-sans text-[0.75rem] leading-relaxed text-graphite">
          <li>· <span className="text-ink">Ajak</span> · <span className="text-ink">KOMI-Diary</span> · <span className="text-ink">KOMI &amp; MOMO POP</span> · <span className="text-ink">K-Sajoo</span> · <span className="text-ink">ABI</span>는 각자의 저장소에서 배포됩니다. 여기서는 링크만 겁니다.</li>
          <li>· 공개 페이지는 DB가 없어도 시드로 뜹니다. Supabase가 멈춰도 사이트는 살아 있습니다.</li>
          <li>· service_role 키는 이 저장소에 존재하지 않습니다. 모든 접근은 anon 키 + RLS입니다.</li>
        </ul>
      </Panel>
    </div>
  );
}

export function NotionSection() {
  const { data, setNotion } = useAdminData();
  const [draft, setDraft] = useState<NotionInfo>(data.notion);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(data.notion);
  }, [data.notion]);

  const update = (patch: Partial<NotionInfo>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  const updateDatabase = (id: string, patch: Partial<NotionInfo["databases"][number]>) => {
    update({ databases: draft.databases.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  };

  return (
    <div className="space-y-6">
      <SectionHead
        no="13"
        eyebrow="MENU 13 · NOTION"
        title="Notion 연결 정보"
        description="노션 원본은 Pickle 앱의 연결로 관리하고, 여기에는 워크스페이스 정보와 자주 찾는 데이터베이스 링크만 적어 둡니다."
        action={
          <Btn
            variant="primary"
            onClick={() => {
              setNotion(draft);
              setSaved(true);
            }}
          >
            저장
          </Btn>
        }
      />

      {saved ? (
        <p className="border-l-2 border-brass bg-brass-soft/40 px-3 py-2 font-sans text-[0.75rem] text-graphite">
          저장했습니다. 공개 페이지에는 노출되지 않습니다.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="워크스페이스">
          <div className="space-y-4">
            <Field label="워크스페이스 이름">
              <TextInput value={draft.workspace} onChange={(value) => update({ workspace: value })} />
            </Field>
            <Field label="워크스페이스 주소" hint="없으면 비워 두세요">
              <TextInput type="url" value={draft.url} placeholder="https://www.notion.so/…" onChange={(value) => update({ url: value })} />
            </Field>
            <Field label="메모">
              <TextArea value={draft.note} rows={3} onChange={(value) => update({ note: value })} />
            </Field>
            <Switch checked={draft.connected} onChange={(value) => update({ connected: value })} label="연결됨으로 표시" />
          </div>
        </Panel>

        <Panel title="연결 안내" note="앱에서 연결하는 순서">
          <ol className="space-y-3 font-sans text-[0.75rem] leading-relaxed text-graphite">
            <li className="flex gap-3">
              <span className="font-sans text-[0.5625rem] tracking-[0.16em] text-brass">01</span>
              Pickle 앱 → 연결 → Notion을 선택하고 워크스페이스를 승인합니다.
            </li>
            <li className="flex gap-3">
              <span className="font-sans text-[0.5625rem] tracking-[0.16em] text-brass">02</span>
              공유할 페이지·데이터베이스를 선택합니다 (전체 공유는 피합니다).
            </li>
            <li className="flex gap-3">
              <span className="font-sans text-[0.5625rem] tracking-[0.16em] text-brass">03</span>
              이 화면에 자주 쓰는 데이터베이스 링크를 적어 두면 콘텐츠·소싱 작업에서 바로 찾습니다.
            </li>
            <li className="flex gap-3">
              <span className="font-sans text-[0.5625rem] tracking-[0.16em] text-brass">04</span>
              Control Center는 노션을 수정하지 않습니다. 읽기와 링크 보관만 합니다.
            </li>
          </ol>
        </Panel>
      </div>

      <Panel
        title="데이터베이스 · 페이지"
        note={`${draft.databases.length}개`}
        action={
          <Btn
            variant="outline"
            onClick={() =>
              update({
                databases: [
                  ...draft.databases,
                  { id: `nd_${Date.now().toString(36)}`, name: "", purpose: "", url: "" },
                ],
              })
            }
          >
            + 추가
          </Btn>
        }
      >
        {draft.databases.length === 0 ? (
          <p className="font-sans text-[0.75rem] text-muted">
            아직 등록된 데이터베이스가 없습니다. 소싱 원칙, 콘텐츠 캘린더처럼 자주 여는 페이지를 추가해 두세요.
          </p>
        ) : (
          <ul className="space-y-3">
            {draft.databases.map((row) => (
              <li key={row.id} className="grid gap-2 border border-line p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end">
                <Field label="이름">
                  <TextInput value={row.name} onChange={(value) => updateDatabase(row.id, { name: value })} />
                </Field>
                <Field label="용도">
                  <TextInput value={row.purpose} onChange={(value) => updateDatabase(row.id, { purpose: value })} />
                </Field>
                <Field label="링크">
                  <TextInput type="url" value={row.url} onChange={(value) => updateDatabase(row.id, { url: value })} />
                </Field>
                <Btn variant="ghost" onClick={() => update({ databases: draft.databases.filter((entry) => entry.id !== row.id) })}>
                  삭제
                </Btn>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
