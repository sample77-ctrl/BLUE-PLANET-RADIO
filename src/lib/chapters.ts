import type { DataSeries } from '../datasets/series';
import type { SliceJson } from '../datasets/adapters/common';
import { fmtNum, type Lang } from './strings';

/** Landing chapters (roadmap v5, V3): one EIC frame each, its colour, and the ONE real number shown with it. Pure: nothing here holds a number, it only reads them from the bundled series. */
export type ChapterId = 'ghg' | 'ocean' | 'rain' | 'elnino';
export type ChapterColor = 'brass' | 'teal' | 'rain' | 'fire';
/** Where the number comes from: a Data Jukebox story's series, or the global rain sample. */
export type ChapterSource = { story: 'co2' | 'sst-month' | 'gistemp' } | { precip: true };

export interface ChapterDef {
  id: ChapterId;
  frameId: string;
  color: ChapterColor;
  source: ChapterSource;
  /** True when the number is from a related dataset on the same theme, not the numbers printed in the picture. The UI says so. */
  related: boolean;
  /** Fraction digits to show, and whether to force a + sign (anomalies). */
  digits: number;
  signed?: boolean;
}

export const CHAPTERS: ChapterDef[] = [
  { id: 'ghg', frameId: 'eic-ghg', color: 'brass', source: { story: 'co2' }, related: false, digits: 1 },
  { id: 'ocean', frameId: 'eic-ocean-heat', color: 'teal', source: { story: 'sst-month' }, related: true, digits: 2, signed: true },
  { id: 'rain', frameId: 'eic-geos-rain', color: 'rain', source: { precip: true }, related: true, digits: 1 },
  { id: 'elnino', frameId: 'eic-elnino', color: 'fire', source: { story: 'gistemp' }, related: true, digits: 2, signed: true },
];

/** A number as shown in a chapter: value, unit, the moment it is for, and the series' own period and source. */
export interface ChapterNumber {
  value: number;
  unit: string;
  /** The moment the value is for: a year, a month or a date, exactly as the series names it. */
  at: string;
  period: string;
  source: string;
  sourceUrl: string;
  /** Bundled-file date. Never a "live" claim: every chapter number is a snapshot or a sample. */
  snapshot: string | null;
  isSample: boolean;
}

/** The last real value of a series (gaps are skipped, never filled). */
export function lastValue(s: Pick<DataSeries, 'points'>): { t: string; v: number } | null {
  for (let i = s.points.length - 1; i >= 0; i--) { const p = s.points[i]; if (p.v !== null && Number.isFinite(p.v)) return { t: p.t, v: p.v }; }
  return null;
}

export function numberFromSeries(s: DataSeries): ChapterNumber | null {
  const last = lastValue(s);
  return last ? { value: last.v, unit: s.unit, at: last.t, period: s.period, source: s.source, sourceUrl: s.sourceUrl, snapshot: s.snapshotDate ?? null, isSample: s.isSample } : null;
}

/** The heaviest single-day rain in the global rain sample: the largest value over every day and point. Null when the file has no valid value. */
export function numberFromPrecip(j: SliceJson, info: { unit: string; source: string; sourceUrl: string }): ChapterNumber | null {
  let best: { v: number; day: string } | null = null;
  const days: string[] = [];
  for (const sl of j.slices) {
    days.push(sl.dateLabel);
    for (const o of sl.observations) if (Number.isFinite(o.value) && o.value >= 0 && (!best || o.value > best.v)) best = { v: o.value, day: sl.dateLabel };
  }
  if (!best) return null;
  days.sort();
  return { value: best.v, unit: info.unit, at: best.day, period: days.length > 1 ? `${days[0]} to ${days[days.length - 1]}` : days[0], source: info.source, sourceUrl: info.sourceUrl, snapshot: j.generated ?? null, isSample: true };
}

/** "+0.31" / "424.6": locale digits are applied by the caller (`fmtNum`); this only decides sign and rounding rules. */
export const chapterFormat = (def: Pick<ChapterDef, 'digits' | 'signed'>) => ({ minimumFractionDigits: def.digits, maximumFractionDigits: def.digits, ...(def.signed ? { signDisplay: 'exceptZero' as const } : {}) });

/** A series timestamp for people: "2025", "September 2026" or "3 Oct 2026", with the language's digits. Anything else is returned as it is. */
export function fmtAt(at: string, lang: Lang): string {
  const loc = lang === 'bn' ? 'bn-BD' : 'en-GB';
  if (/^\d{4}$/.test(at)) return fmtNum(Number(at), lang, { useGrouping: false });
  if (/^\d{4}-\d{2}$/.test(at)) return new Date(`${at}-01T00:00:00Z`).toLocaleDateString(loc, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  if (/^\d{4}-\d{2}-\d{2}/.test(at)) return new Date(`${at.slice(0, 10)}T00:00:00Z`).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return at;
}
/** "1959 to 2025" (the series' own period text) → "1959–2025". */
export const fmtPeriod = (period: string, lang: Lang) => period.split(' to ').map((x) => fmtAt(x, lang)).join('–');
