// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { MyEarthPassport } from '../game/MyEarthPassport';
import { derive, readStars, readModes, markMode, BADGE_ORDER, BADGE_RULES, STARS_KEY, MODES_KEY } from '../game/progress';
import { periodOf, SNAPSHOT_FILES } from '../game/sources';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const passport = (props: Partial<React.ComponentProps<typeof MyEarthPassport>> = {}) =>
  render(<PrefsProvider><MyEarthPassport onBack={() => {}} {...props} /></PrefsProvider>);
const unlockedIds = () => [...document.querySelectorAll('[data-badge][data-unlocked="true"]')].map((e) => e.getAttribute('data-badge'));

describe('Earth Passport progress is derived from real play', () => {
  it('a fresh visitor has 0 badges, 0 XP, level 1 and 0 stars', () => {
    passport();
    expect(unlockedIds()).toEqual([]);
    expect(screen.getByText(/0 \/ 7 Badges/)).toBeDefined();
    expect(screen.getByText(/0 Total XP/)).toBeDefined();
    expect(screen.getByText(/0 Stars/)).toBeDefined();
    expect(screen.getByText('Level 1')).toBeDefined();
    expect(screen.queryByText('UNLOCKED')).toBeNull();
    expect(screen.getAllByText('LOCKED')).toHaveLength(7);
    expect(screen.getByRole('heading', { level: 3, name: 'Cadet' })).toBeDefined(); // no invented callsign
  });

  it('every locked badge says what earns it, in English and in Bangla', () => {
    passport();
    for (const id of BADGE_ORDER) expect(screen.getByText(BADGE_RULES[id].earnEn)).toBeDefined();
    cleanup();
    for (const id of BADGE_ORDER) { expect(BADGE_RULES[id].earnBn.length).toBeGreaterThan(10); expect(BADGE_RULES[id].earnBn).not.toBe(BADGE_RULES[id].earnEn); }
  });

  it('the certificate button stays inert until a badge is earned', () => {
    passport();
    const btn = screen.getByRole('button', { name: /View certificate of completion/i });
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(btn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('completing a mission (real stored stars) unlocks only its badge and adds XP', () => {
    localStorage.setItem(STARS_KEY, JSON.stringify({ 1: 0, 2: 2, 3: 0, 4: 0 }));
    passport(); // no stars prop: read the same key the game writes
    expect(unlockedIds()).toEqual(['rain']);
    expect(screen.getByText(/1 \/ 7 Badges/)).toBeDefined();
    expect(screen.getByText(/300 Total XP/)).toBeDefined();
    expect(screen.getByText('Level 2')).toBeDefined();
    expect(screen.getByText(/2 Stars/)).toBeDefined();
  });

  it('mode badges come from the stored modes, set by markMode', () => {
    expect(readModes()).toEqual({});
    markMode('dj');
    markMode('blind');
    expect(JSON.parse(localStorage.getItem(MODES_KEY)!)).toEqual({ dj: true, blind: true });
    passport();
    expect(unlockedIds().sort()).toEqual(['blind', 'dj']);
    expect(screen.getByText(/200 Total XP/)).toBeDefined();
  });

  it('badges are derived: a stored "unlocked" flag or garbage cannot unlock anything', () => {
    localStorage.setItem(STARS_KEY, JSON.stringify({ 1: 'yes', 2: -4, unlocked: true, fire: true }));
    localStorage.setItem(MODES_KEY, JSON.stringify({ blind: 'true', timemachine: 1, unlocked: ['fire'] }));
    expect(readStars()).toEqual({});
    expect(readModes()).toEqual({});
    expect(derive(readStars(), readModes()).unlockedCount).toBe(0);
    localStorage.setItem(STARS_KEY, '{not json');
    expect(readStars()).toEqual({});
    // the only inputs are stars and modes, the same inputs always give the same result
    const a = derive({ 1: 3, 4: 1 }, { dj: true });
    expect(a.badges.filter((b) => b.unlocked).map((b) => b.id)).toEqual(['fire', 'orbital', 'dj']);
    expect(a.xp).toBe(4 * 150 + 100);
    expect(derive({ 1: 3, 4: 1 }, { dj: true })).toEqual(a);
  });

  it('shows no fabricated trust claims', () => {
    passport({ stars: { 1: 3, 2: 3, 3: 3, 4: 3 } });
    const text = document.body.textContent ?? '';
    for (const bad of [/SEAP-2026/i, /NASA-VALIDATED/i, /100% SCIENTIFIC/i, /Research Council/i, /Space Apps 2026 Certified/i, /Official Certificate/i, /AUTHENTIC NASA/i]) expect(text).not.toMatch(bad);
    expect(text).toMatch(/not live/i);
    expect(text).toMatch(/NASA has not reviewed or endorsed/i);
  });

  it('lists the four snapshot sources with the period read from their files', async () => {
    const files: Record<string, unknown> = {};
    for (const s of SNAPSHOT_FILES) files[s.file] = JSON.parse(readFileSync(`public${s.file}`, 'utf8'));
    vi.stubGlobal('fetch', vi.fn(async (u: string) => ({ ok: true, json: async () => files[u] })));
    passport();
    expect(await screen.findByText(/NASA GISS GISTEMP v4/)).toBeDefined();
    const items = [...document.querySelectorAll('#passport-sources')][0].closest('section')!.textContent!;
    expect(items).toMatch(/period 1880–2025, baseline 1951-1980/);
    expect(items).toMatch(/period September 2026/);
    expect(items).toMatch(/period 2026-10-02 to 2026-10-05/);
    expect((items.match(/bundled snapshot/g) ?? []).length).toBe(4);
    vi.unstubAllGlobals();
  });

  it('a source file that cannot be read says so instead of inventing a period', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    passport();
    expect((await screen.findAllByText(/period unavailable/)).length).toBe(4);
    vi.unstubAllGlobals();
  });

  it('periodOf reads the file, not a constant', () => {
    expect(periodOf('gistemp', { series: [{ year: 1900 }, { year: 1910 }], baseline: '1951-1980' })).toBe('1900–1910, baseline 1951-1980');
    expect(periodOf('sst', { monthLabel: 'May 2020' })).toBe('May 2020');
    expect(periodOf('firms', { slices: [{ dateLabel: '2026-10-03' }, { dateLabel: '2026-10-01' }] })).toBe('2026-10-01 to 2026-10-03');
    expect(periodOf('power', {})).toBeNull();
  });
});
