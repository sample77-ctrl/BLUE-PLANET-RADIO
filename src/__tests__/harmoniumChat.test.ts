import { describe, it, expect, beforeEach } from 'vitest';
import {
  HARMONIUM_KEYS,
  harmoniumAudio,
  swaraForNote,
} from '../harmonium/harmoniumAudio';
import {
  matchHarmoniumSound,
  HISTORICAL_BENCHMARKS,
} from '../harmonium/earthSoundMatcher';
import {
  generateDeterministicFuturePrediction,
} from '../harmonium/groqPredictor';

describe('Harmonium Keyboard & Swara System', () => {
  it('defines 17 classical harmonium keys covering C4 to E5 with Swara mappings', () => {
    expect(HARMONIUM_KEYS.length).toBe(17);

    // Verify first key is C4 (Sa)
    const first = HARMONIUM_KEYS[0];
    expect(first.key).toBe('C4');
    expect(first.note).toBe('C4');
    expect(first.swara).toBe('Sa');
    expect(first.swaraBn).toBe('সা');
    expect(first.isBlack).toBe(false);
    expect(first.freq).toBeCloseTo(261.63, 1);

    // Verify octave middle Pa (G4)
    const paKey = HARMONIUM_KEYS.find((k) => k.swara === 'Pa');
    expect(paKey).toBeDefined();
    expect(paKey?.key).toBe('G4');
    expect(paKey?.swaraBn).toBe('পা');
    expect(paKey?.freq).toBeCloseTo(392.0, 1);

    // Verify Taar Sa (C5)
    const taarSa = HARMONIUM_KEYS.find((k) => k.key === 'C5');
    expect(taarSa).toBeDefined();
    expect(taarSa?.swara).toBe("Sa'");
    expect(taarSa?.freq).toBeCloseTo(523.25, 1);
  });

  it('maintains strictly increasing frequencies across keyboard', () => {
    for (let i = 1; i < HARMONIUM_KEYS.length; i++) {
      expect(HARMONIUM_KEYS[i].freq).toBeGreaterThan(HARMONIUM_KEYS[i - 1].freq);
    }
  });

  it('correctly maps musical note to classical Indian Swara', () => {
    expect(swaraForNote('C4')).toBe('Sa (সা)');
    expect(swaraForNote('D4')).toBe('Re (রে)');
    expect(swaraForNote('E4')).toBe('Ga (গা)');
    expect(swaraForNote('F4')).toBe('Ma (মা)');
    expect(swaraForNote('G4')).toBe('Pa (পা)');
    expect(swaraForNote('A4')).toBe('Dha (ধা)');
    expect(swaraForNote('B4')).toBe('Ni (নি)');
  });
});

describe('Harmonium Free-Reed Audio Engine & Saved Voice', () => {
  beforeEach(() => {
    harmoniumAudio.clearBuffer();
  });

  it('manages bellows air pressure mechanics', () => {
    const initialPressure = harmoniumAudio.getBellowsPressure();
    expect(initialPressure).toBeGreaterThan(0);
    expect(initialPressure).toBeLessThanOrEqual(1.0);

    // Pumping increases or maintains pressure
    harmoniumAudio.pumpBellows();
    expect(harmoniumAudio.getBellowsPressure()).toBeGreaterThanOrEqual(initialPressure);
  });

  it('tracks played note buffer and sequence summary', () => {
    expect(harmoniumAudio.getPlayedSummary().notesCount).toBe(0);

    harmoniumAudio.playNote('C4', 261.63);
    harmoniumAudio.playNote('G4', 392.0);

    const summary = harmoniumAudio.getPlayedSummary();
    expect(summary.notesCount).toBe(2);
    expect(summary.swaraSequence).toContain('Sa');
    expect(summary.swaraSequence).toContain('Pa');
  });

  it('supports continuous drone stops (Sa / Pa sur)', async () => {
    expect(harmoniumAudio.isDroneActive()).toBe(false);
    await harmoniumAudio.toggleDrone(true, 130.81);
    expect(harmoniumAudio.isDroneActive()).toBe(true);
    await harmoniumAudio.toggleDrone(false);
    expect(harmoniumAudio.isDroneActive()).toBe(false);
  });

  it('loads curated historical and future voice presets', () => {
    harmoniumAudio.loadPresetVoice('historical-1981');
    let summary = harmoniumAudio.getPlayedSummary();
    expect(summary.notesCount).toBe(3);
    expect(summary.dominantFreq).toBeCloseTo(261.63, 1);

    harmoniumAudio.loadPresetVoice('future-2055');
    summary = harmoniumAudio.getPlayedSummary();
    expect(summary.notesCount).toBe(3);
    expect(summary.dominantFreq).toBeCloseTo(523.25, 1);
  });

  it('safely manages saved sequence playback and stops without errors', async () => {
    harmoniumAudio.loadPresetVoice('record-2024');
    expect(harmoniumAudio.isSequencePlaying()).toBe(false);

    await harmoniumAudio.playSavedSequence();
    harmoniumAudio.stopSavedSequence();
    expect(harmoniumAudio.isSequencePlaying()).toBe(false);
  });

  it('safely handles future voice preview synthesis and stop', async () => {
    expect(harmoniumAudio.isFutureVoicePlaying()).toBe(false);
    await harmoniumAudio.playFutureVoicePreview(523.25, 1.88, 1000);
    harmoniumAudio.stopFutureVoicePreview();
    expect(harmoniumAudio.isFutureVoicePlaying()).toBe(false);
  });
});

