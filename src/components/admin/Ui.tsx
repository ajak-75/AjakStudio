"use client";

import { useEffect, useId, type ChangeEvent, type ReactNode } from "react";

import { bi, type Bi } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

/** CONTROL CENTER primitives — the same Editorial White tokens, denser. */

export function Panel({
  children,
  className,
  title,
  note,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("border border-line bg-paper", className)}>
      {title ? (
        <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-serif text-[1.125rem] leading-tight text-ink">{title}</h2>
            {note ? <p className="mt-1 font-sans text-[0.6875rem] leading-relaxed text-muted">{note}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn(title ? "p-5" : "p-5")}>{children}</div>
    </section>
  );
}

export function SectionHead({
  no,
  eyebrow,
  title,
  description,
  action,
}: {
  no: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-ink/80 pb-6">
      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="font-sans text-[0.625rem] tracking-[0.2em] text-brass">{no}</span>
          <span className="eyebrow">{eyebrow}</span>
        </div>
        <h1 className="mt-3 font-serif text-[clamp(1.75rem,3vw,2.5rem)] leading-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-[62ch] font-sans text-[0.8125rem] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </header>
  );
}

const buttonStyles = {
  primary:
    "border border-ink bg-ink px-4 py-2 font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-brass hover:border-brass disabled:opacity-40",
  outline:
    "border border-line bg-paper px-4 py-2 font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink disabled:opacity-40",
  ghost:
    "px-2 py-1 font-sans text-[0.6875rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink disabled:opacity-40",
  danger:
    "border border-[#8a3c3c] px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.12em] text-[#8a3c3c] transition-colors hover:bg-[#8a3c3c] hover:text-paper",
  brass:
    "border border-brass bg-brass px-4 py-2 font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ink hover:border-ink disabled:opacity-40",
} as const;

export function Btn({
  children,
  onClick,
  variant = "outline",
  type = "button",
  disabled,
  className,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: keyof typeof buttonStyles;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap", buttonStyles[variant], className)}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="block font-sans text-[0.625rem] uppercase tracking-[0.14em] text-graphite">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint ? <span className="mt-1 block font-sans text-[0.625rem] leading-relaxed text-muted">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "w-full border border-line bg-paper px-3 py-2 font-sans text-[0.8125rem] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink";

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
  disabled,
  className,
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "url" | "date" | "color" | "number" | "password" | "email";
  min?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      step={step}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      className={cn(inputClass, type === "color" && "h-10 cursor-pointer p-1", className)}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={cn(inputClass, "resize-y leading-relaxed", className)}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(inputClass, "appearance-none bg-[length:10px] pr-8", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3e%3cpath d='M1 1l4 4 4-4' stroke='%236b6862' fill='none'/%3e%3c/svg%3e\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  const id = useId();
  return (
    <span className="flex items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 border transition-colors",
          checked ? "border-ink bg-ink" : "border-line bg-porcelain",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-3 w-3 -translate-y-1/2 bg-paper transition-all",
            checked ? "left-[calc(100%-0.95rem)]" : "left-1",
          )}
        />
      </button>
      <span className="font-sans text-[0.75rem] text-graphite">{label}</span>
    </span>
  );
}

export function BiField({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  hint,
}: {
  label: string;
  value: Bi;
  onChange: (value: Bi) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <span className="block font-sans text-[0.625rem] uppercase tracking-[0.14em] text-graphite">{label}</span>
      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
        {(["ko", "en"] as const).map((locale) => (
          <div key={locale}>
            <span className="mb-1 block font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">
              {locale}
            </span>
            {multiline ? (
              <TextArea
                value={value[locale]}
                rows={rows}
                onChange={(next) => onChange({ ...value, [locale]: next })}
              />
            ) : (
              <TextInput value={value[locale]} onChange={(next) => onChange({ ...value, [locale]: next })} />
            )}
          </div>
        ))}
      </div>
      {hint ? <span className="mt-1 block font-sans text-[0.625rem] text-muted">{hint}</span> : null}
    </div>
  );
}

export function Tag({ children, tone = "line" }: { children: ReactNode; tone?: "line" | "brass" | "ink" | "warn" }) {
  const tones = {
    line: "border-line text-muted",
    brass: "border-brass/40 text-brass",
    ink: "border-ink text-ink",
    warn: "border-[#8a3c3c]/50 text-[#8a3c3c]",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-0.5 font-sans text-[0.5625rem] uppercase tracking-[0.14em]",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-line px-6 py-12 text-center">
      <p className="font-serif text-[1.25rem] text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-[48ch] font-sans text-[0.75rem] leading-relaxed text-muted">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative my-4 w-full border border-ink/20 bg-paper shadow-[0_24px_60px_-30px_rgba(20,20,15,0.45)]",
          wide ? "max-w-4xl" : "max-w-2xl",
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-serif text-[1.125rem] text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-muted hover:text-ink"
          >
            닫기
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer> : null}
      </div>
    </div>
  );
}

export function Meter({ value, max, tone = "ink" }: { value: number; max: number; tone?: "ink" | "brass" | "warn" }) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const colours = { ink: "bg-ink", brass: "bg-brass", warn: "bg-[#8a3c3c]" } as const;
  return (
    <span className="block h-1 w-full bg-porcelain">
      <span className={cn("block h-full transition-all", colours[tone])} style={{ width: `${ratio * 100}%` }} />
    </span>
  );
}

export function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  return (
    <Btn
      variant="ghost"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
      }}
      title="클립보드에 복사"
    >
      {label}
    </Btn>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-t border-line pt-3">
      <p className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1.5 font-serif text-[1.625rem] leading-none text-ink">{value}</p>
      {note ? <p className="mt-1.5 font-sans text-[0.625rem] text-muted">{note}</p> : null}
    </div>
  );
}

export function emptyBi(): Bi {
  return bi("", "");
}
