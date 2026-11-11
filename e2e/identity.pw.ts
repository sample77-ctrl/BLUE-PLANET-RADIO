import { test, expect } from '@playwright/test';
import { offline, open, VIEWS, noHorizontalScroll } from './helpers';

/** Roadmap v5, V1: the "Instrument" identity. These check the things that make it look new, from the computed styles (not by eye). */
const css = (page: import('@playwright/test').Page, sel: string, prop: string) => page.evaluate(([s, p]) => { const el = document.querySelector(s); return el ? getComputedStyle(el).getPropertyValue(p) : null; }, [sel, prop]);

test('the ground is near-black and neutral, with no starfield outside the landing hero', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=about');
  expect(await css(page, '#space-bg', 'background-color')).toBe('rgb(10, 10, 10)');
  expect(await css(page, '#stars', 'display')).toBe('none');
  await open(page, ''); // landing
  await expect(page.locator('html.landing-open')).toHaveCount(1);
  expect(await css(page, '#stars', 'display')).toBe('block');
  expect(errors).toEqual([]);
});

test('cards are opaque with a hairline and a 0-4 px radius; glass is only on the Now-Playing bar', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=jukebox&story=gistemp');
  await expect(page.locator('.np-bar')).toBeVisible();
  const card = page.locator('article.panel').first(); // the story card
  await expect(card).toBeVisible();
  const c = await card.evaluate((el) => { const s = getComputedStyle(el); return { blur: s.backdropFilter, radius: parseFloat(s.borderTopLeftRadius), border: s.borderTopWidth, bg: s.backgroundColor }; });
  expect(c.blur).toBe('none');
  expect(c.radius).toBeLessThanOrEqual(8); // 4 px, or 8 px where corner-shape: squircle is on (Chrome)
  expect(c.border).toBe('1px');
  expect(c.bg).not.toMatch(/rgba\(.*, 0\.\d+\)/); // opaque
  expect(await css(page, '.np-bar', 'backdrop-filter')).not.toBe('none');
  expect(errors).toEqual([]);
});

test('the header is ruled text nav: "Frames" is first, opens the frames view, and carries the signal underline', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=about');
  const nav = page.getByRole('banner').getByRole('navigation', { name: /main/i });
  const items = nav.getByRole('button');
  await expect(items.first()).toHaveText('Frames');
  await items.first().click();
  await expect(page).toHaveURL(/track=frames/);
  const cur = nav.locator('[aria-current="page"]');
  await expect(cur).toHaveText('Frames');
  const shadow = await cur.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).toContain('inset'); // the underline
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.site-header')!).borderBottomWidth)).toBe('1px');
  // the Jukebox collections lost "Frames" (it is a section of its own now)
  await nav.getByRole('button', { name: 'Data Jukebox' }).click();
  await expect(page.getByRole('navigation', { name: /collections/i }).getByRole('button', { name: /EIC frames/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the signal colour comes from what is playing: each story floods the Jukebox hero with its own data colour', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  const hero = async (story: string, theme: string, rgb: string) => {
    await open(page, `track=jukebox&story=${story}`);
    await expect(page.locator(`html[data-dataset="${theme}"]`)).toHaveCount(1); // set once the story's series has loaded and the bar publishes it
    await expect.poll(() => css(page, '.vinyl-hero', 'background-color'), { timeout: 8000 }).toBe(rgb); // --accent is a registered colour property: it transitions for 300 ms
  };
  await hero('gistemp', 'warm', 'rgb(255, 137, 180)'); // --warm
  await hero('sea-ice', 'cold', 'rgb(159, 174, 254)'); // --cold
  await hero('co2', 'brass', 'rgb(212, 178, 1)'); // --brass (greenhouse gases)
  // dark text on the field
  expect(await css(page, '.vinyl-title', 'color')).toBe('rgb(10, 10, 10)');
  expect(errors).toEqual([]);
});

test('high contrast: black ground, and the signal colour is text and lines only (no filled field)', async ({ page }) => {
  const errors = await offline(page);
  await page.addInitScript(() => { try { localStorage.setItem('sea-prefs-v1', JSON.stringify({ highContrast: true })); } catch { /* ignore */ } });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=jukebox&story=gistemp');
  await expect(page.locator('html.hc')).toHaveCount(1);
  await expect(page.locator('.vinyl-hero')).toBeVisible(); // the Jukebox is a lazy chunk
  expect(await css(page, '.vinyl-hero', 'background-color')).toBe('rgb(0, 0, 0)');
  expect(await css(page, '.site-header', 'background-color')).toBe('rgb(0, 0, 0)');
  expect(await css(page, '#space-bg::before', 'display')).not.toBe('block');
  expect(errors).toEqual([]);
});

test('every view keeps its layout on the new identity: no horizontal scroll at 375 and 1440', async ({ page }) => {
  const errors = await offline(page);
  for (const w of [375, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const [name, hash] of VIEWS) {
      if (name === 'atlas') continue; // needs WebGL under load; covered by layout.pw.ts
      await open(page, hash);
      await page.waitForTimeout(300);
      expect(await noHorizontalScroll(page), `${name} at ${w}`).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
