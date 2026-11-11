import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { offline, open, noHorizontalScroll } from './helpers';

/** Roadmap v5, V3: the landing hero over the ocean-heat frame and four chapters, one EIC frame each. */
const PREFS = 'sea-prefs-v1';
const prefs = (page: Page, p: object) => page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } }, [PREFS, JSON.stringify(p)]);
/** Scrolls the landing container (not the page) so that the element's top is `offset` px below the container's top. */
const scrollTo = (page: Page, sel: string, offset = 0) => page.evaluate(([s, o]) => { const sc = document.getElementById('landing')!, el = document.querySelector(s as string)!; sc.scrollTo(0, sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - (o as number)); }, [sel, offset] as const);
const getJson = async (page: Page, f: string) => (await page.request.get(`/data/${f}`)).json();
const IDS = ['ghg', 'ocean', 'rain', 'elnino'] as const;

test('the hero sets "Hear Earth change" full width in the wide cut over the ocean-heat EIC frame', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hear Earth change');
  await expect(page.locator('h1')).toHaveCount(1);
  const img = page.locator('.lh-pic img');
  await expect(img).toHaveAttribute('src', '/eic/ocean-heat-content.webp');
  await expect.poll(() => img.evaluate((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth)).toBe(1024);
  const t = await page.locator('.lh-title').evaluate((h) => {
    const r = document.createRange(); r.selectNodeContents(h); const cs = getComputedStyle(h);
    return { stretch: cs.fontStretch, transform: cs.textTransform, w: r.getBoundingClientRect().width, vw: innerWidth, widest: Math.max(...[...h.querySelectorAll('.lh-w')].map((s) => s.getBoundingClientRect().right)) };
  });
  expect(t.stretch).toBe('125%'); // the wide cut
  expect(t.transform).toBe('uppercase');
  expect(t.w / t.vw).toBeGreaterThan(0.7); // set across the screen
  expect(t.widest).toBeLessThanOrEqual(t.vw);
  expect(await noHorizontalScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the hero keeps one primary action: "Hear an EIC frame", the globe second, and real key numbers', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  const btns = page.locator('.lh .hero-actions button');
  await expect(btns.nth(0)).toHaveText('Hear an EIC frame');
  await expect(btns.nth(0)).toHaveClass(/btn-brass/);
  await expect(btns.nth(1)).toHaveText('Explore the globe');
  await expect(btns.nth(1)).not.toHaveClass(/btn-brass/);
  await expect(page.locator('.lh .hero-tele dd').first()).toHaveText('4'); // the four EIC frames
  await expect(page.locator('.lh .hero-tele dd').nth(1)).toHaveText(/^\+\d\.\d\d$/); // latest GISTEMP anomaly
  await expect(page.locator('.lh .hero-tele')).toContainText('not live data');
  await btns.nth(0).click();
  await expect(page.locator('.stage-frame canvas').first()).toBeVisible();
  await expect(page).toHaveURL(/eic-ocean-heat/); // the picture behind the headline is the one that opens
});

test('nothing makes sound before a click; pressing play moves the headline with the sound, stop returns it', async ({ page }) => {
  const errors = await offline(page);
  await page.addInitScript(() => {
    const w = window as unknown as { AudioContext: typeof AudioContext; __ac: number };
    w.__ac = 0; const O = w.AudioContext;
    w.AudioContext = class extends O { constructor(...a: ConstructorParameters<typeof AudioContext>) { super(...a); w.__ac++; } } as typeof AudioContext;
  });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  await expect(page.locator('.lh .hero-actions button').nth(2)).toBeVisible();
  for (const id of IDS) { await scrollTo(page, `#lc-${id}`); await page.waitForTimeout(150); } // scrolling through every chapter starts nothing
  await scrollTo(page, '.lh');
  const count = () => page.evaluate(() => (window as unknown as { __ac: number }).__ac);
  expect(await count()).toBe(0);
  await expect(page.locator('.lh')).toHaveAttribute('data-playing', 'false');
  expect(await page.locator('.lh').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--np-amp'))).toBe('');
  const play = page.getByRole('button', { name: /Press play · hear 1880–2025 warming/ });
  await play.click();
  await expect(page.locator('.lh')).toHaveAttribute('data-playing', 'true');
  expect(await count()).toBeGreaterThanOrEqual(1); // created by the click
  await expect.poll(() => page.locator('.lh').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--np-amp')), { timeout: 8000 }).not.toBe(''); // the headline follows the analyser
  await expect(page.getByRole('status').filter({ hasText: 'Playing the global temperature record' })).toBeAttached();
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.locator('.lh')).toHaveAttribute('data-playing', 'false');
  await expect.poll(() => page.locator('.lh').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--np-amp'))).toBe('');
  expect(errors).toEqual([]);
});

test('each chapter shows its frame with alt text, one real number from the bundled series, and its unit, period and source', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  await expect(page.locator('.lc')).toHaveCount(4);
  await expect(page.locator('.lc-big')).toHaveCount(4);
  const big = (id: string) => page.locator(`#lc-${id} .lc-big`);
  const co2 = (await getJson(page, 'vital_signs.json')).series.find((s: { id: string }) => s.id === 'co2').points.at(-1);
  await expect(big('ghg')).toHaveText(co2.value.toFixed(1));
  await expect(page.locator('#lc-ghg .lc-unit')).toHaveText('ppm');
  await expect(page.locator('#lc-ghg .lc-meta')).toContainText('1959–2025');
  await expect(page.locator('#lc-ghg .lc-meta')).toContainText('NOAA');
  const sst = (await getJson(page, 'sst_snapshot.json')).globalStats.areaWeightedMeanAnomalyC;
  await expect(big('ocean')).toHaveText(`${sst > 0 ? '+' : ''}${sst.toFixed(2)}`);
  await expect(page.locator('#lc-ocean .lc-unit')).toHaveText('°C');
  const precip = await getJson(page, 'precip_snapshot.json');
  const maxRain = Math.max(...precip.slices.flatMap((s: { observations: { value: number }[] }) => s.observations.map((o) => o.value)));
  await expect(big('rain')).toHaveText(maxRain.toFixed(1));
  await expect(page.locator('#lc-rain .lc-unit')).toHaveText('mm/day');
  const gis = (await getJson(page, 'gistemp_global.json')).series.at(-1);
  await expect(big('elnino')).toHaveText(`${gis.anomaly > 0 ? '+' : ''}${gis.anomaly.toFixed(2)}`);
  for (const id of IDS) {
    const ch = page.locator(`#lc-${id}`);
    await expect(ch.locator('.lc-meta dd').first()).not.toBeEmpty(); // period
    await expect(ch.locator('.lc-meta a')).not.toBeEmpty(); // source
    await expect(ch.locator('.lc-badges')).toContainText('Bundled snapshot, not live data');
    expect((await ch.locator('.lc-img img').getAttribute('alt'))!.length).toBeGreaterThan(200); // the frame's long description
  }
  // the related ones say so, the CO₂ record (the series behind the picture) does not; the rain number is labelled a sample
  await expect(page.locator('#lc-ghg .lc-badges')).not.toContainText('Related data');
  for (const id of ['ocean', 'rain', 'elnino']) await expect(page.locator(`#lc-${id} .lc-badges`)).toContainText('Related data');
  await expect(page.locator('#lc-rain .lc-badges')).toContainText('A sample');
  await expect(page.locator('#lc-elnino .lc-num dt').first()).toContainText('No series is bundled for this forecast');
  expect((await page.locator('.lands').innerText()).replace(/not live data/gi, '')).not.toMatch(/\blive\b/i); // no "live" badge on snapshot data
  expect(errors).toEqual([]);
});

for (const [id, frame, title] of [['ghg', 'eic-ghg', 'Greenhouse gas warming index'], ['ocean', 'eic-ocean-heat', 'Ocean heat content since 1957'], ['rain', 'eic-geos-rain', 'Global weather: rain and cloud'], ['elnino', 'eic-elnino', 'Forecast El Niño impact on crop yields']] as const) {
  test(`chapter "${id}": Hear this frame opens the Stage on that frame, through a view transition, with nothing playing`, async ({ page }) => {
    const errors = await offline(page);
    await page.addInitScript(() => { const w = window as unknown as { __vt: number }; w.__vt = 0; const d = document as unknown as { startViewTransition?: (cb: () => void) => unknown }; const o = d.startViewTransition?.bind(document); if (o) d.startViewTransition = (cb) => { w.__vt++; return o(cb); }; });
    await page.setViewportSize({ width: 1400, height: 900 });
    await open(page, '');
    await page.locator(`#lc-${id} .lc-hear`).click();
    await expect(page).toHaveURL(new RegExp(frame));
    await expect(page.locator('.stage-frame canvas').first()).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(`^${title}`), pressed: true })).toBeVisible(); // the chip of this frame is the selected one
    await expect(page.locator('.stage-play')).toHaveText(/Play/);
    expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBeGreaterThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('scroll-driven: the colour band and the needle follow the scroll position (animation-timeline: view())', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  test.skip(!(await page.evaluate(() => CSS.supports('animation-timeline: view()'))), 'this Chromium has no scroll-driven animations');
  await expect(page.locator('.lands')).toHaveAttribute('data-st', '1');
  const kind = await page.locator('#lc-ocean .lc-band').evaluate((el) => el.getAnimations()[0]?.timeline?.constructor.name);
  expect(kind).toBe('ViewTimeline');
  const read = () => page.locator('#lc-ocean .lc-sweep i').evaluate((el) => parseFloat(getComputedStyle(el).translate.split(' ')[0]) || 0);
  const after = async (prev?: number) => { let v = 0; await expect.poll(async () => (v = await read()), { timeout: 8000 }).not.toBe(prev); return v; }; // the timeline moves on the next rendered frame (slow with the software GL scene)
  await scrollTo(page, '#lc-ocean', 700); // the chapter is just entering from below
  const early = await after();
  await scrollTo(page, '#lc-ocean', 300);
  const mid = await after(early);
  await scrollTo(page, '#lc-ocean', -300);
  const late = await after(mid);
  expect(early).toBeLessThan(mid); // -100% → 0: the needle moves east as you scroll down
  expect(mid).toBeLessThan(late);
  expect(late).toBeLessThanOrEqual(0.5);
  await scrollTo(page, '#lc-ocean', 700);
  expect(await page.locator('#lc-ocean .lc-band').evaluate((el) => getComputedStyle(el).clipPath)).not.toBe('none'); // still wiping when it has barely entered
  await scrollTo(page, '#lc-ocean', 0);
  await expect.poll(() => page.locator('#lc-ocean .lc-band').evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/^inset\(0(px|%)?( 0(px|%)?){0,3}\)$/); // fully drawn
});

test('without animation-timeline, an IntersectionObserver reveals each chapter once it is a quarter on screen (same end state)', async ({ page }) => {
  const errors = await offline(page);
  await page.addInitScript(() => { const o = CSS.supports.bind(CSS); CSS.supports = ((...a: string[]) => (/animation-timeline/.test(a.join(' ')) ? false : (o as (...x: string[]) => boolean)(...a))) as typeof CSS.supports; });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  await expect(page.locator('.lands')).not.toHaveAttribute('data-st', /.*/);
  await expect(page.locator('.lands')).not.toHaveAttribute('data-static', /.*/);
  await expect(page.locator('#lc-elnino')).toHaveAttribute('data-in', 'false'); // far below the fold
  expect(await page.locator('#lc-elnino .lc-band').evaluate((el) => getComputedStyle(el).clipPath)).not.toBe('none');
  await scrollTo(page, '#lc-elnino', 200);
  await expect(page.locator('#lc-elnino')).toHaveAttribute('data-in', 'true');
  await expect.poll(() => page.locator('#lc-elnino .lc-band').evaluate((el) => getComputedStyle(el).clipPath), { timeout: 5000 }).toMatch(/^inset\(0(px|%)?( 0(px|%)?){0,3}\)$/);
  await expect.poll(() => page.locator('#lc-elnino .lc-sweep i').evaluate((el) => getComputedStyle(el).translate), { timeout: 6000 }).toMatch(/^(0px|0px 0px|none)$/);
  await expect(page.locator('#lc-ghg')).toHaveAttribute('data-in', 'false'); // chapters above, never visited, stay unrevealed
  expect(errors).toEqual([]);
});

test('reduced motion: chapters are static (no scroll animation, no sweep, nothing clipped) and the hero does not sweep', async ({ page }) => {
  const errors = await offline(page);
  await prefs(page, { reduceMotion: true });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  await expect(page.locator('.lands')).toHaveAttribute('data-static', '1');
  await expect(page.locator('.lands')).not.toHaveAttribute('data-st', /.*/);
  for (const id of IDS) {
    const r = await page.locator(`#lc-${id}`).evaluate((el) => {
      const band = getComputedStyle(el.querySelector('.lc-band')!), sweep = getComputedStyle(el.querySelector('.lc-sweep')!);
      return { anims: el.querySelector('.lc-band')!.getAnimations().length, clip: band.clipPath, sweep: sweep.display };
    });
    expect(r).toEqual({ anims: 0, clip: 'none', sweep: 'none' });
  }
  expect(await page.locator('.lh-sweep').evaluate((el) => getComputedStyle(el).display)).toBe('none');
  await expect(page.locator('#lc-ocean .lc-big')).toBeVisible(); // the number is there without any scrolling effect
  expect(errors).toEqual([]);
});

test('high contrast: black ground, the data colour only as text and lines; no picture behind the headline', async ({ page }) => {
  await offline(page);
  await prefs(page, { highContrast: true });
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  expect(await page.locator('.lh-pic').evaluate((el) => getComputedStyle(el).display)).toBe('none');
  const band = await page.locator('#lc-rain .lc-band').evaluate((el) => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, big: getComputedStyle(el.querySelector('.lc-big')!).color }; });
  expect(band.bg).toBe('rgb(0, 0, 0)');
  expect(band.big).toBe('rgb(47, 197, 250)'); // --rain
});

