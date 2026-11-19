import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionLabel({
  index,
  children,
  className,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-4", className)}>
      {index ? <span className="font-sans text-[0.625rem] tracking-[0.2em] text-brass">{index}</span> : null}
      <span className="eyebrow">{children}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <header className="shell pt-14 md:pt-20">
      <p className="font-sans text-[0.625rem] uppercase tracking-[0.2em] text-brass">{eyebrow}</p>
      <h1 className="mt-5 max-w-[18ch] font-serif text-display-l text-ink">{title}</h1>
      {lead ? (
        <p className="mt-8 max-w-measure text-[1.0625rem] leading-[1.75] text-graphite">{lead}</p>
      ) : null}
      <div aria-hidden className="mt-14 h-px w-full bg-line" />
    </header>
  );
}

const statusStyles: Record<string, string> = {
  live: "text-brass",
  beta: "text-brass",
  active: "text-brass",
  coming_soon: "text-muted",
  preparing: "text-muted",
  planned: "text-muted",
  archived: "text-muted",
  paused: "text-muted",
};

export function StatusTag({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-sans text-[0.625rem] uppercase tracking-[0.16em]",
        statusStyles[status] ?? "text-muted",
      )}
    >
      <span aria-hidden className="h-1 w-1 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function ArrowGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      className={cn("h-3 w-3", className)}
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M3 13 13 3M5.5 3H13v7.5" />
    </svg>
  );
}
