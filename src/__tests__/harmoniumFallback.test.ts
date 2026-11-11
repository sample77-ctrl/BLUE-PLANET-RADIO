// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendHarmoniumChatMessage, sendHarmoniumChatMessageDetailed, predictFutureClimateFromHarmonium, getAiStatus, resetAiStatusForTests, hasGroqKey, PITCH_METHOD_EN } from '../harmonium/groqPredictor';
import { fallbackReply } from '../harmonium/fallback';
import { HISTORICAL_BENCHMARKS } from '../harmonium/earthSoundMatcher';
import gistemp from '../../public/data/gistemp_global.json';

const CTX = { freq: 440, swaraSequence: 'Sa Re', mappedAnomaly: 1.5 };
const ask = (q: string) => [{ role: 'user' as const, content: q }];
const hasBengali = (s: string) => /[ঀ-৿]/.test(s);
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => { resetAiStatusForTests(); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('no key', () => {
  beforeEach(() => vi.stubEnv('VITE_GROQ_API_KEY', ''));
  it('never touches the network and says why, in English', async () => {
    const r = await sendHarmoniumChatMessageDetailed(ask('Why is the Arctic warming?'), CTX, 'en');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(r.source).toBe('built-in');
    expect(r.text).toMatch(/unavailable: no API key/i);
    expect(hasBengali(r.text)).toBe(false);
    expect(getAiStatus()).toBe('unconfigured');
  });
  it('answers in Bengali when the UI is Bengali', async () => {
    const t = await sendHarmoniumChatMessage(ask('আর্কটিক কেন গরম হচ্ছে?'), CTX, 'bn');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(hasBengali(t)).toBe(true);
    expect(t).toContain('এপিআই কী');
  });
  it('reads the language from the page when none is passed', async () => {
    document.documentElement.lang = 'bn';
    const t = await sendHarmoniumChatMessage(ask('hello'), CTX);
    document.documentElement.lang = 'en';
    expect(hasBengali(t)).toBe(true);
  });
  it('gives a sourced snapshot answer for a covered question and nothing invented for others', async () => {
    const warm = fallbackReply('Why is the Arctic warming?', { reason: 'nokey' }, 'en');
    expect(warm).toMatch(/not live/);
    expect(warm).toMatch(/1951–1980/);
    expect(warm).toMatch(/Source: .*GISTEMP/);
    expect(warm).toMatch(/sea-ice extent: 7\.05 million km² in 1979/);
    const other = fallbackReply('Which raga is best for monsoon?', { reason: 'nokey' }, 'en');
    expect(other).toMatch(/no bundled data/);
    expect(other).not.toMatch(/\d+\.\d+°C/);
  });
  it('the future-prediction path also skips the network and is labelled built-in and illustrative', async () => {
    const p = await predictFutureClimateFromHarmonium(659, 'Sa', 1.8);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(p.source).toBe('built-in');
    expect(p.sourceTrajectory).toBe(PITCH_METHOD_EN);
    expect(p.whyAndHowEn).toMatch(/not a forecast/i);
    expect(PITCH_METHOD_EN).toMatch(/not NASA data/);
  });
});

describe('with a key', () => {
  beforeEach(() => vi.stubEnv('VITE_GROQ_API_KEY', 'test-key'));
  it('is idle until a request has succeeded, then connected', async () => {
    expect(hasGroqKey()).toBe(true);
    expect(getAiStatus()).toBe('idle');
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: ' Hello from the model ' } }] }) });
    const r = await sendHarmoniumChatMessageDetailed(ask('hi'), CTX, 'en');
    expect(r).toEqual({ text: 'Hello from the model', source: 'ai' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer test-key' });
    expect(getAiStatus()).toBe('connected');
  });
  it('HTTP error: states the status, falls back in the UI language, status offline', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    const en = await sendHarmoniumChatMessageDetailed(ask('What is the CO2 level?'), CTX, 'en');
    expect(en.source).toBe('built-in');
    expect(en.text).toMatch(/HTTP 429/);
    expect(en.text).toMatch(/Mauna Loa annual mean CO₂/);
    expect(getAiStatus()).toBe('offline');
    const bn = await sendHarmoniumChatMessage(ask('hi'), CTX, 'bn');
    expect(hasBengali(bn)).toBe(true);
    expect(bn).toContain('HTTP');
  });
  it('network failure: says offline', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const r = await sendHarmoniumChatMessageDetailed(ask('hi'), CTX, 'en');
    expect(r.text).toMatch(/offline or the service could not be reached/);
    expect(getAiStatus()).toBe('offline');
  });
  it('recovers to connected after a later success', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('x')).mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) });
    await sendHarmoniumChatMessage(ask('a'), CTX, 'en');
    expect(getAiStatus()).toBe('offline');
    await sendHarmoniumChatMessage(ask('b'), CTX, 'en');
    expect(getAiStatus()).toBe('connected');
  });
  it('prediction: the year always follows the stated rule, even if the model says otherwise', async () => {
    const body = { predictedYear: 2031, yearsFromNow: 5, whyAndHowEn: 'text', keyDrivers: ['a'] };
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(body) } }] }) });
    const p = await predictFutureClimateFromHarmonium(659, 'Sa', 1.8);
    expect(p.source).toBe('ai');
    expect(p.predictedYear).toBe(2026 + Math.round(((1.8 - 1.25) / 0.25) * 10));
    expect(p.sourceTrajectory).toBe(PITCH_METHOD_EN);
  });
});

describe('benchmarks', () => {
  it('match the bundled GISTEMP snapshot exactly', () => {
    const by = new Map((gistemp as { series: { year: number; anomaly: number }[] }).series.map((p) => [p.year, p.anomaly]));
    for (const b of HISTORICAL_BENCHMARKS) expect(b.anomaly).toBe(by.get(b.year));
  });
});
