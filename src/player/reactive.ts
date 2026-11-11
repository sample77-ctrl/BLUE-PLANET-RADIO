import { useEffect, type RefObject } from 'react';
import { AudioContextManager } from '../audio/audioContext';

/**
 * Audio-reactive glow. Reads the shared master analyser (already in the audio graph, so nothing is added to it) at most 30 times a second,
 * reduces it to four bands plus a level, and writes CSS variables on one element: no React re-render. Only `transform` and `opacity` use them.
 * Stops while the page is hidden, when nothing is playing, and under reduced motion.
 */
export function useReactiveGlow(ref: RefObject<HTMLElement | null>, active: boolean, reduceMotion: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reset = () => { ['--np-amp', '--np-bass', '--np-mid', '--np-high'].forEach((v) => el.style.removeProperty(v)); };
    if (!active || reduceMotion) { reset(); return; }
    let raf = 0, last = 0, buf: Uint8Array<ArrayBuffer> | null = null;
    const prev = { amp: -1, bass: -1, mid: -1, high: -1 };
    const put = (k: keyof typeof prev, name: string, v: number) => { if (Math.abs(v - prev[k]) >= 0.01) { prev[k] = v; el.style.setProperty(name, v.toFixed(2)); } };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || now - last < 33) return;
      last = now;
      const an = AudioContextManager.getAnalyser();
      if (!an) return;
      if (!buf || buf.length !== an.frequencyBinCount) buf = new Uint8Array(an.frequencyBinCount);
      an.getByteFrequencyData(buf);
      const n = buf.length, avg = (a: number, b: number) => { let s = 0; for (let i = a; i < b; i++) s += buf![i]; return s / Math.max(1, b - a) / 255; };
      const bass = avg(0, Math.max(1, n >> 4)), mid = avg(n >> 4, n >> 2), high = avg(n >> 2, n >> 1);
      put('bass', '--np-bass', bass); put('mid', '--np-mid', mid); put('high', '--np-high', high); put('amp', '--np-amp', Math.min(1, (bass + mid + high) / 1.5));
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); reset(); };
  }, [ref, active, reduceMotion]);
}
