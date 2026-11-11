import { test, expect, type Page } from '@playwright/test';
import { offline, open } from './helpers';

/** Roadmap v5, V5: light pillars on the Atlas globe that pulse with the voices. */
const prefs = (page: Page, p: object) => page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } }, ['sea-prefs-v1', JSON.stringify(p)]);
const globe = (page: Page) => page.locator('[data-pillars]');

test('every visible data point stands on a light pillar, and nothing pulses until a voice sounds', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  await expect(globe(page)).toBeAttached();
  await expect.poll(async () => Number(await globe(page).getAttribute('data-pillars')), { timeout: 20000 }).toBeGreaterThan(0);
  await expect(globe(page)).toHaveAttribute('data-pulsing', '0');
  expect(errors).toEqual([]);
});

test('turning sound on makes the pillars pulse with the voices; turning it off settles them', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  await expect.poll(async () => Number(await globe(page).getAttribute('data-pillars')), { timeout: 20000 }).toBeGreaterThan(0);
  await page.getByRole('banner').getByRole('button', { name: 'Sound off' }).click(); // sound is opt-in
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await expect.poll(async () => Number(await globe(page).getAttribute('data-pulsing')), { timeout: 20000 }).toBeGreaterThan(0);
  await page.getByRole('banner').getByRole('button', { name: /^Sound/ }).click(); // sound off again: the voices end
  await expect.poll(async () => Number(await globe(page).getAttribute('data-pulsing')), { timeout: 20000 }).toBe(0);
  expect(errors).toEqual([]);
});

test('reduced motion and high contrast: the Atlas still builds its pillars without errors', async ({ page }) => {
  const errors = await offline(page);
  await prefs(page, { reduceMotion: true, highContrast: true });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  await expect.poll(async () => Number(await globe(page).getAttribute('data-pillars')), { timeout: 20000 }).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
