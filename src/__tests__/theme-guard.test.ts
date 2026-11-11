// Regression guard: Sonic Quest and the Harmonium follow the site theme (tokens in src/index.css, "Instrument").
// DOM chrome uses tokens and shared classes only: no raw Tailwind palette colours, no decorative gradients, no large radii, nothing under 12px.
import { describe, it, expect } from 'vitest';
const fs = await import(/* @vite-ignore */ 'node:fs' as string);
const path = await import(/* @vite-ignore */ 'node:path' as string);

const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const files: string[] = [...walk('src/game'), ...walk('src/harmonium')].filter((f) => f.endsWith('.tsx'));

// Canvas / illustration files may keep illustrative pixels (they draw with ctx.* and hex in code, not utility classes). Add a name here only with a reason.
const ALLOW = new Set<string>([]);

const RULES: [string, RegExp][] = [
  ['raw Tailwind palette colour', /\b(?:bg|text|border|from|to|via|ring|fill|stroke|shadow|outline|divide|placeholder|accent|decoration|caret)-(?:amber|orange|red|yellow|green|emerald|lime|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|stone|zinc|slate|gray|neutral)-\d/],
  ['large radius (rounded-xl/2xl/3xl)', /\brounded(?:-[a-z]{1,2})?-(?:xl|2xl|3xl)\b/],
  ['decorative gradient', /\bbg-gradient-to-|\b(?:from|via|to)-\[(?:#|var\()/],
  ['text under 12px', /\btext-(?:3xs|4xs)\b|\btext-\[(?:[0-9]|1[01])px\]/],
  ['black/white utility instead of a token', /\b(?:text|bg)-(?:black|white)\b/],
];

describe('Quest and Harmonium theme guard', () => {
  it('scans the files', () => expect(files.length).toBeGreaterThan(20));
  for (const [name, re] of RULES) {
    it(`no ${name} in src/game/** or src/harmonium/**`, () => {
      const hits = files.filter((f) => !ALLOW.has(path.basename(f))).flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').map((l: string, i: number) => (re.test(l) ? `${f}:${i + 1}: ${l.trim().slice(0, 100)}` : '')).filter(Boolean));
      expect(hits).toEqual([]);
    });
  }
  it('the allow-list stays short', () => expect(ALLOW.size).toBeLessThanOrEqual(5));
});
