// Drive Export / Import JSON end-to-end on /dashboard. Bundled headless
// chromium via Playwright (the MCP Chrome launch is blocked by the admin
// policy on this machine per FINAL_GOAL's note).
//
// Flow:
//   1. Navigate to /dashboard, seed localStorage with a known fixture, and
//      verify the Export + Import buttons are visible.
//   2. Click "Export data", capture the download, parse the JSON and assert
//      every v1 slot is present.
//   3. Wipe localStorage, upload the captured JSON via the Import button,
//      click "Overwrite my data", and assert every slot re-hydrated.
//   4. Test the unknown-version guard: upload a v99 bundle, assert we see
//      the "Import failed" error without crashing the app.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const BASE = "http://localhost:4747";
const SHOT_DIR = "/tmp/research-desk-shots/s126";
mkdirSync(SHOT_DIR, { recursive: true });
const TMP = mkdirSync(path.join(os.tmpdir(), "rd-export-test"), {
  recursive: true,
  ...{},
}) || path.join(os.tmpdir(), "rd-export-test");
mkdirSync(TMP, { recursive: true });

const log = (...a) => console.log("[drive]", ...a);
const asserts = [];
const assert = (name, cond, detail = "") => {
  asserts.push({ name, pass: !!cond, detail });
  console.log((cond ? "✓ " : "✗ ") + name + (detail ? " — " + detail : ""));
};

const FIXTURE = {
  progress: { "p1-sutton-barto": "done", "p2-ppo-paper": "inprog" },
  cards: {
    "kl-forward-reverse": {
      ef: 2.6,
      interval: 6,
      reps: 2,
      lapses: 0,
      dueAt: Date.now() + 5 * 86400_000,
    },
  },
  "paper-answers": {
    instructgpt: {
      "alignment-tax": "a real 219-char paragraph the user typed earlier",
    },
  },
  notes: {
    pages: [
      { id: "notes", title: "Notes", body: "# fixture notebook body" },
      { id: "scratch", title: "Scratch", body: "scratch fixture" },
      { id: "weekly-log", title: "Weekly log", body: "w/c 2026-04-27 fixture" },
    ],
  },
  streak: {
    days: ["2026-04-25", "2026-04-26", "2026-04-27"],
    cardsToday: { date: "2026-04-27", count: 7 },
    lastTouched: { id: "p2-ppo-paper", at: Date.now() - 3600_000 },
  },
  "item-notes": { "p1-sutton-barto": "finished ch 6 — GAE intuition stuck" },
};

function envelope(data) {
  return JSON.stringify({ version: 1, data });
}

async function seed(page) {
  await page.evaluate((fix) => {
    localStorage.clear();
    localStorage.setItem(
      "research-desk:v1:progress",
      JSON.stringify({ version: 1, data: fix.progress }),
    );
    localStorage.setItem(
      "research-desk:v1:cards",
      JSON.stringify({ version: 1, data: fix.cards }),
    );
    localStorage.setItem(
      "research-desk:v1:paper-answers",
      JSON.stringify({ version: 1, data: fix["paper-answers"] }),
    );
    localStorage.setItem(
      "research-desk:v1:notes",
      JSON.stringify({ version: 1, data: fix.notes }),
    );
    localStorage.setItem(
      "research-desk:v1:streak",
      JSON.stringify({ version: 1, data: fix.streak }),
    );
    localStorage.setItem(
      "research-desk:v1:item-notes",
      JSON.stringify({ version: 1, data: fix["item-notes"] }),
    );
  }, FIXTURE);
}

