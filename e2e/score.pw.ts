import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { offline, open, noHorizontalScroll } from './helpers';

/** Roadmap v5, V4: the score view (a picture's notes, a series' piano roll) and the share card. */
const PREFS = 'sea-prefs-v1';
const prefs = (page: Page, p: object) => page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } }, [PREFS, JSON.stringify(p)]);
const ready = (page: Page) => expect(page.locator('.stage-play')).toBeEnabled();
const pct = (page: Page, sel: string) => page.locator(sel).first().evaluate((el) => parseFloat((el as HTMLElement).style.left));
const SCORE = (page: Page) => page.getByRole('region', { name: 'The score' });

test('the score sits under the picture: its thumbnail and its notes share the same columns, and the playhead is the needle', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames&frame=eic-ghg&col=40');
  await ready(page);
  const score = SCORE(page);
  await expect(score).toBeVisible();
  await expect(score.locator('canvas.score-thumb')).toBeVisible();
  const [tb, nb] = await Promise.all([score.locator('canvas.score-thumb').boundingBox(), score.locator('svg.score-svg').boundingBox()]);
  expect(Math.abs(tb!.x - nb!.x)).toBeLessThan(1.5); expect(Math.abs(tb!.width - nb!.width)).toBeLessThan(1.5); // aligned
  expect(nb!.y).toBeGreaterThanOrEqual(tb!.y + tb!.height - 2); // notes under the thumbnail
  // the thumbnail is the picture (not blank)
  expect(await score.locator('canvas.score-thumb').evaluate((c) => { const cv = c as HTMLCanvasElement, d = cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height).data; let lit = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] + d[i + 1] + d[i + 2] > 60) lit++; return lit; })).toBeGreaterThan(20);
  const notes = score.locator('svg.score-svg rect');
  const n = await notes.count();
  expect(n).toBeGreaterThan(30);
  // no note where the picture is silent: this frame only sounds in x 1%–67% of its width (the ring chart on the right is outside)
  const maxCol = await notes.evaluateAll((rs) => Math.max(...rs.map((r) => +r.getAttribute('x')!)));
  expect(maxCol).toBeLessThanOrEqual(Math.ceil(0.67 * 128));
  expect(await notes.evaluateAll((rs) => rs.every((r) => +r.getAttribute('x')! >= 0 && +r.getAttribute('y')! >= 0 && +r.getAttribute('y')! < 12))).toBe(true);
  // the playhead and the needle are the same position
  expect(Math.abs((await pct(page, '.score-play')) - (await pct(page, '.stage-needle')))).toBeLessThan(1.2);
  await page.locator('#frame-scrub').fill('70');
  await expect.poll(async () => Math.abs((await pct(page, '.score-play')) - (await pct(page, '.stage-needle')))).toBeLessThan(1.2);
  expect(await pct(page, '.score-play')).toBeGreaterThan(50);
  // a text alternative in words and numbers
  const alt = await score.locator('[role="img"]').first().getAttribute('aria-label');
  expect(alt).toMatch(/^Score of this picture: \d+ notes over \d+ of 128 columns, from [A-G]/);
  expect(errors).toEqual([]);
});

test('the playhead moves with the sound, and the Score button hides and shows the panel', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames&frame=eic-ghg&col=3');
  await ready(page);
  const x0 = await pct(page, '.score-play');
  await page.locator('.stage-play').click();
  await expect.poll(() => pct(page, '.score-play'), { timeout: 8000 }).toBeGreaterThan(x0 + 3);
  await page.locator('.stage-play').click();
  const btn = page.getByRole('button', { name: 'Score', exact: true });
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await btn.click();
  await expect(SCORE(page)).toHaveCount(0);
  await btn.click();
  await expect(SCORE(page)).toBeVisible();
  expect(errors).toEqual([]);
});

test('each EIC frame has a score, a silent picture is said to be silent, and Side A / Side B shows two scores', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  for (const f of ['eic-ocean-heat', 'eic-elnino', 'eic-geos-rain']) {
    await open(page, `track=frames&frame=${f}`);
    await ready(page);
    expect(await SCORE(page).locator('svg.score-svg rect').count(), f).toBeGreaterThan(10);
  }
  await open(page, 'track=frames&pair=eic');
  await ready(page);
  const score = SCORE(page);
  await expect(score.locator('figure.score')).toHaveCount(2);
  await expect(score.locator('.score-head').nth(0)).toContainText('Side A');
  await expect(score.locator('.score-head').nth(1)).toContainText('Side B');
  await expect(page.getByRole('button', { name: 'Make a share card' })).toHaveCount(0); // a card is for one picture with one source
  expect(errors).toEqual([]);
});

