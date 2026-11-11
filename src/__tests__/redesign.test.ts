// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { STRINGS } from '../lib/strings';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('redesign guardrails', () => {
  it('no roadmap codes (A1, A2, B1, B2) in the world kickers, in either language', () => {
    for (const lang of ['en', 'bn'] as const) for (const n of [1, 2, 3, 4]) {
      const v = STRINGS[lang][`w${n}Kicker` as keyof (typeof STRINGS)['en']] ?? '';
      expect(v, `${lang} w${n}Kicker`).not.toMatch(/\b[AB][12]\b/);
    }
  });
  it('snapshot data never carries a live badge, and no copy says "hallucination"', () => {
    for (const f of ['game/SonicRangersGame.tsx', 'game/QuestHub.tsx', 'game/EarthTimeMachine.tsx']) {
      expect(read(f)).not.toMatch(/LIVE \/ NRT/);
      expect(read(f)).not.toMatch(/hallucination/i);
    }
  });
  it('the Quest opens on the hub, not on the Update Plan guide', () => {
    expect(read('game/SonicRangersGame.tsx')).toMatch(/initialScreen = 'home'/);
  });
  it('every new hero string exists in English and Bangla', () => {
    for (const k of ['heroTitle', 'heroPlay', 'heroExplore', 'heroQuestKids', 'heroSnapshot', 'hearingLive', 'hearingOff', 'stereoPos', 'jbNowPlaying', 'jbRdNote'] as const) {
      expect(STRINGS.en[k], `en ${k}`).toBeTruthy();
      expect(STRINGS.bn[k], `bn ${k}`).toBeTruthy();
    }
  });
});
