import type { NasaFrame } from './gibs';
import type { RGB } from './signal';

/** Pure helpers for the Frame Stage (roadmap v5, V2). */

/** The chart year under the needle, from the time axis printed on an EIC frame (`frame.axis`, measured from the picture). Null outside the chart or on a frame with no time axis. */
export function axisValueAt(axis: NasaFrame['axis'], frac: number): number | null {
  if (!axis) return null;
  const v = axis.v0 + ((frac - axis.x0) / (axis.x1 - axis.x0)) * (axis.v1 - axis.v0);
  const r = Math.round(v);
  return r < axis.lo || r > axis.hi ? null : r;
}

/** The colour of what is heard in one column: its pixels weighted by loudness (the brightness^1.5 that drives the sound) and by how vivid they are, so a column of
 *  grey map with a few orange fields reads as orange, not as the grey that a plain average would give. Null when the column is (nearly) silent, so the interface
 *  holds the last colour instead of flashing. `rgb` is RGBA bytes of a cols x rows grid. */
export function columnColor(rgb: ArrayLike<number>, lum: ArrayLike<number>, col: number, cols: number, rows: number): RGB | null {
  let loud = 0, w = 0, r = 0, g = 0, b = 0;
  for (let row = 0; row < rows; row++) {
    const i = row * cols + col, l = Math.pow(lum[i], 1.5);
    const R = rgb[i * 4], G = rgb[i * 4 + 1], B = rgb[i * 4 + 2];
    const sat = (Math.max(R, G, B) - Math.min(R, G, B)) / 255, wi = l * (0.05 + sat) ** 2;
    loud += l; w += wi; r += wi * R; g += wi * G; b += wi * B;
  }
  if (loud < 0.05 || w <= 0) return null;
  return [Math.round(r / w), Math.round(g / w), Math.round(b / w)];
}

/** Exponential smoothing between two colours (k = weight of the new one), so the interface glides rather than flickers. */
export const mixRgb = (from: RGB | null, to: RGB, k: number): RGB => (from ? [0, 1, 2].map((i) => Math.round(from[i] + (to[i] - from[i]) * k)) as RGB : to);

/** Frames that have a real series behind them in the Data Jukebox. `related: true` = a different dataset on the same theme, and the UI says so. */
export const RELATED_STORY: Record<string, { story: string; related: boolean; en: string; bn: string }> = {
  'eic-ghg': { story: 'co2', related: false, en: 'Hear the CO₂ record behind it (NOAA, 1959 to 2025)', bn: 'এর পেছনের CO₂ রেকর্ড শুনুন (NOAA, ১৯৫৯–২০২৫)' },
  'eic-ocean-heat': { story: 'sst-month', related: true, en: 'Hear related data: ocean surface heat anomaly (NASA MUR SST, last month)', bn: 'সম্পর্কিত ডেটা শুনুন: সমুদ্রপৃষ্ঠের তাপের বিচ্যুতি (NASA MUR SST, গত মাস)' },
};
