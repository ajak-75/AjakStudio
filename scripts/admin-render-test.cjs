/**
 * Render every Control Center screen outside a browser.
 *
 * This is a smoke test, not a substitute for clicking through the app: it runs
 * the real components with the real seed data through React's server renderer
 * and fails on any render-time exception or empty screen. It catches the class
 * of bug that a click-through would find first (a missing field, an undefined
 * relation, a broken list), without needing a display.
 *
 * Run: npm run test:render
 */
const path = require("path");
const Module = require("module");

const OUT = path.join(__dirname, "..", ".tmp-test", "ssr", "src");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) {
    return originalResolve.call(this, path.join(OUT, request.slice(2)), ...rest);
  }
  return originalResolve.call(this, request, ...rest);
};

const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const { AdminDataProvider } = require("../.tmp-test/ssr/src/lib/admin/store.js");
const { createSeedData } = require("../.tmp-test/ssr/src/lib/admin/seed.js");
const { OverviewSection } = require("../.tmp-test/ssr/src/components/admin/sections/Overview.js");
const { CollectionSection } = require("../.tmp-test/ssr/src/components/admin/sections/Collection.js");
const { ImageLibrary, VideoLibrary, DocumentLibrary, PromptVault } = require("../.tmp-test/ssr/src/components/admin/sections/Archive.js");
const { GitHubSection, NotionSection } = require("../.tmp-test/ssr/src/components/admin/sections/Infra.js");
const { FinanceSection } = require("../.tmp-test/ssr/src/components/admin/sections/Finance.js");
const { BackupSection } = require("../.tmp-test/ssr/src/components/admin/sections/Backup.js");
const { HeroStudio } = require("../.tmp-test/ssr/src/components/admin/HeroStudio.js");

const data = createSeedData();
const h = React.createElement;

function render(name, element) {
  try {
    const html = renderToStaticMarkup(h(AdminDataProvider, { initialData: data }, element));
    if (!html || html.length < 200) throw new Error(`output too small (${html.length} chars)`);
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length < 60) throw new Error("no readable text rendered");
    return { name, ok: true, chars: html.length, text: text.slice(0, 90) };
  } catch (error) {
    return { name, ok: false, error: error.message };
  }
}

const screens = [
  ["01 개요", h(OverviewSection, { onNavigate: () => {} })],
  ["02 앱", h(CollectionSection, { id: "apps" })],
  ["03 채널", h(CollectionSection, { id: "channels" })],
  ["04 Hero Studio", h(HeroStudio)],
  ["05 콘텐츠", h(CollectionSection, { id: "contents" })],
  ["06 이미지", h(ImageLibrary)],
  ["07 영상", h(VideoLibrary)],
  ["08 문서", h(DocumentLibrary)],
  ["09 프롬프트", h(PromptVault)],
  ["10 프로젝트", h(CollectionSection, { id: "projects" })],
  ["11 일정", h(CollectionSection, { id: "tasks" })],
  ["12 GitHub", h(GitHubSection)],
  ["13 Notion", h(NotionSection)],
  ["14 재무", h(FinanceSection)],
  ["15 백업", h(BackupSection)],
];

let pass = 0;
const failed = [];
for (const [name, element] of screens) {
  const result = render(name, element);
  if (result.ok) {
    pass += 1;
    console.log(`  ✓ ${name} · ${result.chars} chars · ${result.text}`);
  } else {
    failed.push(`${name}: ${result.error}`);
    console.log(`  ✗ ${name} · ${result.error}`);
  }
}

console.log(`\nRENDER PASS ${pass}/15`);
if (failed.length) {
  console.log(failed.join("\n"));
  process.exit(1);
}
