import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import type { DatasetTheme } from '../lib/datasetTheme';

/** One shared "now playing" record. A player publishes its state and controls; the bar reads it. Engines stay inside each track. */
export interface NowPlaying {
  id: string;
  title: string;
  subtitle: string; // source · period · unit
  badge: 'sample' | 'snapshot'; // never "live"
  state: 'busy' | 'ready' | 'playing' | 'paused';
  index: number; count: number; // count 0 = no position to show
  label: string; valueText: string; // current position, e.g. "1998" / "+0.61 °C"
  spark: number[]; // the series, for the scrubber backdrop
  dataset?: DatasetTheme; // tints the interface accent while this plays
  /** Shown in the full player. */
  details?: { narration: string; mapping: string[] };
  /** An extra full-player tab ("Waveform & stereo" for the Atlas): the live signal the player produces. */
  signal?: ReactNode;
  upNext?: { id: string; title: string }[];
  background?: boolean; // published by a player whose view is not on screen (it keeps playing)
  pauses?: boolean; // false: the player can only start/stop (shown as Stop, not Pause)
  volume?: number; muted?: boolean; speed?: number;
  /** Only what the player really supports: the bar hides the rest. */
  controls: {
    toggle: () => void; stop: () => void; nextStory?: () => void; dequeue?: (id: string) => void; clearQueue?: () => void; step?: (by: 1 | -1) => void; seek?: (i: number) => void;
    setVolume?: (v: number) => void; setMuted?: (m: boolean) => void; setSpeed?: (s: number) => void;
  };
}

/** Two slots: the view on screen (foreground, last writer wins) and a player that keeps going while another view is in front (background, §3.1 D9). */
let fg: NowPlaying | null = null, bg: NowPlaying | null = null, current: NowPlaying | null = null;
const subs = new Set<() => void>();
/** The bar shows a background player while it is playing; otherwise the view on screen; otherwise a paused background player. */
const pick = () => (bg?.state === 'playing' ? bg : fg ?? bg);
const emit = () => { current = pick(); subs.forEach((f) => f()); };

/** Publish a player's record. Pass null (with its id) to clear; a different player's record is left alone. `np.background` puts it in the background slot. */
export function publishNowPlaying(np: NowPlaying | null, id?: string) {
  if (np === null) {
    let hit = false;
    if (fg && (id === undefined || fg.id === id)) { fg = null; hit = true; }
    if (bg && (id === undefined || bg.id === id)) { bg = null; hit = true; }
    if (hit) emit();
    return;
  }
  if (np.background) { bg = np; if (fg?.id === np.id) fg = null; } else { fg = np; if (bg?.id === np.id) bg = null; }
  emit();
}
export const getNowPlaying = () => current;
export function subscribeNowPlaying(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }
export function useNowPlaying(): NowPlaying | null {
  return useSyncExternalStore(subscribeNowPlaying, getNowPlaying, () => null);
}

/** Spoken form of a position for aria-valuetext: words, never clock-style "1:00". */
export function positionText(label: string, valueText: string, i: number, n: number, t: (k: 'jbPosition', v: Record<string, string | number>) => string) {
  return [label, valueText, t('jbPosition', { i, n })].filter(Boolean).join(', ');
}

/** For tracks: publish this render's record (null = not active) and clear it, if still ours, on unmount. */
export function usePublishNowPlaying(id: string, np: NowPlaying | null) {
  useEffect(() => { publishNowPlaying(np, id); });
  useEffect(() => () => publishNowPlaying(null, id), [id]);
}
