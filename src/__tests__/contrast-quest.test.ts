// WCAG AA pairs introduced by the Quest / Harmonium restyle (src/game/quest.css). Kept apart from contrast.test.ts.
import { describe, it, expect } from 'vitest';
const fs = await import(/* @vite-ignore */ 'node:fs' as string);
const css: string = fs.readFileSync('src/index.css', 'utf8');
const qcss: string = fs.readFileSync('src/game/quest.css', 'utf8');
const token = (name: string): string => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6}|var\\(--([\\w-]+)\\))`));
  if (!m) throw new Error(`missing token --${name}`);
  return m[2] ? token(m[2]) : m[1];
};
const lum = (hex: string) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [text token, background token, what uses it]
const PAIRS: [string, string, string][] = [
  ['ink', 'hair', 'white-key labels (.hm-white)'],
  ['ink', 'ground', 'black-key labels (.hm-black), dark inputs, chat log'],
  ['ink-2', 'ground', '.q-stat, .q-hud text'],
  ['ink-2', 'panel', '.q-sub on cards'],
  ['ink-3', 'panel', '.q-label, .q-src on cards'],
  ['ink-3', 'ground', 'labels inside dark wells'],
  ['ink', 'panel-2', 'built-in chat bubbles, saved-note chips'],
  ['on-signal-default', 'signal-default', 'primary buttons, active key, user chat bubble'],
  ['signal-default', 'panel', 'active tab / chip text'],
  ['signal-default', 'ground', 'chip text in wells'],
];
describe('Quest / Harmonium text pairs (AA 4.5:1)', () => {
  for (const [fg, bg, use] of PAIRS) it(`--${fg} on --${bg}: ${use}`, () => expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5));
  for (const fill of ['fire', 'rain', 'teal', 'brass']) it(`dataset rule --${fill} against the card (3:1, non-text)`, () => expect(ratio(token(fill), token('panel'))).toBeGreaterThanOrEqual(3));
  it('high contrast: a key never fills with --hair (it becomes near-white there)', () => expect(qcss).toMatch(/html\.hc \.hm-white \{ background: var\(--panel-2\)/));
});
