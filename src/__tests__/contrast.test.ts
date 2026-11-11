import { describe, it, expect } from 'vitest';
import { rgbToOklch, fromHex } from '../lib/signal';
// Loaded dynamically so the app's own type-check does not need Node types.
const fs = await import(/* @vite-ignore */ 'node:fs' as string);
const css: string = fs.readFileSync('src/index.css', 'utf8');
// Reads the first definition (the :root block); role tokens like --accent: var(--rain) are followed.
const token = (name: string): string => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6}|var\\(--([\\w-]+)\\))`));
  if (!m) throw new Error(`missing token --${name}`);
  return m[2] ? token(m[2]) : m[1];
};
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe('colour contrast (WCAG AA, 4.5:1 for text)', () => {
  const backgrounds = ['abyss', 'panel', 'panel-2'];
  for (const fg of ['ink', 'ink-2', 'ink-3', 'brass']) {
    for (const bg of backgrounds) {
      it(`--${fg} on --${bg}`, () => expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5));
    }
  }
  // v5: the signal colour fills large areas (primary button, Jukebox hero, note scale) with dark text on it, and is also used as text on the ground
  it('--on-signal-default on the default signal field', () => expect(ratio(token('on-signal-default'), token('signal-default'))).toBeGreaterThanOrEqual(4.5));
  for (const bg of ['abyss', 'panel', 'panel-2']) it(`default signal as text on --${bg}`, () => expect(ratio(token('signal-default'), token(bg))).toBeGreaterThanOrEqual(4.5));
  for (const th of ['fire', 'rain', 'warm', 'cold', 'teal', 'brass']) it(`--on-signal-default on a --${th} field (the signal while that dataset plays)`, () => expect(ratio(token('on-signal-default'), token(th))).toBeGreaterThanOrEqual(4.5));
  // v3 role tokens, used for links, icons and the nav marker
  for (const fg of ['accent', 'accent-warm', 'teal']) {
    for (const bg of ['abyss', 'surface', 'panel-2']) {
      it(`--${fg} on --${bg}`, () => expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5));
    }
  }
  // Data colours are also used as text (legend, units, the sound-error line), so they get the text threshold.
  for (const fg of ['fire', 'rain', 'warm', 'cold', 'teal', 'brass']) {
    for (const bg of backgrounds) {
      it(`data colour --${fg} on --${bg}`, () => expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5));
    }
  }
});

describe('data colours (v5): six colours at equal lightness', () => {
  it('are within 0.03 of oklch L .77, so none shouts louder than another', () => {
    for (const n of ['fire', 'rain', 'warm', 'cold', 'teal', 'brass']) expect(Math.abs(rgbToOklch(fromHex(token(n))).L - 0.77), n).toBeLessThan(0.03);
  });
  it('the ground is #0a0a0a and the neutrals are neutral (chroma < .01)', () => {
    expect(token('ground')).toBe('#0a0a0a');
    for (const n of ['panel', 'panel-2', 'hair', 'ink', 'ink-2', 'ink-3']) expect(rgbToOklch(fromHex(token(n))).C, n).toBeLessThan(0.012);
  });
});

describe('high contrast mode (WCAG AAA, 7:1)', () => {
  const hc = Object.fromEntries([...(css.match(/html\.hc \{([^}]*)\}/)?.[1] ?? '').matchAll(/--([\w-]+):\s*#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)].map((m) => [m[1], `#${m[2].length === 3 ? [...m[2]].map((c) => c + c).join('') : m[2]}`]));
  const hcToken = (n: string) => hc[n] ?? token(n);
  it('overrides the text and surface tokens', () => { for (const k of ['panel', 'panel-2', 'ink', 'ink-2', 'ink-3', 'brass', 'line', 'ground', 'signal-default']) expect(hc[k]).toBeTruthy(); });
  // the signal colour is text and lines only in high contrast (never a field), so it needs 7:1 on the black ground
  for (const fg of ['ink', 'ink-2', 'ink-3', 'brass', 'line', 'signal-default']) {
    for (const bg of ['panel', 'panel-2']) {
      it(`--${fg} on --${bg}`, () => expect(ratio(hcToken(fg), hcToken(bg))).toBeGreaterThanOrEqual(7));
    }
  }
});

describe('design tokens', () => {
  it('has a single token set (no legacy names left)', () => {
    for (const legacy of ['--bg-space-', '--accent-cyan', '--text-primary', 'Outfit', 'JetBrains Mono']) expect(css).not.toContain(legacy);
  });
  it('zeroes every duration token under reduced motion', () => {
    const durs = [...css.matchAll(/(--dur-[\w-]+):\s*\d/g)].map((m) => m[1]);
    expect(new Set(durs).size).toBeGreaterThanOrEqual(3);
    const rm = css.match(/@media \(prefers-reduced-motion: reduce\) \{ :root \{([^}]*)\}/)?.[1] ?? '';
    for (const d of new Set(durs)) expect(rm).toContain(`${d}: 0ms`);
  });
});

describe('glass surfaces (composited over the backdrop)', () => {
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (top: string, a: number, under: string) => `#${hex(top).map((v, i) => Math.round(v * a + hex(under)[i] * (1 - a)).toString(16).padStart(2, '0')).join('')}`;
  const alpha = (name: string) => Number(css.match(new RegExp(`--${name}:\\s*color-mix\\(in srgb, var\\(--panel\\) (\\d+)%`))?.[1]) / 100;
  // Under the glass: deep space, and a lit ocean pixel of the globe as a bright case.
  for (const under of ['#0a0a0a', '#5a7a9a']) {
    for (const g of ['glass-bg', 'glass-bg-strong']) {
      for (const fg of ['ink', 'ink-2']) {
        it(`--${fg} on --${g} over ${under}`, () => expect(ratio(token(fg), mix(token('panel'), alpha(g), under))).toBeGreaterThanOrEqual(4.5));
      }
    }
  }
  it('--ink-3 on the strong glass over the ground', () => expect(ratio(token('ink-3'), mix(token('panel'), alpha('glass-bg-strong'), '#0a0a0a'))).toBeGreaterThanOrEqual(4.5));
  // v5: the bar and floating controls can sit over a white pixel of an EIC frame
  for (const fg of ['ink']) it(`--${fg} on the strong glass over a white frame pixel`, () => expect(ratio(token(fg), mix(token('panel'), alpha('glass-bg-strong'), '#ffffff'))).toBeGreaterThanOrEqual(4.5));
});
