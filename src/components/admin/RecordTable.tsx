"use client";

import { useMemo, useState } from "react";

import { useAdminData } from "@/lib/admin/store";
import {
  asBi,
  asBool,
  asNumber,
  asString,
  asTags,
  bi,
  type Bi,
  type EntityDef,
  type FieldDef,
} from "@/lib/admin/types";
import { cn } from "@/lib/utils";

import { BiField, Btn, EmptyState, Field, Modal, Select, Switch, Tag, TextArea, TextInput } from "./Ui";

type Draft = Record<string, unknown>;

function defaultDraft(def: EntityDef, sortValue: number): Draft {
  const draft: Draft = {};
  for (const field of def.fields) {
    switch (field.kind) {
      case "bi":
      case "biTextarea":
        draft[field.key] = bi("", "");
        break;
      case "number":
        draft[field.key] = field.key === "sort" ? sortValue : 0;
        break;
      case "boolean":
        draft[field.key] = field.key === "visible";
        break;
      case "tags":
        draft[field.key] = [];
        break;
      case "select":
        draft[field.key] = field.options?.[0]?.value ?? "";
        break;
      case "date":
        draft[field.key] = new Date().toISOString().slice(0, 10);
        break;
      default:
        draft[field.key] = "";
    }
  }
  return draft;
}

function optionLabel(field: FieldDef, value: string, optionsFromLabels: Record<string, string>): string {
  if (field.optionsFrom) return optionsFromLabels[value] ?? (value ? "—" : "—");
  const match = field.options?.find((option) => option.value === value);
  return match?.label.ko ?? (value || "—");
}

