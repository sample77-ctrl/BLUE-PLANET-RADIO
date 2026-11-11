import { describe, it, expect } from 'vitest';
import { CHAPTERS, chapterFormat, fmtAt, fmtPeriod, lastValue, numberFromPrecip, numberFromSeries } from '../lib/chapters';
import { EIC_FRAMES } from '../lib/eicFrames';
import { GLOBAL_STORIES } from '../stories/stories';
import { sstMonthSeries } from '../stories/loadStory';
import { parseVitalSigns } from '../datasets/adapters/vitalSigns';
import { parseGistemp } from '../datasets/adapters/gistemp';
import { PRECIP_INFO } from '../datasets/adapters/precip';
import { contrastRatio } from '../lib/signal';
import { STRINGS } from '../lib/strings';
// Loaded dynamically so the app's own type-check does not need Node types.
const fs = await import(/* @vite-ignore */ 'node:fs' as string);
const file = (p: string) => JSON.parse(fs.readFileSync(`public/data/${p}`, 'utf8'));
const css: string = fs.readFileSync('src/index.css', 'utf8');
const token = (n: string) => css.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`))![1];

describe('landing chapters (roadmap v5, V3)', () => {
  it('there are four, in the order of the roadmap, each on its own EIC frame', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual(['ghg', 'ocean', 'rain', 'elnino']);
    expect(CHAPTERS.map((c) => c.frameId)).toEqual(['eic-ghg', 'eic-ocean-heat', 'eic-geos-rain', 'eic-elnino']);
    for (const c of CHAPTERS) expect(EIC_FRAMES.some((f) => f.id === c.frameId)).toBe(true);
  });
  it('every story a chapter reads exists, and a related number says so', () => {
    for (const c of CHAPTERS) if ('story' in c.source) expect(GLOBAL_STORIES.some((s) => s.id === (c.source as { story: string }).story)).toBe(true);
    expect(CHAPTERS.find((c) => c.id === 'ghg')!.related).toBe(false); // the CO₂ record is the one matching series
    expect(CHAPTERS.filter((c) => c.related).map((c) => c.id)).toEqual(['ocean', 'rain', 'elnino']);
  });
  it('each chapter colour is a data colour with readable dark text on it (4.5:1) and on the ground as text', () => {
    for (const c of CHAPTERS) {
      expect(contrastRatio(token('on-signal-default'), token(c.color))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(token(c.color), '#0a0a0a')).toBeGreaterThanOrEqual(4.5);
    }
    expect(new Set(CHAPTERS.map((c) => c.color)).size).toBe(4);
  });
  it('all the chapter strings exist in English and বাংলা', () => {
    const keys = Object.keys(STRINGS.en).filter((k) => /^(lc|lh)[A-Z]/.test(k));
    expect(keys.length).toBeGreaterThan(30);
    for (const k of keys) expect((STRINGS.bn as Record<string, string>)[k], k).toBeTruthy();
  });
});

describe('the numbers come from the bundled files, never invented', () => {
  it('lastValue skips gaps and returns null for an empty or all-gap series', () => {
    expect(lastValue({ points: [{ t: '1', v: 3 }, { t: '2', v: null }] })).toEqual({ t: '1', v: 3 });
    expect(lastValue({ points: [{ t: '1', v: null }] })).toBeNull();
    expect(lastValue({ points: [] })).toBeNull();
  });
  it('chapter 1 is the last CO₂ value in vital_signs.json, with its unit, period and source', () => {
    const j = file('vital_signs.json'), co2 = parseVitalSigns(j).find((s) => s.id === 'vital-co2')!, n = numberFromSeries(co2)!;
    const raw = j.series.find((s: { id: string }) => s.id === 'co2').points.at(-1);
    expect(n.value).toBe(raw.value);
    expect(n.at).toBe(String(raw.year));
    expect(n.unit).toBe('ppm');
    expect(n.period).toMatch(/^\d{4} to \d{4}$/);
    expect(n.source).toMatch(/NOAA/);
    expect(n.snapshot).toBe(j.generated);
    expect(n.isSample).toBe(false);
  });
  it('chapter 2 is the month value of the SST snapshot (the file’s own area-weighted mean)', () => {
    const j = file('sst_snapshot.json'), n = numberFromSeries(sstMonthSeries(j))!;
    expect(n.value).toBe(j.globalStats.areaWeightedMeanAnomalyC);
    expect(n.unit).toBe('°C');
    expect(n.at).toMatch(/^\d{4}-\d{2}$/);
  });
  it('chapter 3 is the largest rain value over every day and point of the rain sample', () => {
    const j = file('precip_snapshot.json'), n = numberFromPrecip(j, PRECIP_INFO)!;
    const all: number[] = j.slices.flatMap((s: { observations: { value: number }[] }) => s.observations.map((o) => o.value));
    expect(n.value).toBe(Math.max(...all));
    expect(n.unit).toBe('mm/day');
    expect(n.isSample).toBe(true);
    expect(n.period).toBe(`${j.slices[0].dateLabel} to ${j.slices[j.slices.length - 1].dateLabel}`);
    expect(j.slices.some((s: { dateLabel: string }) => s.dateLabel === n.at)).toBe(true);
  });
  it('chapter 4 is the latest GISTEMP anomaly', () => {
    const j = file('gistemp_global.json'), n = numberFromSeries(parseGistemp(j))!, last = j.series.at(-1);
    expect(n.value).toBe(last.anomaly);
    expect(n.at).toBe(String(last.year));
  });
  it('an empty rain file gives no number', () => {
    expect(numberFromPrecip({ slices: [] }, PRECIP_INFO)).toBeNull();
  });
});

describe('formatting', () => {
  it('years, months and days read naturally, with বাংলা digits', () => {
    expect(fmtAt('2025', 'en')).toBe('2025');
    expect(fmtAt('2025', 'bn')).toBe('২০২৫');
    expect(fmtAt('2026-09', 'en')).toBe('September 2026');
    expect(fmtAt('2026-10-05', 'en')).toBe('5 Oct 2026');
    expect(fmtAt('n/a', 'en')).toBe('n/a');
    expect(fmtPeriod('1959 to 2025', 'en')).toBe('1959–2025');
    expect(fmtPeriod('2026-09', 'en')).toBe('September 2026');
  });
  it('anomalies carry a sign, concentrations do not', () => {
    const f = (id: string, v: number) => new Intl.NumberFormat('en-US', chapterFormat(CHAPTERS.find((c) => c.id === id)!)).format(v);
    expect(f('elnino', 1.19)).toBe('+1.19');
    expect(f('ocean', -0.4)).toBe('-0.40');
    expect(f('ghg', 427.43)).toBe('427.4');
  });
});
