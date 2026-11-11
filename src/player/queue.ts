import { useSyncExternalStore } from 'react';

/** "Up next" for the Data Jukebox: story ids in order. Lives in the share link (`q=`). */
let q: string[] = [];
const subs = new Set<() => void>();
const set = (next: string[]) => { q = next.slice(0, 20); subs.forEach((f) => f()); };

export const getQueue = () => q;
export const setQueue = (ids: string[]) => set([...new Set(ids)]);
export const enqueue = (id: string) => { if (!q.includes(id)) set([...q, id]); };
export const playNext = (id: string) => set([id, ...q.filter((x) => x !== id)]);
export const dequeue = (id: string) => set(q.filter((x) => x !== id));
export const clearQueue = () => set([]);
/** Removes and returns the head. */
export function shiftQueue(): string | null { const h = q[0] ?? null; if (h) set(q.slice(1)); return h; }
export function useQueue(): string[] {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, getQueue, () => []);
}
