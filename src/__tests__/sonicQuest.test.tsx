// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { SonicQuest } from '../game/SonicQuest';
import { GameAudioEngine } from '../game/gameAudio';

afterEach(cleanup);

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
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
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
});

describe('SonicQuest component', () => {
  it('renders the Overworld Map hub with mission islands', () => {
    const onExplore = vi.fn();
    render(
      <PrefsProvider>
        <SonicQuest onExplore={onExplore} audioReady={true} />
      </PrefsProvider>
    );

    expect(screen.getByText(/Sonic Quest: NASA Earth Rangers/i)).toBeDefined();
    expect(screen.getByText(/Amazon Wildfire Extinguisher/i)).toBeDefined();
    expect(screen.getByText(/Bengal Monsoon Flood Rescue/i)).toBeDefined();
    expect(screen.getByText(/Pacific Ocean Submarine Dive/i)).toBeDefined();
    expect(screen.getByText(/NASA Orbital Space Station/i)).toBeDefined();
  });

  it('can enter Free Roam walking mode with controls and HUD', () => {
    const onExplore = vi.fn();
    render(
      <PrefsProvider>
        <SonicQuest onExplore={onExplore} audioReady={true} />
      </PrefsProvider>
    );

    const freeRoamBtn = screen.getByRole('button', { name: /Free Roam/i });
    fireEvent.click(freeRoamBtn);

    expect(screen.getByRole('button', { name: /Walk Left/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Walk Right/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Jump/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Scan or Interact/i })).toBeDefined();
  });

  it('can deploy to Mission 1 (Wildfire Extinguisher) and interact with water blaster', () => {
    const onExplore = vi.fn();
    render(
      <PrefsProvider>
        <SonicQuest onExplore={onExplore} audioReady={true} />
      </PrefsProvider>
    );

    const startBtns = screen.getAllByRole('button', { name: /Deploy|Replay/i });
    fireEvent.click(startBtns[0]);

    expect(screen.getByText(/Extinguished:/i)).toBeDefined();
    const blastBtn = screen.getByRole('button', { name: /Spray Water/i });
    expect(blastBtn).toBeDefined();
    fireEvent.mouseDown(blastBtn);
    fireEvent.mouseUp(blastBtn);

    // Can exit back to map
    const exitBtn = screen.getByRole('button', { name: /Exit Mission/i });
    fireEvent.click(exitBtn);
    expect(screen.getByText(/Sonic Quest: NASA Earth Rangers/i)).toBeDefined();
  });

  it('can switch to the DJ Studio tab and play sound loops', () => {
    const onExplore = vi.fn();
    render(
      <PrefsProvider>
        <SonicQuest onExplore={onExplore} audioReady={true} />
      </PrefsProvider>
    );

    const djTab = screen.getByRole('button', { name: /DJ Studio/i });
    fireEvent.click(djTab);

    expect(screen.getByText(/Remix NASA Sounds/i)).toBeDefined();
    expect(screen.getByText(/Wildfire/i)).toBeDefined();
    expect(screen.getByText(/Monsoon Rain/i)).toBeDefined();
    expect(screen.getByText(/Ocean Bass/i)).toBeDefined();

    // Toggle fire button
    const fireToggle = screen.getByRole('button', { name: /Toggle fire/i });
    fireEvent.click(fireToggle);
    expect(GameAudioEngine.prototype.playFire).toHaveBeenCalled();

    // Play a piano pad
    const g3Note = screen.getByRole('button', { name: /G3/i });
    fireEvent.click(g3Note);
    expect(GameAudioEngine.prototype.playPentatonicNote).toHaveBeenCalled();
  });

  it('can switch to Science Lab tab and interact with questions', () => {
    const onExplore = vi.fn();
    render(
      <PrefsProvider>
        <SonicQuest onExplore={onExplore} audioReady={true} />
      </PrefsProvider>
    );

    const labTab = screen.getByRole('button', { name: /Science Lab/i });
    fireEvent.click(labTab);

    expect(screen.getByText(/The Sound Lab: Nature’s Voices/i)).toBeDefined();
    const playSoundBtn = screen.getByRole('button', { name: /Play Sound/i });
    fireEvent.click(playSoundBtn);
    expect(GameAudioEngine.prototype.playFire).toHaveBeenCalled();
  });

  it('can open and close the Cadet Badge modal', () => {
    const onExplore = vi.fn();
    render(
      <PrefsProvider>
        <SonicQuest onExplore={onExplore} audioReady={true} />
      </PrefsProvider>
    );

    const badgeBtns = screen.getAllByRole('button', { name: /Badges|Cadet Certificate/i });
    fireEvent.click(badgeBtns[0]);

    expect(screen.getByText(/NASA Junior Sonic Cadet/i)).toBeDefined();
    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/NASA Junior Sonic Cadet/i)).toBeNull();
  });

  it('renders the Step-by-Step Update Plan guide and navigates through the steps', () => {
    const onExplore = vi.fn();
    render(
      <PrefsProvider>
        <SonicQuest onExplore={onExplore} audioReady={true} />
      </PrefsProvider>
    );

    // Initial view should be Step 1
    expect(screen.getByText(/Authentic NASA Earth Science & Sonification/i)).toBeDefined();
    expect(screen.getByText(/NASA Space Apps Challenge 2026/i)).toBeDefined();

    // Click Next Step to go to Step 2
    const nextBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/The Seven Explorer Game Modes/i)).toBeDefined();

    // Click Next Step to go to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Four Playable NASA Data Missions/i)).toBeDefined();

    // Click Next Step to go to Step 4 (Audio Legend & Formulas)
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Scientific Audio Legend & Verification Matrix/i)).toBeDefined();
    const testFireBtn = screen.getByRole('button', { name: /Test Fire Sound/i });
    fireEvent.click(testFireBtn);
    expect(GameAudioEngine.prototype.playFire).toHaveBeenCalled();

    // Click Next Step to go to Step 5 (Time Travel 1981 vs 2025)
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Time Travel — Hear Earth in 1981 vs 2025/i)).toBeDefined();
    const hear1981Btn = screen.getByRole('button', { name: /Hear Earth in 1981/i });
    fireEvent.click(hear1981Btn);
    expect(GameAudioEngine.prototype.playPentatonicNote).toHaveBeenCalled();

    // Click Next Step to go to Step 6 (Blind Explorer & Spatial Audio)
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Blind Explorer Mode & 3D Spatial Audio/i)).toBeDefined();

    // Click Next Step to go to Step 7 (Passport & Certification)
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Earth Sound Passport & Graduation/i)).toBeDefined();
    expect(screen.getByText(/SEAP-2026-NASA-VALIDATED/i)).toBeDefined();

    // Previous step works
    const prevBtn = screen.getByRole('button', { name: /Previous Step/i });
    fireEvent.click(prevBtn);
    expect(screen.getByText(/Blind Explorer Mode & 3D Spatial Audio/i)).toBeDefined();
  });
});
