"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * AutoTranslate — visitor-language reach for the two static locales.
 *
 * `/ko/` and `/en/` stay fully static. When the browser's language is neither
 * (or the visitor picks one from the menu), text nodes are translated in place
 * through Google Translate's public single endpoint and cached in localStorage,
 * so a second visit is instant. Brand names are protected with `notranslate`
 * spans; `ar` flips the page to RTL for the session, back to LTR on exit.
 */

export const AUTO_LANGS = [
  { code: "ja", label: "日本語" },
  { code: "zh-CN", label: "中文" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Русский" },
  { code: "id", label: "Indonesia" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "ar", label: "العربية" },
] as const;

const STORAGE_KEY = "gdu-autolang";
const CACHE_KEY = "gdu-tr-cache-v1";
const BASE_LANGS = ["ko", "en"];

/** Brand marks and numerals that must never be rewritten. */
const PROTECT = [
  "AjakStudio",
  "AjakStudio",
  "Ajak Studio",
  "AjakStudioKFN",
  "SW Global",
  "KOMI & MOMO",
  "KOMI-Diary",
  "KOMI & MOMO POP",
  "KOMI & MOMO BUBBLE MERGE",
  "MOMO ADVENTURE RUN",
  "K-Sajoo",
  "ABI",
  "Ajak",
  "HOJAKDO",
  "Danjjan Sallim",
  "KFN",
  "KOMI's Unnie",
  "SQLite",
];

type Cache = Record<string, string>;

function loadCache(): Cache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as Cache;
  } catch {
    return {};
  }
}

function saveCache(cache: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* private mode — the site still works, translations just re-fetch */
  }
}

/** Wrap protected brand marks in <span class="notranslate"> so the endpoint keeps them. */
function protectSpans(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const edits: Array<{ node: Text; html: string }> = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.parentElement) continue;
    const text = node.nodeValue ?? "";
    if (!text.trim()) continue;
    if (node.parentElement.closest(".notranslate")) continue;
    let hit = false;
    let html = text;
    for (const mark of PROTECT) {
      if (html.includes(mark)) {
        html = html.split(mark).join(`<span class="notranslate">${mark}</span>`);
        hit = true;
      }
    }
    if (hit) edits.push({ node, html });
  }
  for (const { node, html } of edits) {
    const span = document.createElement("span");
    span.innerHTML = html;
    node.replaceWith(...Array.from(span.childNodes));
  }
}

function collectTargets(root: ParentNode): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.nodeValue?.trim()) continue;
    if (node.parentElement?.closest(".notranslate, [data-no-translate], script, style, noscript")) continue;
    targets.push(node);
  }
  return targets;
}

