/* Self-test for the Control Center's pure logic. Run: node .tmp-test/run-tests.cjs */
const Module = require("module");
const path = require("path");

const OUT = path.join(__dirname, "..", ".tmp-test", "out", "src");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) {
    return originalResolve.call(this, path.join(OUT, request.slice(2)), ...rest);
  }
  return originalResolve.call(this, request, ...rest);
};

const hero = require("../.tmp-test/out/src/lib/admin/hero.js");
const backup = require("../.tmp-test/out/src/lib/admin/backup.js");
const metrics = require("../.tmp-test/out/src/lib/admin/metrics.js");
const seed = require("../.tmp-test/out/src/lib/admin/seed.js");

let pass = 0;
const failures = [];
function check(name, condition, detail) {
  if (condition) {
    pass += 1;
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  }
}
function near(a, b, eps = 0.001) {
  return Math.abs(a - b) <= eps;
}

/* ------------------------------------------------------------ hero geometry */

{
  const layer = { id: "l", assetId: "a", url: null, x: 0.5, y: 0.5, scale: 1, crop: { x: 0, y: 0, w: 1, h: 1 }, opacity: 1, visible: true };
  const rect = hero.imageRect(layer, 1600, 900, 1000, 1000);
  check("cover: square image fills 16:9 frame width", rect && near(rect.dw, 1600) && near(rect.dh, 1600), JSON.stringify(rect));
  check("cover: centred", rect && near(rect.dx, 0) && near(rect.dy, -350), JSON.stringify(rect));
  check("crop: source rect uses full image", rect && near(rect.sw, 1000) && near(rect.sh, 1000));

  const half = hero.imageRect({ ...layer, crop: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 } }, 1600, 900, 1000, 1000);
  check("crop: source offset honoured", half && near(half.sx, 250) && near(half.sy, 250) && near(half.sw, 500));
  check("crop: aspect preserved", half && near(half.dw / half.dh, 1));

  const zoom = hero.imageRect({ ...layer, scale: 0.5 }, 1600, 900, 1000, 1000);
  check("scale 0.5 uses half the frame width for a square", zoom && near(zoom.dw, 800), JSON.stringify(zoom));

  const inside = hero.imageRect({ ...layer, x: 5, y: 5 }, 1600, 900, 1000, 1000);
  check("position clamped into a sane range", inside && inside.dx > -1e6 && inside.dy > -1e6);

  const zero = hero.imageRect(layer, 1600, 900, 0, 0);
  check("missing image dimensions return null", zero === null);

  const cropClamped = hero.imageRect({ ...layer, crop: { x: 0.9, y: 0.9, w: 0.5, h: 0.5 } }, 1600, 900, 1000, 1000);
  check("crop offset clamped to the image", cropClamped && cropClamped.sx + cropClamped.sw <= 1000.001);
}

/* --------------------------------------------------------------- hero state */

{
  const base = {
    id: "h1",
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
    name: "home-hero",
    version: 1,
    snapshot: seed.defaultHeroSnapshot,
    published: true,
    publishedAt: "2026-11-20T01:00:00.000Z",
    note: "",
  };
  const second = { ...base, id: "h2", version: 2, published: false, publishedAt: null };
  const third = { ...base, id: "h3", version: 3, published: true, publishedAt: "2026-11-21T01:00:00.000Z" };

  check("nextVersion counts versions", hero.nextVersion([base, second]) === 3);
  check("nextVersion for a new name starts at 1", hero.nextVersion([base], "other") === 1);

  const published = hero.publishInList([base, second], "h2");
  check("publish marks the target", published.find((l) => l.id === "h2").published === true);
  check("publish unpublishes the previous version", published.find((l) => l.id === "h1").published === false);
  check("publish leaves exactly one published", published.filter((l) => l.published).length === 1);
  check("publish sets publishedAt", Boolean(published.find((l) => l.id === "h2").publishedAt));

  check("publishedLayout picks the newest published", hero.publishedLayout([base, second, third]).id === "h3");
  check("publishedLayout with none returns null", hero.publishedLayout([second]) === null);

  const clone = hero.cloneLayout(base, 4, "복원");
  check("restore clones to a new id", clone.id !== base.id);
  check("restore keeps the source published state off", clone.published === false);
  clone.snapshot.pc.text.headline = "changed";
  check("restore deep-copies the snapshot", base.snapshot.pc.text.headline !== "changed");

  const publishedLayouts = hero.publishInList([{ ...second }, { ...third }], "h2");
  check("publishing an older version keeps one published", publishedLayouts.filter((l) => l.published).length === 1);
}