test('chapter fields flood with their data colour and carry dark text at 4.5:1 or better', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, '');
  const want: Record<string, string> = { ghg: 'rgb(212, 178, 1)', ocean: 'rgb(12, 209, 175)', rain: 'rgb(47, 197, 250)', elnino: 'rgb(255, 149, 85)' };
  for (const id of IDS) {
    const c = await page.locator(`#lc-${id} .lc-band`).evaluate((el) => { const cs = getComputedStyle(el); return [cs.backgroundColor, cs.color]; });
    expect(c[0]).toBe(want[id]);
    const lum = (s: string) => { const v = s.match(/\d+/g)!.slice(0, 3).map((x) => Number(x) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const [a, b] = [lum(c[0]), lum(c[1])].sort((p, q) => q - p);
    expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(4.5);
  }
});

test('the headline never overflows, even at its widest while breathing, on phones, tablets and desktops, in English and বাংলা', async ({ page }) => {
  await offline(page);
  for (const lang of ['en', 'bn']) {
    for (const w of [320, 375, 768, 1400]) {
      await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } }, [PREFS, JSON.stringify({ lang })]);
      await page.setViewportSize({ width: w, height: 800 });
      await open(page, '');
      await expect(page.locator('.lh-title')).toBeVisible();
      await page.locator('.lh').evaluate((el) => { (el as HTMLElement).style.setProperty('--np-amp', '1'); (el as HTMLElement).style.setProperty('--np-bass', '1'); }); // loudest breath: weight 900
      const o = await page.locator('.lh-title').evaluate((h) => ({ sw: h.scrollWidth, cw: h.clientWidth, right: Math.max(...[...h.querySelectorAll('.lh-w')].map((s) => s.getBoundingClientRect().right)), vw: innerWidth }));
      expect(o.right, `${lang} ${w}`).toBeLessThanOrEqual(o.vw);
      expect(o.sw, `${lang} ${w}`).toBeLessThanOrEqual(o.cw);
      expect(await noHorizontalScroll(page), `${lang} ${w}`).toBe(true);
    }
  }
});