async function translateBatch(
  texts: string[],
  target: string,
  source: string,
  cache: Cache,
): Promise<string[]> {
  const endpoint = "https://translate.googleapis.com/translate_a/single";
  const results: string[] = [];
  const CHUNK = 40;
  for (let i = 0; i < texts.length; i += CHUNK) {
    const slice = texts.slice(i, i + CHUNK);
    const sep = "\n@@@\n";
    const q = slice.join(sep);
    const url = `${endpoint}?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`translate ${res.status}`);
    const data = (await res.json()) as Array<Array<[string, string]>>;
    const joined = (data?.[0] ?? []).map((part) => part?.[0] ?? "").join("");
    const parts = joined.split(/@@@|@@@/).map((p) => p.trim());
    if (parts.length !== slice.length) {
      // fall back to per-line translation if the separator split is uneven
      slice.forEach((original, idx) => {
        const key = `${target}:${original}`;
        results.push(cache[key] ?? original);
      });
    } else {
      slice.forEach((original, idx) => {
        const key = `${target}:${original}`;
        const value = parts[idx] || original;
        cache[key] = value;
        results.push(value);
      });
    }
  }
  return results;
}

function restoreOriginals(root: ParentNode, snapshot: Map<Text, string>) {
  for (const [node, original] of snapshot) {
    if (node.parentNode) node.nodeValue = original;
  }
  root.querySelectorAll("span.gdu-protected").forEach((el) => {
    const text = el.getAttribute("data-original") ?? el.textContent ?? "";
    el.replaceWith(document.createTextNode(text));
  });
}

function unprotect(root: ParentNode) {
  root.querySelectorAll("span.gdu-protected").forEach((el) => {
    const text = el.getAttribute("data-original") ?? el.textContent ?? "";
    el.replaceWith(document.createTextNode(text));
  });
}

function snapshotProtected(root: ParentNode) {
  root.querySelectorAll("span.notranslate").forEach((el) => {
    el.setAttribute("data-original", el.textContent ?? "");
    el.classList.add("gdu-protected");
  });
}

export function AutoTranslate({ locale }: { locale: "ko" | "en" }) {
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1) explicit visitor choice wins, 2) browser language when not ko/en
    const saved = localStorage.getItem(STORAGE_KEY);
    const browser = (navigator.language || "en").toLowerCase();
    const pick = AUTO_LANGS.find((l) => browser.startsWith(l.code.toLowerCase().slice(0, 2)) && browser.slice(0, 2) !== "en" && browser.slice(0, 2) !== "ko");
    if (saved && saved !== locale) {
      setActive(saved);
    } else if (!saved && pick) {
      setActive(pick.code);
    }
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    const root = document.getElementById("main");
    if (!root) return;

    (async () => {
      if (!active || active === locale) {
        document.documentElement.lang = locale;
        document.documentElement.dir = "ltr";
        return;
      }
      setBusy(true);
      setProgress(0);
      try {
        const source = locale;
        const cache = loadCache();
        protectSpans(root);
        snapshotProtected(root);
        const targets = collectTargets(root);
        // unique originals, longest first so shared prefixes dedupe well
        const originals = Array.from(new Set(targets.map((t) => t.nodeValue!.trim())));
        const missing = originals.filter((t) => !(cache[`${active}:${t}`]));
        const done = await translateBatch(missing, active, source, cache);
        saveCache(cache);
        if (cancelled) return;
        let index = 0;
        for (const node of targets) {
          const raw = node.nodeValue!.trim();
          const key = `${active}:${raw}`;
          const value = cache[key];
          if (value) node.nodeValue = node.nodeValue!.replace(raw, value);
          index += 1;
          if (index % 60 === 0) setProgress(Math.round((index / targets.length) * 100));
        }
        document.documentElement.lang = active;
        document.documentElement.dir = active === "ar" ? "rtl" : "ltr";
        setActive(active);
      } catch {
        /* network refused — leave the static page untouched */
        document.documentElement.lang = locale;
        document.documentElement.dir = "ltr";
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, locale]);

  const choose = (code: string | null) => {
    setOpen(false);
    // Any switch reloads the static page first, so translation always starts
    // from the pristine server-rendered text instead of stacking on itself.
    if (!code || BASE_LANGS.includes(code)) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
      return;
    }
    localStorage.setItem(STORAGE_KEY, code);
    window.location.reload();
  };

  const current = AUTO_LANGS.find((l) => l.code === active);

  return (
    <div className="relative" data-no-translate>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 whitespace-nowrap font-sans text-[0.625rem] uppercase tracking-[0.14em] transition-colors",
          active ? "text-ink" : "text-muted hover:text-ink",
        )}
      >
        <span aria-hidden>🌐</span>
        {busy ? `··· ${progress}%` : current ? current.label : "AUTO"}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[60] mt-2 w-44 border border-line bg-paper p-2 shadow-[0_10px_30px_rgba(20,20,15,0.08)]">
          <p className="px-2 py-1 font-sans text-[0.5rem] uppercase tracking-[0.16em] text-muted">
            Language
          </p>
          <button
            type="button"
            onClick={() => choose(null)}
            className={cn(
              "block w-full px-2 py-1.5 text-left font-sans text-[0.6875rem] tracking-[0.08em] transition-colors hover:bg-porcelain",
              !active ? "text-ink" : "text-graphite",
            )}
          >
            {locale === "ko" ? "한국어 (기본)" : "English (default)"}
          </button>
          <ul className="mt-1 border-t border-line pt-1">
            {AUTO_LANGS.map((lang) => (
              <li key={lang.code}>
                <button
                  type="button"
                  onClick={() => choose(lang.code)}
                  className={cn(
                    "block w-full px-2 py-1.5 text-left font-sans text-[0.6875rem] tracking-[0.04em] transition-colors hover:bg-porcelain",
                    active === lang.code ? "text-ink" : "text-graphite",
                  )}
                >
                  {lang.label}
                  <span className="ml-2 text-[0.5625rem] uppercase tracking-[0.14em] text-muted">
                    {lang.code}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
