// Quick visual snapshot of the Dashboard Data section in its initial state.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/research-desk-shots/s126", { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3100/dashboard", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="data-export-import"]');

  // Scroll the Data card into view, screenshot just that element.
  const card = page.locator('[data-testid="data-export-import"]');
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: "/tmp/research-desk-shots/s126/00-data-card-initial.png" });

  // Click Import to open file chooser state (no file yet)
  // Actually: simulate the error state visually by uploading an unknown-version file.
  const { writeFileSync } = await import("node:fs");
  const bad = JSON.stringify({
    schema: "research-desk", version: 99, exportedAt: "2099-01-01T00:00:00.000Z",
    data: { progress: null, cards: null, paperAnswers: null, notes: null, streak: null, itemNotes: null }
  });
  const badPath = "/tmp/bad-version.json";
  writeFileSync(badPath, bad);
  await page.setInputFiles('[data-testid="import-file-input"]', badPath);
  await page.waitForSelector('[data-testid="data-export-error"]');
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: "/tmp/research-desk-shots/s126/00-data-card-error.png" });

  // Now do a successful import to capture the confirm dialog
  const good = JSON.stringify({
    schema: "research-desk", version: 1, exportedAt: "2026-04-27T00:00:00.000Z",
    data: {
      progress: { "p1-sutton-barto": "done" },
      cards: null, paperAnswers: null, notes: null, streak: null, itemNotes: null,
    }
  });
  writeFileSync("/tmp/good.json", good);
  await page.setInputFiles('[data-testid="import-file-input"]', "/tmp/good.json");
  await page.waitForSelector('[data-testid="import-confirm"]');
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: "/tmp/research-desk-shots/s126/00-data-card-confirm.png" });

  console.log("✓ captured 3 data-card states");
} finally {
  await browser.close();
}
