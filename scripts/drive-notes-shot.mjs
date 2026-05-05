// Quick visual confirmation: type into /notes and screenshot immediately
// after the 400ms debounce so the cream + coral + rendered preview all
// show in one frame.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const SHOT_DIR = "/tmp/research-desk-shots/s122";
mkdirSync(SHOT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:4747/notes", { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="notes-editor"]');

const ta = page.locator('[data-testid="notes-textarea"]');
await ta.click();
await ta.fill("");
await ta.type("# Session notes\n\nToday I read the **PPO** paper. The clipped surrogate keeps `r(θ)` inside [1-ε, 1+ε].\n\n- derive §4 from memory\n- run on GSM8K\n- compare KL to the baseline\n\n> Reward hacking is inevitable without a KL penalty.", { delay: 10 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOT_DIR}/10-rich-markdown.png`, fullPage: true });

// Mobile preview
const m = await browser.newContext({ viewport: { width: 375, height: 812 } });
const mp = await m.newPage();
await mp.goto("http://localhost:4747/notes", { waitUntil: "networkidle" });
await mp.waitForSelector('[data-testid="notes-editor"]');
await mp.click('[data-testid="mobile-pane-preview"]');
await mp.waitForTimeout(200);
await mp.screenshot({ path: `${SHOT_DIR}/11-mobile-preview-default.png`, fullPage: true });

await browser.close();
console.log("shots written to", SHOT_DIR);
