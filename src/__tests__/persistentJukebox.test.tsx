// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { dataFile } from './fixtures';
import { PrefsProvider } from '../lib/prefs';
import { PlaybackProvider, usePlaybackReport } from '../lib/playbackContext';
import { JukeboxView } from '../jukebox/JukeboxView';
import { NowPlayingBar } from '../player/NowPlayingBar';
import { TimelineBar } from '../atlas/TimelineBar';
import { HearingPanel, HearingSignal } from '../atlas/HearingPanel';
import { publishNowPlaying, getNowPlaying, type NowPlaying } from '../player/nowPlaying';
import { setFullPlayer } from '../player/ui';
import { clearStoryCache } from '../stories/loadStory';
import { AudioContextManager } from '../audio/audioContext';
import { seriesDiagnostics } from '../sonification/series/SeriesPlayer';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); clearStoryCache(); act(() => { publishNowPlaying(null); setFullPlayer(false, 'next'); }); window.history.replaceState(null, '', '/'); });
const stubFiles = () => vi.stubGlobal('fetch', async (u: string) => ({ ok: true, status: 200, json: async () => dataFile(u) }));
const countries = { list: [], country: null, point: null, onSelect: () => {} };
const state = () => document.querySelector('.np-bar')?.getAttribute('data-player-state');

function fakeAudio() {
  const t0 = performance.now();
  const param = () => ({ value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {} });
  const ctx = {
    get currentTime() { return (performance.now() - t0) / 1000; }, destination: node(),
    createGain: () => ({ ...node(), gain: param() }), createStereoPanner: () => ({ ...node(), pan: param() }),
    createOscillator: () => ({ ...node(), type: 'sine', frequency: param(), start() {}, stop() {} }),
  } as unknown as AudioContext;
  vi.spyOn(AudioContextManager, 'init').mockResolvedValue(ctx);
  vi.spyOn(AudioContextManager, 'isReady').mockReturnValue(true);
  vi.spyOn(AudioContextManager, 'getContext').mockReturnValue(ctx);
  vi.spyOn(AudioContextManager, 'getMasterNode').mockReturnValue(ctx.destination as AudioNode);
}
/** Another player that is making sound, as the Atlas or Monsoon would report it. */
function Other({ on }: { on: boolean }) { usePlaybackReport('atlas', 'Atlas', on, () => {}); return null; }
const host = (mode: 'front' | 'back' | 'off', other = false) => (
  <PrefsProvider><PlaybackProvider><Other on={other} />
    <JukeboxView mode={mode} countries={countries} initialStory="gistemp" initialT="1998" onOpenCollection={() => {}} />
    <NowPlayingBar /></PlaybackProvider></PrefsProvider>);
const start = async (ui: React.ReactElement) => {
  const view = render(ui);
  await waitFor(() => expect(state()).toBe('ready'), { timeout: 5000 });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Play' })); });
  expect(state()).toBe('playing');
  return view;
};

describe('Jukebox audio across views (roadmap §3.1 D9)', () => {
  it('keeps playing and keeps the bar while hidden, comes back as the same player, and unmounting frees every node', async () => {
    stubFiles(); fakeAudio();
    window.history.replaceState(null, '', '/#v1&track=atlas');
    const view = await start(host('front'));
    const root = () => document.querySelector('[data-col="story"]')!.closest('[hidden], .scroll-thin') as HTMLElement;
    let peak = 0;
    const sample = () => { peak = Math.max(peak, seriesDiagnostics().nodes); };
    for (let round = 0; round < 4; round++) { // leave and re-enter several times
      view.rerender(host('back')); sample();
      expect(root().hasAttribute('hidden')).toBe(true);
      expect(root().hasAttribute('inert')).toBe(true);
      expect(state()).toBe('playing'); // still playing, and the bar is still there
      expect(getNowPlaying()?.id).toBe('jukebox');
      await new Promise((r) => setTimeout(r, 120)); sample();
      view.rerender(host('front')); sample();
      expect(root().hasAttribute('hidden')).toBe(false);
      expect(state()).toBe('playing');
    }
    expect(seriesDiagnostics().nodes).toBeGreaterThan(0);
    expect(peak).toBeLessThan(80); // one player's bounded window, never a second player's worth stacked on top
    expect(window.location.hash).toContain('track=atlas'); // a hidden Jukebox never rewrote the URL of the view in front
    view.unmount();
    await new Promise((r) => setTimeout(r, 150));
    expect(seriesDiagnostics().nodes).toBe(0);
  });

  it('pauses on the landing page and when another player starts', async () => {
    stubFiles(); fakeAudio();
    const view = await start(host('front'));
    view.rerender(host('off'));
    await waitFor(() => expect(getNowPlaying()).toBeNull()); // landing page: no bar
    view.rerender(host('front'));
    await waitFor(() => expect(state()).toBe('paused'));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Resume' })); });
    expect(state()).toBe('playing');
    view.rerender(host('back', true)); // the Atlas starts playing
    await waitFor(() => expect(getNowPlaying()?.state).not.toBe('playing'));
    view.unmount();
    await new Promise((r) => setTimeout(r, 150));
    expect(seriesDiagnostics().nodes).toBe(0);
  });
});

