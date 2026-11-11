import { test, expect, type Page } from '@playwright/test';
import { offline, open } from './helpers';

/** Roadmap v5, V2: the Frame Stage. */
const signal = (page: Page) => page.evaluate(() => document.documentElement.style.getPropertyValue('--signal-live'));
const needle = (page: Page) => page.locator('.stage-needle').first().evaluate((el) => parseFloat((el as HTMLElement).style.left));

test('the Stage opens from the landing CTA, with a frame on it, and nothing plays by itself', async ({ page }) => {
  const errors = await offline(page);
  await page.addInitScript(() => { (window as unknown as { __vt: number }).__vt = 0; const d = document as unknown as { startViewTransition?: (cb: () => void) => unknown }; const o = d.startViewTransition?.bind(document); if (o) d.startViewTransition = (cb) => { (window as unknown as { __vt: number }).__vt++; return o(cb); }; });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  const cta = page.getByRole('button', { name: 'Hear an EIC frame' });
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/\/frames|track=frames/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.stage-frame canvas').first()).toBeVisible();
  await expect(page.locator('.stage-needle').first()).toBeVisible();
  await expect(page.locator('.stage-play')).toHaveText(/Play/); // not playing: sound starts only after a press
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBeGreaterThanOrEqual(1); // opened through a view transition (root fallback in Chromium 141)
  expect(errors).toEqual([]);
});

test('the first header item and the CTA agree: Frames is the Stage, the globe is the second item', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=about');
  const items = page.getByRole('banner').getByRole('navigation', { name: /main/i }).getByRole('button');
  await expect(items.nth(0)).toHaveText('Frames');
  await expect(items.nth(1)).toHaveText('Explore Earth');
  expect(errors).toEqual([]);
});

test('while playing, the needle advances and the year reads from the chart axis', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames&frame=eic-ghg&col=3');
  await expect(page.locator('.stage-play')).toBeEnabled();
  await expect(page.locator('.stage-big')).toHaveText('1979'); // column 3 of 128 sits on the first bar
  const x0 = await needle(page);
  await page.locator('.stage-play').click();
  await expect(page.locator('.stage-play')).toHaveText(/Stop/);
  await expect.poll(() => needle(page), { timeout: 8000 }).toBeGreaterThan(x0 + 3);
  const yr = Number(await page.locator('.stage-big').textContent());
  expect(yr).toBeGreaterThan(1979);
  expect(yr).toBeLessThanOrEqual(2021);
  await page.locator('.stage-play').click();
  await expect(page.locator('.stage-play')).toHaveText(/Play/);
  expect(errors).toEqual([]);
});

test('the signal colour follows the picture under the needle, and is legible', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames&frame=eic-elnino');
  await expect(page.locator('.stage-play')).toBeEnabled();
  const slider = page.locator('#frame-scrub');
  await slider.fill('25');
  await expect.poll(() => signal(page)).toMatch(/^#[0-9a-f]{6}$/);
  const a = await signal(page);
  const seen = new Set([a]);
  for (const c of ['45', '70', '95', '110']) { await slider.fill(c); await page.waitForTimeout(250); seen.add(await signal(page)); }
  expect(seen.size, `colours: ${[...seen].join(' ')}`).toBeGreaterThanOrEqual(3); // the colour of the picture changes along the frame
  // the readout field really is that colour, with dark or light text that keeps 4.5:1
  const r = await page.locator('.stage-read').evaluate((el) => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, fg: cs.color }; });
  const lum = (c: string) => { const m = c.match(/\d+/g)!.slice(0, 3).map(Number).map((v) => v / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
  const [hi, lo] = [lum(r.bg), lum(r.fg)].sort((p, q) => q - p);
  expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(4.5);
  // leaving the view gives the interface back its own colour
  await page.getByRole('banner').getByRole('button', { name: 'About the Science' }).click();
  await expect.poll(() => signal(page)).toBe('');
  expect(errors).toEqual([]);
});

test('Side A / Side B: two frames side by side, one in each ear, both play', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames');
  await page.getByRole('button', { name: 'Before / after' }).click();
  await expect(page.locator('.stage-frame[data-pair="true"] .stage-half')).toHaveCount(2);
  await expect(page.locator('.stage-side').nth(0)).toContainText('Side A');
  await expect(page.locator('.stage-side').nth(0)).toContainText('left ear');
  await expect(page.locator('.stage-side').nth(1)).toContainText('Side B');
  await expect(page.locator('.stage-side').nth(1)).toContainText('right ear');
  await expect(page.locator('.stage-play')).toBeEnabled();
  await page.locator('.stage-play').click();
  await expect(page.locator('.stage-play')).toHaveText(/Stop/);
  await expect.poll(async () => (await page.locator('.stage-needle').count())).toBe(2);
  const x0 = await needle(page);
  await expect.poll(() => needle(page), { timeout: 8000 }).not.toBe(x0);
  expect(errors).toEqual([]);
});

