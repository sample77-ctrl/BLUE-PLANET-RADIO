import { test, expect } from '@playwright/test';
import { offline, open, noHorizontalScroll } from './helpers';

type Box = { x: number; y: number; w: number; h: number };
const hit = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

for (const width of [320, 390, 768]) {
  test(`Atlas controls do not overlap at ${width} px`, async ({ page }) => {
    await offline(page);
    await page.setViewportSize({ width, height: 760 });
    await open(page, 'track=atlas');
    await page.locator('[data-ctl="views"]').waitFor();
    const boxes = await page.evaluate(() => {
      const out: Record<string, Box> = {};
      for (const el of document.querySelectorAll<HTMLElement>('[data-ctl]')) {
        const r = el.getBoundingClientRect();
        if (r.width && r.height && getComputedStyle(el).visibility !== 'hidden') out[el.dataset.ctl!] = { x: r.x, y: r.y, w: r.width, h: r.height };
      }
      return out;
    });
    const names = Object.keys(boxes);
    expect(names).toContain('views');
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
      expect(hit(boxes[names[i]], boxes[names[j]]), `${names[i]} overlaps ${names[j]}`).toBe(false);
    }
    expect(await noHorizontalScroll(page)).toBe(true);
  });
}

test('the header is fixed glass', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, '');
  const pos = await page.locator('header.site-header').evaluate((h) => getComputedStyle(h).position);
  expect(pos).toBe('fixed');
});

test('the collections row on the Jukebox fades and snaps instead of cutting off', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 320, height: 700 });
  await open(page, 'track=jukebox&story=gistemp');
  await expect(page.getByRole('navigation', { name: 'Collections' }).first()).toHaveClass(/fade-x/);
});

test('the fixed header keeps a sane height on every view (the Jukebox adds one row) and --header-h follows it', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 390, height: 800 });
  for (const hash of ['', 'track=atlas', 'track=jukebox&story=gistemp', 'track=about']) {
    await open(page, hash);
    await page.locator('header.site-header').waitFor();
    await page.waitForTimeout(300);
    const { h, v } = await page.evaluate(() => ({ h: document.querySelector('header.site-header')!.getBoundingClientRect().height, v: parseFloat(document.documentElement.style.getPropertyValue('--header-h')) }));
    expect(h, hash).toBeGreaterThan(40);
    expect(h, hash).toBeLessThan(120);
    expect(Math.abs(h - v), hash).toBeLessThan(2); // --header-h = the header's height (v5: the ruled header is flush with the top, so there is no 10 px gap any more)
  }
});

// WCAG 2.5.8 / the documented 44px on coarse pointers (header, collections row, carousel dots, EIC link).
test.describe('touch targets at 375px', () => {
  test.use({ viewport: { width: 375, height: 760 }, hasTouch: true, isMobile: true });
  const small = (page: import('@playwright/test').Page, sel: string, min: number) => page.evaluate(([s, m]) => [...document.querySelectorAll(s as string)].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && (r.width < (m as number) || r.height < (m as number))).length, [sel, min] as const);
  test('header controls and carousel dots are at least 44px, on one row', async ({ page }) => {
    await offline(page);
    await open(page, '');
    await expect(page.locator('.world-dot')).toHaveCount(4);
    expect(await small(page, 'header > div button', 44)).toBe(0);
    expect(await small(page, '.world-dot', 44)).toBe(0);
    expect(await noHorizontalScroll(page)).toBe(true);
    const tops = await page.evaluate(() => new Set([...document.querySelectorAll('header > div button')].filter((e) => e.getBoundingClientRect().width).map((e) => Math.round(e.getBoundingClientRect().top))).size);
    expect(tops).toBe(1);
  });
  test('Jukebox collection links are at least 44px tall', async ({ page }) => {
    await offline(page);
    await open(page, 'track=jukebox&story=gistemp');
    await expect(page.locator('header nav[aria-label="Collections"] .nav-link').first()).toBeVisible();
    expect(await small(page, 'header nav[aria-label="Collections"] .nav-link', 44)).toBe(0);
  });
});
