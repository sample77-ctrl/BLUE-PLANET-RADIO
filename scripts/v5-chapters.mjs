// Landing hero + chapter screenshots for roadmap v5 V3: node scripts/v5-chapters.mjs <before|after> [baseUrl] [lang] [extra-prefs-json]
// Scrolls the landing container (#landing) to the hero, each chapter and the carousel. Output: docs/v5-shots/v3/<tag>-<name>-<width>[-bn][-x].png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [tag = 'after', base = 'http://localhost:5199', lang = 'en', extra = '{}'] = process.argv.slice(2);
const out = 'docs/v5-shots/v3';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
for (const w of [375, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 375 ? 812 : 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((p) => { try { localStorage.setItem('sea-prefs-v1', JSON.stringify(p)); } catch { /* ignore */ } }, { ...(lang === 'bn' ? { lang: 'bn' } : {}), ...JSON.parse(extra) });
  const page = await ctx.newPage();
  await page.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await page.goto('about:blank');
  await page.goto(`${base}/`);
  await page.waitForTimeout(4000);
  const suffix = `${w}${lang === 'bn' ? '-bn' : ''}${extra !== '{}' ? '-x' : ''}`;
  const stops = tag === 'before' ? [['hero', 0], ['carousel', 0]] : [['hero', 'hero'], ['ch1', '#lc-ghg'], ['ch2', '#lc-ocean'], ['ch3', '#lc-rain'], ['ch4', '#lc-elnino'], ['carousel', '.world-track']];
  for (const [name, target] of stops) {
    if (tag !== 'before') await page.evaluate((sel) => {
      const sc = document.getElementById('landing');
      if (sel === 'hero') { sc.scrollTo(0, 0); return; }
      const el = document.querySelector(sel), r = el.getBoundingClientRect(), s = sc.getBoundingClientRect();
      sc.scrollTo(0, sc.scrollTop + r.top - s.top - (sel.startsWith('#lc') ? 0 : 0));
    }, target);
    else if (name === 'carousel') break;
    await page.waitForTimeout(1500);
    const file = `${out}/${tag}-${name}-${suffix}.png`;
    await page.screenshot({ path: file });
    console.log(file);
  }
  await ctx.close();
}
await browser.close();
