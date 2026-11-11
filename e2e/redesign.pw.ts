import { test, expect } from '@playwright/test';
import { offline, open, noHorizontalScroll, VIEWS } from './helpers';

const PREFS = 'sea-prefs-v1';

test.describe('responsive: nothing scrolls sideways on any view', () => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    for (const lang of ['en', 'bn'] as const) {
      test(`${width} px, ${lang}`, async ({ page }) => {
        await offline(page);
        await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [PREFS, JSON.stringify({ lang })]);
        await page.setViewportSize({ width, height: 800 });
        for (const [name, hash] of VIEWS) {
          await open(page, hash);
          await page.waitForTimeout(400);
          expect(await noHorizontalScroll(page), `${name} at ${width} px (${lang})`).toBe(true);
        }
      });
    }
  }
});

test('reduced motion: the sound rings are hidden and the record does not spin', async ({ page }) => {
  await offline(page);
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [PREFS, JSON.stringify({ reduceMotion: true })]);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  await expect(page.locator('.sound-ribbons').first()).toBeHidden();
  await open(page, 'track=jukebox&story=gistemp');
  await page.waitForSelector('.vinyl');
  const anim = await page.locator('.vinyl').evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toBe('none');
});

test('the landing hero has one primary action and shows real key numbers', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  await expect(page.locator('.lh').getByRole('button', { name: /Press play/ })).toBeVisible(); // the hero's preview button (the carousel below has its own)
  await expect(page.locator('.hero-tele dd').first()).toHaveText(/\d/);
  // one brass action in the first screen (the sections below the fold have their own)
  const inView = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.btn-brass')].filter((b) => !b.classList.contains('sr-only-focusable')).filter((b) => {
    const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
    return cs.visibility !== 'hidden' && Number(cs.opacity) > 0.1 && r.width > 0 && r.top >= 0 && r.top < window.innerHeight && r.bottom <= window.innerHeight;
  }).length);
  expect(inView).toBe(1);
});

test('sound states: off → blocked (with a retry) when the browser keeps audio suspended', async ({ page }) => {
  await offline(page);
  // the autoplay policy in its worst case: resume() never gets the context running
  await page.addInitScript(() => {
    AudioContext.prototype.resume = async function () { /* stays suspended */ };
    Object.defineProperty(AudioContext.prototype, 'state', { get: () => 'suspended' });
  });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  const btn = page.getByRole('banner').getByRole('button', { name: 'Sound off' });
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(page.getByRole('alert')).toContainText(/blocked the sound/i);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Sound blocked' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Sound off' })).toBeVisible();
});

test('sound states: a normal start reads Sound on', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  await page.getByRole('banner').getByRole('button', { name: 'Sound off' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Sound on' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
