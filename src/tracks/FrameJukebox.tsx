import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, ImagePlus, Loader2, AlertTriangle, Repeat, BookOpen, Link2, ChevronLeft, ChevronRight, Headphones, Share2, Music2, Download, X } from 'lucide-react';
import { FRAMES, gibsUrl, loadFileCanvases, loadFrameCanvases, type NasaFrame } from '../lib/gibs';
import { EIC_FRAMES, EIC_STORY } from '../lib/eicFrames';
import { decodeLocation, encodeShare } from '../lib/shareLink';
import { activeColumns, bandHz, colAt, nextColumn, noteName, orderRange, rowAt, stepMs, timbreWord } from '../lib/frameSweep';
import { AudioContextManager } from '../audio/audioContext';
import { usePrefs, speak } from '../lib/prefs';
import { usePlaybackReport } from '../lib/playbackContext';
import { usePublishNowPlaying } from '../player/nowPlaying';
import { useReactiveGlow } from '../player/reactive';
import { applySignal, type RGB } from '../lib/signal';
import { axisValueAt, columnColor, mixRgb, RELATED_STORY } from '../lib/frameStage';
import { digits } from '../jukebox/format';
import { SeriesUnderFrame } from './SeriesUnderFrame';
import { FrameScore } from './ScoreView';
import { dominantBand, frameScore, type ScoreNote } from '../lib/score';
import { cardFileName, renderShareCard } from '../lib/shareCard';

const ALL_FRAMES: NasaFrame[] = [...EIC_FRAMES, ...FRAMES];
const COLS = 128, ROWS = 12, SWEEP_SEC = 20;
// Top row (north) is the highest pitch, like the globe's latitude tilt.
const rowHz = (row: number) => bandHz(row, ROWS);

interface Grid { lum: Float32Array; warm: Float32Array; green: Float32Array; rgb: Uint8ClampedArray }
function toGrid(cv: HTMLCanvasElement): Grid {
  const g = document.createElement('canvas'); g.width = COLS; g.height = ROWS;
  const c = g.getContext('2d', { willReadFrequently: true })!;
  c.imageSmoothingQuality = 'high';
  c.drawImage(cv, 0, 0, COLS, ROWS);
  const px = c.getImageData(0, 0, COLS, ROWS).data;
  const n = COLS * ROWS, lum = new Float32Array(n), warm = new Float32Array(n), green = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const R = px[i * 4] / 255, G = px[i * 4 + 1] / 255, B = px[i * 4 + 2] / 255;
    lum[i] = 0.299 * R + 0.587 * G + 0.114 * B;
    warm[i] = Math.max(0, R - B); green[i] = Math.max(0, G - Math.max(R, B));
  }
  return { lum, warm, green, rgb: px };
}

interface Bank { oscs: OscillatorNode[]; gains: GainNode[]; filters: BiquadFilterNode[]; pan: StereoPannerNode; out: GainNode }
function makeBank(ctx: AudioContext, dest: AudioNode): Bank {
  const out = ctx.createGain(); out.gain.value = 0.9;
  const pan = ctx.createStereoPanner(); pan.connect(out); out.connect(dest);
  const oscs: OscillatorNode[] = [], gains: GainNode[] = [], filters: BiquadFilterNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = rowHz(r);
    f.type = 'lowpass'; f.frequency.value = 600; f.Q.value = 0.7;
    g.gain.value = 0;
    o.connect(f); f.connect(g); g.connect(pan); o.start();
    oscs.push(o); gains.push(g); filters.push(f);
  }
  return { oscs, gains, filters, pan, out };
}
function disposeBank(b: Bank | null) {
  if (!b) return;
  b.oscs.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
  b.out.disconnect();
}

const lonAt = (col: number) => Math.round(-180 + ((col + 0.5) / COLS) * 360);
const latAt = (row: number) => Math.round(90 - ((row + 0.5) / ROWS) * 180);
const fmtLon = (l: number) => `${Math.abs(l)}°${l < 0 ? 'W' : l > 0 ? 'E' : ''}`;
const fmtLat = (l: number) => `${Math.abs(l)}°${l < 0 ? 'S' : l > 0 ? 'N' : ''}`;

// Pairs for "then and now". Same layer and day of year, one year apart (or season apart for vegetation).
const PAIRS: { id: string; label: string; a: NasaFrame; b: NasaFrame }[] = [
  { id: 'eic', label: 'EIC: greenhouse gases (left ear) → ocean heat (right ear)', a: EIC_FRAMES[0], b: EIC_FRAMES[1] },
  { id: 'sst', label: 'Ocean heat anomaly: Sep 2025 → Sep 2026', a: { ...FRAMES[3], date: '2025-09-30', title: '30 Sep 2025' }, b: { ...FRAMES[3], title: '30 Sep 2026' } },
  { id: 'veg', label: 'Vegetation: March → September 2026', a: { ...FRAMES[6], date: '2026-03-22', title: '22 Mar 2026' }, b: { ...FRAMES[6], title: '22 Sep 2026' } },
  { id: 'fire', label: 'Fires: 3 Oct 2025 → 3 Oct 2026', a: { ...FRAMES[1], date: '2025-10-03', title: '3 Oct 2025' }, b: { ...FRAMES[1], title: '3 Oct 2026' } },
];

