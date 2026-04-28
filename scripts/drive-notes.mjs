// Drive /notes end-to-end. Headless chromium bundled with Playwright.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const SHOT_DIR = "/tmp/research-desk-shots/s122";
mkdirSync(SHOT_DIR, { recursive: true });

const log = (...a) => console.log("[drive]", ...a);
const asserts = [];
const assert = (name, cond, detail = "") => {
  asserts.push({ name, pass: !!cond, detail });
  console.log((cond ? "✓ " : "✗ ") + name + (detail ? " — " + detail : ""));
};

const browser = await chromium.launch({ headless: true });
try {
  // Desktop run
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto("http://localhost:3100/notes", { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="notes-editor"]', { timeout: 5000 });

  // Acceptance checkpoints
  const textareaCount = await page.locator("textarea").count();
  assert("≥ 1 textarea on /notes", textareaCount >= 1, `count=${textareaCount}`);

  const tabCount = await page.locator('[data-testid^="page-tab-"]').count();
  assert("≥ 3 named page tabs", tabCount >= 3, `count=${tabCount}`);

  const tabLabels = await page
    .locator('[data-testid^="page-tab-"]')
    .allTextContents();
  log("tab labels:", tabLabels);

  // "Shipping next" / "TabStub" must be absent
  const body = await page.locator("body").innerText();
  assert("no 'Shipping next' copy", !/shipping next/i.test(body));
  assert("no 'TabStub' string", !/tabstub/i.test(body));
  assert("no 'build progresses tab by tab'", !/build progresses tab by tab/i.test(body));

  await page.screenshot({ path: `${SHOT_DIR}/01-notes-initial.png`, fullPage: true });

  // Type into the active textarea. Clear via fill("") first since cross-
  // platform "select all" differs between Control+A and Meta+A.
  const textarea = page.locator('[data-testid="notes-textarea"]');
  await textarea.click();
  await textarea.fill("");
  await textarea.type("hello **world**", { delay: 15 });
  await page.waitForTimeout(400); // > debounce

  // Preview should render bold inside it
  const strongTexts = await page
    .locator('[data-testid="preview-body"] strong')
    .allTextContents();
  assert(
    "preview renders <strong>world</strong>",
    strongTexts.includes("world"),
    `strongTexts=${JSON.stringify(strongTexts)}`
  );

  await page.screenshot({ path: `${SHOT_DIR}/02-notes-typed.png`, fullPage: true });

  // Read localStorage envelope
  const notesEnvelope = await page.evaluate(() => {
    return localStorage.getItem("research-desk:v1:notes");
  });
  log("raw envelope (truncated):", (notesEnvelope || "").slice(0, 200));
  const parsed = JSON.parse(notesEnvelope);
  assert("envelope version === 1", parsed.version === 1);
  assert("envelope has data.pages array", Array.isArray(parsed.data?.pages));
  assert(
    "data.pages length ≥ 3",
    Array.isArray(parsed.data?.pages) && parsed.data.pages.length >= 3,
    `len=${parsed.data?.pages?.length}`
  );
  const activeTabId = await page
    .locator('[data-testid^="page-tab-"][data-active="true"]')
    .getAttribute("data-testid");
  log("active tab testid:", activeTabId);
  const activeBody = parsed.data.pages.find((p) =>
    activeTabId?.endsWith(p.id)
  )?.body;
  assert(
    "active page body === 'hello **world**' in storage",
    activeBody === "hello **world**",
    `got="${activeBody?.slice(0, 40)}..."`
  );

  // Reload — textarea value must survive
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="notes-textarea"]');
  const afterReload = await page
    .locator('[data-testid="notes-textarea"]')
    .inputValue();
  assert(
    "after reload textarea value === 'hello **world**'",
    afterReload === "hello **world**",
    `got="${afterReload}"`
  );

  // Switch to "Scratch" page, confirm distinct body appears
  await page.click('[data-testid="page-tab-scratch"]');
  await page.waitForTimeout(200);
  const scratchVal = await page
    .locator('[data-testid="notes-textarea"]')
    .inputValue();
  assert("scratch page has its own body", scratchVal.includes("Scratch"));

  // Switch to weekly-log
  await page.click('[data-testid="page-tab-weekly-log"]');
  await page.waitForTimeout(200);
  const weeklyVal = await page
    .locator('[data-testid="notes-textarea"]')
    .inputValue();
  assert("weekly-log page has its own body", weeklyVal.includes("Weekly log"));

  await page.screenshot({ path: `${SHOT_DIR}/03-weekly-log-tab.png`, fullPage: true });

  // Mobile run — confirm tabbed switcher
  const mctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const m = await mctx.newPage();
  await m.goto("http://localhost:3100/notes", { waitUntil: "networkidle" });
  await m.waitForSelector('[data-testid="notes-editor"]');

  const mobileWriteBtn = m.locator('[data-testid="mobile-pane-write"]');
  const mobilePreviewBtn = m.locator('[data-testid="mobile-pane-preview"]');
  assert("mobile 'Write' button present", (await mobileWriteBtn.count()) === 1);
  assert("mobile 'Preview' button present", (await mobilePreviewBtn.count()) === 1);

  // On mobile, tapping Preview should show the preview pane and hide write.
  await mobilePreviewBtn.click();
  await m.waitForTimeout(100);
  const writeVisible = await m.locator('[data-testid="write-pane"]').isVisible();
  const previewVisible = await m.locator('[data-testid="preview-pane"]').isVisible();
  assert(
    "mobile preview mode: write hidden / preview visible",
    !writeVisible && previewVisible,
    `write=${writeVisible} preview=${previewVisible}`
  );
  await m.screenshot({ path: `${SHOT_DIR}/04-mobile-preview.png`, fullPage: true });

  await mobileWriteBtn.click();
  await m.waitForTimeout(100);
  const writeVisibleAfter = await m
    .locator('[data-testid="write-pane"]')
    .isVisible();
  assert("mobile write mode: write pane visible again", writeVisibleAfter);
  await m.screenshot({ path: `${SHOT_DIR}/05-mobile-write.png`, fullPage: true });

  // Body style check
  const bodyStyles = await page.evaluate(() => {
    const s = getComputedStyle(document.body);
    return { background: s.backgroundColor, color: s.color };
  });
  log("body computed:", bodyStyles);
  assert(
    "body bg = cream #FDF6E3",
    bodyStyles.background === "rgb(253, 246, 227)",
    `got=${bodyStyles.background}`
  );
  assert(
    "body fg = slate #586E75",
    bodyStyles.color === "rgb(88, 110, 117)",
    `got=${bodyStyles.color}`
  );
} finally {
  await browser.close();
}

const failed = asserts.filter((a) => !a.pass);
console.log(`\n=== ${asserts.length - failed.length}/${asserts.length} passed ===`);
if (failed.length) {
  for (const f of failed) console.log("FAIL:", f.name, f.detail);
  process.exit(1);
}
