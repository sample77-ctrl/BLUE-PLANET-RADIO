import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/** Roadmap v5, V6: spring easing, @starting-style on pop-ups and a signal-colour wipe for view changes, all off under reduced motion. */
const index = readFileSync('src/index.css', 'utf8'), bold = readFileSync('src/bold.css', 'utf8');

describe('spring easing', () => {
  it('is a linear() spring that overshoots a little and settles, with a plain ease-out where linear() easing is missing', () => {
    const m = index.match(/--ease-spring: linear\(([^)]*)\);/);
    expect(m).not.toBeNull();
    const stops = m![1].split(',').map((x) => parseFloat(x.trim().split(' ')[0]));
    expect(stops[0]).toBe(0); expect(stops.at(-1)).toBe(1); // starts at rest, ends settled
    expect(Math.max(...stops)).toBeGreaterThan(1); // it overshoots
    expect(Math.max(...stops)).toBeLessThan(1.3); // but only a little
    expect(stops.every((v) => Number.isFinite(v))).toBe(true);
    expect(index).toMatch(/@supports not \(transition-timing-function: linear\(0, 1\)\) \{ :root \{ --ease-spring: var\(--ease-out\); \} \}/);
  });
  it('pop-ups and the bottom sheet arrive through @starting-style, and their durations are the tokens that are 0 under reduced motion', () => {
    expect(index).toMatch(/@starting-style \{ \.scrim \{ opacity: 0; \} \.glass-pop \{ opacity: 0; scale: \.96; \} \}/);
    expect(index).toMatch(/\.glass-pop \{ transition: opacity var\(--dur-fast\)[^}]*scale var\(--dur-med\) var\(--ease-spring\)/);
    expect(index).toMatch(/@starting-style \{ \.scrim > \.glass-pop\.rounded-t-2xl \{[^}]*translate: 0 6rem/);
    expect(index).toMatch(/html\.rm \{ --dur-fast: 0ms; --dur-med: 0ms; --dur-slow: 0ms; \}/);
    expect(index).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ :root \{ --dur-fast: 0ms; --dur-med: 0ms; --dur-slow: 0ms; \} \}/);
  });
  it('does not put a translate on .glass-pop (Tailwind translate classes on tooltips would fight it)', () => {
    expect(index).not.toMatch(/\.glass-pop \{[^}]*translate:/);
  });
});

describe('view change wipe', () => {
  it('floods the group with the signal colour, fades the old view and wipes the new one in, at document level and scoped to <main>', () => {
    expect(bold).toMatch(/::view-transition-group\(root\), main::view-transition-group\(root\) \{ background: var\(--signal\); \}/);
    expect(bold).toMatch(/::view-transition-old\(root\), main::view-transition-old\(root\) \{ animation: vt-off/);
    expect(bold).toMatch(/::view-transition-new\(root\), main::view-transition-new\(root\) \{ animation: vt-wipe/);
    expect(bold).toMatch(/@keyframes vt-wipe \{ from \{ clip-path: inset\(0 100% 0 0\); \} to \{ clip-path: inset\(0 0 0 0\); \} \}/);
  });
  it('is a plain fade over black in high contrast, and no animation at all under the OS reduced-motion setting', () => {
    expect(bold).toMatch(/html\.hc::view-transition-group\(root\)[^{]*\{ background: #000; \}/);
    expect(bold).toMatch(/html\.hc::view-transition-new\(root\)[^{]*\{ animation: vt-fade/);
    expect(bold).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ ::view-transition-group\(\*\), ::view-transition-old\(\*\), ::view-transition-new\(\*\) \{ animation: none !important; \} \}/);
  });
});