interface JukeboxProps { autoPlay?: boolean; onAutoPlayed?: () => void; onPlay?: () => void; onOpenStory?: (id: string) => void }

export const FrameJukebox: React.FC<JukeboxProps> = ({ autoPlay, onAutoPlayed, onPlay, onOpenStory }) => {
  const { t, lang, narration, reduceMotion } = usePrefs();
  const rmRef = useRef(reduceMotion);
  useEffect(() => { rmRef.current = reduceMotion; });
  const sigRef = useRef<RGB | null>(null); // the signal colour, smoothed
  const readRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const [dataOpen, setDataOpen] = useState(false); // the series behind the frame, played under it
  const [ar, setAr] = useState(2); // width / height of what is on stage, for the frame's size
  const [score, setScore] = useState<{ a: ScoreNote[]; b: ScoreNote[] | null } | null>(null); // the notes of the picture(s) on stage, for the score view and the share card
  const [scoreOpen, setScoreOpen] = useState(true);
  const [card, setCard] = useState<{ url: string; blob: Blob; name: string; link: string; title: string } | null>(null); // the share card, once made
  const [cardMsg, setCardMsg] = useState('');
  // A shared link (#v1&track=frames&...) restores the picture, the comparison and the needle.
  const [share] = useState(() => {
    const s = decodeLocation(window.location.pathname, window.location.search, window.location.hash, { frames: ALL_FRAMES.map((f) => f.id), pairs: [...PAIRS.map((p) => p.id), 'custom'] });
    return s?.track === 'frames' ? s : null;
  });
  const pendingCol = useRef<number | null>(share?.col ?? null);
  const [mode, setMode] = useState<'single' | 'pair'>(share?.pair ? 'pair' : 'single');
  const [frameId, setFrameId] = useState(share?.frame ?? EIC_FRAMES[0].id);
  const [pairId, setPairId] = useState(share?.pair ?? PAIRS[0].id);
  const [customA, setCustomA] = useState(share?.a ?? EIC_FRAMES[0].id);
  const [customB, setCustomB] = useState(share?.b ?? EIC_FRAMES[1].id);
  const [story, setStory] = useState<number | null>(null);
  const [loadedFor, setLoadedFor] = useState('');
  const lastAnnounce = useRef(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playing, setPlaying] = useState(false);
  useReactiveGlow(readRef, playing, reduceMotion); // the big numeral's weight and width follow the sound (CSS variables on one element, no re-render)
  const [col, setCol] = useState(0);
  const [readout, setReadout] = useState('');
  const [srText, setSrText] = useState('');
  const [legend, setLegend] = useState(true);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [heard, setHeard] = useState<{ note: string; hz: number; level: number; color: string; timbre: string } | null>(null);
  const viewA = useRef<HTMLCanvasElement>(null), viewB = useRef<HTMLCanvasElement>(null);
  const grids = useRef<{ a: Grid | null; b: Grid | null }>({ a: null, b: null });
  const banks = useRef<{ a: Bank | null; b: Bank | null }>({ a: null, b: null });
  const timer = useRef<number | null>(null);
  const probeTimer = useRef<number | null>(null);
  const stepRef = useRef<() => void>(() => {});
  const endRef = useRef<() => void>(() => {});
  const savedLoop = useRef(true);
  const colRef = useRef(0);
  const [speed, setSpeedState] = useState(1);
  const [loop, setLoopState] = useState(true);
  const [region, setRegionState] = useState<[number, number] | null>(null);
  const speedRef = useRef(1), loopRef = useRef(true), regionRef = useRef<[number, number] | null>(null);
  const setSpeed = (v: number) => { speedRef.current = v; setSpeedState(v); };
  const setLoop = (v: boolean) => { loopRef.current = v; setLoopState(v); };
  const setRegion = (v: [number, number] | null) => { regionRef.current = v; setRegionState(v); };
  const frameBox = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x0: number; moved: boolean } | null>(null);

  const frame = ALL_FRAMES.find((f) => f.id === frameId)!;
  const pair = useMemo(() => pairId === 'custom'
    ? { id: 'custom', label: '', a: ALL_FRAMES.find((f) => f.id === customA)!, b: ALL_FRAMES.find((f) => f.id === customB)! }
    : PAIRS.find((p) => p.id === pairId)!, [pairId, customA, customB]);

  /** Timers and audio only; `stop` also flips the playing flag. */
  const silence = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    if (probeTimer.current) window.clearTimeout(probeTimer.current);
    probeTimer.current = null;
    disposeBank(banks.current.a); disposeBank(banks.current.b);
    banks.current = { a: null, b: null };
  }, []);
  const stop = useCallback(() => { silence(); setPlaying(false); }, [silence]);
  usePlaybackReport('frames', t('track2'), playing, stop);

  // A new selection resets the view during render (not in an effect); the effect below silences the audio and loads the images.
  const selKey = `${mode}|${frameId}|${pairId}|${customA}|${customB}`;
  const [prevSel, setPrevSel] = useState<{ key: string; file: File | null }>({ key: selKey, file: userFile });
  if (prevSel.key !== selKey || prevSel.file !== userFile) {
    setPrevSel({ key: selKey, file: userFile });
    setPlaying(false); setStatus('loading'); setCol(0); setRegionState(null); setReadout(''); setSrText(''); setHeard(null); setScore(null); setCard(null); setCardMsg('');
  }

  useEffect(() => {
    let cancelled = false;
    silence(); colRef.current = 0; regionRef.current = null; sigRef.current = null; applySignal(null);
    const paint = (target: HTMLCanvasElement | null, src: HTMLCanvasElement) => {
      if (!target) return;
      target.width = src.width; target.height = src.height;
      target.getContext('2d')!.drawImage(src, 0, 0);
    };
    (async () => {
      try {
        if (mode === 'single') {
          const c = userFile ? await loadFileCanvases(userFile) : await loadFrameCanvases(frame);
          if (cancelled) return;
          paint(viewA.current, c.display); setAr(c.display.width / c.display.height);
          grids.current = { a: toGrid(c.sound), b: null };
          // Frames with a sound region start on the part that actually has sound, not on the silent margin.
          const live = !userFile && frame.soundRegion ? activeColumns(grids.current.a!.lum, COLS, ROWS) : null;
          if (live) { setRegion(live); colRef.current = live[0]; setCol(live[0]); }
        } else {
          const [a, b] = await Promise.all([loadFrameCanvases(pair.a), loadFrameCanvases(pair.b)]);
          if (cancelled) return;
          paint(viewA.current, a.display); paint(viewB.current, b.display); setAr((a.display.width / a.display.height) * 2);
          grids.current = { a: toGrid(a.sound), b: toGrid(b.sound) };
        }
        const g = grids.current;
        setScore({ a: frameScore(g.a!.lum, g.a!.rgb, COLS, ROWS), b: g.b ? frameScore(g.b.lum, g.b.rgb, COLS, ROWS) : null });
        setStatus('ready');
        setLoadedFor(mode === 'single' && !userFile ? frame.id : '');
        if (pendingCol.current !== null) { colRef.current = pendingCol.current; setCol(pendingCol.current); pendingCol.current = null; }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [mode, frameId, pairId, userFile, frame, pair, silence]);

  useEffect(() => () => stop(), [stop]);
  useEffect(() => () => { if (card) URL.revokeObjectURL(card.url); }, [card]);
  useEffect(() => () => applySignal(null), []); // leaving the view gives the interface back its dataset colour

  const geo = mode === 'pair' ? !pair.a.src : (!!userFile || !frame.src);
  const where = (c: number, r?: number) => {
    const x = geo ? fmtLon(lonAt(c)) : `${Math.round(((c + 0.5) / COLS) * 100)}% across`;
    if (r === undefined) return x;
    return `${x} · ${geo ? fmtLat(latAt(r)) : `band ${r + 1} of ${ROWS} from the top`}`;
  };

  const openBanks = (ctx: AudioContext, dest: AudioNode) => {
    banks.current.a = makeBank(ctx, dest);
    if (mode === 'pair') { banks.current.b = makeBank(ctx, dest); banks.current.a.pan.pan.value = -0.9; banks.current.b.pan.pan.value = 0.9; }
  };

  /** Sound one column of the picture (and move the needle there). */
  const driveCol = (ctx: AudioContext, c: number, paint = true) => {
    const ga = grids.current.a, bank = banks.current.a;
    if (!ga || !bank) return;
    const now = ctx.currentTime;
    const drive = (bk: Bank, g: Grid, panByCol: boolean) => {
      if (panByCol) bk.pan.pan.setTargetAtTime((c / (COLS - 1)) * 1.8 - 0.9, now, 0.05);
      for (let r = 0; r < ROWS; r++) {
        const i = r * COLS + c;
        const amp = Math.pow(g.lum[i], 1.5) * 0.06;
        bk.gains[r].gain.setTargetAtTime(amp, now, 0.05);
        // Warm colours open the filter (brighter buzz); green and blue stay soft.
        bk.filters[r].frequency.setTargetAtTime(350 + g.warm[i] * 3200 + g.green[i] * 400, now, 0.05);
      }
    };
    drive(bank, ga, mode === 'single');
    if (mode === 'pair' && banks.current.b && grids.current.b) drive(banks.current.b, grids.current.b, false);
    if (paint) setCol(c);
  };

  const describe = (c: number, r?: number) => {
    const ga = grids.current.a; if (!ga) return;
    let best = 0, bestR = 0;
    for (let rr = 0; rr < ROWS; rr++) { const v = ga.lum[rr * COLS + c]; if (v > best) { best = v; bestR = rr; } }
    const row = r ?? bestR;
    const level = Math.round(ga.lum[row * COLS + c] * 100);
    const line = r === undefined ? `${where(c)} · loudest band ${geo ? fmtLat(latAt(bestR)) : `${bestR + 1} from the top`}` : `${where(c, r)} · brightness ${level}%`;
    setReadout(line);
    const i = row * COLS + c;
    const cc = columnColor(ga.rgb, ga.lum, c, COLS, ROWS);
    if (cc) { sigRef.current = mixRgb(sigRef.current, cc, 0.5); applySignal(sigRef.current); } // the signal colour is the colour of what is heard in this column
    setHeard({ note: noteName(rowHz(row)), hz: Math.round(rowHz(row)), level, color: `rgb(${ga.rgb[i * 4]},${ga.rgb[i * 4 + 1]},${ga.rgb[i * 4 + 2]})`, timbre: timbreWord(ga.warm[i], ga.green[i]) });
    return line;
  };

  const start = async () => {
    if (!grids.current.a) return;
    let ctx: AudioContext;
    try {
      ctx = await AudioContextManager.init();
      if (ctx.state !== 'running') await ctx.resume();
    } catch { setAudioBlocked(true); return; }
    if (ctx.state !== 'running') { setAudioBlocked(true); return; }
    setAudioBlocked(false);
    onPlay?.();
    const dest = AudioContextManager.getMasterNode()!;
    if (probeTimer.current) window.clearTimeout(probeTimer.current);
    probeTimer.current = null;
    disposeBank(banks.current.a); disposeBank(banks.current.b);
    banks.current = { a: null, b: null };
    openBanks(ctx, dest);
    setPlaying(true);
    const [lo0, hi0] = regionRef.current ?? [0, COLS - 1];
    if (colRef.current < lo0 || colRef.current > hi0) colRef.current = lo0;
    stepRef.current = () => {
      const [lo, hi] = regionRef.current ?? [0, COLS - 1];
      const c = colRef.current;
      // Reduced motion: the sound runs at full rate, but the needle, numerals and colour only update about once a second.
      const paint = !rmRef.current || c % 8 === 0;
      driveCol(ctx, c, paint);
      if (paint) describe(c);
      const n = nextColumn(c, { lo, hi, loop: loopRef.current });
      if (n === null) { colRef.current = lo; stop(); endRef.current(); return; }
      colRef.current = n;
    };
    stepRef.current();
    timer.current = window.setInterval(() => stepRef.current(), stepMs(SWEEP_SEC, COLS, speedRef.current));
  };

  // "Listen now" from the landing page: play as soon as the first picture is ready.
  useEffect(() => {
    if (autoPlay && status === 'ready' && !timer.current) { onAutoPlayed?.(); start(); }
  }, [autoPlay, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // A new speed takes effect straight away, without restarting the sweep.
  useEffect(() => {
    if (!timer.current) return;
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => stepRef.current(), stepMs(SWEEP_SEC, COLS, speed));
  }, [speed]);

  /** Move the needle. While playing the sweep carries on from there; otherwise play a short probe so you can hear the spot. */
  const seek = async (c: number, r?: number) => {
    if (status !== 'ready') return;
    colRef.current = c;
    setCol(c);
    const line = describe(c, r);
    // Holding an arrow key moves the needle many times a second; announce at most once a second.
    if (line && Date.now() - lastAnnounce.current > 1000) { lastAnnounce.current = Date.now(); setSrText(line); }
    if (timer.current) { const ctx = AudioContextManager.getContext(); if (ctx) driveCol(ctx, c); return; }
    const ctx = await AudioContextManager.init();
    if (timer.current) return;
    if (!banks.current.a) openBanks(ctx, AudioContextManager.getMasterNode()!);
    driveCol(ctx, c);
    if (probeTimer.current) window.clearTimeout(probeTimer.current);
    probeTimer.current = window.setTimeout(() => {
      probeTimer.current = null;
      if (timer.current) return;
      disposeBank(banks.current.a); disposeBank(banks.current.b);
      banks.current = { a: null, b: null };
    }, 450);
  };

  // --- EIC story: one sweep per bundled frame, with a caption (spoken when narration is on). ---
  const endStory = () => {
    if (story === null) return;
    setStory(null); setLoop(savedLoop.current);
    try { window.speechSynthesis?.cancel(); } catch { /* speech unavailable */ }
    stop();
  };
  const goStory = (k: number) => {
    if (k >= EIC_STORY.length) { endStory(); return; }
    if (story === null) savedLoop.current = loopRef.current;
    setLoop(false); setMode('single'); setUserFile(null); setFrameId(EIC_STORY[k].frameId); setStory(k);
  };
  useEffect(() => { endRef.current = () => { if (story !== null) goStory(story + 1); }; });
  useEffect(() => {
    if (story === null || status !== 'ready' || timer.current) return;
    const step = EIC_STORY[story];
    if (loadedFor !== step.frameId || mode !== 'single') return;
    colRef.current = regionRef.current?.[0] ?? 0; setCol(colRef.current);
    if (narration) speak(lang === 'bn' ? step.bn : step.en, lang);
    start();
  }, [story, status, loadedFor]); // eslint-disable-line react-hooks/exhaustive-deps
  // Choosing anything by hand ends the story.
  const pickFrame = (id: string) => { endStory(); setUserFile(null); setFrameId(id); };
  const chooseMode = (m: 'single' | 'pair') => { endStory(); setMode(m); };

  const copyLink = async () => {
    const hash = encodeShare({ track: 'frames', ...(mode === 'pair' ? { pair: pairId, ...(pairId === 'custom' ? { a: customA, b: customB } : {}) } : { frame: frameId }), col, lang });
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    try { await navigator.clipboard.writeText(url); setCopied(t('linkCopied')); } catch { setCopied(url); }
    window.setTimeout(() => setCopied(null), 4000);
  };

  /** Draws the share card (1080 x 1350 PNG) for the frame on stage with the needle where it is now. Nothing leaves the device until the user shares or saves it. */
  const makeCard = async () => {
    const ga = grids.current.a, cv = viewA.current;
    if (!ga || !cv || !score || mode !== 'single' || userFile) return;
    setCardMsg(t('scMaking'));
    const link = `${window.location.origin}${window.location.pathname}#${encodeShare({ track: 'frames', frame: frameId, col, lang })}`;
    const cs = getComputedStyle(document.documentElement), v = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
    const dom = dominantBand(ga.lum, col, COLS, ROWS), ttl = lang === 'bn' ? frame.titleBn : frame.title;
    const blob = await renderShareCard({
      frame: cv, frameW: cv.width, frameH: cv.height, kicker: t('scCardKicker'), title: ttl,
      notes: score.a, cols: COLS, rows: ROWS, col, bigLabel, bigValue, pitch: dom ? `${dom.note} · ${digits(dom.hz, lang)} Hz` : null,
      source: `${t('stSource')}: ${frame.credit}`, method: t('scCardMethod'), url: link,
      signal: v('--signal', '#baed3f'), onSignal: v('--on-signal', '#0a0a0a'),
      fonts: { display: v('--font-display', 'sans-serif'), body: v('--font-body', 'sans-serif'), mono: v('--font-mono', 'monospace') },
    });
    if (!blob) { setCardMsg(t('scCardFail')); return; }
    setCard({ url: URL.createObjectURL(blob), blob, name: cardFileName(frame.id), link, title: ttl });
    setCardMsg(t('scCardReady'));
  };
  const canShareFile = () => { try { return typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [new File([], 'a.png', { type: 'image/png' })] }); } catch { return false; } };
  const shareCard = async () => {
    if (!card) return;
    try { await navigator.share({ files: [new File([card.blob], card.name, { type: 'image/png' })], title: card.title, text: `${card.title}: ${t('scShareText')}`, url: card.link }); setCardMsg(t('scShared')); }
    catch (e) { if ((e as Error).name !== 'AbortError') setCardMsg(t('scCardFail')); }
  };

  const fractionIn = (e: React.PointerEvent) => {
    const r = frameBox.current!.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    return { fx: mode === 'pair' ? (fx * 2) % 1 : fx, fy: (e.clientY - r.top) / r.height }; // side by side: the column is measured inside one picture
  };
  const onFrameDown = (e: React.PointerEvent) => {
    if (status !== 'ready') return;
    drag.current = { x0: e.clientX, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onFrameMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.x0) < 8) return;
    d.moved = true;
    const r = frameBox.current!.getBoundingClientRect();
    const x0 = (d.x0 - r.left) / r.width, a = colAt(mode === 'pair' ? (x0 * 2) % 1 : x0, COLS), b = colAt(fractionIn(e).fx, COLS);
    setRegion(orderRange(a, b, COLS));
  };
  const onFrameUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const { fx, fy } = fractionIn(e);
    if (d.moved) {
      const reg = regionRef.current;
      if (reg) { colRef.current = reg[0]; seek(reg[0]); }
      return;
    }
    seek(colAt(fx, COLS), rowAt(fy, ROWS));
  };

  const needle = `${((col + 0.5) / COLS) * 100}%`;
  const meta = mode === 'single' ? (userFile ? { title: userFile.name, what: 'Your image', credit: 'Uploaded by you', url: undefined } : { title: lang === 'bn' ? frame.titleBn : frame.title, what: frame.what, credit: frame.credit, url: frame.sourceUrl }) : null;

  usePublishNowPlaying('frames', {
    id: 'frames', title: t('track2'), subtitle: t('npFramesSub'), badge: 'snapshot', state: status !== 'ready' ? 'busy' : playing ? 'playing' : 'ready', pauses: false,
    index: col, count: 0, label: '', valueText: readout, spark: [], speed,
    controls: { toggle: () => { if (playing) stop(); else void start(); }, stop, setSpeed },
  });

  const frac = (col + 0.5) / COLS;
  const year = mode === 'single' && !userFile ? axisValueAt(frame.axis, frac) : null;
  const bigLabel = year !== null ? t('stYear') : geo ? t('stLon') : t('stAcross');
  const bigValue = year !== null ? digits(year, lang) : geo ? digits(fmtLon(lonAt(col)), lang) : `${digits(Math.round(frac * 100), lang)}%`;
  const related = mode === 'single' && !userFile ? RELATED_STORY[frame.id] : undefined;
  const title = meta?.title ?? '';
  const sides = mode === 'pair' ? [{ ref: viewA, f: pair.a, side: 'A' as const }, { ref: viewB, f: pair.b, side: 'B' as const }] : [{ ref: viewA, f: frame, side: 'A' as const }];
  const stepBy = (dir: 1 | -1) => { const [lo, hi] = regionRef.current ?? [0, COLS - 1]; void seek(Math.min(hi, Math.max(lo, col + dir * 4))); };
  const chipOn = (on: boolean) => `stage-chip${on ? ' on' : ''}`;

  return (
    <section className="stage h-full overflow-y-auto pt-[calc(var(--header-h)+1rem)]" aria-labelledby="frames-title" data-state={playing ? 'playing' : status}>
      <div className="stage-in">
        <header className="stage-head">
          <div className="min-w-0">
            <p className="readout stage-eyebrow">{mode === 'pair' ? t('stEyebrowOne') : t('stEyebrowOne')}</p>
            <h1 id="frames-title" className="stage-title font-display">{mode === 'pair' ? `${pair.a.title} → ${pair.b.title}` : title || t('framesTitle')}</h1>
          </div>
          <div className="stage-modes" role="group" aria-label={t('frMode')}>
            <button type="button" className="btn" aria-pressed={mode === 'single'} onClick={() => chooseMode('single')}>{t('frOne')}</button>
            <button type="button" className="btn" aria-pressed={mode === 'pair'} onClick={() => chooseMode('pair')}>{t('beforeAfter')}</button>
          </div>
        </header>

        <div className="stage-strip" role="group" aria-label={t('frChoose')}>
          {mode === 'single'
            ? EIC_FRAMES.map((f) => <button key={f.id} type="button" className={chipOn(!userFile && frameId === f.id)} aria-pressed={!userFile && frameId === f.id} onClick={() => pickFrame(f.id)}>{lang === 'bn' ? f.titleBn : f.title}</button>)
            : PAIRS.map((p) => <button key={p.id} type="button" className={chipOn(pairId === p.id)} aria-pressed={pairId === p.id} onClick={() => setPairId(p.id)}>{p.label}</button>)}
          <button type="button" className={chipOn(more)} aria-expanded={more} aria-controls="stage-more" onClick={() => setMore(!more)}>{t('stMore')}</button>
        </div>

        <div className="stage-main">
        <div className="stage-frame" data-pair={mode === 'pair'} style={{ ['--ar' as string]: ar }} ref={frameBox}
          onPointerDown={onFrameDown} onPointerMove={onFrameMove} onPointerUp={onFrameUp} onPointerCancel={() => { drag.current = null; }}>
          {sides.map(({ ref, f, side }) => (
            <div key={side} className="stage-half">
              {mode === 'pair' && <span className="stage-side chip">{side === 'A' ? t('stSideA') : t('stSideB')} · {side === 'A' ? t('stLeftEar') : t('stRightEar')} · {f.title}</span>}
              <canvas ref={ref} className="stage-canvas" role="img" aria-label={mode === 'single' && !userFile ? ((lang === 'bn' ? f.longBn : f.longEn) ?? `${f.title}. ${f.what}`) : mode === 'single' ? `${meta?.title ?? ''}` : f.title} />
              {status === 'ready' && <>
                {region && <div className="stage-region" style={{ left: `${(region[0] / COLS) * 100}%`, width: `${((region[1] - region[0] + 1) / COLS) * 100}%` }} />}
                <div className="stage-glow" style={{ left: `${(col / COLS) * 100}%` }} />
                <div className="stage-needle" style={{ left: needle }} />
              </>}
            </div>
          ))}
          {legend && status === 'ready' && (
            <div className="stage-legend" aria-hidden="true">
              <span className="chip">{t('frBright')}</span>
              <span className="chip"><i style={{ background: 'var(--fire)' }} />{t('frWarm')}</span>
              <span className="chip"><i style={{ background: 'var(--cold)' }} />{t('frCool')}</span>
            </div>
          )}
          {status !== 'ready' && (
            <div className="stage-overlay">
              {status === 'loading' ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {frame.src && !userFile ? 'Loading Earth Information Center image…' : 'Loading NASA imagery from GIBS…'}</span>
                : (
                  <div className="flex flex-col items-center gap-3" role="alert">
                    <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[var(--signal)]" /> {frame.src && !userFile ? 'This picture could not be loaded.' : 'NASA GIBS did not respond. Check the internet connection, or load an image file below.'}</span>
                    {!(frame.src && !userFile) && <button className="btn btn-brass" onClick={() => { setMode('single'); setUserFile(null); setFrameId(EIC_FRAMES[0].id); }}>{t('tryEic')}</button>}
                  </div>
                )}
            </div>
          )}
        </div>

        <div ref={readRef} className="stage-read" role="group" aria-label={t('stHeard')}>
          <div className="stage-bigwrap">
            <span className="readout">{bigLabel}</span>
            <div className="stage-big" aria-hidden="true">{bigValue}</div>
          </div>
          <dl className="stage-vals">
            <div><dt className="readout">{t('stPitch')}</dt><dd className="tnum">{heard ? `${heard.note} · ${digits(heard.hz, lang)} Hz` : '–'}</dd></div>
            <div><dt className="readout">{t('stLoud')}</dt><dd className="tnum flex items-center gap-2">
              <span className="stage-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={heard?.level ?? 0} aria-label={t('loudness')}><i style={{ width: `${heard?.level ?? 0}%` }} /></span>{heard ? `${digits(heard.level, lang)}%` : '–'}</dd></div>
            <div><dt className="readout">{t('stTimbre')}</dt><dd>{heard ? heard.timbre : '–'}</dd></div>
          </dl>
          <p className="stage-hint">{playing || heard ? t('stColour') : t('stIdle')}</p>
        </div>

        </div>

        <div className="stage-ctl">
          <button onClick={playing ? (story !== null ? endStory : stop) : start} disabled={status !== 'ready'} className="btn btn-brass stage-play disabled:opacity-50">
            {playing ? <><Square className="w-4 h-4" /> {t('stop')}</> : <><Play className="w-4 h-4" /> {t('play')}</>}
          </button>
          <button className="btn btn-icon" disabled={status !== 'ready'} onClick={() => stepBy(-1)} aria-label={t('stBack')} title={t('stBack')}><ChevronLeft className="w-4 h-4" /></button>
          <button className="btn btn-icon" disabled={status !== 'ready'} onClick={() => stepBy(1)} aria-label={t('stFwd')} title={t('stFwd')}><ChevronRight className="w-4 h-4" /></button>
          <div className="stage-scrub">
            <label htmlFor="frame-scrub" className="sr-only">{t('scrub')}</label>
            <input id="frame-scrub" type="range" min={0} max={COLS - 1} value={col} disabled={status !== 'ready'}
              onChange={(e) => seek(+e.target.value)} aria-valuetext={where(col)} aria-describedby="frame-scrub-hint"
              className="w-full accent-[var(--signal)] disabled:opacity-50" />
          </div>
          <span className="label" id="frame-speed">{t('speed')}</span>
          <div role="group" aria-labelledby="frame-speed" className="flex gap-1">
            {[0.5, 1, 2].map((v) => <button key={v} className="btn" aria-pressed={speed === v} onClick={() => setSpeed(v)}>{v}×</button>)}
          </div>
          <button className="btn" aria-pressed={loop} onClick={() => setLoop(!loop)}><Repeat className="w-4 h-4" /> {t('loop')}</button>
        </div>
        <p id="frame-scrub-hint" className="stage-note">{t('scrubHint')} {t('regionHint')}</p>
        <span className="sr-only" aria-live="polite">{srText}</span>
        {audioBlocked && <p role="alert" className="mt-3 text-sm text-[var(--signal)] max-w-[70ch]">{t('audioBlocked')}</p>}

        {scoreOpen && score && status === 'ready' && (
          <section id="stage-score" className="stage-score" aria-label={t('scTitle')}>
            <p className="readout">{t('scTitle')}</p>
            <p className="stage-note">{mode === 'pair' ? t('scNotePair') : t('scNote')}</p>
            <div className="score-set" data-pair={mode === 'pair'}>
              <FrameScore source={viewA} token={score} ar={mode === 'pair' ? ar / 2 : ar} notes={score.a} cols={COLS} rows={ROWS} col={col} heading={mode === 'pair' ? `${t('stSideA')} · ${pair.a.title}` : undefined} />
              {mode === 'pair' && score.b && <FrameScore source={viewB} token={score} ar={ar / 2} notes={score.b} cols={COLS} rows={ROWS} col={col} heading={`${t('stSideB')} · ${pair.b.title}`} />}
            </div>
          </section>
        )}

        <div className="stage-ctl stage-ctl2">
          {related && <button className="btn btn-brass" aria-expanded={dataOpen} onClick={() => setDataOpen(!dataOpen)}><Headphones className="w-4 h-4" /> {lang === 'bn' ? related.bn : related.en}</button>}
          {mode === 'single' && (
            <label className="btn cursor-pointer">
              <ImagePlus className="w-4 h-4" /> {t('loadOwn')}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUserFile(f); }} />
            </label>
          )}
          <button className="btn" aria-pressed={legend} onClick={() => setLegend(!legend)}>{t('legend')}</button>
          {mode === 'single' && !userFile && (story === null
            ? <button className="btn" disabled={status !== 'ready' && story === null} onClick={() => goStory(0)}><BookOpen className="w-4 h-4" /> {t('story')}</button>
            : <button className="btn" onClick={endStory}>{t('storyStop')}</button>)}
          <button className="btn" onClick={copyLink}><Link2 className="w-4 h-4" /> {t('shareLink')}</button>
          <button className="btn" aria-pressed={scoreOpen} aria-controls="stage-score" onClick={() => setScoreOpen(!scoreOpen)}><Music2 className="w-4 h-4" /> {t('scToggle')}</button>
          {mode === 'single' && !userFile && <button className="btn" disabled={status !== 'ready' || !score} onClick={makeCard}><Share2 className="w-4 h-4" /> {t('scMake')}</button>}
          <button className="btn" disabled={status !== 'ready'} onClick={() => { const [, hi] = regionRef.current ?? [0, COLS - 1]; setRegion(orderRange(col, Math.max(hi, col), COLS)); }}>{t('loopStart')}</button>
          <button className="btn" disabled={status !== 'ready'} onClick={() => { const [lo] = regionRef.current ?? [0, COLS - 1]; setRegion(orderRange(Math.min(lo, col), col, COLS)); }}>{t('loopEnd')}</button>
          {region && <button className="btn" onClick={() => setRegion(null)}>{t('clearRegion')}</button>}
        </div>
        {related?.related && <p className="stage-note">{t('stRelated')} {lang === 'bn' ? related.bn : related.en}</p>}
        {related && dataOpen && <SeriesUnderFrame key={related.story} storyId={related.story} related={related.related} framePlaying={playing} onStart={stop} onOpenStory={(id) => onOpenStory?.(id)} onClose={() => setDataOpen(false)} />}

        {copied && <p role="status" className="mt-2 text-sm text-[var(--ink-2)] max-w-[70ch] break-all">{copied.startsWith('http') ? <input readOnly value={copied} onFocus={(e) => e.currentTarget.select()} aria-label={t('shareLink')} className="w-full bg-transparent border border-[var(--line)] rounded px-2 py-1" /> : copied}</p>}
        {(card || cardMsg) && (
          <section className="stage-card" aria-label={t('scCardTitle')}>
            {card && <img src={card.url} alt={t('scCardAlt', { title: card.title })} width={1080} height={1350} />}
            <div className="stage-card-side">
              <p role="status" className="stage-note">{cardMsg}</p>
              {card && (
                <div className="stage-ctl">
                  {canShareFile() && <button className="btn btn-brass" onClick={shareCard}><Share2 className="w-4 h-4" /> {t('scShare')}</button>}
                  <a className={`btn${canShareFile() ? '' : ' btn-brass'}`} href={card.url} download={card.name}><Download className="w-4 h-4" /> {t('scSave')}</a>
                  <button className="btn btn-icon" onClick={() => { setCard(null); setCardMsg(''); }} aria-label={t('close')}><X className="w-4 h-4" /></button>
                </div>
              )}
              {card && <p className="stage-note break-all">{card.link}</p>}
            </div>
          </section>
        )}
        {story !== null && (
          <div className="mt-3 panel p-3 max-w-[70ch]" aria-live="polite">
            <div className="label">{story + 1} / {EIC_STORY.length}</div>
            <p className="mt-1 text-sm text-[var(--ink)]">{lang === 'bn' ? EIC_STORY[story].bn : EIC_STORY[story].en}</p>
            <button className="btn mt-2" onClick={() => goStory(story + 1)}>{t('storyNext')}</button>
          </div>
        )}

        {more && (
          <section id="stage-more" className="stage-more" aria-label={t('stMore')}>
            {mode === 'single' ? (
              <>
                <div className="label">{t('frLive')}</div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {FRAMES.map((f) => (
                    <button key={f.id} onClick={() => pickFrame(f.id)} aria-pressed={!userFile && frameId === f.id}
                      className={`text-left rounded-lg border p-2 flex gap-3 items-center cursor-pointer transition ${!userFile && frameId === f.id ? 'border-[var(--signal)] bg-[var(--panel-2)]' : 'border-[var(--line)] hover:border-[var(--ink-3)]'}`}>
                      <img src={gibsUrl(f.layer, f.date, f.format, 128)} alt="" loading="lazy" className="w-16 h-8 object-cover rounded bg-black shrink-0" />
                      <span className="text-sm leading-snug">{lang === 'bn' ? f.titleBn : f.title}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="label">{t('frThen')}</div>
                <button onClick={() => setPairId('custom')} aria-pressed={pairId === 'custom'}
                  className={`w-full sm:w-auto text-left rounded-lg border p-3 text-sm cursor-pointer ${pairId === 'custom' ? 'border-[var(--signal)] bg-[var(--panel-2)]' : 'border-[var(--line)] hover:border-[var(--ink-3)]'}`}>{t('chooseAny')}</button>
                {pairId === 'custom' && (
                  <div className="grid sm:grid-cols-2 gap-3 mt-2">
                    {([['leftEar', customA, setCustomA], ['rightEar', customB, setCustomB]] as const).map(([k, val, setVal]) => (
                      <label key={k} className="block text-sm">
                        <span className="label">{t(k)}</span>
                        <select value={val} onChange={(e) => setVal(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] p-2 text-[var(--ink)]">
                          <optgroup label={t('eicGroup')}>{EIC_FRAMES.map((f) => <option key={f.id} value={f.id}>{lang === 'bn' ? f.titleBn : f.title}</option>)}</optgroup>
                          <optgroup label="NASA GIBS">{FRAMES.map((f) => <option key={f.id} value={f.id}>{lang === 'bn' ? f.titleBn : f.title}</option>)}</optgroup>
                        </select>
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}
        {mode === 'pair' && <p className="stage-note">{t('beforeAfterHint')}</p>}

        <div className="stage-meta">
          {mode === 'single' && !userFile && (
            <details className="stage-details">
              <summary>{t('describeFrame')}</summary>
              <p>{(lang === 'bn' ? frame.longBn : frame.longEn) ?? `${lang === 'bn' ? frame.titleBn : frame.title}. ${frame.what}`}</p>
            </details>
          )}
          <details className="stage-details">
            <summary>{t('whatHearing')}</summary>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('hearNeedle')}</li><li>{t('hearPitch')}</li><li>{t('hearLoud')}</li><li>{t('hearColour')}</li><li>{t('hearScrub')}</li>
            </ul>
          </details>
          <dl className="stage-facts">
            {meta && <div><dt className="readout">{t('stMeta')}</dt><dd><strong>{meta.title}.</strong> {meta.what}</dd></div>}
            {meta && <div><dt className="readout">{t('stSource')}</dt><dd>{meta.credit}{meta.url && <> · <a href={meta.url} target="_blank" rel="noreferrer" className="underline inline-flex items-center min-h-[24px] pointer-coarse:min-h-[44px]">{t('frSeeEarthGov')}</a></>}</dd></div>}
            <div><dt className="readout">{t('stMethod')}</dt><dd>{t('stMethodText')}</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
};
