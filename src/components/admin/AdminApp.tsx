"use client";

import { useCallback, useEffect, useState } from "react";

import { resolveAdminAuth, signInWithPassword, signOutAdmin, sendMagicLink, supabaseEnabled, type AdminAuthState } from "@/lib/admin/auth";
import { ADMIN_MENU, GROUP_LABEL, isAdminSection, type AdminMenuItem } from "@/lib/admin/menu";
import { AdminDataProvider, useAdminData } from "@/lib/admin/store";
import { cn, formatEditorialDate } from "@/lib/utils";

import { Btn, CopyButton, Field, TextInput } from "./Ui";
import { CollectionSection } from "./sections/Collection";
import { OverviewSection } from "./sections/Overview";
import { HeroStudio } from "./HeroStudio";
import { ImageLibrary, PromptVault, VideoLibrary, DocumentLibrary } from "./sections/Archive";
import { GitHubSection, NotionSection } from "./sections/Infra";
import { FinanceSection } from "./sections/Finance";
import { BackupSection } from "./sections/Backup";
import { entityDefs } from "@/lib/admin/defs";

const ADMIN_SQL =
  "insert into public.admin_users (id, display_name, role)\nvalues ('<auth user uuid>', 'Owner', 'owner');";

export function AdminApp() {
  const [auth, setAuth] = useState<AdminAuthState | null>(null);

  const refresh = useCallback(async () => {
    setAuth(await resolveAdminAuth());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!auth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-sans text-[0.75rem] uppercase tracking-[0.16em] text-muted">CONTROL CENTER · 확인 중</p>
      </div>
    );
  }

  if (auth.mode === "supabase" && auth.status === "anonymous") {
    return <SignIn onSignedIn={refresh} />;
  }

  if (auth.mode === "supabase" && auth.status === "forbidden") {
    return <Forbidden email={auth.email} onSignedOut={refresh} />;
  }

  return (
    <AdminDataProvider>
      <AdminShell auth={auth} onSignedOut={refresh} />
    </AdminDataProvider>
  );
}

