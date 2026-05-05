import { chromium } from 'playwright';
const BASE = 'http://localhost:4747';
const OUT = '/tmp/research-desk-judge';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  const log = (m) => console.log(m);

  // Landing
  let r = await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  log('LANDING: HTTP ' + r.status());
  await page.waitForLoadState('load').catch(() => {});
  log('LANDING title: ' + await page.title());
  await page.screenshot({ path: OUT + '/01-landing-desktop.png', fullPage: true });
  const ctaHref = await page.locator('a:has-text("Enter the desk")').first().getAttribute('href').catch(() => 'MISSING');
  log('CTA href: ' + ctaHref);

  // Dashboard
  await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + '/02-dashboard-desktop.png', fullPage: true });
  log('DASHBOARD h1: ' + (await page.locator('h1').first().textContent().catch(() => 'MISSING')));
  log('DASHBOARD continue-link: ' + await page.locator('[data-testid=continue-link]').getAttribute('href').catch(() => 'MISSING'));
  log('DASHBOARD due-today-cta text: ' + await page.locator('[data-testid=due-today-cta]').textContent().catch(() => 'MISSING'));
  log('DASHBOARD streakDots: ' + await page.locator('[data-testid^="streak-dot-"]').count());
  log('DASHBOARD nextUpRows: ' + await page.locator('[data-testid=next-up-row]').count());
  log('DASHBOARD phaseRows: ' + await page.locator('[data-testid^="phase-row-"]').count());
  log('DASHBOARD progressbars: ' + await page.locator('[role=progressbar]').count());
  const bodyStyle = await page.evaluate(() => {
    const s = getComputedStyle(document.body);
    return { bg: s.backgroundColor, fg: s.color };
  });
  log('DASHBOARD bodyStyle: ' + JSON.stringify(bodyStyle));

  // Curriculum
  await page.goto(BASE + '/curriculum', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + '/03-curriculum-desktop.png', fullPage: true });
  const rows = await page.locator('[data-testid=curriculum-row]').count();
  const articles = await page.locator('article').count();
  log('CURRICULUM rows: ' + rows + ' articles: ' + articles);

  // Flashcards
  await page.goto(BASE + '/flashcards', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + '/05-flashcards.png', fullPage: true });
  log('CARDS due-count: ' + await page.locator('[data-testid=due-count]').textContent().catch(() => 'MISSING'));
  const stageEl = page.locator('[data-testid=card-stage]');
  const stageCount = await stageEl.count();
  log('CARDS stage count: ' + stageCount);
  if (stageCount > 0) {
    log('CARDS first cardId: ' + await stageEl.getAttribute('data-card-id'));
    // Time the flip animation
    const t0 = Date.now();
    await page.keyboard.press('Space');
    // sample every 100ms
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(100);
      const f = await stageEl.getAttribute('data-flipped');
      if (f === 'true') { log('CARDS flip flag true at ~' + (Date.now() - t0) + 'ms'); break; }
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: OUT + '/06-flashcards-flipped.png', fullPage: true });
    log('CARDS data-flipped after: ' + await stageEl.getAttribute('data-flipped'));
    await page.keyboard.press('3');
    await page.waitForTimeout(600);
    log('CARDS advanced to: ' + await stageEl.getAttribute('data-card-id'));
  }

  // Papers
  await page.goto(BASE + '/papers', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/07-papers-index.png', fullPage: true });
  log('PAPERS cards: ' + await page.locator('[data-testid=paper-card]').count());

  await page.goto(BASE + '/papers/instructgpt', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/08-paper-instructgpt.png', fullPage: true });
  log('PAPER title: ' + await page.locator('[data-testid=paper-title]').textContent().catch(() => 'MISSING'));
  log('PAPER textareas: ' + await page.locator('[data-testid=answer-textarea]').count());
  const firstTextarea = page.locator('[data-testid=answer-textarea]').first();
  if (await firstTextarea.count() > 0) {
    await firstTextarea.fill('This is a test answer that is definitely longer than forty characters to unlock the reveal button.');
    await page.waitForTimeout(500);
    log('PAPER reveal enabled: ' + await page.locator('button:has-text("Reveal")').first().isEnabled().catch(() => null));
  }

  // Notes — KEY CHECK
  await page.goto(BASE + '/notes', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/09-notes.png', fullPage: true });
  const notesText = await page.locator('body').innerText();
  log('NOTES has "Shipping next": ' + notesText.toLowerCase().includes('shipping next'));
  log('NOTES textareas: ' + await page.locator('textarea').count());
  log('NOTES first 300: ' + notesText.slice(0, 300).replace(/\n/g, ' | '));

  // Export/Import scan
  for (const rr of ['/', '/dashboard', '/curriculum', '/flashcards', '/papers', '/notes']) {
    await page.goto(BASE + rr, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const txt = (await page.locator('body').innerText()).toLowerCase();
    log('ROUTE ' + rr + ' export=' + txt.includes('export') + ' import=' + txt.includes('import'));
  }

  // Mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: OUT + '/10-dashboard-mobile.png', fullPage: true });
  log('MOBILE scrollWidth: ' + await page.evaluate(() => document.documentElement.scrollWidth));

  await page.goto(BASE + '/curriculum', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: OUT + '/11-curriculum-mobile.png', fullPage: true });

  await page.goto(BASE + '/flashcards', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + '/12-flashcards-mobile.png', fullPage: true });

  log('--- ERRORS ---');
  for (const e of errs) log(e);
  await browser.close();
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
