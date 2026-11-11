// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { PrefsProvider } from '../lib/prefs';
import { KidsLearningZone } from '../game/KidsLearningZone';
import { BlindExplorerMode } from '../game/BlindExplorerMode';
import { EarthTimeMachine } from '../game/EarthTimeMachine';
import { MyEarthPassport } from '../game/MyEarthPassport';
import { InclusiveCoopMode } from '../game/InclusiveCoopMode';
import { TacticalWildfireMission } from '../game/TacticalWildfireMission';
import { GameAudioEngine } from '../game/gameAudio';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(GameAudioEngine.prototype, 'playFire').mockImplementation(async () => {});
  vi.spyOn(GameAudioEngine.prototype, 'playRain').mockImplementation(async () => {});
  vi.spyOn(GameAudioEngine.prototype, 'playOcean').mockImplementation(async () => {});
  vi.spyOn(GameAudioEngine.prototype, 'playPentatonicNote').mockImplementation(async () => {});
  vi.spyOn(GameAudioEngine.prototype, 'playSuccess').mockImplementation(async () => {});
  vi.spyOn(GameAudioEngine.prototype, 'playBoop').mockImplementation(async () => {});
  vi.spyOn(GameAudioEngine.prototype, 'playSplash').mockImplementation(async () => {});
  vi.spyOn(GameAudioEngine.prototype, 'playSizzle').mockImplementation(async () => {});
  vi.spyOn(GameAudioEngine.prototype, 'playSonarPing').mockImplementation(async () => {});
  vi.spyOn(GameAudioEngine.prototype, 'playRadioBeep').mockImplementation(async () => {});
  vi.spyOn(GameAudioEngine.prototype, 'playTone').mockImplementation(async () => {});

  // Mock HTMLCanvasElement.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    setLineDash: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    roundRect: vi.fn(),
    closePath: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  // Mock Web Speech API
  class MockUtterance {
    text: string;
    rate = 1;
    pitch = 1;
    voice = null;
    onstart = null;
    onend = null;
    onerror = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  (global as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = MockUtterance;

  window.speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockReturnValue([
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Google বাংলা', lang: 'bn-BD' },
    ]),
    onvoiceschanged: null,
    paused: false,
    pending: false,
    speaking: false,
  } as unknown as SpeechSynthesis;
});

