// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { NowPlayingBar } from '../player/NowPlayingBar';
import { publishNowPlaying, getNowPlaying, type NowPlaying } from '../player/nowPlaying';

const mk = (over: Partial<NowPlaying> = {}): NowPlaying => ({
  id: 'jukebox', title: 'Global temperature', subtitle: 'NASA GISS · 1880 to 2025 · °C', badge: 'snapshot', state: 'ready', index: 3, count: 10,
  label: '1998', valueText: '+0.61 °C', spark: [1, 2, 3, 2, 5, 4, 6, 7, 6, 8], volume: 0.5, muted: false, speed: 1,
  controls: { toggle: () => {}, stop: () => {}, step: () => {}, seek: () => {}, setVolume: () => {}, setMuted: () => {}, setSpeed: () => {} }, ...over,
});
const ui = () => <PrefsProvider><NowPlayingBar /></PrefsProvider>;
afterEach(() => { cleanup(); act(() => publishNowPlaying(null)); localStorage.clear(); });

describe('Now-Playing bar', () => {
  it('renders nothing until a player publishes, then clears when it does', () => {
    const { container } = render(ui());
    expect(container.querySelector('.np-bar')).toBeNull();
    act(() => publishNowPlaying(mk()));
    expect(screen.getByRole('region', { name: 'Now playing' })).toBeTruthy();
    act(() => publishNowPlaying(null, 'jukebox'));
    expect(container.querySelector('.np-bar')).toBeNull();
  });
  it("leaves another player's record alone when a different id clears", () => {
    act(() => publishNowPlaying(mk()));
    act(() => publishNowPlaying(null, 'monsoon'));
    expect(getNowPlaying()?.id).toBe('jukebox');
  });
  it('labels snapshot data as a snapshot, never live, and gives the scrubber a spoken value', () => {
    render(ui()); act(() => publishNowPlaying(mk()));
    expect(screen.getByText('Snapshot')).toBeTruthy();
    expect(screen.queryByText(/live/i)).toBeNull();
    expect(screen.getByRole('slider', { name: 'Position in the series' }).getAttribute('aria-valuetext')).toBe('1998, +0.61 °C');
  });
  it('calls the published controls', () => {
    const calls: string[] = [];
    render(ui());
    act(() => publishNowPlaying(mk({ controls: { ...mk().controls, toggle: () => calls.push('toggle'), step: (b) => calls.push(`step${b}`), seek: (i) => calls.push(`seek${i}`), setSpeed: (x) => calls.push(`speed${x}`) } })));
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.change(screen.getByRole('slider', { name: 'Position in the series' }), { target: { value: '6' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Speed' }), { target: { value: '2' } });
    expect(calls).toEqual(['toggle', 'step1', 'seek6', 'speed2']);
  });
  it('disables play while loading and prev at the first point', () => {
    render(ui()); act(() => publishNowPlaying(mk({ state: 'busy', index: 0 })));
    expect((screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /previous|prev/i }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('shows only the controls a start/stop player supports, with Stop instead of Pause', () => {
    render(ui());
    act(() => publishNowPlaying(mk({ id: 'monsoon', state: 'playing', pauses: false, count: 0, index: 0, volume: undefined, speed: undefined,
      controls: { toggle: () => {}, stop: () => {} } })));
    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Speed' })).toBeNull();
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
  });
});
