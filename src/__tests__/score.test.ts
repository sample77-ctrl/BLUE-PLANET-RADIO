import { describe, expect, it } from 'vitest';
import { bandHz, noteName } from '../lib/frameSweep';
import { dominantBand, frameScore, rollNotes, ROLL_DEGREES, SCORE_FLOOR, summarizeScore } from '../lib/score';
import { CARD_H, CARD_PAD, CARD_W, cardFileName, drawShareCard, fitBox, scoreCell, wrapLines, type CardInput } from '../lib/shareCard';
import { mapSeries } from '../sonification/series/mapping';
import { specFor } from '../sonification/series/specs';

const COLS = 8, ROWS = 4;
/** A grid with one bright cell per listed [col,row] (brightness 1) and the given colour. */
const grid = (cells: [number, number, number?][]) => {
  const lum = new Float32Array(COLS * ROWS), rgb = new Uint8ClampedArray(COLS * ROWS * 4);
  for (const [c, r, v = 1] of cells) { const i = r * COLS + c; lum[i] = v; rgb.set([200, 100, 50, 255], i * 4); }
  return { lum, rgb };
};

describe('band pitch', () => {
  it('the top row is the highest pitch, 12 bands from C3 up a pentatonic scale', () => {
    expect(Math.round(bandHz(11, 12))).toBe(131); // C3 at the bottom
    for (let r = 1; r < 12; r++) expect(bandHz(r - 1, 12)).toBeGreaterThan(bandHz(r, 12));
    expect(noteName(bandHz(11, 12))).toBe('C3');
    expect(noteName(bandHz(0, 12))).toBe('D5'); // 11 pentatonic steps up: two octaves plus 2 semitones above C3
  });
});

describe('frameScore: one note per sounding cell, exactly what the sound plays', () => {
  it('lists bright cells in column order with brightness^1.5 loudness and the pixel colour', () => {
    const g = grid([[2, 1], [0, 3, 0.5], [5, 0, 0.1]]);
    const n = frameScore(g.lum, g.rgb, COLS, ROWS);
    expect(n.map((x) => [x.col, x.row])).toEqual([[0, 3], [2, 1], [5, 0]]);
    expect(n[0].level).toBeCloseTo(0.5 ** 1.5, 3);
    expect(n[1].level).toBe(1);
    expect(n[0].rgb).toEqual([200, 100, 50]);
  });
  it('leaves out what is too quiet to hear, and a black picture gives an empty score', () => {
    const g = grid([[1, 1, 0.05], [2, 2, 0.2]]); // 0.05^1.5 = 0.011 < floor; 0.2^1.5 = 0.089
    expect(0.05 ** 1.5).toBeLessThan(SCORE_FLOOR);
    expect(frameScore(g.lum, g.rgb, COLS, ROWS).map((x) => x.col)).toEqual([2]);
    expect(frameScore(new Float32Array(COLS * ROWS), new Uint8ClampedArray(COLS * ROWS * 4), COLS, ROWS)).toEqual([]);
  });
  it('never invents a note: every note sits on a lit cell inside the grid', () => {
    const g = grid(Array.from({ length: 20 }, (_, k) => [k % COLS, k % ROWS] as [number, number]));
    for (const n of frameScore(g.lum, g.rgb, COLS, ROWS)) { expect(g.lum[n.row * COLS + n.col]).toBeGreaterThan(0); expect(n.col).toBeLessThan(COLS); expect(n.row).toBeLessThan(ROWS); }
  });
});

describe('dominantBand and summarizeScore', () => {
  it('finds the loudest band of a column, with its note and Hz, and null for silence', () => {
    const g = grid([[3, 0, 0.4], [3, 2, 0.9]]);
    const d = dominantBand(g.lum, 3, COLS, ROWS)!;
    expect(d.row).toBe(2); expect(d.level).toBe(90); expect(d.hz).toBe(Math.round(bandHz(2, ROWS))); expect(d.note).toBe(noteName(bandHz(2, ROWS)));
    expect(dominantBand(g.lum, 4, COLS, ROWS)).toBeNull();
  });
  it('summarises count, columns, pitch range and the loudest column for the text alternative', () => {
    const g = grid([[1, 0, 0.5], [1, 3, 0.6], [6, 2, 1]]);
    const s = summarizeScore(frameScore(g.lum, g.rgb, COLS, ROWS), ROWS);
    expect(s).toEqual({ notes: 3, columns: 2, low: noteName(bandHz(3, ROWS)), high: noteName(bandHz(0, ROWS)), loudestCol: 6 });
    expect(summarizeScore([], ROWS)).toEqual({ notes: 0, columns: 0, low: null, high: null, loudestCol: null });
  });
});

describe('rollNotes: the series piano roll is the series mapping, not a new one', () => {
  const pts = [10, 20, null, 40, 80].map((v, i) => ({ t: String(2000 + i), v }));
  const spec = specFor('co2', [10, 20, 40, 80]);
  const mapped = mapSeries(pts, spec);
  const notes = rollNotes(mapped);
  it('has one bar per real value, none for the gap, at the mapped degree, note and frequency', () => {
    expect(notes.map((n) => n.i)).toEqual([0, 1, 3, 4]);
    for (const n of notes) { const m = mapped[n.i]; if (m.kind !== 'note') throw new Error('gap'); expect(n.degree).toBe(m.degree); expect(n.note).toBe(m.note); expect(n.freq).toBe(m.freq); expect(n.timbre).toBe(m.timbre); expect(n.degree).toBeLessThan(ROLL_DEGREES); }
  });
  it('loudness is the mapped gain over its maximum, between 0 and 1', () => { for (const n of notes) { expect(n.level).toBeGreaterThan(0); expect(n.level).toBeLessThanOrEqual(1); } });
  it('a rising series never goes down the roll', () => { const d = notes.map((n) => n.degree); expect([...d].sort((a, b) => a - b)).toEqual(d); });
});

