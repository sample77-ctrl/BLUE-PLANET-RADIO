import type { ScoreNote } from './score';

/** The share card (roadmap v5, V4): a 1080 x 1350 PNG drawn on a canvas, no server. It holds the EIC frame with the needle where it was, the frame's own score line under it,
 *  the signal colour of what was heard, the source, the method in one line, and the link back to the Stage. Layout maths is pure and tested; drawing needs a 2D context. */
export const CARD_W = 1080, CARD_H = 1350, CARD_PAD = 64;

/** The largest size with the aspect of w x h that fits in maxW x maxH (never upscaled past the box). */
export function fitBox(w: number, h: number, maxW: number, maxH: number): { w: number; h: number } {
  if (!(w > 0) || !(h > 0)) return { w: maxW, h: maxH };
  const k = Math.min(maxW / w, maxH / h);
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

/** Greedy word wrap with a measuring function. At most `maxLines`; the last line ends in an ellipsis when text is left over. A single word wider than the box stays whole on its line. */
export function wrapLines(measure: (s: string) => number, text: string, maxW: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean), lines: string[] = [];
  let cur = '', i = 0;
  for (; i < words.length; i++) {
    const next = cur ? `${cur} ${words[i]}` : words[i];
    if (cur && measure(next) > maxW) {
      if (lines.length === maxLines - 1) break;
      lines.push(cur); cur = words[i];
    } else cur = next;
  }
  if (i < words.length) { // out of lines: cut the last line to fit, with an ellipsis
    let rest = [cur, ...words.slice(i)].filter(Boolean).join(' ');
    while (rest.length > 1 && measure(`${rest}…`) > maxW) rest = rest.slice(0, -1).trimEnd();
    lines.push(`${rest}…`);
  } else if (cur) lines.push(cur);
  return lines;
}

/** Where the notes of the score go inside a box: one cell per column and band; `y` counts from the top (the highest band). */
export function scoreCell(n: Pick<ScoreNote, 'col' | 'row'>, cols: number, rows: number, w: number, h: number) {
  return { x: (n.col / cols) * w, y: (n.row / rows) * h, w: w / cols, h: h / rows };
}

export interface CardInput {
  /** The frame as drawn on the Stage. */
  frame: CanvasImageSource; frameW: number; frameH: number;
  kicker: string; title: string;
  notes: ScoreNote[]; cols: number; rows: number; col: number;
  /** "Year" / "Longitude" / "Across the picture", its value, and (when known) the note under the needle. */
  bigLabel: string; bigValue: string; pitch: string | null;
  source: string; method: string; url: string;
  /** Colours as CSS strings: the signal colour, the text on it, the ground. */
  signal: string; onSignal: string; ground?: string;
  /** Font families as CSS font-family values. */
  fonts: { display: string; body: string; mono: string };
}

