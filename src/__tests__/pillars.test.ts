import { describe, expect, it } from 'vitest';
import { PILLAR_MIN, PILLAR_SPAN, pillarLength, pillarOpacity, pillarWidth, pulseAt } from '../globe/pillars';

describe('light pillars', () => {
  it('a stronger value gives a taller, slightly thicker beam, inside fixed bounds', () => {
    expect(pillarLength(0)).toBe(PILLAR_MIN);
    expect(pillarLength(1)).toBeCloseTo(PILLAR_MIN + PILLAR_SPAN, 10);
    expect(pillarLength(0.5)).toBeGreaterThan(pillarLength(0.2));
    expect(pillarWidth(1)).toBeGreaterThan(pillarWidth(0));
    expect(pillarWidth(1)).toBeLessThan(0.02); // never a bar that hides the marker
  });
  it('clamps values outside 0..1 and survives NaN', () => {
    expect(pillarLength(-3)).toBe(pillarLength(0));
    expect(pillarLength(9)).toBe(pillarLength(1));
    expect(pillarLength(NaN)).toBe(pillarLength(0));
  });
  it('resting, selected and sounding brightness are ordered', () => {
    expect(pillarOpacity(false, false)).toBeLessThan(pillarOpacity(false, true));
    expect(pillarOpacity(false, true)).toBeLessThan(pillarOpacity(true, false));
  });
});

describe('pulseAt: the ripple and the lift follow the voice', () => {
  it('starts with the ring at full strength and the beam lifted, then settles', () => {
    const p0 = pulseAt(0, 0.5);
    expect(p0.ripple).toBe(1); expect(p0.ring).toBeCloseTo(0.95, 5); expect(p0.lift).toBeCloseTo(1.45, 5);
    const late = pulseAt(0.5, 0.5); // 0.5 s at rate 2.8 → 1.4 into the 1.6 span
    expect(late.ring).toBeLessThan(0.2); expect(late.lift).toBeLessThan(1.1);
  });
  it('stays inside its ranges at any time', () => {
    for (let t = 0; t < 30; t += 0.037) for (const i of [0, 0.5, 1]) { const p = pulseAt(t, i); expect(p.ripple).toBeGreaterThanOrEqual(1); expect(p.ripple).toBeLessThan(2.6); expect(p.ring).toBeGreaterThanOrEqual(0); expect(p.ring).toBeLessThanOrEqual(0.95); expect(p.lift).toBeGreaterThanOrEqual(1); expect(p.lift).toBeLessThanOrEqual(1.45); }
  });
  it('a louder voice beats faster (the same time is further into the beat)', () => {
    const t = 0.2; // soft: 1.8/s → span .36; loud: 3.8/s → span .76
    expect(pulseAt(t, 1).ripple).toBeGreaterThan(pulseAt(t, 0).ripple);
  });
  it('with reduced motion or a calm background nothing moves: the same values at every time', () => {
    expect(pulseAt(0, 0.9, true)).toEqual(pulseAt(7.3, 0.1, true));
    expect(pulseAt(1, 0.5, true).lift).toBe(1);
  });
  it('a negative time (clock skew) does not break the maths', () => { expect(pulseAt(-5, 0.5).ripple).toBe(1); });
});