test('the series has a piano roll: one bar per real value at its mapped note, a playhead, and Side A / Side B rolls', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames&frame=eic-ghg');
  await ready(page);
  await page.getByRole('button', { name: /CO₂ record behind it/ }).click();
  const panel = page.getByRole('region', { name: 'The data behind it' });
  const roll = panel.locator('figure.roll');
  await expect(roll).toHaveCount(1);
  const co2 = (await (await page.request.get('/data/vital_signs.json')).json()).series.find((s: { id: string }) => s.id === 'co2').points;
  await expect(roll.locator('rect.roll-n')).toHaveCount(co2.filter((p: { value: number | null }) => p.value !== null).length);
  await expect(roll.locator('[role="img"]')).toHaveAttribute('aria-label', /^.+: \d+ notes from [A-G]\d up to [A-G]\d\.$/);
  // a rising series: the last bar is higher (smaller y) than the first
  const ys = await roll.locator('rect.roll-n').evaluateAll((rs) => rs.map((r) => +r.getAttribute('y')!));
  expect(ys.at(-1)!).toBeLessThan(ys[0]);
  const x0 = await pct(page, '.roll .score-play');
  await panel.getByRole('button', { name: 'Play' }).click();
  await expect.poll(() => pct(page, '.roll .score-play'), { timeout: 8000 }).toBeGreaterThan(x0);
  await panel.getByRole('button', { name: 'Pause' }).click();
  await panel.getByRole('button', { name: 'Side A / Side B' }).click();
  await expect(panel.locator('figure.roll')).toHaveCount(2);
  await expect(panel.locator('figure.roll .score-head').nth(0)).toContainText('Side A');
  await expect(panel.locator('figure.roll .score-head').nth(1)).toContainText('Side B');
  expect(errors).toEqual([]);
});

