// Before/after screenshots for roadmap v5: node scripts/v5-shots.mjs <phase> <before|after> [baseUrl] [lang] [extra-prefs-json]
// Same URLs, same sizes (375 and 1440 px), offline like the e2e runs. Output: docs/v5-shots/<phase>/<tag>-<view>-<width>.png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [phase = 'v1', tag = 'after', base = 'http://localhost:5199', lang = 'en', extra = '{}'] = process.argv.slice(2);
const VIEWS = [
  ['landing', ''], ['atlas', 'track=atlas'], ['frames', 'track=frames&frame=eic-ocean-heat&col=40'], ['jukebox', 'track=jukebox&story=gistemp&t=1998'],
  ['monsoon', 'track=monsoon'], ['pulse', 'track=pulse'], ['quest', 'track=quest'], ['about', 'track=about'],
];
const only = process.env.ONLY?.split(',');
const out = `docs/v5-shots/${phase}`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
for (const w of [375, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 375 ? 812 : 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((p) => { try { localStorage.setItem('sea-prefs-v1', JSON.stringify(p)); } catch { /* ignore */ } }, { ...(lang === 'bn' ? { lang: 'bn' } : {}), ...JSON.parse(extra) });
  for (const [name, hash] of VIEWS) {
    if (only && !only.includes(name)) continue;
    const page = await ctx.newPage();
    await page.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
    await page.goto('about:blank');
    await page.goto(`${base}/${hash ? `#v1&${hash}` : ''}`);
    await page.waitForTimeout(name === 'atlas' || name === 'landing' ? 4500 : 2500);
    const file = `${out}/${tag}-${name}-${w}${lang === 'bn' ? '-bn' : ''}${extra !== '{}' ? '-x' : ''}.png`;
    await page.screenshot({ path: file });
    console.log(file);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
