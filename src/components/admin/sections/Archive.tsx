"use client";

import { useMemo, useRef, useState } from "react";

import { formatBytes } from "@/lib/admin/backup";
import { defFor } from "@/lib/admin/defs";
import { useAdminData, validateImageFile } from "@/lib/admin/store";
import type { Bi, PromptRecord } from "@/lib/admin/types";
import { RecordTable } from "@/components/admin/RecordTable";
import { BiField, Btn, EmptyState, Field, Meter, Modal, Panel, SectionHead, Tag, TextArea, TextInput } from "@/components/admin/Ui";
import { useAssetUrl } from "@/lib/admin/store";
import { formatEditorialDate } from "@/lib/utils";

/* ------------------------------------------------------------------ images */

export function ImageLibrary() {
  const { data, addImage, updateImage, archiveImage, restoreImage, purgeImage } = useAdminData();
  const [filter, setFilter] = useState<"active" | "archived" | "all">("active");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; title: string; alt: Bi; tags: string } | null>(null);
  const [confirmPurge, setConfirmPurge] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const images = data.images.filter((image) =>
    filter === "active" ? !image.archivedAt : filter === "archived" ? Boolean(image.archivedAt) : true,
  );
  const totalBytes = data.images.reduce((sum, image) => sum + image.byteSize, 0);

  const upload = async (files: FileList | File[]) => {
    setError(null);
    setBusy(true);
    for (const file of Array.from(files)) {
      const invalid = validateImageFile(file);
      if (invalid) {
        setError(`${file.name}: ${invalid}`);
        continue;
      }
      const result = await addImage(file, "library");
      if (!result.ok) setError(result.error ?? "업로드 실패");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <SectionHead
        no="06"
        eyebrow="MENU 06 · IMAGE ARCHIVE"
        title="이미지 자료실"
        description="JPG · PNG · WebP, 파일당 5MB까지. 업로드한 원본 바이트는 다시 쓰지 않고, 크롭·보정은 히어로 시안 쪽에만 기록합니다."
        action={<Btn variant="primary" onClick={() => inputRef.current?.click()}>+ 이미지 업로드</Btn>}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) void upload(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        className="border border-dashed border-line bg-paper px-6 py-8 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer?.files?.length) void upload(event.dataTransfer.files);
        }}
      >
        <p className="font-serif text-[1.125rem] text-ink">여기로 이미지를 끌어다 놓으세요</p>
        <p className="mt-1 font-sans text-[0.75rem] text-muted">JPG · PNG · WebP · 최대 5MB · 원본 보존</p>
        {busy ? <p className="mt-2 font-sans text-[0.6875rem] text-brass">저장 중…</p> : null}
        {error ? <p className="mt-2 font-sans text-[0.6875rem] text-[#8a3c3c]">{error}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex gap-1">
          {(
            [
              { id: "active", label: "사용 중", count: data.images.filter((image) => !image.archivedAt).length },
              { id: "archived", label: "보관됨", count: data.images.filter((image) => image.archivedAt).length },
              { id: "all", label: "전체", count: data.images.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`border px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] ${
                filter === tab.id ? "border-ink bg-ink text-paper" : "border-line text-graphite hover:border-ink"
              }`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>
        <p className="font-sans text-[0.625rem] uppercase tracking-[0.14em] text-muted">
          {data.images.length}개 · {formatBytes(totalBytes)}
        </p>
      </div>

      {images.length === 0 ? (
        <EmptyState
          title="이미지가 없습니다"
          body="첫 이미지를 올리면 Hero Studio에서 바로 레이어로 쓸 수 있습니다. 홈페이지 히어로는 이 원본에서 크롭만 계산합니다."
          action={<Btn variant="primary" onClick={() => inputRef.current?.click()}>+ 이미지 업로드</Btn>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              id={image.id}
              title={image.title}
              blobKey={image.blobKey}
              publicUrl={image.publicUrl}
              mime={image.mime}
              byteSize={image.byteSize}
              width={image.width}
              height={image.height}
              archived={Boolean(image.archivedAt)}
              createdAt={image.createdAt}
              confirmPurge={confirmPurge === image.id}
              onEdit={() => setEditing({ id: image.id, title: image.title, alt: image.alt, tags: image.tags.join(", ") })}
              onArchive={() => archiveImage(image.id)}
              onRestore={() => restoreImage(image.id)}
              onAskPurge={() => setConfirmPurge(image.id)}
              onCancelPurge={() => setConfirmPurge(null)}
              onPurge={() => {
                void purgeImage(image.id);
                setConfirmPurge(null);
              }}
            />
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="이미지 정보"
        footer={
          <>
            <Btn onClick={() => setEditing(null)}>취소</Btn>
            <Btn
              variant="primary"
              onClick={() => {
                if (!editing) return;
                updateImage(editing.id, {
                  title: editing.title,
                  alt: editing.alt,
                  tags: editing.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
                });
                setEditing(null);
              }}
            >
              저장
            </Btn>
          </>
        }
      >
        {editing ? (
          <div className="space-y-4">
            <Field label="제목">
              <TextInput value={editing.title} onChange={(value) => setEditing({ ...editing, title: value })} />
            </Field>
            <BiField label="대체 텍스트 (alt)" value={editing.alt} onChange={(value) => setEditing({ ...editing, alt: value })} hint="스크린리더와 검색엔진이 읽는 설명입니다." />
            <Field label="태그" hint="쉼표로 구분">
              <TextInput value={editing.tags} onChange={(value) => setEditing({ ...editing, tags: value })} />
            </Field>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function ImageCard({
  id,
  title,
  blobKey,
  publicUrl,
  mime,
  byteSize,
  width,
  height,
  archived,
  createdAt,
  confirmPurge,
  onEdit,
  onArchive,
  onRestore,
  onAskPurge,
  onCancelPurge,
  onPurge,
}: {
  id: string;
  title: string;
  blobKey: string;
  publicUrl: string | null;
  mime: string;
  byteSize: number;
  width: number;
  height: number;
  archived: boolean;
  createdAt: string;
  confirmPurge: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onAskPurge: () => void;
  onCancelPurge: () => void;
  onPurge: () => void;
}) {
  const resolved = useAssetUrl(blobKey);
  const url = resolved ?? publicUrl;
  const format = mime.split("/")[1]?.toUpperCase() ?? "IMG";

  return (
    <li className={`border border-line bg-paper ${archived ? "opacity-70" : ""}`}>
      <div className="aspect-[4/3] border-b border-line bg-porcelain">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center font-sans text-[0.625rem] uppercase tracking-[0.14em] text-muted">
            불러오는 중
          </div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate font-sans text-[0.75rem] text-ink" title={title}>
            {title}
          </p>
          <Tag tone={archived ? "line" : "brass"}>{archived ? "보관" : "원본 보존"}</Tag>
        </div>
        <p className="font-sans text-[0.5625rem] uppercase tracking-[0.12em] text-muted">
          {format} · {width}×{height} · {formatBytes(byteSize)} · {formatEditorialDate(createdAt)}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
          <Btn variant="ghost" onClick={onEdit}>
            정보
          </Btn>
          {archived ? (
            <Btn variant="ghost" onClick={onRestore}>
              복원
            </Btn>
          ) : (
            <Btn variant="ghost" onClick={onArchive}>
              보관
            </Btn>
          )}
          {confirmPurge ? (
            <>
              <Btn variant="danger" onClick={onPurge}>
                원본 삭제
              </Btn>
              <Btn variant="ghost" onClick={onCancelPurge}>
                취소
              </Btn>
            </>
          ) : (
            <Btn variant="ghost" onClick={onAskPurge} title="원본 바이트까지 삭제합니다">
              완전 삭제
            </Btn>
          )}
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ videos */

export function VideoLibrary() {
  const { data } = useAdminData();
  const def = defFor("videos");
  const usedMb = data.videos.reduce((sum, video) => sum + (video.sizeMb || 0), 0);
  const budgetMb = 1024;

  return (
    <div className="space-y-6">
      <SectionHead
        no="07"
        eyebrow="MENU 07 · VIDEO ARCHIVE"
        title="영상 자료실"
        description="영상 파일은 올리지 않고 YouTube · Google Drive 링크만 저장합니다. Supabase 무료 스토리지 1GB를 영상에 쓰면 한 건에 소진되기 때문입니다."
      />
      <Panel title="무료 스토리지 1GB 한도" note="영상은 링크만 보관 — 업로드 용량 0MB">
        <div className="flex items-end justify-between gap-4">
          <p className="font-serif text-[2rem] leading-none text-ink">{usedMb.toFixed(0)} MB</p>
          <p className="font-sans text-[0.625rem] uppercase tracking-[0.14em] text-muted">/ {budgetMb} MB 참고값</p>
        </div>
        <div className="mt-3">
          <Meter value={usedMb} max={budgetMb} tone={usedMb > budgetMb * 0.8 ? "warn" : "brass"} />
        </div>
        <p className="mt-3 font-sans text-[0.6875rem] leading-relaxed text-muted">
          영상은 외부 링크로만 두므로 이 한도를 쓰지 않습니다. 이미지 원본(5MB 이하)만 스토리지를 사용합니다.
        </p>
      </Panel>
      <div className="border border-line bg-paper p-5">
        <RecordTable def={def} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- docs */

export function DocumentLibrary() {
  const def = defFor("docs");
  return (
    <div className="space-y-6">
      <SectionHead no="08" eyebrow="MENU 08 · DOCUMENT ARCHIVE" title="문서 자료실" description={def.description.ko} />
      <div className="border border-line bg-paper p-5">
        <RecordTable def={def} />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- prompts */

interface PromptDraft {
  id: string | null;
  title: string;
  category: string;
  body: string;
  tags: string;
  favorite: boolean;
}

const emptyPrompt: PromptDraft = { id: null, title: "", category: "", body: "", tags: "", favorite: false };

export function PromptVault() {
  const { data, createRecord, updateRecord, deleteRecord } = useAdminData();
  const [filter, setFilter] = useState("전체");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<PromptDraft | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const categories = useMemo(
    () => ["전체", ...Array.from(new Set(data.prompts.map((prompt) => prompt.category).filter(Boolean)))],
    [data.prompts],
  );

  const prompts = data.prompts.filter((prompt) => {
    const matchCategory = filter === "전체" || prompt.category === filter;
    const needle = query.trim().toLowerCase();
    const matchQuery =
      !needle ||
      prompt.title.toLowerCase().includes(needle) ||
      prompt.body.toLowerCase().includes(needle) ||
      prompt.tags.join(" ").toLowerCase().includes(needle);
    return matchCategory && matchQuery;
  });

  const save = () => {
    if (!draft || !draft.title.trim() || !draft.body.trim()) return;
    const payload = {
      title: draft.title.trim(),
      category: draft.category.trim(),
      body: draft.body,
      tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      favorite: draft.favorite,
    };
    if (draft.id) updateRecord("prompts", draft.id, payload);
    else createRecord("prompts", { ...payload, uses: 0 });
    setDraft(null);
  };

  const copy = async (prompt: PromptRecord) => {
    try {
      await navigator.clipboard.writeText(prompt.body);
      updateRecord("prompts", prompt.id, { uses: (prompt.uses || 0) + 1, lastUsedAt: new Date().toISOString() });
      setCopied(prompt.id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHead
        no="09"
        eyebrow="MENU 09 · PROMPT VAULT"
        title="AI 프롬프트 보관함"
        description="자주 쓰는 프롬프트를 카테고리로 묶고, 복사 버튼으로 바로 가져갑니다. 복사 횟수를 함께 기록합니다."
        action={<Btn variant="primary" onClick={() => setDraft({ ...emptyPrompt })}>+ 새 프롬프트</Btn>}
      />

      <div className="flex flex-wrap items-center gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={`border px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] ${
              filter === category ? "border-ink bg-ink text-paper" : "border-line text-graphite hover:border-ink"
            }`}
          >
            {category}
          </button>
        ))}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="검색"
          className="ml-auto w-40 border border-line px-3 py-1.5 font-sans text-[0.75rem] outline-none focus:border-ink"
        />
      </div>

      {prompts.length === 0 ? (
        <EmptyState
          title="프롬프트가 없습니다"
          body="반복해서 쓰는 지시문을 저장해 두면 매번 처음부터 쓰지 않아도 됩니다."
          action={<Btn variant="primary" onClick={() => setDraft({ ...emptyPrompt })}>+ 새 프롬프트</Btn>}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {prompts.map((prompt) => (
            <li key={prompt.id} className={`border bg-paper p-4 ${prompt.favorite ? "border-brass/60" : "border-line"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-[1.125rem] leading-tight text-ink">{prompt.title}</p>
                  <p className="mt-1 font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">
                    {prompt.category || "미분류"} · {prompt.uses || 0}회 사용
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Btn variant={copied === prompt.id ? "brass" : "outline"} onClick={() => void copy(prompt)}>
                    {copied === prompt.id ? "복사됨" : "복사"}
                  </Btn>
                  <Btn
                    variant="ghost"
                    onClick={() =>
                      setDraft({
                        id: prompt.id,
                        title: prompt.title,
                        category: prompt.category,
                        body: prompt.body,
                        tags: prompt.tags.join(", "),
                        favorite: prompt.favorite,
                      })
                    }
                  >
                    수정
                  </Btn>
                  {confirm === prompt.id ? (
                    <Btn variant="danger" onClick={() => { deleteRecord("prompts", prompt.id); setConfirm(null); }}>
                      삭제 확인
                    </Btn>
                  ) : (
                    <Btn variant="ghost" onClick={() => setConfirm(prompt.id)}>
                      삭제
                    </Btn>
                  )}
                </div>
              </div>
              <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap border-t border-line pt-3 font-sans text-[0.6875rem] leading-relaxed text-graphite">
                {prompt.body}
              </pre>
              {prompt.tags.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {prompt.tags.map((tag) => (
                    <Tag key={tag}>#{tag}</Tag>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "프롬프트 수정" : "새 프롬프트"}
        wide
        footer={
          <>
            <Btn onClick={() => setDraft(null)}>취소</Btn>
            <Btn variant="primary" onClick={save}>
              저장
            </Btn>
          </>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="제목">
                <TextInput value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
              </Field>
              <Field label="카테고리">
                <TextInput value={draft.category} onChange={(value) => setDraft({ ...draft, category: value })} />
              </Field>
            </div>
            <Field label="프롬프트 본문">
              <TextArea value={draft.body} rows={8} onChange={(value) => setDraft({ ...draft, body: value })} />
            </Field>
            <Field label="태그" hint="쉼표로 구분">
              <TextInput value={draft.tags} onChange={(value) => setDraft({ ...draft, tags: value })} />
            </Field>
            <label className="flex items-center gap-2 font-sans text-[0.75rem] text-graphite">
              <input
                type="checkbox"
                checked={draft.favorite}
                onChange={(event) => setDraft({ ...draft, favorite: event.target.checked })}
                className="h-4 w-4 accent-[#8a6a3c]"
              />
              즐겨찾기
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