test('"Describe" gives the picture\'s long description, and the image alt is that description', async ({ page }) => {
  const errors = await offline(page);
  await open(page, 'track=frames&frame=eic-ghg');
  await expect(page.locator('.stage-canvas')).toHaveAttribute('aria-label', /bar chart/i);
  await page.getByText('Describe this picture').click();
  await expect(page.locator('.stage-details').first()).toContainText('NOAA Annual Greenhouse Gas Index');
  expect(errors).toEqual([]);
});

test('"Hear the data behind it" plays the real series under the frame, with a score line, Side A / Side B, and its source', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames&frame=eic-ghg');
  await page.getByRole('button', { name: /CO₂ record behind it/ }).click();
  const panel = page.getByRole('region', { name: 'The data behind it' });
  await expect(panel).toBeVisible();
  await expect(page.locator('.stage-frame canvas')).toBeVisible(); // the picture stays on screen
  await expect(panel.locator('.stage-chart svg path').first()).toBeVisible(); // the score line
  await expect(panel).toContainText('NOAA');
  await expect(panel).toContainText('Snapshot');
  const when = panel.locator('.stage-series-big');
  const t0 = await when.textContent();
  await panel.getByRole('button', { name: 'Play' }).click();
  await expect(panel.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect.poll(() => when.textContent(), { timeout: 8000 }).not.toBe(t0); // the cursor moves with the sound
  await panel.getByRole('button', { name: 'Pause' }).click();
  // the picture's own sweep and the series never sound together
  await page.locator('.stage-play').first().click();
  await expect(panel.getByRole('button', { name: 'Play' })).toBeVisible();
  await page.locator('.stage-play').first().click();
  // Side A / Side B on the series
  await panel.getByRole('button', { name: 'Side A / Side B' }).click();
  await expect(panel.locator('.stage-side').nth(0)).toContainText('Side A');
  await expect(panel.locator('.stage-side').nth(1)).toContainText('right ear');
  // the Jukebox link still goes to the story
  await panel.getByRole('button', { name: 'Open in the Data Jukebox' }).click();
  await expect(page).toHaveURL(/story=co2/);
  await open(page, 'track=frames&frame=eic-ocean-heat');
  await expect(page.getByText(/Related, not identical data/)).toBeVisible();
  await page.getByRole('button', { name: /related data/i }).click();
  await expect(page.getByRole('region', { name: 'The data behind it' })).toContainText('not the numbers drawn in the picture');
  expect(errors).toEqual([]);
});

test('reduced motion: the numerals stay static while playing and the view does not run a transition', async ({ page }) => {
  const errors = await offline(page);
  await page.addInitScript(() => { try { localStorage.setItem('sea-prefs-v1', JSON.stringify({ reduceMotion: true })); } catch { /* ignore */ } (window as unknown as { __vt: number }).__vt = 0; const d = document as unknown as { startViewTransition?: (cb: () => void) => unknown }; const o = d.startViewTransition?.bind(document); if (o) d.startViewTransition = (cb) => { (window as unknown as { __vt: number }).__vt++; return o(cb); }; });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  await page.getByRole('button', { name: 'Hear an EIC frame' }).click();
  await expect(page.locator('.stage-play')).toBeEnabled();
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(0);
  await page.locator('.stage-play').click();
  await page.waitForTimeout(1500);
  expect(await page.locator('.stage-read').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--np-bass'))).toBe(''); // no audio-reactive variables
  await expect(page.locator('.stage-step, button[aria-label="Step right"]').first()).toBeVisible(); // step buttons are there for moving the needle by hand
  expect(errors).toEqual([]);
});

test('the Stage fits at 375 px: no horizontal scroll, controls reachable, in বাংলা too', async ({ page }) => {
  const errors = await offline(page);
  await page.addInitScript(() => { try { localStorage.setItem('sea-prefs-v1', JSON.stringify({ lang: 'bn' })); } catch { /* ignore */ } });
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, 'track=frames&frame=eic-ghg');
  await expect(page.locator('.stage-play')).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('.stage-big')).toHaveText(/[০-৯]/); // বাংলা numerals
  expect(errors).toEqual([]);
});
