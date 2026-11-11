import { describe, it, expect } from 'vitest';
import { axisValueAt, columnColor, mixRgb, RELATED_STORY } from '../lib/frameStage';
import { EIC_FRAMES } from '../lib/eicFrames';
import { GLOBAL_STORIES as STORIES } from '../stories/stories';
import { signalFromRgb, contrastRatio, GROUND } from '../lib/signal';

describe('axisValueAt: the chart year under the needle', () => {
  const ghg = EIC_FRAMES.find((f) => f.id === 'eic-ghg')!.axis, oh = EIC_FRAMES.find((f) => f.id === 'eic-ocean-heat')!.axis;
  it('hits the printed tick labels', () => {
    expect(axisValueAt(ghg, 70 / 1920)).toBe(1980);
    expect(axisValueAt(ghg, 1240 / 1920)).toBe(2020);
    expect(axisValueAt(oh, 281 / 1024)).toBe(1960);
    expect(axisValueAt(oh, 775 / 1024)).toBe(2020);
  });
  it('the first and last bars are 1979 and 2021, and outside the chart there is no year', () => {
    expect(axisValueAt(ghg, 41 / 1920)).toBe(1979);
    expect(axisValueAt(ghg, 1269 / 1920)).toBe(2021);
    expect(axisValueAt(ghg, 0.9)).toBeNull(); // the ring chart
    expect(axisValueAt(ghg, 0)).toBeNull();
    expect(axisValueAt(oh, 0.05)).toBeNull();
  });
  it('a frame with no time axis gives null', () => { expect(axisValueAt(undefined, 0.5)).toBeNull(); });
  it('is monotonic across the chart', () => { let p = 0; for (let f = 0.03; f < 0.66; f += 0.01) { const v = axisValueAt(ghg, f); if (v !== null) { expect(v).toBeGreaterThanOrEqual(p); p = v; } } });
});

describe('columnColor: the colour of what is heard', () => {
  const cols = 4, rows = 2;
  const px = (cells: [number, number, number][]) => Uint8ClampedArray.from(cells.flatMap(([r, g, b]) => [r, g, b, 255]));
  it('weights by loudness: a bright red pixel wins over a dim blue one', () => {
    // grid index = row * cols + col; column 1 has red (bright) over blue (dim)
    const cells: [number, number, number][] = Array.from({ length: 8 }, () => [0, 0, 0] as [number, number, number]);
    cells[1] = [255, 0, 0]; cells[5] = [0, 0, 255];
    const lum = new Float32Array(8); lum[1] = 0.9; lum[5] = 0.1;
    const c = columnColor(px(cells), lum, 1, cols, rows)!;
    expect(c[0]).toBeGreaterThan(c[2] * 4);
  });
  it('a silent column gives null so the colour is held', () => {
    expect(columnColor(px(Array.from({ length: 8 }, () => [0, 0, 0] as [number, number, number])), new Float32Array(8), 2, cols, rows)).toBeNull();
  });
  it('any sampled colour becomes a legible signal', () => {
    for (const c of [[255, 0, 0], [10, 40, 120], [255, 255, 255], [30, 30, 30]] as [number, number, number][]) expect(contrastRatio(signalFromRgb(c).hex, GROUND)).toBeGreaterThanOrEqual(4.5);
  });
  it('mixRgb glides toward the target', () => { expect(mixRgb([0, 0, 0], [100, 200, 50], 0.5)).toEqual([50, 100, 25]); expect(mixRgb(null, [1, 2, 3], 0.5)).toEqual([1, 2, 3]); });
});

describe('frames with a real series behind them', () => {
  it('every related story exists, and every EIC frame with a time axis has one', () => {
    for (const [fid, r] of Object.entries(RELATED_STORY)) { expect(EIC_FRAMES.some((f) => f.id === fid)).toBe(true); expect(STORIES.some((s) => s.id === r.story), r.story).toBe(true); }
    for (const f of EIC_FRAMES.filter((f) => f.axis)) expect(RELATED_STORY[f.id], f.id).toBeTruthy();
  });
  it('the ocean-heat frame is honestly labelled as related data, not the same dataset', () => { expect(RELATED_STORY['eic-ocean-heat'].related).toBe(true); expect(RELATED_STORY['eic-ocean-heat'].en).toMatch(/related/i); });
});
