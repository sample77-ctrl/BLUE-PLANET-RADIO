import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { offline, open, VIEWS } from './helpers';

const PREFS = 'sea-prefs-v1';
const setups: { label: string; width: number; prefs?: object }[] = [
  { label: 'desktop', width: 1400 },
  { label: 'phone, বাংলা, high contrast, reduced motion', width: 360, prefs: { lang: 'bn', highContrast: true, reduceMotion: true } },
];

for (const s of setups) {
  test.describe(s.label, () => {
    for (const [name, hash] of VIEWS) {
      test(`${name} has no axe violations`, async ({ page }) => {
        await offline(page);
        if (s.prefs) await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [PREFS, JSON.stringify(s.prefs)]);
        await page.setViewportSize({ width: s.width, height: 800 });
        await open(page, hash);
        await expect(page.locator('h1')).toHaveCount(1);
        await page.waitForTimeout(800); // lazy views and data settle
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
        expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
      });
    }
  });
}

// Atlas List view (accessibility-first mode): ~80 rows, and the right rail must not cover its controls.
for (const w of [1024, 1440, 375]) {
  test(`atlas List view has no axe violations and nothing under the rails at ${w}px`, async ({ page }) => {
    await offline(page);
    await page.setViewportSize({ width: w, height: 800 });
    await open(page, 'track=atlas');
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await expect(page.getByRole('region', { name: /list|audio/i }).first()).toBeVisible();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    if (w < 1024) return;
    const covered = await page.evaluate(() => {
      const rails = [...document.querySelectorAll('main > div.absolute')].filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0 && (e.matches('[data-ctl="hearing"]') || e.className.includes('left-3 top')) ).map((e) => e.getBoundingClientRect());
      const root = document.querySelector('[role=region][aria-label]')!;
      return [...root.querySelectorAll('button,input,a')].filter((e) => { const a = e.getBoundingClientRect(); return a.width > 0 && a.top >= 0 && a.bottom <= innerHeight && rails.some((x) => a.left < x.right && a.right > x.left && a.top < x.bottom && a.bottom > x.top); }).length;
    });
    expect(covered).toBe(0);
  });
}
