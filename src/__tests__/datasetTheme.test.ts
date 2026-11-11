import { describe, it, expect } from 'vitest';
import { DATASET_THEMES, THEME_OF_TOPIC } from '../lib/datasetTheme';
// Loaded dynamically so the app's own type-check does not need Node types.
const fs = await import(/* @vite-ignore */ 'node:fs' as string);
const css: string = fs.readFileSync('src/index.css', 'utf8');
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

describe('dataset themes', () => {
  it('every theme is defined in the CSS as an accent override', () => {
    for (const th of DATASET_THEMES) expect(css).toContain(`html[data-dataset='${th}'] { --accent: var(--${th}); }`);
  });
  it('the focus ring follows the accent, but never in high contrast, and every accent clears the 3:1 a focus ring needs on the surfaces', () => {
    expect(css).toContain('outline: 2px solid var(--focus-ring, var(--brass))');
    expect(css).toContain("html[data-dataset]:not(.hc) { --focus-ring: var(--accent); }");
    for (const th of DATASET_THEMES) for (const bg of ['abyss', 'panel', 'panel-2']) expect(ratio(token(th), token(bg)), `${th} on ${bg}`).toBeGreaterThanOrEqual(3);
  });
  it('every topic maps to a defined theme', () => {
    for (const th of Object.values(THEME_OF_TOPIC)) expect(DATASET_THEMES).toContain(th);
  });
  // The accent is used for links, icons, the scrubber line and focus-adjacent marks, so it must read as text (4.5:1) on every surface.
  for (const th of DATASET_THEMES) for (const bg of ['abyss', 'panel', 'panel-2']) {
    it(`--${th} on --${bg} is at least 4.5:1`, () => expect(ratio(token(th), token(bg))).toBeGreaterThanOrEqual(4.5));
  }
});