/** Draws the card on a 1080 x 1350 context and returns the box each part took (for tests and the text alternative). */
export function drawShareCard(ctx: CanvasRenderingContext2D, o: CardInput) {
  const { fonts } = o, W = CARD_W, P = CARD_PAD, IW = W - 2 * P, ground = o.ground ?? '#0a0a0a';
  const spaced = (px: string) => { try { (ctx as unknown as { letterSpacing: string }).letterSpacing = px; } catch { /* not supported: plain spacing */ } };
  const text = (s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') => { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); };
  const measure = (font: string) => (s: string) => { ctx.font = font; return ctx.measureText(s).width; };
  ctx.fillStyle = ground; ctx.fillRect(0, 0, W, CARD_H);
  let y = P;

  spaced('3px'); text(o.kicker.toUpperCase(), P, y + 20, `500 22px ${fonts.mono}`, o.signal); spaced('0px');
  y += 56;

  const tFont = `800 54px ${fonts.display}`, tLines = wrapLines(measure(tFont), o.title, IW, 2);
  tLines.forEach((l, i) => text(l, P, y + 46 + i * 60, tFont, '#f4f4f2'));
  y += tLines.length * 60 + 18;

  const box = fitBox(o.frameW, o.frameH, IW, 470), fx = P + Math.round((IW - box.w) / 2);
  ctx.fillStyle = '#000'; ctx.fillRect(fx, y, box.w, box.h);
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(o.frame, fx, y, box.w, box.h);
  const nx = fx + ((o.col + 0.5) / o.cols) * box.w;
  ctx.fillStyle = o.signal; ctx.fillRect(Math.round(nx) - 2, y, 4, box.h);
  const frameBox = { x: fx, y, w: box.w, h: box.h };
  y += box.h + 12;

  const sh = 190;
  ctx.fillStyle = '#000'; ctx.fillRect(fx, y, box.w, sh);
  for (const n of o.notes) {
    const c = scoreCell(n, o.cols, o.rows, box.w, sh);
    ctx.fillStyle = `rgba(${n.rgb[0]},${n.rgb[1]},${n.rgb[2]},${(0.3 + 0.7 * n.level).toFixed(3)})`;
    ctx.fillRect(Math.round(fx + c.x), Math.round(y + c.y), Math.max(1, Math.ceil(c.w)), Math.max(1, Math.ceil(c.h) - 1));
  }
  ctx.fillStyle = o.signal; ctx.fillRect(Math.round(nx) - 2, y, 4, sh);
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2; ctx.strokeRect(fx + 1, y + 1, box.w - 2, sh - 2);
  const scoreBox = { x: fx, y, w: box.w, h: sh };
  y += sh + 18;

  const fh = 150;
  ctx.fillStyle = o.signal; ctx.fillRect(P, y, IW, fh);
  spaced('2px'); text(o.bigLabel.toUpperCase(), P + 28, y + 40, `500 20px ${fonts.mono}`, o.onSignal); spaced('0px');
  let bigPx = 104; const bigFont = (px: number) => `900 ${px}px ${fonts.display}`;
  while (bigPx > 48 && measure(bigFont(bigPx))(o.bigValue) > IW * 0.62) bigPx -= 6;
  text(o.bigValue, P + 28, y + fh - 26, bigFont(bigPx), o.onSignal);
  if (o.pitch) text(o.pitch, P + IW - 28, y + fh - 30, `600 34px ${fonts.mono}`, o.onSignal, 'right');
  y += fh + 24;

  const sFont = `400 25px ${fonts.body}`, sLines = wrapLines(measure(sFont), o.source, IW, 3);
  sLines.forEach((l, i) => text(l, P, y + 22 + i * 33, sFont, '#c9c9c4'));
  y += sLines.length * 33 + 6;
  const mFont = `400 22px ${fonts.body}`, mLines = wrapLines(measure(mFont), o.method, IW, 2);
  mLines.forEach((l, i) => text(l, P, y + 22 + i * 30, mFont, '#8f8f8a'));
  y += mLines.length * 30 + 10;
  const uFont = `500 22px ${fonts.mono}`, uLines = wrapLines(measure(uFont), o.url.replace(/^https?:\/\//, ''), IW, 1);
  text(uLines[0] ?? '', P, Math.min(y + 24, CARD_H - 28), uFont, o.signal);
  return { frame: frameBox, score: scoreBox, bottom: y + 24 };
}

/** Renders the card to a PNG blob (null when the canvas cannot be read or encoded). Fonts used by the page are awaited first so the card matches the screen. */
export async function renderShareCard(o: CardInput): Promise<Blob | null> {
  try { await document.fonts?.ready; } catch { /* no font API: the fallback faces draw */ }
  const cv = document.createElement('canvas'); cv.width = CARD_W; cv.height = CARD_H;
  const ctx = cv.getContext('2d'); if (!ctx) return null;
  drawShareCard(ctx, o);
  return new Promise((res) => { try { cv.toBlob((b) => res(b), 'image/png'); } catch { res(null); } });
}

/** The file name of a card: `blue-planet-radio-<frame id>.png`, safe for any file system. */
export const cardFileName = (frameId: string) => `blue-planet-radio-${frameId.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.png`;