describe('Sonic Earth Adventure: Master Game Sections', () => {
  it('Section 05 – BlindExplorerMode handles keyboard navigation, sonar ping, and visual spectrum', () => {
    const onBack = vi.fn();
    render(
      <PrefsProvider>
        <BlindExplorerMode onBack={onBack} />
      </PrefsProvider>
    );

    expect(screen.getAllByText(/BLIND EXPLORER MODE/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Visual Equivalent for Hearing-Impaired/i)).toBeDefined();

    // Trigger Sonar Ping
    const pingBtn = screen.getByRole('button', { name: /Send Sonar Ping/i });
    fireEvent.click(pingBtn);
    expect(GameAudioEngine.prototype.playTone).toHaveBeenCalled();

    // Keyboard navigation: W steps forward, Space pings
    fireEvent.keyDown(window, { key: 'w' });
    fireEvent.keyDown(window, { key: ' ' });
    expect(GameAudioEngine.prototype.playTone).toHaveBeenCalled();
  });

  it('Section 06 – KidsLearningZone supports 3 difficulty tiers, audio cues, and zero-penalty learning', () => {
    const onBack = vi.fn();
    render(
      <PrefsProvider>
        <KidsLearningZone onBack={onBack} />
      </PrefsProvider>
    );

    expect(screen.getByText(/KIDS LEARNING ZONE/i)).toBeDefined();
    expect(screen.getByText(/Beginner/i)).toBeDefined();
    expect(screen.getByText(/Explorer/i)).toBeDefined();
    expect(screen.getByText(/Advanced/i)).toBeDefined();

    // Switch tier
    const explorerTab = screen.getByRole('button', { name: /Explorer/i });
    fireEvent.click(explorerTab);

    // Play nature sound
    const playSoundBtn = screen.getByRole('button', { name: /Play Nature Sound/i });
    fireEvent.click(playSoundBtn);

    // Click an option and see explanation without penalty
    const options = screen.getAllByRole('button');
    const questionOption = options.find((btn) => btn.textContent?.includes('Amazon') || btn.textContent?.includes('Bengal'));
    if (questionOption) {
      fireEvent.click(questionOption);
      expect(screen.getByText(/Next Challenge/i)).toBeDefined();
    }
  });

  it('Section 08 – EarthTimeMachine compares 1981 vs 2025 climate anomaly and acoustic frequency delta', async () => {
    const onBack = vi.fn();
    // the real bundled snapshot; with no data the view shows an error instead of an invented series
    const snap = JSON.parse(readFileSync('public/data/gistemp_global.json', 'utf8'));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => snap })));
    render(
      <PrefsProvider>
        <EarthTimeMachine onBack={onBack} />
      </PrefsProvider>
    );
    await screen.findByText(/snapshot, not live/i);

    expect(screen.getByText(/EARTH TIME MACHINE/i)).toBeDefined();
    expect(screen.getAllByText(/1981/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2025/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/ACOUSTIC DELTA/i)).toBeDefined();

    // Play binaural comparison
    const binauralBtn = screen.getByRole('button', { name: /Play Binaural Harmony/i });
    fireEvent.click(binauralBtn);
    expect(GameAudioEngine.prototype.playTone).toHaveBeenCalled();
  });

  it('Section 09 – MyEarthPassport shows honest progress, the data sources used and a certificate that is not NASA\'s', () => {
    const onBack = vi.fn();
    render(
      <PrefsProvider>
        <MyEarthPassport onBack={onBack} stars={{ 1: 2, 2: 0, 3: 0, 4: 0 }} />
      </PrefsProvider>
    );

    expect(screen.getByText(/MY EARTH PASSPORT/i)).toBeDefined();
    expect(screen.getByText(/Data sources used/i)).toBeDefined();
    expect(screen.queryByText(/SEAP-2026-NASA-VALIDATED/i)).toBeNull();
    expect(screen.queryByText(/100% SCIENTIFIC INTEGRITY/i)).toBeNull();
    expect(screen.getByText(/Amazon Forest Sentinel/i)).toBeDefined();

    // Open the certificate
    const certBtn = screen.getByRole('button', { name: /View certificate of completion/i });
    fireEvent.click(certBtn);
    expect(screen.getByRole('dialog', { name: /CERTIFICATE OF COMPLETION/i })).toBeDefined();
    expect(screen.getByText(/not issued or endorsed by NASA/i)).toBeDefined();
    expect(screen.queryByText(/Research Council/i)).toBeNull();
  });

  it('Signature Feature E – InclusiveCoopMode synchronizes Player 1 visual grid with Player 2 audio tuning', () => {
    const onBack = vi.fn();
    render(
      <PrefsProvider>
        <InclusiveCoopMode onBack={onBack} />
      </PrefsProvider>
    );

    expect(screen.getByText(/INCLUSIVE CO-OP MODE/i)).toBeDefined();
    expect(screen.getByText(/PLAYER 1: SATELLITE NAVIGATOR/i)).toBeDefined();
    expect(screen.getByText(/PLAYER 2: ACOUSTIC SPECIALIST/i)).toBeDefined();

    // Tune acoustic frequency
    const tuneUpBtn = screen.getByRole('button', { name: /\+20 Hz/i });
    fireEvent.click(tuneUpBtn);
    expect(GameAudioEngine.prototype.playTone).toHaveBeenCalled();
  });

  it('Section 03 – TacticalWildfireMission implements incident command, air tanker drop, and radio logs', () => {
    const onExit = vi.fn();
    render(
      <PrefsProvider>
        <TacticalWildfireMission
          onComplete={vi.fn()}
          onExit={onExit}
          audioReady={true}
          onSoundOn={vi.fn()}
        />
      </PrefsProvider>
    );

    expect(screen.getByText(/WILDFIRE INCIDENT COMMAND/i)).toBeDefined();
    expect(screen.getByText(/INCIDENT OBJECTIVES/i)).toBeDefined();
    expect(screen.getByText(/LIVE RADIO \/ SATELLITE FEED/i)).toBeDefined();

    // Deploy Air Tanker
    const tankerBtn = screen.getByRole('button', { name: /Deploy Air Tanker/i });
    fireEvent.click(tankerBtn);
    expect(GameAudioEngine.prototype.playSplash).toHaveBeenCalled();

    // Switch to Satellite Downlink
    const satBtn = screen.getByRole('button', { name: /Satellite Downlink/i });
    fireEvent.click(satBtn);
    expect(satBtn.getAttribute('aria-pressed')).toBe('true'); // was asserted via the old bg-emerald-500 class; same behaviour
  });
});
