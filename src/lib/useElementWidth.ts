import { useEffect, useState } from 'react';

/** Rendered width (CSS px) of an element, kept live with a ResizeObserver. `fallback` applies until measured and wherever layout does not exist (tests, SSR).
 *  Charts use it as their viewBox width, so one user unit is one CSS pixel and SVG text renders at exactly its font size.
 *  Returns a callback ref, so an element that mounts later (after an early return) is still measured. */
export function useElementWidth<T extends Element>(fallback: number): [(el: T | null) => void, number] {
  const [el, setEl] = useState<T | null>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    if (!el) return;
    const read = () => { const n = Math.round(el.getBoundingClientRect().width); if (n > 0) setW((p) => (p === n ? p : n)); };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, w];
}
