/** The signal colour (roadmap v5): one loud colour taken from what is being heard. A frame's colour under the needle is sampled, clamped in oklch lightness
 *  so it is always legible both as text on the near-black ground and as a field with dark text on it, and published as --signal-live / --on-signal-live.
 *  Pure maths here (no DOM, no canvas), so it is unit-tested; `applySignal` is the only function that touches the page. */
export type RGB = [number, number, number]; // 0..255
export interface Signal { hex: string; onSignal: string; L: number; C: number; h: number }

export const GROUND = '#0a0a0a';
/** Lightness window of a signal colour. At L >= .72 the colour is >= 7:1 on the ground; at L <= .90 black on it stays >= 9:1. */
export const SIGNAL_L_MIN = 0.72;
export const SIGNAL_L_MAX = 0.9;
export const SIGNAL_C_MAX = 0.2;
export const DEFAULT_SIGNAL = '#baed3f';
const DEFAULT_HUE = 125;

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLin = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function rgbToOklch([r, g, b]: RGB): { L: number; C: number; h: number } {
  const [lr, lg, lb] = [r, g, b].map((v) => toLin(v / 255));
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

const linearRgb = (L: number, C: number, h: number): RGB => {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
};
/** oklch to sRGB 0..255; chroma is reduced until the colour is inside the sRGB gamut (lightness and hue are kept). */
export function oklchToRgb(L: number, C: number, h: number): RGB {
  let c = C, rgb = linearRgb(L, c, h);
  while (c > 0 && rgb.some((x) => x < -0.0005 || x > 1.0005)) { c = Math.max(0, c - 0.004); rgb = linearRgb(L, c, h); }
  return rgb.map((x) => Math.round(fromLin(clamp01(x)) * 255)) as RGB;
}

export const toHex = (rgb: RGB) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
export const fromHex = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
export const luminance = (rgb: RGB) => { const [r, g, b] = rgb.map((v) => toLin(v / 255)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrastRatio = (a: RGB | string, b: RGB | string) => {
  const [x, y] = [luminance(typeof a === 'string' ? fromHex(a) : a), luminance(typeof b === 'string' ? fromHex(b) : b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** A frame colour to a signal colour. Near-grey pixels (clouds, black margins) give the default signal, so the interface never goes grey. */
export function signalFromRgb(rgb: RGB): Signal {
  const { L: L0, C, h } = rgbToOklch(rgb);
  const hue = C < 0.03 ? DEFAULT_HUE : h;
  const chroma = C < 0.03 ? 0.2 : Math.min(SIGNAL_C_MAX, Math.max(0.09, C));
  let L = C < 0.03 ? 0.86 : Math.min(SIGNAL_L_MAX, Math.max(SIGNAL_L_MIN, L0)), out = oklchToRgb(L, chroma, hue);
  // The clamp itself guarantees the legibility window; the loop is a safety net for a gamut quirk at the ends.
  while (contrastRatio(out, GROUND) < 4.5 && L < SIGNAL_L_MAX) { L += 0.01; out = oklchToRgb(L, chroma, hue); }
  const onSignal = contrastRatio(out, '#0a0a0a') >= contrastRatio(out, '#ffffff') ? '#0a0a0a' : '#ffffff';
  const back = rgbToOklch(out);
  return { hex: toHex(out), onSignal, L: back.L, C: back.C, h: back.h };
}

/** Publishes the signal colour to the whole interface (null = back to the dataset colour or the default). Browser only. */
export function applySignal(rgb: RGB | null) {
  if (typeof document === 'undefined') return;
  const st = document.documentElement.style;
  if (!rgb) { st.removeProperty('--signal-live'); st.removeProperty('--on-signal-live'); return; }
  const s = signalFromRgb(rgb);
  st.setProperty('--signal-live', s.hex);
  st.setProperty('--on-signal-live', s.onSignal);
}