describe('share card layout', () => {
  it('fits a picture in a box without distortion', () => {
    expect(fitBox(1920, 800, 952, 470)).toEqual({ w: 952, h: 397 });
    expect(fitBox(1024, 1024, 952, 470)).toEqual({ w: 470, h: 470 });
    expect(fitBox(0, 0, 952, 400)).toEqual({ w: 952, h: 400 });
  });
  const measure = (s: string) => s.length * 10;
  it('wraps words, keeps whole words, and ends in an ellipsis when it must cut', () => {
    expect(wrapLines(measure, 'aaa bbb ccc ddd', 70, 5)).toEqual(['aaa bbb', 'ccc ddd']);
    expect(wrapLines(measure, 'aaa bbb ccc ddd', 70, 1)).toEqual(['aaa bb…']); // cut until it fits (7 x 10 = 70)
    expect(wrapLines(measure, 'extraordinarilylongword x', 50, 3)).toEqual(['extraordinarilylongword', 'x']);
    for (const l of wrapLines(measure, 'one two three four five six seven eight nine ten', 100, 2)) expect(measure(l)).toBeLessThanOrEqual(100);
    expect(wrapLines(measure, '   ', 100, 2)).toEqual([]);
  });
  it('places a note in its column and band, top row at the top', () => {
    expect(scoreCell({ col: 0, row: 0 }, 128, 12, 1280, 120)).toEqual({ x: 0, y: 0, w: 10, h: 10 });
    expect(scoreCell({ col: 127, row: 11 }, 128, 12, 1280, 120)).toEqual({ x: 1270, y: 110, w: 10, h: 10 });
  });
  it('names the file safely', () => { expect(cardFileName('eic-ocean-heat')).toBe('sonic-earth-eic-ocean-heat.png'); expect(cardFileName('a/b c')).toBe('sonic-earth-a-b-c.png'); });
});

describe('drawShareCard', () => {
  const calls: string[] = [];
  const fake = () => {
    calls.length = 0;
    const state: Record<string, unknown> = {};
    return new Proxy(state, {
      get: (t, k: string) => (k === 'measureText' ? (s: string) => ({ width: s.length * 12 }) : k in t ? t[k] : (...a: unknown[]) => { calls.push(`${k}:${a.join(',')}`); }),
      set: (t, k: string, v) => { t[k] = v; return true; },
    }) as unknown as CanvasRenderingContext2D;
  };
  const input = (over: Partial<CardInput> = {}): CardInput => {
    const g = grid([[1, 1], [2, 2, 0.5]]);
    return { frame: {} as CanvasImageSource, frameW: 1920, frameH: 800, kicker: 'Sonic Earth Atlas', title: 'Greenhouse gas warming index, 1979 to 2021', notes: frameScore(g.lum, g.rgb, COLS, ROWS), cols: COLS, rows: ROWS, col: 3,
      bigLabel: 'Year', bigValue: '1998', pitch: 'C4 · 262 Hz', source: 'Source: NASA Earth Information Center (earth.gov), Greenhouse Gases theme; data: NOAA Annual Greenhouse Gas Index', method: 'Sound made from this picture’s pixels.', url: 'https://example.org/#v1&track=frames&frame=eic-ghg&col=40',
      signal: '#baed3f', onSignal: '#0a0a0a', fonts: { display: 'sans-serif', body: 'sans-serif', mono: 'monospace' }, ...over };
  };
  it('is 1080 x 1350 and keeps the frame, the score and the footer inside the card', () => {
    expect([CARD_W, CARD_H]).toEqual([1080, 1350]);
    const r = drawShareCard(fake(), input());
    for (const b of [r.frame, r.score]) { expect(b.x).toBeGreaterThanOrEqual(CARD_PAD); expect(b.x + b.w).toBeLessThanOrEqual(CARD_W - CARD_PAD); }
    expect(r.score.x).toBe(r.frame.x); expect(r.score.w).toBe(r.frame.w); // the score sits on the same columns as the picture
    expect(r.score.y).toBeGreaterThan(r.frame.y + r.frame.h - 1);
    expect(r.bottom).toBeLessThanOrEqual(CARD_H);
  });
  it('still fits with the longest text, a square picture and a long Bengali title', () => {
    const r = drawShareCard(fake(), input({ frameW: 1024, frameH: 1024, title: 'ফসলের ফলনে এল নিনোর পূর্বাভাসিত প্রভাব '.repeat(4), source: 'x '.repeat(300), method: 'y '.repeat(300), url: 'https://example.org/' + 'a'.repeat(400) }));
    expect(r.bottom).toBeLessThanOrEqual(CARD_H);
  });
  it('draws the picture, the needle and every note', () => {
    drawShareCard(fake(), input());
    expect(calls.filter((c) => c.startsWith('drawImage'))).toHaveLength(1);
    expect(calls.filter((c) => c.startsWith('fillText')).map((c) => c.split(':')[1].split(',')[0].trim()).join('|')).toContain('1998');
  });
});
