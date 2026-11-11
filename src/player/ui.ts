import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

/** Whether the full player is open and on which tab, so keyboard shortcuts and the bar share it. */
export type FullTab = 'next' | 'narration' | 'how' | 'signal';
let st = { open: false, tab: 'next' as FullTab };
const subs = new Set<() => void>();
const apply = (n: typeof st) => { st = n; subs.forEach((f) => f()); };
/** Opening or closing the full player morphs the title from the bar (View Transitions). Feature-detected, and skipped under reduced motion (in-app switch or OS setting). */
const set = (n: typeof st) => {
  const d = typeof document === 'undefined' ? null : (document as Document & { startViewTransition?: (cb: () => void) => unknown });
  const calm = typeof window === 'undefined' || document.documentElement.classList.contains('rm') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (d?.startViewTransition && !calm && n.open !== st.open) d.startViewTransition(() => flushSync(() => apply(n)));
  else apply(n);
};
export const getFullPlayer = () => st;
export const setFullPlayer = (open: boolean, tab?: FullTab) => set({ open, tab: tab ?? st.tab });
export const toggleFullPlayer = () => set({ ...st, open: !st.open });
export const setFullTab = (tab: FullTab) => set({ ...st, tab });
export function useFullPlayer() { return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, getFullPlayer, getFullPlayer); }
