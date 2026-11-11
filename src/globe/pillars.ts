/** Pure maths for the Atlas light pillars (roadmap v5, V5). A pillar is a thin beam of light standing on each data point: its height is the value, and it pulses with a ripple while that point's voice sounds, so the eye and the ear are on the same beat. */
const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));

export const PILLAR_MIN = 0.1, PILLAR_SPAN = 0.55;
/** Beam length in globe units (the Earth's radius is 2): 0.10 for the weakest value up to 0.65 for the strongest. */
export const pillarLength = (normalized: number) => PILLAR_MIN + PILLAR_SPAN * clamp01(normalized);
/** Beam radius at its base: a little thicker for stronger values, never a bar that hides the marker. */
export const pillarWidth = (normalized: number) => 0.006 + 0.01 * clamp01(normalized);

export interface Pulse {
  /** Ripple ring scale on the surface, 1 → 2.6, then it starts again. */
  ripple: number;
  /** Ring opacity: strong at the start of a ripple, gone at the end. */
  ring: number;
  /** How much the beam is lifted by the beat (1 = rest). A sharp attack that decays, like a note. */
  lift: number;
}
/** One beat of a sounding voice. `elapsedSec` since the voice started; louder (more intense) voices beat faster. With `still` (reduced motion or a calm background) nothing moves: a steady ring and a steady beam. */
export function pulseAt(elapsedSec: number, intensity: number, still = false): Pulse {
  if (still) return { ripple: 1.4, ring: 0.8, lift: 1 };
  const rate = 1.8 + clamp01(intensity) * 2.0; // ripples per 1.6 s span, as the original rings
  const span = (Math.max(0, elapsedSec) * rate) % 1.6;
  const phase = span / 1.6; // 0..1 inside one beat
  return { ripple: 1 + span, ring: Math.max(0, 0.95 - span / 1.6), lift: 1 + 0.45 * (1 - phase) ** 2 };
}

/** Brightness of a resting pillar by the layer's state: dim when nothing sounds, the selected point a little brighter, a sounding voice at full. */
export const pillarOpacity = (sounding: boolean, selected: boolean) => (sounding ? 0.95 : selected ? 0.7 : 0.34);
