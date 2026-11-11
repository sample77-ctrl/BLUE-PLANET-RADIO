// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { SeriesChart } from '../jukebox/SeriesChart';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const pts = Array.from({ length: 12 }, (_, i) => ({ t: String(2000 + i), v: i }));
const draw = () => render(<PrefsProvider><SeriesChart points={pts} cursor={null} unit="°C" label="x" /></PrefsProvider>).container.querySelector('svg')!;

describe('chart text renders at its font size', () => {
  it('uses the measured width as the viewBox width, so one unit is one pixel', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ width: 325, height: 0, x: 0, y: 0, top: 0, left: 0, right: 325, bottom: 0, toJSON() {} } as DOMRect);
    const svg = draw();
    expect(svg.getAttribute('viewBox')!.split(' ')[2]).toBe('325');
    for (const t of svg.querySelectorAll('text')) expect(Number(t.getAttribute('font-size'))).toBeGreaterThanOrEqual(12);
  });
  it('falls back to 900 where there is no layout', () => {
    expect(draw().getAttribute('viewBox')!.split(' ')[2]).toBe('900');
  });
});