describe('Now-Playing slots', () => {
  const np = (over: Partial<NowPlaying>): NowPlaying => ({ id: 'a', title: 'A', subtitle: '', badge: 'snapshot', state: 'ready', index: 0, count: 0, label: '', valueText: '', spark: [], controls: { toggle() {}, stop() {} }, ...over });
  it('a playing background player holds the bar; otherwise the view on screen; a paused background one only fills an empty bar', () => {
    act(() => publishNowPlaying(np({ id: 'atlas', title: 'Atlas' })));
    act(() => publishNowPlaying(np({ id: 'jukebox', title: 'Jukebox', background: true, state: 'playing' })));
    expect(getNowPlaying()?.id).toBe('jukebox');
    act(() => publishNowPlaying(np({ id: 'jukebox', title: 'Jukebox', background: true, state: 'paused' })));
    expect(getNowPlaying()?.id).toBe('atlas');
    act(() => publishNowPlaying(null, 'atlas'));
    expect(getNowPlaying()?.id).toBe('jukebox');
    act(() => publishNowPlaying(np({ id: 'jukebox', title: 'Jukebox' }))); // back in front: one record, not two
    act(() => publishNowPlaying(null, 'jukebox'));
    expect(getNowPlaying()).toBeNull();
  });
});

describe('Atlas: one transport, slim hearing card', () => {
  it('the timeline keeps the day pills and "Hear the change" but has no play, previous or next', () => {
    const slices = [{ dateLabel: '2026-10-02', observations: [] }, { dateLabel: '2026-10-03', observations: [] }] as never;
    render(<PrefsProvider><TimelineBar slices={slices} index={0} onChange={() => {}} playing={false} hearChange={false} onToggleHearChange={() => {}} enabled={{ fire: true, precipitation: true, sst: true } as never} /></PrefsProvider>);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Hear the change/ })).toBeTruthy();
    for (const name of ['Play', 'Pause', 'Previous day', 'Next day']) expect(screen.queryByRole('button', { name })).toBeNull();
  });
  it('the Now hearing card has no waveform; the waveform and stereo meter are in the full player tab, only for a player that offers them', () => {
    const { container } = render(<PrefsProvider><HearingPanel observations={[]} enabled={{ fire: true, precipitation: true, sst: true } as never} audioReady={false} onSelect={() => {}} /></PrefsProvider>);
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('.stereo-meter')).toBeNull();
    cleanup();
    const mk = (signal?: React.ReactNode): NowPlaying => ({ id: 'atlas', title: 'Planet', subtitle: '', badge: 'snapshot', state: 'ready', index: 0, count: 0, label: '', valueText: '', spark: [], signal, controls: { toggle() {}, stop() {} } });
    render(<PrefsProvider><NowPlayingBar /></PrefsProvider>);
    act(() => { publishNowPlaying(mk()); setFullPlayer(true, 'signal'); });
    expect(screen.queryByRole('tab', { name: 'Waveform & stereo' })).toBeNull(); // no signal offered: the tab is not there
    expect(screen.getByRole('tab', { name: 'Up next', selected: true })).toBeTruthy();
    act(() => { publishNowPlaying(mk(<HearingSignal observations={[]} enabled={{ fire: true, precipitation: true, sst: true } as never} audioReady={false} />)); });
    expect(screen.getByRole('tab', { name: 'Waveform & stereo', selected: true })).toBeTruthy();
    expect(document.querySelector('#np-panel canvas')).not.toBeNull();
  });
});
