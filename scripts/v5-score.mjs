// Score view + share card screenshots for roadmap v5 V4: node scripts/v5-score.mjs [baseUrl] [lang] [extra-prefs-json]
// Output: docs/v5-shots/v4/score-<frame>-<width>.png (the Stage scrolled to the score and the card), and card-<frame>[-bn].png (the 1080 x 1350 card itself).
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const [base = 'http://localhost:5199', lang = 'en', extra = '{}'] = process.argv.slice(2);
const out = 'docs/v5-shots/v4';
mkdirSync(out, { recursive: true });
const FRAMES = [['eic-ghg', 40, 'CO₂'], ['eic-ocean-heat', 60, 'related']];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
for (const w of [375, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 375 ? 812 : 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((p) => { try { localStorage.setItem('sea-prefs-v1', JSON.stringify(p)); } catch { /* ignore */ } }, { ...(lang === 'bn' ? { lang: 'bn' } : {}), ...JSON.parse(extra) });
  for (const [frame, col] of FRAMES) {
    const page = await ctx.newPage();
    await page.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
    await page.goto('about:blank');
    await page.goto(`${base}/#v1&track=frames&frame=${frame}&col=${col}`);
    await page.waitForSelector('.stage-score svg rect', { timeout: 20000 });
    await page.waitForTimeout(1500);
    const suffix = `${frame}-${w}${lang === 'bn' ? '-bn' : ''}${extra !== '{}' ? '-x' : ''}`;
    await page.screenshot({ path: `${out}/stage-${suffix}.png` });
    if (frame === 'eic-ghg') { // the series roll too
      const hear = page.locator('.stage-ctl2 .btn-brass').first();
      if (await hear.count()) { await hear.click(); await page.waitForSelector('figure.roll svg rect', { timeout: 10000 }); }
    }
    await page.locator('.stage-ctl2 button').filter({ has: page.locator('svg') }).nth(0).waitFor();
    const make = page.locator('.stage-ctl2 button', { hasText: lang === 'bn' ? 'শেয়ার কার্ড' : 'share card' });
    await make.click();
    await page.waitForSelector('.stage-card img', { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.locator('.stage-score').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/score-${suffix}.png`, fullPage: false });
    await page.locator('.stage-card').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/card-panel-${suffix}.png`, fullPage: false });
    if (w === 1440) {
      const data = await page.locator('.stage-card img').evaluate(async (im) => { const r = await fetch(im.src); const b = await r.arrayBuffer(); return Array.from(new Uint8Array(b)); });
      writeFileSync(`${out}/card-${frame}${lang === 'bn' ? '-bn' : ''}${extra !== '{}' ? '-x' : ''}.png`, Buffer.from(data));
    }
    console.log(suffix);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
