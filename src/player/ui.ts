import { useSyncExternalStore } from 'react';

/** Whether the full player is open and on which tab, so keyboard shortcuts and the bar share it. */
export type FullTab = 'next' | 'narration' | 'how';
let st = { open: false, tab: 'next' as FullTab };
const subs = new Set<() => void>();
const set = (n: typeof st) => { st = n; subs.forEach((f) => f()); };
export const getFullPlayer = () => st;
export const setFullPlayer = (open: boolean, tab?: FullTab) => set({ open, tab: tab ?? st.tab });
export const toggleFullPlayer = () => set({ ...st, open: !st.open });
export const setFullTab = (tab: FullTab) => set({ ...st, tab });
export function useFullPlayer() { return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, getFullPlayer, getFullPlayer); }