test('375 px: no sideways scroll across hero, chapters and carousel, in English and বাংলা', async ({ page }) => {
  await offline(page);
  for (const lang of ['en', 'bn']) {
    await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } }, [PREFS, JSON.stringify({ lang })]);
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, '');
    await expect(page.locator('#lc-elnino .lc-big')).toBeVisible({ timeout: 25000 }); // the numbers load in a lazy chunk while the software-GL carousel starts: slow on a busy machine
    for (const sel of ['.lh', '#lc-ghg', '#lc-ocean', '#lc-rain', '#lc-elnino', '.world-track']) {
      await scrollTo(page, sel);
      await page.waitForTimeout(100);
      expect(await noHorizontalScroll(page), `${lang} ${sel}`).toBe(true);
      expect(await page.evaluate(() => { const sc = document.getElementById('landing')!; return sc.scrollWidth <= sc.clientWidth; }), `${lang} ${sel} container`).toBe(true);
    }
  }
});

for (const s of [{ label: 'desktop', w: 1400, p: {} }, { label: 'phone, বাংলা, high contrast, reduced motion', w: 360, p: { lang: 'bn', highContrast: true, reduceMotion: true } }]) {
  test(`axe: landing hero and chapters, ${s.label}`, async ({ page }) => {
    await offline(page);
    await prefs(page, s.p);
    await page.setViewportSize({ width: s.w, height: 800 });
    await open(page, '');
    await expect(page.locator('#lc-elnino .lc-big')).toBeVisible({ timeout: 25000 }); // the numbers load in a lazy chunk while the software-GL carousel starts: slow on a busy machine
    for (const sel of ['.lh', '#lc-ghg', '#lc-rain']) {
      await scrollTo(page, sel);
      await page.waitForTimeout(1600); // the colour band has wiped in
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
      expect(r.violations.map((v) => `${sel} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    }
  });
}