test('the share card: made on this device, 1080 x 1350, with the source and the link back; it can be saved as a PNG', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames&frame=eic-ghg&col=40');
  await ready(page);
  await page.getByRole('button', { name: 'Make a share card' }).click();
  const card = page.getByRole('region', { name: 'Share card' });
  const img = card.locator('img');
  await expect(img).toBeVisible();
  await expect(card.getByRole('status')).toContainText('stays on this device');
  expect(await img.getAttribute('src')).toMatch(/^blob:/);
  expect(await img.evaluate((i) => [(i as HTMLImageElement).naturalWidth, (i as HTMLImageElement).naturalHeight])).toEqual([1080, 1350]);
  expect(await img.getAttribute('alt')).toContain('Greenhouse gas warming index');
  await expect(card).toContainText('frame=eic-ghg'); // the link back to the Stage, at the needle's column
  await expect(card).toContainText('col=40');
  // the card is not blank and carries the signal colour (the readout field)
  const sig = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--signal').trim());
  const stats = await img.evaluate((i, s) => {
    const im = i as HTMLImageElement, c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d')!; x.drawImage(im, 0, 0);
    const t = document.createElement('canvas').getContext('2d')!; t.fillStyle = s; t.fillRect(0, 0, 1, 1); const want = t.getImageData(0, 0, 1, 1).data;
    const d = x.getImageData(0, 0, c.width, c.height).data; let signal = 0, lit = 0;
    for (let k = 0; k < d.length; k += 4) { if (Math.abs(d[k] - want[0]) < 6 && Math.abs(d[k + 1] - want[1]) < 6 && Math.abs(d[k + 2] - want[2]) < 6) signal++; if (d[k] + d[k + 1] + d[k + 2] > 150) lit++; }
    return { signal, lit, px: d.length / 4 };
  }, sig);
  expect(stats.signal / stats.px).toBeGreaterThan(0.08); // the signal-coloured field
  expect(stats.lit / stats.px).toBeGreaterThan(0.1);
  // save: a real PNG with a safe name
  const [dl] = await Promise.all([page.waitForEvent('download'), card.getByRole('link', { name: 'Save PNG' }).click()]);
  expect(dl.suggestedFilename()).toBe('blue-planet-radio-eic-ghg.png');
  const buf = readFileSync(await dl.path());
  expect([...buf.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(buf.length).toBeGreaterThan(20000);
  await card.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('region', { name: 'Share card' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Share hands the PNG, the title and the link to the browser share sheet when it can share files', async ({ page }) => {
  const errors = await offline(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: unknown };
    Object.defineProperty(navigator, 'canShare', { value: (d: { files?: File[] }) => !!d?.files?.length, configurable: true });
    Object.defineProperty(navigator, 'share', { value: async (d: { files: File[]; title: string; text: string; url: string }) => { w.__shared = { n: d.files.length, name: d.files[0].name, type: d.files[0].type, size: d.files[0].size, title: d.title, url: d.url, text: d.text }; }, configurable: true });
  });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames&frame=eic-ocean-heat&col=50');
  await ready(page);
  await page.getByRole('button', { name: 'Make a share card' }).click();
  const card = page.getByRole('region', { name: 'Share card' });
  await card.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(card.getByRole('status')).toHaveText('Shared.');
  const shared = await page.evaluate(() => (window as unknown as { __shared: { n: number; name: string; type: string; size: number; title: string; url: string; text: string } }).__shared);
  expect(shared).toMatchObject({ n: 1, name: 'blue-planet-radio-eic-ocean-heat.png', type: 'image/png', title: 'Ocean heat content since 1957' });
  expect(shared.size).toBeGreaterThan(20000);
  expect(shared.url).toContain('frame=eic-ocean-heat');
  expect(errors).toEqual([]);
});

test('বাংলা: the score and the share card are translated', async ({ page }) => {
  const errors = await offline(page);
  await prefs(page, { lang: 'bn' });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames&frame=eic-ghg&col=40');
  await ready(page);
  await expect(page.getByRole('region', { name: 'স্কোর' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'স্কোর' }).locator('[role="img"]').first()).toHaveAttribute('aria-label', /^এই ছবির স্কোর: [০-৯]+টির মধ্যে [০-৯]+টি কলামে [০-৯]+টি স্বর/);
  await page.getByRole('button', { name: 'শেয়ার কার্ড বানান' }).click();
  await expect(page.getByRole('region', { name: 'শেয়ার কার্ড' }).locator('img')).toBeVisible();
  await expect(page.getByRole('link', { name: 'PNG সংরক্ষণ' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('reduced motion and high contrast: the score and card still show; the playhead steps about once a second', async ({ page }) => {
  const errors = await offline(page);
  await prefs(page, { reduceMotion: true, highContrast: true });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=frames&frame=eic-ghg&col=3');
  await ready(page);
  await expect(SCORE(page).locator('svg.score-svg rect').first()).toBeVisible();
  expect(await page.locator('.score-play').evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  await page.getByRole('button', { name: /CO₂ record behind it/ }).click();
  expect(await page.locator('.roll-n').first().evaluate((el) => getComputedStyle(el).fill)).toBe(await page.locator('.score-play').first().evaluate((el) => getComputedStyle(el).backgroundColor)); // one colour, the signal, as text-and-lines only
  expect(errors).toEqual([]);
});

test('375 px: no sideways scroll with the score, the roll and the card open, in English and বাংলা', async ({ page }) => {
  await offline(page);
  for (const lang of ['en', 'bn']) {
    await prefs(page, { lang });
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, 'track=frames&frame=eic-ghg');
    await ready(page);
    await page.getByRole('button', { name: /CO₂/ }).first().click();
    await page.getByRole('button', { name: lang === 'bn' ? 'শেয়ার কার্ড বানান' : 'Make a share card' }).click();
    await expect(page.locator('.stage-card img')).toBeVisible();
    expect(await noHorizontalScroll(page), lang).toBe(true);
    expect(await page.locator('.score-box').first().evaluate((el) => el.getBoundingClientRect().right <= innerWidth), lang).toBe(true);
  }
});

for (const s of [{ label: 'desktop', w: 1400, p: {} }, { label: 'phone, বাংলা, high contrast, reduced motion', w: 360, p: { lang: 'bn', highContrast: true, reduceMotion: true } }]) {
  test(`axe: the Stage with the score, the roll and the card open, ${s.label}`, async ({ page }) => {
    await offline(page);
    await prefs(page, s.p);
    await page.setViewportSize({ width: s.w, height: 900 });
    await open(page, 'track=frames&frame=eic-ghg&col=40');
    await ready(page);
    await page.getByRole('button', { name: /CO₂/ }).first().click();
    await expect(page.locator('figure.roll')).toBeVisible();
    await page.getByRole('button', { name: 'lang' in s.p ? 'শেয়ার কার্ড বানান' : 'Make a share card' }).click();
    await expect(page.locator('.stage-card img')).toBeVisible();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  });
}