/* ------------------------------------------------------------ backup format */

{
  const data = seed.createSeedData();
  const text = backup.serializeBackup(data);
  const parsed = backup.parseBackup(text);
  check("backup parses its own output", parsed.ok === true, parsed.error);
  check("backup round-trip keeps app count", parsed.payload.data.apps.length === data.apps.length);
  check("backup round-trip keeps hero versions", parsed.payload.data.heroLayouts.length === data.heroLayouts.length);
  check("backup round-trip keeps Korean copy", parsed.payload.data.apps[0].tagline.ko.length > 0);
  check("checksum is stable", backup.hashString(text) === backup.hashString(text));
  check("checksum differs for different text", backup.hashString(text) !== backup.hashString(text + " "));
  check("summary counts every collection", backup.summarizeBackup(parsed.payload).total > 20);
  check("summary sees no images in data-only backup", backup.summarizeBackup(parsed.payload).withImages === false);

  const broken = backup.parseBackup("{not json");
  check("invalid JSON is rejected", broken.ok === false && /JSON/.test(broken.error));
  const wrongFormat = backup.parseBackup(JSON.stringify({ format: "other", version: 1, data }));
  check("foreign file is rejected", wrongFormat.ok === false && /format/.test(wrongFormat.error));
  const noNotion = JSON.parse(text);
  delete noNotion.data.notion;
  check("missing notion block is rejected", backup.parseBackup(JSON.stringify(noNotion)).ok === false);

  const missing = JSON.parse(text);
  delete missing.data.tasks;
  const missingResult = backup.parseBackup(JSON.stringify(missing));
  check("missing collection is rejected", missingResult.ok === false && /tasks/.test(missingResult.error));
  const futureVersion = JSON.parse(text);
  futureVersion.version = 99;
  check("future version is rejected", backup.parseBackup(JSON.stringify(futureVersion)).ok === false);

  const withImages = backup.serializeBackup(data, [{ id: "builtin-hojakdo", dataUrl: "data:image/webp;base64,AAAA" }]);
  const withImagesParsed = backup.parseBackup(withImages);
  check("image payload parses", withImagesParsed.ok === true);
  check("image payload is summarised", withImagesParsed.summary.withImages === true && withImagesParsed.summary.images === 1);
  check("bad image payload is rejected", backup.parseBackup(JSON.stringify({ ...JSON.parse(withImages), images: [{ id: 1 }] })).ok === false);

  check("file stamp format", /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(backup.backupFileStamp(new Date("2026-11-20T08:55:00"))));
  check("formatBytes", backup.formatBytes(2048) === "2 KB" && backup.formatBytes(0) === "0 B");
}

/* ------------------------------------------------------------------ finance */

{
  const rows = [
    { id: "f1", createdAt: "", updatedAt: "", date: "2026-11-02", direction: "income", category: "판매", item: "스마트스토어", amount: 120000, currency: "KRW", note: "" },
    { id: "f2", createdAt: "", updatedAt: "", date: "2026-11-05", direction: "expense", category: "인프라", item: "도메인", amount: 15000, currency: "KRW", note: "" },
    { id: "f3", createdAt: "", updatedAt: "", date: "2026-10-30", direction: "expense", category: "인프라", item: "서버", amount: 5000, currency: "KRW", note: "" },
    { id: "f4", createdAt: "", updatedAt: "", date: "2026-11-06", direction: "expense", category: "구독", item: "툴", amount: 20, currency: "USD", note: "" },
  ];
  const november = metrics.financeTotals(rows, "2026-11");
  check("monthly income", november.income === 120000);
  check("monthly expense", november.expense === 15000);
  check("monthly net", november.net === 105000);
  check("USD rows are separated", november.foreign === 20);
  check("all-time net", metrics.financeTotals(rows).net === 100000);
  const groups = metrics.groupFinanceByMonth(rows);
  check("months are newest first", groups[0].month === "2026-11" && groups[1].month === "2026-10");
  check("month grouping counts rows", groups[0].count === 3);
  check("KRW formatting", metrics.formatKrw(1234567) === "₩1,234,567");
  check("negative formatting", metrics.formatKrw(-500) === "-₩500");
}

/* -------------------------------------------------------------------- seed */

