// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { NowPlayingBar } from '../player/NowPlayingBar';
import { publishNowPlaying, type NowPlaying } from '../player/nowPlaying';
import { setFullPlayer } from '../player/ui';
import { getQueue, setQueue, enqueue, playNext, dequeue, shiftQueue, clearQueue } from '../player/queue';
import { buildUrl, decodeLocation, encodeShare, decodeShare, parseQueue } from '../lib/shareLink';

afterEach(() => { cleanup(); setFullPlayer(false, 'next'); act(() => { publishNowPlaying(null); clearQueue(); }); localStorage.clear(); });

describe('queue store', () => {
  it('keeps order, ignores duplicates, puts "play next" first and shifts the head', () => {
    setQueue(['a1', 'b2']); enqueue('b2'); enqueue('c3');
    expect(getQueue()).toEqual(['a1', 'b2', 'c3']);
    playNext('c3'); expect(getQueue()).toEqual(['c3', 'a1', 'b2']);
    dequeue('a1'); expect(getQueue()).toEqual(['c3', 'b2']);
    expect(shiftQueue()).toBe('c3'); expect(shiftQueue()).toBe('b2'); expect(shiftQueue()).toBeNull();
  });
});

describe('queue in the share link', () => {
  it('round-trips through the clean URL and the hash, and bad ids are dropped', () => {
    const url = buildUrl({ track: 'jukebox', story: 'gistemp', q: ['co2', 'c-npl-temp', 'BAD ID', 'co2'] });
    expect(url).toBe('/jukebox?story=gistemp&q=co2%2Cc-npl-temp');
    const [path, search] = url.split('?');
    expect(decodeLocation(path, '?' + search, '', { frames: [], pairs: [] })?.q).toEqual(['co2', 'c-npl-temp']);
    expect(decodeShare('#' + encodeShare({ track: 'jukebox', q: ['co2'] }), { frames: [], pairs: [] })?.q).toEqual(['co2']);
    expect(parseQueue('x,ok-id,<script>')).toEqual(['ok-id']);
  });
  it('old links without q still decode', () => {
    const d = decodeLocation('/jukebox', '?story=gistemp&t=1998', '', { frames: [], pairs: [] });
    expect(d?.story).toBe('gistemp'); expect(d?.q).toBeUndefined();
  });
});

describe('full player', () => {
  const np = (over: Partial<NowPlaying> = {}): NowPlaying => ({
    id: 'jukebox', title: 'Global temperature', subtitle: 's', badge: 'snapshot', state: 'ready', index: 0, count: 5, label: '1998', valueText: '', spark: [], volume: 1, muted: false, speed: 1,
    details: { narration: 'In 1998 it was warm.', mapping: ['Higher note = warmer.'] }, upNext: [{ id: 'co2', title: 'CO₂' }],
    controls: { toggle: () => {}, stop: () => {}, nextStory: () => {}, dequeue: () => {}, clearQueue: () => {} }, ...over,
  });
  it('opens with tabs for Up next, Narration and How it sounds', () => {
    render(<PrefsProvider><NowPlayingBar /></PrefsProvider>); act(() => publishNowPlaying(np()));
    expect(screen.queryByRole('tabpanel')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open the full player' }));
    expect(screen.getByRole('tabpanel').textContent).toContain('CO₂');
    fireEvent.click(screen.getByRole('tab', { name: 'Narration' }));
    expect(screen.getByRole('tabpanel').textContent).toContain('In 1998 it was warm.');
    fireEvent.click(screen.getByRole('tab', { name: 'How it sounds' }));
    expect(screen.getByRole('tabpanel').textContent).toContain('Higher note');
    fireEvent.click(screen.getByRole('button', { name: 'Close the full player' }));
    expect(screen.queryByRole('tabpanel')).toBeNull();
  });
  it('shows the next-story button only when something is queued', () => {
    render(<PrefsProvider><NowPlayingBar /></PrefsProvider>);
    act(() => publishNowPlaying(np({ upNext: [] })));
    expect(screen.queryByRole('button', { name: 'Next story in the queue' })).toBeNull();
    act(() => publishNowPlaying(np()));
    expect(screen.getByRole('button', { name: 'Next story in the queue' })).toBeTruthy();
  });
});
