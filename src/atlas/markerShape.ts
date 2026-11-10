import type { PhenomenonType } from '../types/dataset';

/** Each layer has its own marker shape, so colour is never the only cue: fire = circle, rain = drop, ocean heat = diamond. */
export type MarkerShape = 'circle' | 'drop' | 'diamond';
export const MARKER_SHAPE: Record<PhenomenonType, MarkerShape> = { fire: 'circle', precipitation: 'drop', sst: 'diamond' };

/** SVG path of a marker centred on (cx, cy) with radius r; a circle is drawn as two arcs so every shape is one <path>. */
export function markerPath(shape: MarkerShape, cx: number, cy: number, r: number): string {
  const f = (n: number) => +n.toFixed(2);
  if (shape === 'drop') return `M${f(cx)} ${f(cy - r * 1.6)} C${f(cx + r * 1.1)} ${f(cy - r * .2)} ${f(cx + r * 1.1)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} C${f(cx - r * 1.1)} ${f(cy + r)} ${f(cx - r * 1.1)} ${f(cy - r * .2)} ${f(cx)} ${f(cy - r * 1.6)}Z`;
  if (shape === 'diamond') return `M${f(cx)} ${f(cy - r * 1.35)} L${f(cx + r * 1.15)} ${f(cy)} L${f(cx)} ${f(cy + r * 1.35)} L${f(cx - r * 1.15)} ${f(cy)}Z`;
  return `M${f(cx - r)} ${f(cy)} a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;
}