export function RecordTable({ def }: { def: EntityDef }) {
  const { data, createRecord, updateRecord, deleteRecord, moveRecord } = useAdminData();
  const rows = data[def.key] as unknown as Array<Record<string, unknown>>;
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const columns = def.fields.filter((field) => field.list);

  const referencedLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const field of def.fields) {
      if (!field.optionsFrom) continue;
      const source = data[field.optionsFrom] as unknown as Array<Record<string, unknown>>;
      const labelKey = field.optionLabel ?? "title";
      for (const row of source) map[asString(row.id)] = asString(row[labelKey]) || asString(row.name);
    }
    return map;
  }, [data, def.fields]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      def.searchKeys.some((key) => {
        const value = row[key];
        if (typeof value === "string") return value.toLowerCase().includes(needle);
        if (value && typeof value === "object") {
          const record = value as Record<string, unknown>;
          return Object.values(record).some(
            (entry) => typeof entry === "string" && entry.toLowerCase().includes(needle),
          );
        }
        return false;
      }),
    );
  }, [rows, query, def.searchKeys]);

  const openNew = () => {
    setEditing({ id: null, draft: defaultDraft(def, rows.length) });
    setError(null);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const draft: Draft = {};
    for (const field of def.fields) draft[field.key] = row[field.key];
    setEditing({ id: asString(row.id), draft });
    setError(null);
  };

  const save = () => {
    if (!editing) return;
    for (const field of def.fields) {
      if (!field.required) continue;
      const value = editing.draft[field.key];
      const text = typeof value === "string" ? value : value && typeof value === "object" ? asBi(value).ko : "";
      if (!text.trim()) {
        setError(`‘${field.label.ko}’은(는) 비워 둘 수 없습니다.`);
        return;
      }
    }
    if (editing.id) updateRecord(def.key, editing.id, editing.draft);
    else createRecord(def.key, editing.draft);
    setEditing(null);
  };

  const setField = (key: string, value: unknown) => {
    setEditing((current) => (current ? { ...current, draft: { ...current.draft, [key]: value } } : current));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="검색"
            className="w-48 border border-line bg-paper px-3 py-2 font-sans text-[0.75rem] outline-none focus:border-ink"
          />
          <span className="font-sans text-[0.625rem] uppercase tracking-[0.14em] text-muted">
            {filtered.length} / {rows.length}
          </span>
        </div>
        <Btn variant="primary" onClick={openNew}>
          + 새 항목
        </Btn>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="아직 항목이 없습니다"
          body="첫 항목을 추가하면 이 표와 공개 사이트의 연결 지점이 함께 갱신됩니다."
          action={
            <Btn variant="primary" onClick={openNew}>
              + 새 항목
            </Btn>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-y border-ink/80">
                  {columns.map((field) => (
                    <th
                      key={field.key}
                      className="whitespace-nowrap px-2 py-2 font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted"
                    >
                      {field.label.ko}
                    </th>
                  ))}
                  <th className="w-32 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={asString(row.id)} className="group border-b border-line align-top hover:bg-porcelain/60">
                    {columns.map((field) => (
                      <td key={field.key} className="px-2 py-3 font-sans text-[0.75rem] leading-relaxed text-graphite">
                        {renderCell(field, row[field.key], referencedLabels)}
                      </td>
                    ))}
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Btn variant="ghost" onClick={() => moveRecord(def.key, asString(row.id), -1)} title="위로">
                          ↑
                        </Btn>
                        <Btn variant="ghost" onClick={() => moveRecord(def.key, asString(row.id), 1)} title="아래로">
                          ↓
                        </Btn>
                        <Btn variant="ghost" onClick={() => openEdit(row)}>
                          수정
                        </Btn>
                        {confirming === asString(row.id) ? (
                          <>
                            <Btn variant="danger" onClick={() => { deleteRecord(def.key, asString(row.id)); setConfirming(null); }}>
                              확인
                            </Btn>
                            <Btn variant="ghost" onClick={() => setConfirming(null)}>
                              취소
                            </Btn>
                          </>
                        ) : (
                          <Btn variant="ghost" onClick={() => setConfirming(asString(row.id))}>
                            삭제
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <li key={asString(row.id)} className="border border-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-serif text-[1.0625rem] leading-tight text-ink">
                    {asString(row[def.primary]) || "(이름 없음)"}
                  </p>
                  <div className="flex shrink-0 gap-1">
                    <Btn variant="ghost" onClick={() => openEdit(row)}>
                      수정
                    </Btn>
                    <Btn variant="ghost" onClick={() => setConfirming(asString(row.id))}>
                      삭제
                    </Btn>
                  </div>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  {columns.slice(1, 5).map((field) => (
                    <div key={field.key} className="min-w-0">
                      <dt className="font-sans text-[0.5rem] uppercase tracking-[0.14em] text-muted">{field.label.ko}</dt>
                      <dd className="truncate font-sans text-[0.6875rem] text-graphite">
                        {renderCell(field, row[field.key], referencedLabels)}
                      </dd>
                    </div>
                  ))}
                </dl>
                {confirming === asString(row.id) ? (
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-line pt-2">
                    <span className="mr-auto font-sans text-[0.625rem] text-[#8a3c3c]">정말 삭제할까요?</span>
                    <Btn variant="danger" onClick={() => { deleteRecord(def.key, asString(row.id)); setConfirming(null); }}>
                      삭제
                    </Btn>
                    <Btn variant="ghost" onClick={() => setConfirming(null)}>
                      취소
                    </Btn>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? `${def.title.ko} 수정` : `${def.title.ko} 추가`}
        wide
        footer={
          <>
            <Btn onClick={() => setEditing(null)}>취소</Btn>
            <Btn variant="primary" onClick={save}>
              저장
            </Btn>
          </>
        }
      >
        {error ? (
          <p className="mb-4 border-l-2 border-[#8a3c3c] bg-[#8a3c3c]/5 px-3 py-2 font-sans text-[0.75rem] text-[#8a3c3c]">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {def.fields.map((field) => (
            <div key={field.key} className={cn(field.kind === "biTextarea" || field.kind === "textarea" ? "sm:col-span-2" : "")}>
              {renderField(field, editing?.draft ?? {}, setField, referencedLabels)}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function renderCell(
  field: FieldDef,
  value: unknown,
  referencedLabels: Record<string, string>,
): React.ReactNode {
  switch (field.kind) {
    case "bi": {
      const text = asBi(value);
      return (
        <span className="block">
          <span className="block text-ink">{text.ko || "—"}</span>
          {text.en && text.en !== text.ko ? (
            <span className="block font-sans text-[0.625rem] text-muted">{text.en}</span>
          ) : null}
        </span>
      );
    }
    case "select":
      return <span className="whitespace-nowrap">{optionLabel(field, asString(value), referencedLabels)}</span>;
    case "boolean":
      return asBool(value) ? <Tag tone="brass">ON</Tag> : <Tag>OFF</Tag>;
    case "tags":
      return <span className="whitespace-nowrap text-muted">{asTags(value).join(", ") || "—"}</span>;
    case "number":
      return <span className="font-sans tabular-nums">{asNumber(value).toLocaleString("ko-KR")}</span>;
    case "url": {
      const url = asString(value);
      if (!url) return <span className="text-muted">—</span>;
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="link-rule block max-w-[28ch] truncate">
          {url.replace(/^https?:\/\//, "")}
        </a>
      );
    }
    default: {
      const text = asString(value);
      return <span className="block max-w-[32ch] truncate" title={text}>{text || "—"}</span>;
    }
  }
}

function renderField(
  field: FieldDef,
  draft: Draft,
  setField: (key: string, value: unknown) => void,
  referencedLabels: Record<string, string>,
): React.ReactNode {
  const value = draft[field.key];
  const hint = field.hint?.ko;

  switch (field.kind) {
    case "bi":
      return (
        <BiField
          label={field.label.ko}
          value={asBi(value)}
          onChange={(next: Bi) => setField(field.key, next)}
          hint={hint}
        />
      );
    case "biTextarea":
      return (
        <BiField
          label={field.label.ko}
          value={asBi(value)}
          onChange={(next: Bi) => setField(field.key, next)}
          multiline
          rows={4}
          hint={hint}
        />
      );
    case "textarea":
      return (
        <Field label={field.label.ko} hint={hint}>
          <TextArea value={asString(value)} onChange={(next) => setField(field.key, next)} rows={4} />
        </Field>
      );
    case "select": {
      const options = field.optionsFrom
        ? [
            { value: "", label: "— 선택 안 함" },
            ...Object.entries(referencedLabels).map(([id, label]) => ({ value: id, label })),
          ]
        : (field.options ?? []).map((option) => ({ value: option.value, label: option.label.ko }));
      return (
        <Field label={field.label.ko} hint={hint}>
          <Select value={asString(value)} onChange={(next) => setField(field.key, next)} options={options} />
        </Field>
      );
    }
    case "boolean":
      return (
        <div className="pt-6">
          <Switch checked={asBool(value)} onChange={(next) => setField(field.key, next)} label={field.label.ko} />
          {hint ? <p className="mt-1 font-sans text-[0.625rem] text-muted">{hint}</p> : null}
        </div>
      );
    case "number":
      return (
        <Field label={field.label.ko} hint={hint}>
          <TextInput
            type="number"
            value={asNumber(value)}
            min={field.min}
            step={field.step}
            onChange={(next) => setField(field.key, next === "" ? 0 : Number(next))}
          />
        </Field>
      );
    case "date":
      return (
        <Field label={field.label.ko} hint={hint}>
          <TextInput type="date" value={asString(value)} onChange={(next) => setField(field.key, next)} />
        </Field>
      );
    case "url":
      return (
        <Field label={field.label.ko} hint={hint}>
          <TextInput
            type="url"
            value={asString(value)}
            placeholder="https://"
            onChange={(next) => setField(field.key, next)}
          />
        </Field>
      );
    case "tags":
      return (
        <Field label={field.label.ko} hint={hint}>
          <TextInput
            value={asTags(value).join(", ")}
            placeholder="ko, en, zh"
            onChange={(next) =>
              setField(
                field.key,
                next
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              )
            }
          />
        </Field>
      );
    case "color":
      return (
        <Field label={field.label.ko} hint={hint}>
          <TextInput type="color" value={asString(value) || "#000000"} onChange={(next) => setField(field.key, next)} />
        </Field>
      );
    default:
      return (
        <Field label={field.label.ko} hint={hint}>
          <TextInput value={asString(value)} onChange={(next) => setField(field.key, next)} />
        </Field>
      );
  }
}
