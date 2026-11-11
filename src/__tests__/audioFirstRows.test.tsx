// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { AudioFirstMode } from '../accessibility/AudioFirstMode';
import type { EarthObservation } from '../types/dataset';

const play = vi.fn();
vi.mock('../audio/sonificationEngine', () => ({ SonificationEngine: { getInstance: () => ({ playObservation: play }) } }));
afterEach(() => { cleanup(); play.mockClear(); });

const obs = (id: string, name: string): EarthObservation => ({ id, phenomenon: 'fire', latitude: 1, longitude: 20, timestamp: '2026-01-01', variable: 'Fire power', value: 5, unit: 'MW', normalizedValue: 0.5, source: 's', regionName: name });
const setup = () => { const onSel = vi.fn(); render(<PrefsProvider><AudioFirstMode observations={[obs('a', 'Alpha'), obs('b', 'Beta')]} currentDateLabel="x" selectedObservation={null} onSelectObservation={onSel} onExitAudioFirst={() => {}} /></PrefsProvider>); return onSel; };

describe('Atlas list rows (axe nested-interactive)', () => {
  it('no row is a button role; each row has exactly one focusable control, its play button', () => {
    setup();
    for (const name of ['Alpha', 'Beta']) {
      const row = screen.getByRole('group', { name: new RegExp(`^${name}\\. Fire power: 5 MW`) });
      expect(row.getAttribute('role')).not.toBe('button');
      expect(row.getAttribute('tabindex')).toBeNull();
      expect(row.querySelectorAll('button,[tabindex],a[href],input,select').length).toBe(1);
      expect(within(row).getByRole('button', { name: `Play audio for ${name}` })).toBeTruthy();
    }
  });
  it('clicking the play button or anywhere in the row plays it once', () => {
    const onSel = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Play audio for Alpha' }));
    expect(onSel).toHaveBeenCalledTimes(1); expect(play).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Beta'));
    expect(onSel).toHaveBeenCalledTimes(2); expect(onSel.mock.calls[1][0].id).toBe('b');
  });
});
