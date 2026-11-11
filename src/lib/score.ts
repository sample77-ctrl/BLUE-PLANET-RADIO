import type { MappedPoint } from '../sonification/series/mapping';
import { GAIN_MAX } from '../sonification/series/mapping';
import { bandHz, noteName } from './frameSweep';

/** Pure score model (roadmap v5, V4): what the ear gets, drawn. Nothing here is invented: every note comes from the same grids and mappings that drive the sound. */

/** One note of a frame's score: the band `row` at needle column `col`, as loud as the pixel is (the sound uses brightness^1.5), in the colour of that pixel. */
export interface ScoreNote { col: number; row: number; level: number; rgb: [number, number, number] }

/** Notes quieter than this are not drawn (the sound is below 0.03 x 0.06 gain: inaudible next to its neighbours). */
export const SCORE_FLOOR = 0.03;

/** Every sounding cell of the picture, in column order. `lum` is brightness 0..1 and `rgb` RGBA bytes of a cols x rows grid (the one `toGrid` makes for the sound). */
export function frameScore(lum: ArrayLike<number>, rgb: ArrayLike<number>, cols: number, rows: number): ScoreNote[] {
  const out: ScoreNote[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const i = r * cols + c, level = Math.pow(lum[i], 1.5);
      if (level >= SCORE_FLOOR) out.push({ col: c, row: r, level: Math.round(level * 1000) / 1000, rgb: [rgb[i * 4], rgb[i * 4 + 1], rgb[i * 4 + 2]] });
    }
  }
  return out;
}

/** The loudest band in one column, or null when the column is silent. */
export function dominantBand(lum: ArrayLike<number>, col: number, cols: number, rows: number): { row: number; level: number; note: string; hz: number } | null {
  let best = -1, bestV = 0;
  for (let r = 0; r < rows; r++) { const v = lum[r * cols + col]; if (v > bestV) { bestV = v; best = r; } }
  if (best < 0 || Math.pow(bestV, 1.5) < SCORE_FLOOR) return null;
  const hz = bandHz(best, rows);
  return { row: best, level: Math.round(bestV * 100), note: noteName(hz), hz: Math.round(hz) };
}

export interface ScoreSummary { notes: number; columns: number; low: string | null; high: string | null; loudestCol: number | null }
/** Numbers for the picture's text alternative: how many notes, over how many columns, from which note to which, and where it is loudest. */
export function summarizeScore(notes: ScoreNote[], rows: number): ScoreSummary {
  if (!notes.length) return { notes: 0, columns: 0, low: null, high: null, loudestCol: null };
  let lo = rows, hi = -1, best = notes[0];
  const cols = new Set<number>();
  for (const n of notes) { cols.add(n.col); lo = Math.min(lo, n.row); hi = Math.max(hi, n.row); if (n.level > best.level) best = n; }
  return { notes: notes.length, columns: cols.size, low: noteName(bandHz(hi, rows)), high: noteName(bandHz(lo, rows)), loudestCol: best.col };
}

/** One note of a series' piano roll: the scale degree (0 = lowest) and how loud, in the colour slot of its timbre. Silence (a gap in the data) has no note. */
export interface RollNote { i: number; degree: number; level: number; pulses: number; timbre: 'warm' | 'soft' | 'plain'; clipped: 'low' | 'high' | null; note: string; freq: number }
export function rollNotes(mapped: MappedPoint[]): RollNote[] {
  const out: RollNote[] = [];
  mapped.forEach((m, i) => { if (m.kind === 'note') out.push({ i, degree: m.degree, level: Math.round((m.gain / GAIN_MAX) * 1000) / 1000, pulses: m.pulses, timbre: m.timbre, clipped: m.clipped, note: m.note, freq: m.freq }); });
  return out;
}
export const ROLL_DEGREES = 11;
