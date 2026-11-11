import { describe, it, expect } from 'vitest';
import { signalFromRgb, rgbToOklch, oklchToRgb, contrastRatio, toHex, fromHex, SIGNAL_L_MIN, SIGNAL_L_MAX, GROUND, DEFAULT_SIGNAL, applySignal, type RGB } from '../lib/signal';

// A grid over the whole sRGB cube (every 51 = 6 steps per channel = 216 colours) plus greys and the extremes.
const grid: RGB[] = [];
for (const r of [0, 51, 102, 153, 204, 255]) for (const g of [0, 51, 102, 153, 204, 255]) for (const b of [0, 51, 102, 153, 204, 255]) grid.push([r, g, b]);

describe('signal colour (sampled from a frame, clamped for legibility)', () => {
  it('oklch round trip is stable', () => {
    for (const c of [[200, 40, 40], [20, 120, 200], [250, 250, 20]] as RGB[]) {
      const { L, C, h } = rgbToOklch(c);
      const back = oklchToRgb(L, C, h);
      back.forEach((v, i) => expect(Math.abs(v - c[i])).toBeLessThanOrEqual(2));
    }
  });
  it('every colour of the sRGB grid gives a signal that is >= 4.5:1 as text on the ground', () => {
    for (const c of grid) expect(contrastRatio(signalFromRgb(c).hex, GROUND), `rgb(${c})`).toBeGreaterThanOrEqual(4.5);
  });
  it('every colour of the grid gives an --on-signal that is >= 4.5:1 on the signal field', () => {
    for (const c of grid) { const s = signalFromRgb(c); expect(contrastRatio(s.onSignal, s.hex), `rgb(${c})`).toBeGreaterThanOrEqual(4.5); }
  });
  it('clamps lightness into the window and keeps the picture\'s hue', () => {
    for (const c of grid) { const s = signalFromRgb(c); expect(s.L).toBeGreaterThanOrEqual(SIGNAL_L_MIN - 0.02); expect(s.L).toBeLessThanOrEqual(SIGNAL_L_MAX + 0.02); }
    const blue = signalFromRgb([10, 40, 120]), src = rgbToOklch([10, 40, 120]);
    expect(Math.abs(blue.h - src.h)).toBeLessThan(6);
    expect(blue.L).toBeGreaterThan(src.L); // a dark ocean blue is lifted to a legible signal
  });
  it('a grey or black pixel gives the default-looking signal, never a grey interface', () => {
    for (const c of [[0, 0, 0], [128, 128, 128], [255, 255, 255]] as RGB[]) { const s = signalFromRgb(c); expect(s.C).toBeGreaterThan(0.1); }
    expect(contrastRatio(DEFAULT_SIGNAL, GROUND)).toBeGreaterThanOrEqual(4.5);
  });
  it('is deterministic and hex helpers invert each other', () => {
    expect(signalFromRgb([200, 30, 30])).toEqual(signalFromRgb([200, 30, 30]));
    expect(toHex(fromHex('#baed3f'))).toBe('#baed3f');
  });
  it('applySignal does nothing without a document (SSR, the node test environment)', () => { expect(() => applySignal([1, 2, 3])).not.toThrow(); });
});
