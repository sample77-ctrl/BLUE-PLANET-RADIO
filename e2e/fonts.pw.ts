import { test, expect } from '@playwright/test';
import { offline, open } from './helpers';

test('the self-hosted fonts load offline, with real weights and a real width axis (no synthetic bold)', async ({ page }) => {
  await offline(page); // every request outside localhost is aborted, so these can only come from /fonts
  await page.setViewportSize({ width: 1200, height: 800 });
  await open(page, 'track=about');
  const r = await page.evaluate(async () => {
    const faces = ['400 16px "Mona Sans"', '700 16px "Mona Sans"', '400 16px "IBM Plex Mono"', '400 16px "Noto Sans Bengali"'];
    for (const f of faces) await document.fonts.load(f, f.includes('Bengali') ? 'বাংলা' : 'Abc');
    const w = (font: string) => { const c = document.createElement('canvas').getContext('2d')!; c.font = font; return c.measureText('Sonic Earth Atlas, listen to the planet').width; };
    // The width axis: the same text at 75% and at 125% font-stretch (DOM, because canvas has no numeric font-stretch)
    const span = (stretch: string) => { const e = document.createElement('span'); e.style.cssText = `font:700 24px "Mona Sans";font-stretch:${stretch};white-space:nowrap;position:absolute;left:0;top:0`; e.textContent = 'Sonic Earth Atlas'; document.body.appendChild(e); const wd = e.getBoundingClientRect().width; e.remove(); return wd; };
    return { ok: faces.map((f) => document.fonts.check(f, f.includes('Bengali') ? 'বাংলা' : 'Abc')), w400: w('400 16px "Mona Sans"'), w700: w('700 16px "Mona Sans"'), narrow: span('75%'), wide: span('125%'), body: getComputedStyle(document.body).fontFamily };
  });
  expect(r.ok).toEqual([true, true, true, true]);
  expect(r.w700).toBeGreaterThan(r.w400); // a real bold face is wider than regular; synthetic bold would not change the advance this way
  expect(r.wide).toBeGreaterThan(r.narrow * 1.25); // the wide cut is a real axis, not a stretched glyph
  expect(r.body).toContain('Mona Sans');
});
