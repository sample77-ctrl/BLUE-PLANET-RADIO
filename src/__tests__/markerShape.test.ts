import { describe, it, expect } from 'vitest';
import { MARKER_SHAPE, markerPath } from '../atlas/markerShape';

describe('marker shapes', () => {
  it('every layer has its own shape, so colour is never the only cue', () => {
    expect(new Set(Object.values(MARKER_SHAPE)).size).toBe(3);
    expect(MARKER_SHAPE).toEqual({ fire: 'circle', precipitation: 'drop', sst: 'diamond' });
  });
  it('the three shapes draw different, closed paths around the same point', () => {
    const paths = (['circle', 'drop', 'diamond'] as const).map((s) => markerPath(s, 50, 50, 5));
    expect(new Set(paths).size).toBe(3);
    for (const p of paths) { expect(p.startsWith('M')).toBe(true); expect(p.endsWith('Z')).toBe(true); expect(p).not.toMatch(/NaN/); }
  });
});