describe('NASA Earth Observation Sound Matcher', () => {
  it('contains verified historical climate benchmarks from 1880 to 2025', () => {
    expect(HISTORICAL_BENCHMARKS.length).toBeGreaterThan(5);

    const baseline = HISTORICAL_BENCHMARKS.find((b) => b.year === 1970);
    expect(baseline).toBeDefined();
    expect(baseline?.anomaly).toBeCloseTo(0.03, 2);

    const recordYear = HISTORICAL_BENCHMARKS.find((b) => b.year === 2024);
    expect(recordYear).toBeDefined();
    expect(recordYear?.anomaly).toBeGreaterThanOrEqual(1.25);
  });

  it('accurately matches Sa (C4 ~261Hz) with historical observations (~1981)', () => {
    const result = matchHarmoniumSound(261.63);
    expect(result.frequency).toBe(262);
    expect(result.mappedAnomaly).toBeGreaterThan(0.2);
    expect(result.mappedAnomaly).toBeLessThan(0.6);
    expect(result.matchedYear).toBeDefined();
    expect(result.yearsAgo).toBeDefined();
    // 2026 - matchedYear
    expect(result.yearsAgo).toBeGreaterThanOrEqual(30);
    expect(result.yearsAgo).toBeLessThanOrEqual(50);
    expect(result.nasaDataset).toContain('GISTEMP');
    expect(result.requiresAiPrediction).toBe(false);
  });

  it('accurately matches Pa (G4 ~392Hz) with modern record warming (~2023-2025)', () => {
    const result = matchHarmoniumSound(392.0);
    expect(result.matchedYear).toBeGreaterThanOrEqual(2020);
    expect(result.yearsAgo).toBeLessThanOrEqual(6);
    expect(result.mappedAnomaly).toBeGreaterThanOrEqual(1.1);
  });

  it('flags unprecedented high pitches (>440Hz) for AI future climate prediction', () => {
    // 523.25 Hz (Taar Sa / C5) -> mappedAnomaly = 1.5 * log2(523.25 / 220) = ~1.88°C
    const result = matchHarmoniumSound(523.25);
    expect(result.mappedAnomaly).toBeGreaterThan(1.5);
    expect(result.requiresAiPrediction).toBe(true);
    expect(result.matchedYear).toBeUndefined();
    expect(result.yearsAgo).toBeUndefined();
  });
});

describe('Groq AI Climate Predictor & Causality (Keno Hobe)', () => {
  it('generates physical future timeline when frequency exceeds historical records', () => {
    const prediction = generateDeterministicFuturePrediction(523.25, 'Sa - Pa - Sa', 1.88);
    expect(prediction.predictedYear).toBeGreaterThan(2026);
    expect(prediction.yearsFromNow).toBe(prediction.predictedYear - 2026);
    expect(prediction.temperatureAnomaly).toBeCloseTo(1.88, 2);

    // Verifies physical causality explanation (Keno Hobe)
    expect(prediction.whyAndHowEn).toContain('greenhouse');
    expect(prediction.whyAndHowBn).toContain('গ্রিনহাউস');

    // Verifies future voice characterization (futre er kemon voice hoite pare)
    expect(prediction.futureVoiceCharacterEn).toBeDefined();
    expect(prediction.futureVoiceCharacterEn?.length).toBeGreaterThan(10);
    expect(prediction.futureVoiceCharacterBn).toBeDefined();
    expect(prediction.futureVoiceCharacterBn?.length).toBeGreaterThan(10);

    // Verifies key environmental drivers
    expect(prediction.keyDrivers.length).toBeGreaterThanOrEqual(3);

    // Verifies classical raga analogy
    expect(prediction.musicalRagaAnalogy).toContain('Deepak');
  });

  it('calculates higher future years for higher frequencies', () => {
    const pred1 = generateDeterministicFuturePrediction(440.0, 'Dha', 1.5);
    const pred2 = generateDeterministicFuturePrediction(587.33, 'Taar Re', 2.12);
    expect(pred2.predictedYear).toBeGreaterThan(pred1.predictedYear);
    expect(pred2.yearsFromNow).toBeGreaterThan(pred1.yearsFromNow);
  });
});
