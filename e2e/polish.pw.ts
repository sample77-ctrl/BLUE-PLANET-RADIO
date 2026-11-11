import { test, expect, type Page } from '@playwright/test';
import { offline, open } from './helpers';

/** Roadmap v5, V6: spring easing on pop-ups, and a view transition for view changes. */
const prefs = (page: Page, p: object) => page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } }, ['sea-prefs-v1', JSON.stringify(p)]);
const countVT = (page: Page) => page.addInitScript(() => { const w = window as unknown as { __vt: number }; w.__vt = 0; const d = document as unknown as { startViewTransition?: (cb: () => void) => unknown }; const o = d.startViewTransition?.bind(document); if (o) d.startViewTransition = (cb) => { w.__vt++; return o(cb); }; });
const vt = (page: Page) => page.evaluate(() => (window as unknown as { __vt: number }).__vt);

test('header navigation changes the view through a view transition, and a signal-coloured wipe is defined', async ({ page }) => {
  const errors = await offline(page);
  await countVT(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=about');
  const nav = page.getByRole('banner').getByRole('navigation', { name: /main/i });
  await nav.getByRole('button', { name: 'Frames' }).click();
  await expect(page.locator('.stage-frame canvas').first()).toBeVisible();
  expect(await vt(page)).toBeGreaterThanOrEqual(1);
  await nav.getByRole('button', { name: 'About the Science' }).click();
  await expect(page).toHaveURL(/track=about/);
  expect(await vt(page)).toBeGreaterThanOrEqual(2);
  // the wipe's pieces exist in the stylesheet
  const css = await page.evaluate(() => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].map((r) => r.cssText); } catch { return []; } }).join('\n'));
  expect(css).toContain('vt-wipe');
  expect(css).toMatch(/view-transition-group\(root\)[^{]*\{[^}]*background: var\(--signal\)/);
  expect(errors).toEqual([]);
});

test('reduced motion: header navigation runs no view transition', async ({ page }) => {
  const errors = await offline(page);
  await prefs(page, { reduceMotion: true });
  await countVT(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=about');
  await page.getByRole('banner').getByRole('navigation', { name: /main/i }).getByRole('button', { name: 'Frames' }).click();
  await expect(page.locator('.stage-frame canvas').first()).toBeVisible();
  expect(await vt(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('a pop-up arrives with a spring: its transition uses the linear() curve and it ends fully visible; under reduced motion it has no duration', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=about');
  await page.getByRole('banner').getByRole('button', { name: 'Settings' }).click();
  const dlg = page.getByRole('dialog').first();
  await expect(dlg).toBeVisible();
  const tr = await dlg.evaluate((el) => { const cs = getComputedStyle(el); return { fn: cs.transitionTimingFunction, dur: cs.transitionDuration, prop: cs.transitionProperty }; });
  expect(tr.prop).toContain('scale');
  expect(tr.fn).toContain('linear('); // the spring (Chromium 113+)
  await expect.poll(() => dlg.evaluate((el) => [getComputedStyle(el).opacity, getComputedStyle(el).scale])).toEqual(['1', 'none']);
  expect(errors).toEqual([]);
  await prefs(page, { reduceMotion: true });
  await open(page, 'track=about');
  await page.getByRole('banner').getByRole('button', { name: 'Settings' }).click();
  const d2 = page.getByRole('dialog').first();
  await expect(d2).toBeVisible();
  expect(await d2.evaluate((el) => getComputedStyle(el).transitionDuration.split(',').every((x) => parseFloat(x) < 0.001))).toBe(true);
});