/* ------------------------------------------------------------------ sign in */

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    if (mode === "password") {
      const result = await signInWithPassword(email, password);
      if (!result.ok) setError(result.error ?? "로그인하지 못했습니다.");
      else onSignedIn();
    } else {
      const result = await sendMagicLink(email);
      if (!result.ok) setError(result.error ?? "메일을 보내지 못했습니다.");
      else setSent(true);
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="border-b border-brass/40 bg-brass-soft/40 px-5 py-2 text-center font-sans text-[0.6875rem] tracking-[0.02em] text-graphite">
        Supabase가 연결된 상태입니다. 운영자 계정으로만 들어갈 수 있습니다.
      </div>
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="font-sans text-[0.625rem] uppercase tracking-[0.24em] text-brass">AjakStudio</p>
          <h1 className="mt-3 font-serif text-[2rem] leading-tight text-ink">CONTROL CENTER</h1>
          <p className="mt-2 font-sans text-[0.75rem] leading-relaxed text-muted">
            비공개 관리자입니다. 로그인 뒤 `admin_users`에 활성 행이 있는 계정만 들어올 수 있습니다.
          </p>

          <div className="mt-8 space-y-4">
            <Field label="이메일">
              <TextInput type="email" value={email} onChange={setEmail} placeholder="owner@example.com" />
            </Field>
            {mode === "password" ? (
              <Field label="비밀번호">
                <TextInput type="password" value={password} onChange={setPassword} />
              </Field>
            ) : null}

            {error ? <p className="font-sans text-[0.75rem] text-[#8a3c3c]">{error}</p> : null}
            {sent ? (
              <p className="border-l-2 border-brass bg-brass-soft/40 px-3 py-2 font-sans text-[0.75rem] text-graphite">
                로그인 링크를 보냈습니다. 메일함에서 열어 주세요.
              </p>
            ) : null}

            <Btn variant="primary" onClick={() => void submit()} disabled={busy || !email.trim()} className="w-full">
              {busy ? "확인 중…" : mode === "password" ? "로그인" : "로그인 링크 받기"}
            </Btn>

            <div className="flex items-center justify-between font-sans text-[0.625rem] uppercase tracking-[0.14em]">
              <button type="button" className="link-rule text-muted hover:text-ink" onClick={() => setMode(mode === "password" ? "magic" : "password")}>
                {mode === "password" ? "이메일 링크로 로그인" : "비밀번호로 로그인"}
              </button>
              <a href="/ko/" className="link-rule text-muted hover:text-ink">
                공개 사이트
              </a>
            </div>
          </div>

          <p className="mt-10 border-t border-line pt-4 font-sans text-[0.625rem] leading-relaxed text-muted">
            계정을 잊었다면 Supabase → Authentication에서 사용자를 만들고, SQL Editor에서
            <code className="mx-1 text-ink">admin_users</code>에 owner 행을 추가합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function Forbidden({ email, onSignedOut }: { email: string | null; onSignedOut: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-lg border border-line bg-paper p-8">
        <p className="font-sans text-[0.625rem] uppercase tracking-[0.2em] text-brass">ACCESS LOCKED</p>
        <h1 className="mt-3 font-serif text-[1.75rem] text-ink">관리자 권한이 없습니다</h1>
        <p className="mt-3 font-sans text-[0.8125rem] leading-relaxed text-graphite">
          {email ? `${email} 계정으로 로그인했습니다. ` : ""}이 계정은 <code className="text-ink">admin_users</code> 허용 목록에 없거나
          비활성 상태입니다. Supabase SQL Editor에서 아래를 한 번 실행하면 들어올 수 있습니다.
        </p>
        <pre className="mt-4 overflow-x-auto border border-line bg-porcelain p-3 font-sans text-[0.6875rem] leading-relaxed text-graphite">
          {ADMIN_SQL}
        </pre>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CopyButton text={ADMIN_SQL} label="SQL 복사" />
          <Btn
            variant="outline"
            onClick={async () => {
              await signOutAdmin();
              onSignedOut();
            }}
          >
            로그아웃
          </Btn>
          <a href="/ko/" className="link-rule font-sans text-[0.625rem] uppercase tracking-[0.14em] text-muted">
            공개 사이트
          </a>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- shell */

function AdminShell({ auth, onSignedOut }: { auth: AdminAuthState; onSignedOut: () => void }) {
  const { storage, saveState, lastSavedAt, notice, setNotice } = useAdminData();
  const [section, setSection] = useState("overview");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (isAdminSection(id)) setSection(id);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const navigate = (id: string) => {
    setSection(id);
    setMobileMenu(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const localMode = auth.mode === "local";
  const role = auth.mode === "supabase" && auth.status === "authorized" ? auth.role : null;
  const active = ADMIN_MENU.find((item) => item.id === section) ?? (ADMIN_MENU[0] as AdminMenuItem);

  return (
    <div className="min-h-screen bg-paper">
      {localMode ? (
        <div className="sticky top-0 z-[60] border-b border-brass/40 bg-brass-soft px-4 py-2 text-center font-sans text-[0.6875rem] leading-relaxed text-graphite">
          <strong className="font-medium text-ink">로컬 미리보기 모드</strong> — Supabase 연결 시 실 DB와 이어집니다. 지금 입력한 내용은 이
          브라우저에 저장됩니다 (이미지 포함 · IndexedDB).
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1560px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-line bg-paper lg:flex">
          <div className="border-b border-line px-5 py-5">
            <a href="/ko/" className="block">
              <p className="font-sans text-[0.5625rem] uppercase tracking-[0.24em] text-brass">AjakStudio</p>
              <p className="mt-1 font-serif text-[1.375rem] leading-none text-ink">CONTROL CENTER</p>
            </a>
            <p className="mt-2 font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">
              {localMode ? "LOCAL PREVIEW" : `SUPABASE · ${role?.toUpperCase()}`}
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="관리자 메뉴">
            {(["FIELD", "STUDIO", "CONTENT", "WORK", "SYSTEM"] as const).map((group) => (
              <div key={group} className="mb-2">
                <p className="px-3 py-1.5 font-sans text-[0.5rem] uppercase tracking-[0.2em] text-muted">
                  {GROUP_LABEL[group].ko} · {GROUP_LABEL[group].en}
                </p>
                <ul>
                  {ADMIN_MENU.filter((item) => item.group === group).map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => navigate(item.id)}
                        aria-current={section === item.id ? "page" : undefined}
                        className={cn(
                          "flex w-full items-baseline gap-3 border-l-2 px-3 py-1.5 text-left transition-colors",
                          section === item.id
                            ? "border-brass bg-porcelain/70 text-ink"
                            : "border-transparent text-graphite hover:text-ink",
                        )}
                      >
                        <span className="w-4 shrink-0 font-sans text-[0.5rem] tracking-[0.14em] text-brass">{item.no}</span>
                        <span className="font-sans text-[0.75rem]">{item.ko}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-line px-4 py-3">
            <p className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-muted">저장 상태</p>
            <p className="mt-1 font-sans text-[0.6875rem] text-graphite">
              {saveState === "saving"
                ? "저장 중…"
                : saveState === "error"
                  ? "저장 실패 — 백업을 내려받으세요"
                  : lastSavedAt
                    ? `${new Date(lastSavedAt).toTimeString().slice(0, 5)} 저장됨`
                    : "대기"}
            </p>
            <p className="mt-1 font-sans text-[0.5625rem] text-muted">
              {storage === "idb" ? "IndexedDB" : storage === "local" ? "localStorage" : "메모리"}
            </p>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenu((open) => !open)}
                  className="border border-line px-2.5 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-ink lg:hidden"
                >
                  {mobileMenu ? "닫기" : "메뉴"}
                </button>
                <div>
                  <p className="font-sans text-[0.5rem] uppercase tracking-[0.2em] text-muted">
                    {active.no} · {GROUP_LABEL[active.group].en}
                  </p>
                  <p className="font-serif text-[1.125rem] leading-tight text-ink">{active.ko}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/ko/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden border border-line px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-ink hover:border-ink sm:inline-flex"
                >
                  공개 사이트
                </a>
                {auth.mode === "supabase" ? (
                  <>
                    <span className="hidden font-sans text-[0.625rem] text-muted md:inline">
                      {auth.status === "authorized" ? auth.displayName || auth.email : ""}
                    </span>
                    <Btn
                      variant="outline"
                      onClick={async () => {
                        await signOutAdmin();
                        onSignedOut();
                      }}
                    >
                      로그아웃
                    </Btn>
                  </>
                ) : (
                  <span className="font-sans text-[0.5625rem] uppercase tracking-[0.14em] text-brass">LOCAL PREVIEW</span>
                )}
              </div>
            </div>

            {mobileMenu ? (
              <nav className="max-h-[60vh] overflow-y-auto border-t border-line px-2 py-2 lg:hidden" aria-label="관리자 메뉴 (모바일)">
                <ul className="grid grid-cols-2 gap-x-2">
                  {ADMIN_MENU.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => navigate(item.id)}
                        className={cn(
                          "flex w-full items-baseline gap-2 border-b border-line px-2 py-2 text-left",
                          section === item.id ? "text-ink" : "text-graphite",
                        )}
                      >
                        <span className="font-sans text-[0.5rem] tracking-[0.14em] text-brass">{item.no}</span>
                        <span className="font-sans text-[0.6875rem]">{item.ko}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </header>

          {notice ? (
            <div className="flex items-start justify-between gap-3 border-b border-line bg-porcelain px-4 py-2 sm:px-6">
              <p className="font-sans text-[0.75rem] text-graphite">{notice}</p>
              <button type="button" onClick={() => setNotice(null)} className="font-sans text-[0.625rem] text-muted hover:text-ink">
                닫기
              </button>
            </div>
          ) : null}

          <main className="px-4 py-6 sm:px-6 sm:py-8">{renderSection(section, navigate)}</main>

          <footer className="border-t border-line px-4 py-6 font-sans text-[0.625rem] leading-relaxed text-muted sm:px-6">
            AJAKSTUDIO · CONTROL CENTER · {supabaseEnabled() ? "Supabase 연결됨" : "로컬 미리보기"} ·{" "}
            {formatEditorialDate(new Date().toISOString())} · 이 화면은 검색에 노출되지 않습니다 (noindex).
          </footer>
        </div>
      </div>
    </div>
  );
}

function renderSection(section: string, navigate: (id: string) => void) {
  switch (section) {
    case "overview":
      return <OverviewSection onNavigate={navigate} />;
    case "hero":
      return (
        <div className="space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-6 border-b border-ink/80 pb-6">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-sans text-[0.625rem] tracking-[0.2em] text-brass">04</span>
                <span className="eyebrow">MENU 04 · HERO STUDIO</span>
              </div>
              <h1 className="mt-3 font-serif text-[clamp(1.75rem,3vw,2.5rem)] leading-tight text-ink">Hero Studio</h1>
              <p className="mt-3 max-w-[62ch] font-sans text-[0.8125rem] leading-relaxed text-muted">
                이미지를 올리고 캔버스에서 크기·위치·크롭·텍스트를 조정합니다. 저장은 새 버전으로 보관되며, 공개 HOME은 고정 시그니처 히어로를 씁니다.
              </p>
            </div>
          </header>
          <HeroStudio />
        </div>
      );
    case "images":
      return <ImageLibrary />;
    case "videos":
      return <VideoLibrary />;
    case "docs":
      return <DocumentLibrary />;
    case "prompts":
      return <PromptVault />;
    case "github":
      return <GitHubSection />;
    case "notion":
      return <NotionSection />;
    case "finance":
      return <FinanceSection />;
    case "backup":
      return <BackupSection />;
    default:
      return entityDefs[section] ? <CollectionSection id={section} /> : <OverviewSection onNavigate={navigate} />;
  }
}