const browser = await chromium.launch({ headless: true });
try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const page = await ctx.newPage();

  // --- 1. Seed + load Dashboard ------------------------------------------
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await seed(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="data-export-import"]', {
    timeout: 5000,
  });

  // Buttons must be visible and labeled as the spec demands.
  const exportBtn = page.locator('[data-testid="export-button"]');
  const importBtn = page.locator('[data-testid="import-button"]');
  assert(
    "export button visible",
    (await exportBtn.count()) === 1 && (await exportBtn.isVisible()),
  );
  assert(
    "import button visible",
    (await importBtn.count()) === 1 && (await importBtn.isVisible()),
  );
  const exportText = (await exportBtn.innerText()).trim();
  const importText = (await importBtn.innerText()).trim();
  assert("export label contains 'Export'", /export/i.test(exportText), exportText);
  assert("import label contains 'Import'", /import/i.test(importText), importText);

  // Baseline screenshot
  await page.screenshot({ path: `${SHOT_DIR}/01-dashboard-data-section.png` });

  // --- 2. Click Export and capture download -------------------------------
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    exportBtn.click(),
  ]);
  const filename = download.suggestedFilename();
  assert(
    "download suggested filename starts with research-desk-",
    filename.startsWith("research-desk-") && filename.endsWith(".json"),
    filename,
  );
  const fixturePath = path.join(TMP, filename);
  await download.saveAs(fixturePath);

  // Parse downloaded JSON and assert every slot round-trips.
  const { readFileSync } = await import("node:fs");
  const raw = readFileSync(fixturePath, "utf8");
  const parsed = JSON.parse(raw);
  assert("bundle schema == research-desk", parsed.schema === "research-desk");
  assert("bundle version == 1", parsed.version === 1);
  assert("bundle has exportedAt ISO string", typeof parsed.exportedAt === "string");
  for (const slot of [
    "progress",
    "cards",
    "paperAnswers",
    "notes",
    "streak",
    "itemNotes",
  ]) {
    assert(
      `data.${slot} present`,
      Object.prototype.hasOwnProperty.call(parsed.data, slot),
    );
  }
  assert(
    "progress round-tripped sutton done",
    parsed.data.progress?.["p1-sutton-barto"] === "done",
  );
  assert(
    "cards round-tripped KL card EF",
    Math.abs((parsed.data.cards?.["kl-forward-reverse"]?.ef ?? 0) - 2.6) < 1e-9,
  );
  assert(
    "paperAnswers round-tripped instructgpt alignment-tax",
    /219-char paragraph/.test(
      parsed.data.paperAnswers?.instructgpt?.["alignment-tax"] ?? "",
    ),
  );
  assert(
    "notes round-tripped 3 pages",
    Array.isArray(parsed.data.notes?.pages) && parsed.data.notes.pages.length === 3,
  );
  assert(
    "streak round-tripped 3 days",
    Array.isArray(parsed.data.streak?.days) && parsed.data.streak.days.length === 3,
  );
  assert(
    "itemNotes round-tripped sutton note",
    /finished ch 6/.test(parsed.data.itemNotes?.["p1-sutton-barto"] ?? ""),
  );

  // After-export status line
  const statusLine = await page
    .locator('[data-testid="data-export-status"]')
    .innerText();
  assert(
    "status line reports downloaded filename",
    statusLine.toLowerCase().includes("downloaded"),
    statusLine,
  );

  // --- 3. Wipe + Import ---------------------------------------------------
  await page.evaluate(() => localStorage.clear());
  // Sanity: reload into an empty-state Dashboard (0 of 55 done).
  await page.reload({ waitUntil: "networkidle" });
  const emptyStateCopy = await page
    .locator('header.border-b.border-solar-200.pb-6')
    .innerText();
  assert(
    "after wipe, header shows 0 of 55 done",
    /0 of 55/i.test(emptyStateCopy),
    emptyStateCopy.slice(0, 120),
  );

  // Upload the file we just downloaded. `setInputFiles` drives the hidden
  // <input type="file"> without needing to click the label.
  await page.setInputFiles(
    '[data-testid="import-file-input"]',
    fixturePath,
  );
  // Confirm dialog appears
  await page.waitForSelector('[data-testid="import-confirm"]', {
    timeout: 5000,
  });
  await page.screenshot({
    path: `${SHOT_DIR}/02-import-confirm.png`,
    fullPage: true,
  });
  // All six slots should be marked "present" since the fixture filled every slot.
  const presentSlots = await page.$$eval(
    '[data-testid^="import-slot-"][data-has-data="true"]',
    (nodes) => nodes.length,
  );
  assert("all 6 slots marked present", presentSlots === 6, `count=${presentSlots}`);

  // Click "Overwrite my data". The component schedules a reload ~400ms later;
  // catch the navigation and wait for networkidle.
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle", timeout: 10_000 }),
    page.locator('[data-testid="import-confirm-button"]').click(),
  ]);

  // Verify every slot landed.
  const rehydrated = await page.evaluate(() => {
    const read = (k) => {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };
    return {
      progress: read("research-desk:v1:progress"),
      cards: read("research-desk:v1:cards"),
      paperAnswers: read("research-desk:v1:paper-answers"),
      notes: read("research-desk:v1:notes"),
      streak: read("research-desk:v1:streak"),
      itemNotes: read("research-desk:v1:item-notes"),
    };
  });
  assert(
    "progress re-hydrated sutton=done",
    rehydrated.progress?.data?.["p1-sutton-barto"] === "done",
  );
  assert(
    "cards re-hydrated kl card EF 2.6",
    Math.abs((rehydrated.cards?.data?.["kl-forward-reverse"]?.ef ?? 0) - 2.6) <
      1e-9,
  );
  assert(
    "paper-answers re-hydrated",
    /219-char paragraph/.test(
      rehydrated.paperAnswers?.data?.instructgpt?.["alignment-tax"] ?? "",
    ),
  );
  assert(
    "notes re-hydrated (3 pages)",
    Array.isArray(rehydrated.notes?.data?.pages) &&
      rehydrated.notes.data.pages.length === 3,
  );
  assert(
    "streak re-hydrated (3 days)",
    Array.isArray(rehydrated.streak?.data?.days) &&
      rehydrated.streak.data.days.length === 3,
  );
  assert(
    "item-notes re-hydrated",
    /finished ch 6/.test(
      rehydrated.itemNotes?.data?.["p1-sutton-barto"] ?? "",
    ),
  );

  // Dashboard header should now reflect 1 of 55 done (p1-sutton-barto done in fixture).
  const header = await page
    .locator('header.border-b.border-solar-200.pb-6')
    .innerText();
  assert(
    "dashboard header shows 1 of 55 done after import",
    /1 of 55/i.test(header),
    header.slice(0, 160),
  );

  await page.screenshot({
    path: `${SHOT_DIR}/03-post-import-dashboard.png`,
    fullPage: true,
  });

  // --- 4. Version-guard: unknown-version file should fail gracefully -----
  const badBundle = {
    schema: "research-desk",
    version: 99,
    exportedAt: new Date().toISOString(),
    data: {
      progress: null,
      cards: null,
      paperAnswers: null,
      notes: null,
      streak: null,
      itemNotes: null,
    },
  };
  const badPath = path.join(TMP, "bad-v99.json");
  writeFileSync(badPath, JSON.stringify(badBundle));
  await page.setInputFiles('[data-testid="import-file-input"]', badPath);
  await page.waitForSelector('[data-testid="data-export-error"]', {
    timeout: 5000,
  });
  const errText = await page
    .locator('[data-testid="data-export-error"]')
    .innerText();
  assert(
    "unknown-version error surfaced inline",
    /import failed/i.test(errText) && /v99/.test(errText),
    errText.slice(0, 160),
  );
  // No confirm dialog should have appeared.
  const confirmCount = await page
    .locator('[data-testid="import-confirm"]')
    .count();
  assert("no confirm dialog on bad version", confirmCount === 0);
  // App didn't crash: the Dashboard is still there.
  const stillThere = await page
    .locator('[data-testid="data-export-import"]')
    .count();
  assert("data section still rendered after bad import", stillThere === 1);

  await page.screenshot({
    path: `${SHOT_DIR}/04-version-guard-error.png`,
    fullPage: true,
  });

  // --- 5. Wrong-schema file -----------------------------------------------
  const wrongSchemaPath = path.join(TMP, "wrong-schema.json");
  writeFileSync(
    wrongSchemaPath,
    JSON.stringify({
      schema: "some-other-app",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        progress: null,
        cards: null,
        paperAnswers: null,
        notes: null,
        streak: null,
        itemNotes: null,
      },
    }),
  );
  await page.setInputFiles(
    '[data-testid="import-file-input"]',
    wrongSchemaPath,
  );
  await page.waitForTimeout(250);
  const wrongSchemaErr = await page
    .locator('[data-testid="data-export-error"]')
    .innerText();
  assert(
    "wrong-schema surfaces as 'Research Desk export'",
    /research desk export/i.test(wrongSchemaErr),
    wrongSchemaErr.slice(0, 160),
  );

  // Summary
  const failed = asserts.filter((a) => !a.pass);
  console.log(
    `\nAsserts: ${asserts.length - failed.length}/${asserts.length} passed`,
  );
  if (failed.length) {
    console.log("FAILURES:");
    for (const f of failed) console.log("  ✗", f.name, f.detail);
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
