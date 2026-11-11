import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

/** Whether the full player is open and on which tab, so keyboard shortcuts and the bar share it. */
export type FullTab = 'next' | 'narration' | 'how' | 'signal';
let st = { open: false, tab: 'next' as FullTab };
const subs = new Set<() => void>();
const apply = (n: typeof st) => { st = n; subs.forEach((f) => f()); };
type VT = { startViewTransition?: (cb: () => void) => unknown };
/** Runs a state change inside a View Transition. Element-scoped (`scope.startViewTransition`, Chrome 147+) when the browser has it, so a WebGL canvas elsewhere keeps rendering;
 *  otherwise the root transition; otherwise it just runs. Skipped under reduced motion (in-app switch or OS setting). */
export function withViewTransition(cb: () => void, scope?: Element | null) {
  const calm = typeof window === 'undefined' || document.documentElement.classList.contains('rm') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const el = scope as (Element & VT) | null | undefined, d = typeof document === 'undefined' ? null : (document as Document & VT);
  const start = calm ? undefined : el?.startViewTransition ? el.startViewTransition.bind(el) : d?.startViewTransition?.bind(d);
  if (start) start(() => flushSync(cb)); else cb();
}
/** Opening or closing the full player morphs the title from the bar (View Transitions). */
const set = (n: typeof st) => { if (n.open !== st.open) withViewTransition(() => apply(n)); else apply(n); };
export const getFullPlayer = () => st;
export const setFullPlayer = (open: boolean, tab?: FullTab) => set({ open, tab: tab ?? st.tab });
export const toggleFullPlayer = () => set({ ...st, open: !st.open });
export const setFullTab = (tab: FullTab) => set({ ...st, tab });
export function useFullPlayer() { return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, getFullPlayer, getFullPlayer); }
