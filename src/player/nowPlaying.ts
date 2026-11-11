import { useSyncExternalStore } from 'react';

/** One shared "now playing" record. A player publishes its state and controls; the bar reads it. Engines stay inside each track. */
export interface NowPlaying {
  id: string;
  title: string;
  subtitle: string; // source · period · unit
  badge: 'sample' | 'snapshot'; // never "live"
  state: 'busy' | 'ready' | 'playing' | 'paused';
  index: number; count: number;
  label: string; valueText: string; // current position, e.g. "1998" / "+0.61 °C"
  spark: number[]; // the series, for the scrubber backdrop
  volume: number; muted: boolean; speed: number;
  controls: {
    toggle: () => void; stop: () => void; step: (by: 1 | -1) => void; seek: (i: number) => void;
    setVolume: (v: number) => void; setMuted: (m: boolean) => void; setSpeed: (s: number) => void;
  };
}

let current: NowPlaying | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

/** Publish a player's record. Pass null (with its id) to clear; a different player's record is left alone. */
export function publishNowPlaying(np: NowPlaying | null, id?: string) {
  if (np === null) { if (current && (id === undefined || current.id === id)) { current = null; emit(); } return; }
  current = np; emit();
}
export const getNowPlaying = () => current;
export function useNowPlaying(): NowPlaying | null {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, getNowPlaying, () => null);
}

/** Spoken form of a position for aria-valuetext: words, never clock-style "1:00". */
export function positionText(label: string, valueText: string, i: number, n: number, t: (k: 'jbPosition', v: Record<string, string | number>) => string) {
  return [label, valueText, t('jbPosition', { i, n })].filter(Boolean).join(', ');
}
