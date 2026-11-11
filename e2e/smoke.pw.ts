import { test, expect } from '@playwright/test';
import { offline, open, VIEWS, noHorizontalScroll } from './helpers';

test.describe('every view', () => {
  for (const [name, hash] of VIEWS) {
    test(`${name} loads with one h1, no page errors and no horizontal scroll at 320 px`, async ({ page }) => {
      const errors = await offline(page);
      await page.setViewportSize({ width: 320, height: 720 });
      await open(page, hash);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await noHorizontalScroll(page)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
});

test('navigation reaches every section from the header', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  const nav = page.getByRole('banner');
  await nav.getByRole('button', { name: 'Data Jukebox' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Data Jukebox' })).toBeVisible();
  await nav.getByRole('button', { name: 'About the Science' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await nav.getByRole('button', { name: 'Explore Earth' }).click();
  await expect(page).toHaveURL(/track=atlas/);
  expect(errors).toEqual([]);
});

test('a country can be chosen by search with the keyboard and survives the share link', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  const box = page.getByRole('combobox').first();
  await box.click();
  await box.fill('Nepal');
  await expect(page.getByRole('option', { name: /Nepal/ }).first()).toBeVisible();
  await box.press('Enter');
  await expect(page).toHaveURL(/c=NPL/);
  await page.reload();
  await expect(page.getByText('Nepal').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Jukebox: a timeline pick updates chart, caption and hash; Play changes the state to playing', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=jukebox&story=co2&t=1990');
  await expect(page.locator('[data-caption]')).toContainText('1990');
  await page.getByRole('button', { name: /^2000:/ }).click();
  await expect(page.locator('[data-cursor]')).toHaveAttribute('data-cursor', '2000');
  await expect(page.locator('[data-caption]')).toContainText('2000');
  await expect(page).toHaveURL(/t=2000/);
  await expect(page.locator('[data-player-state]')).toHaveAttribute('data-player-state', 'ready');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('[data-player-state]')).toHaveAttribute('data-player-state', 'playing');
  await expect(page.locator('[data-cursor]')).not.toHaveAttribute('data-cursor', '2000');
  const bar = page.getByRole('region', { name: 'Now playing', exact: true }); // the transport lives in the Now-Playing bar (the header chip is gone)
  await expect(bar).toContainText('Carbon dioxide');
  await bar.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('[data-player-state]')).toHaveAttribute('data-player-state', 'paused');
  expect(errors).toEqual([]);
});

test('Jukebox sound keeps playing in other views, the bar follows, and the Atlas has one transport', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=jukebox&story=co2&t=1990');
  const bar = page.getByRole('region', { name: 'Now playing', exact: true });
  await bar.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(bar).toHaveAttribute('data-player-state', 'playing');
  await page.getByRole('banner').getByRole('button', { name: 'Explore Earth' }).click();
  await expect(page).toHaveURL(/track=atlas/); // a hidden Jukebox must not rewrite the URL
  await page.waitForTimeout(1500);
  await expect(bar).toHaveAttribute('data-player-state', 'playing'); // still playing, still on the bar
  await expect(bar).toContainText('Carbon dioxide');
  await bar.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(bar).toContainText('Planet this week'); // a paused Jukebox gives the bar to the Atlas, which is on screen
  await expect(bar).toHaveAttribute('data-player-state', 'ready');
  await expect(page.getByRole('tablist', { name: 'Day' }).getByRole('tab')).not.toHaveCount(0); // day pills stay in the Atlas
  await expect(page.getByRole('button', { name: 'Previous day' })).toHaveCount(0); // the transport is the bar's alone
  await page.getByRole('banner').getByRole('button', { name: 'Data Jukebox' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Data Jukebox' })).toBeVisible();
  await expect(bar).toContainText('Carbon dioxide');
  expect(errors).toEqual([]);
});

test('the Jukebox timeline scrolls its own rail to the cursor, not the whole page', async ({ page }) => {
  const errors = await offline(page);
  await page.addInitScript(() => { try { localStorage.setItem('sea-prefs-v1', JSON.stringify({ reduceMotion: true })); } catch { /* about:blank */ } }); // instant scroll, so the check is not racing an animation
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=jukebox&story=gistemp&t=1998');
  await expect(page.locator('[data-cursor]')).toHaveAttribute('data-cursor', '1998');
  await page.waitForTimeout(500);
  const { rail, pageTop } = await page.evaluate(() => ({
    rail: document.querySelector<HTMLElement>('[data-col="timeline"] ol')!.scrollTop,
    pageTop: document.querySelector<HTMLElement>('main .absolute.inset-0 > div.overflow-y-auto')!.scrollTop,
  }));
  expect(rail).toBeGreaterThan(0); // the rail followed the cursor
  expect(pageTop).toBe(0); // the page did not jump to it
  expect(errors).toEqual([]);
});

test('the full player opens through a view transition and shows the Atlas waveform tab; reduced motion opens it directly', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  const bar = page.getByRole('region', { name: 'Now playing', exact: true });
  await page.evaluate(() => { // record whether the browser ran a view transition
    const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const orig = d.startViewTransition?.bind(document); (window as unknown as { __vt: number }).__vt = 0;
    if (orig) d.startViewTransition = (cb) => { (window as unknown as { __vt: number }).__vt++; return orig(cb); };
  });
  await bar.getByRole('button', { name: 'Open the full player' }).click();
  await expect(page.locator('#np-full')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(1);
  await page.getByRole('tab', { name: 'Waveform & stereo' }).click();
  await expect(page.locator('#np-panel canvas')).toBeVisible();
  await expect(page.locator('#np-panel .stereo-meter')).toBeVisible();
  await bar.getByRole('button', { name: 'Close the full player' }).click();
  await expect(page.locator('#np-full')).toHaveCount(0);
  await page.addInitScript(() => { try { localStorage.setItem('sea-prefs-v1', JSON.stringify({ reduceMotion: true })); } catch { /* about:blank */ } });
  await open(page, 'track=atlas');
  await page.evaluate(() => { (window as unknown as { __vt: number }).__vt = 0; const d = document as Document & { startViewTransition?: unknown }; const o = (d.startViewTransition as (cb: () => void) => unknown | undefined)?.bind(document); if (o) d.startViewTransition = (cb: () => void) => { (window as unknown as { __vt: number }).__vt++; return o(cb); }; });
  await bar.getByRole('button', { name: 'Open the full player' }).click();
  await expect(page.locator('#np-full')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(0); // no transition under reduced motion
  expect(errors).toEqual([]);
});

test('the header has an EN / বাংলা button and the strings switch', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  await page.getByRole('banner').getByRole('button', { name: 'Switch to বাংলা' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
  await expect(page.getByRole('banner').getByRole('button', { name: /Switch to English|ইংরেজি/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('an old share link (frame + column) still opens the frame player', async ({ page }) => {
  const errors = await offline(page);
  await open(page, 'track=frames&frame=eic-ocean-heat&col=40');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/frame=eic-ocean-heat/);
  expect(errors).toEqual([]);
});
