import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:4747/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: 'docs/screenshot.png', fullPage: false });
await browser.close();
console.log('ok');