{
  const data = seed.createSeedData();
  check("seed: five apps", data.apps.length === 5);
  check("seed: five live or beta apps", data.apps.filter((a) => a.status !== "coming_soon").length === 5);
  check("seed: eight channels", data.channels.length === 8);
  check("seed: two built-in images", data.images.length === 2);
  check("seed: builtin images resolve to public files", data.images.every((i) => i.publicUrl && i.publicUrl.startsWith("/hero/")));
  check("seed: builtin image bytes are recorded", data.images.every((i) => i.byteSize > 0 && i.width === 1100));
  check("seed: one hero version", data.heroLayouts.length === 1);
  check("seed: hero not published by default", data.heroLayouts.every((l) => !l.published));
  check("seed: three prompts", data.prompts.length === 3);
  check("seed: projects include the site itself", data.projects.some((p) => p.title.includes("GLOBAL DIGITAL UNIVERSE")));
  check("seed: notion workspace recorded", data.notion.workspace.length > 0);
  check("seed: six repositories", data.repos.length === 6);
  check("seed: backup log empty", data.backups.length === 0);

  const snapshot = seed.defaultHeroSnapshot;
  check("hero: pc frame has the magpie-tiger layer", snapshot.pc.layers.length === 1 && snapshot.pc.layers[0].assetId === "builtin-hojakdo");
  check("hero: mobile frame has the same artwork", snapshot.mobile.layers[0].assetId === "builtin-hojakdo");
  check("hero: every layer asset exists in the image library", [...snapshot.pc.layers, ...snapshot.mobile.layers].every((l) => data.images.some((i) => i.id === l.assetId)));
  check("hero: every layer carries a resolvable url", [...snapshot.pc.layers, ...snapshot.mobile.layers].every((l) => Boolean(l.url)));
  check("hero: Korean headline present", snapshot.pc.text.headline.includes("디지털"));
  check("hero: English headline present", Boolean(snapshot.pc.text.headlineEn && snapshot.pc.text.headlineEn.includes("digital")));
  check("hero: text width configured", snapshot.pc.text.maxWidth === 0.42);
  check("hero: mobile frame is portrait", hero.aspectOf(snapshot.mobile) < 1);
  check("hero: pc frame is landscape", near(hero.aspectOf(snapshot.pc), 16 / 9));

  const rectPc = hero.imageRect(snapshot.pc.layers[0], 1600, 900, 1100, 1100);
  check("layout: pc artwork stays inside the frame", rectPc.dx >= 0 && rectPc.dx + rectPc.dw <= 1600.5 && rectPc.dy >= 0 && rectPc.dy + rectPc.dh <= 900.5, JSON.stringify(rectPc));
  check("layout: pc artwork sits on the right", rectPc.dx > 1600 / 2);
  check("layout: pc text block does not reach the artwork", 0.055 * 1600 + Math.min(0.42 * 1.1, 0.9) * 1600 <= rectPc.dx + 1, `${0.055 * 1600 + Math.min(0.42 * 1.1, 0.9) * 1600} vs ${rectPc.dx}`);

  const rectMobile = hero.imageRect(snapshot.mobile.layers[0], 900, 1200, 1100, 1100);
  check("layout: mobile artwork inside frame", rectMobile.dx >= 0 && rectMobile.dy >= 0 && rectMobile.dy + rectMobile.dh <= 1200.5, JSON.stringify(rectMobile));
  check("layout: mobile text starts below the artwork", snapshot.mobile.text.y * 1200 >= rectMobile.dy + rectMobile.dh - 1, `${snapshot.mobile.text.y * 1200} vs ${rectMobile.dy + rectMobile.dh}`);

  const metricsData = metrics.overviewMetrics(data);
  check("overview: app count", metricsData.apps === 5);
  check("overview: channel count", metricsData.channels === 8);
  check("overview: hero versions", metricsData.heroVersions === 1);
  check("overview: no monthly cost", metricsData.monthlyCost === 0);
  check("overview: due soon counts", metricsData.dueSoon >= 0);
  check("overview: storage in MB", metricsData.storageMb > 0);

  check("seed cloning is independent", (() => {
    const a = seed.createSeedData();
    a.heroLayouts[0].snapshot.pc.text.headline = "x";
    const b = seed.createSeedData();
    return b.heroLayouts[0].snapshot.pc.text.headline !== "x";
  })());
}

/* ------------------------------------------------------------------ report */

console.log(`\nPASS ${pass} · FAIL ${failures.length}`);
if (failures.length) {
  for (const failure of failures) console.log("  ✗", failure);
  process.exit(1);
}
console.log("All pure-logic checks passed.");
