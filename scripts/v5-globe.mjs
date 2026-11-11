// Atlas globe screenshots for roadmap v5 V5: node scripts/v5-globe.mjs [baseUrl] [lang] [extra-prefs-json]
// Output: docs/v5-shots/v5/globe-<rest|sounding>-<width>[-bn][-x].png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [base = 'http://localhost:5199', lang = 'en', extra = '{}'] = process.argv.slice(2);
const out = 'docs/v5-shots/v5';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
for (const w of [375, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 375 ? 812 : 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((p) => { try { localStorage.setItem('sea-prefs-v1', JSON.stringify(p)); } catch { /* ignore */ } }, { ...(lang === 'bn' ? { lang: 'bn' } : {}), ...JSON.parse(extra) });
  const page = await ctx.newPage();
  await page.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await page.goto('about:blank');
  await page.goto(`${base}/#v1&track=atlas`);
  await page.waitForSelector('[data-pillars]', { timeout: 20000 });
  await page.waitForTimeout(5000);
  const suffix = `${w}${lang === 'bn' ? '-bn' : ''}${extra !== '{}' ? '-x' : ''}`;
  await page.screenshot({ path: `${out}/globe-rest-${suffix}.png` });
  await page.getByRole('button', { name: lang === 'bn' ? /শব্দ বন্ধ/ : 'Sound off' }).first().click().catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/globe-sounding-${suffix}.png` });
  console.log(suffix, await page.locator('[data-pillars]').getAttribute('data-pillars'), await page.locator('[data-pillars]').getAttribute('data-pulsing'));
  await ctx.close();
}
await browser.close();
