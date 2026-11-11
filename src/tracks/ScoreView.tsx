import React, { memo, useEffect, useMemo, type RefObject } from 'react';
import { usePrefs } from '../lib/prefs';
import { digits } from '../jukebox/format';
import { ROLL_DEGREES, rollNotes, summarizeScore, type ScoreNote } from '../lib/score';
import type { MappedPoint } from '../sonification/series/mapping';

/** Score views (roadmap v5, V4): the sound drawn from the same grids and mappings that make it. Both are decoration for the eyes only: the figure carries a text alternative. */

const NotesLayer = memo(function NotesLayer({ notes, cols, rows }: { notes: ScoreNote[]; cols: number; rows: number }) {
  return (
    <svg className="score-svg" viewBox={`0 0 ${cols} ${rows}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {notes.map((n) => <rect key={n.col * rows + n.row} x={n.col} y={n.row} width={1.02} height={0.92} fill={`rgb(${n.rgb[0]},${n.rgb[1]},${n.rgb[2]})`} fillOpacity={0.3 + 0.7 * n.level} />)}
    </svg>
  );
});

interface FrameScoreProps {
  /** The canvas the Stage painted the picture on: copied into the thumbnail whenever `token` changes. */
  source: RefObject<HTMLCanvasElement | null>;
  token: unknown;
  /** width / height of the picture, to size the thumbnail. */
  ar: number;
  notes: ScoreNote[]; cols: number; rows: number;
  /** The needle column (the playhead). */
  col: number;
  /** "Side A · …" when two scores are shown. */
  heading?: string;
}

/** One note per sounding cell of the picture: the picture's thumbnail on top, the notes below it on the same columns (x = where in the picture, y = pitch, brightness = loudness, colour = the pixel's colour). A playhead crosses both. */
export function FrameScore({ source, token, ar, notes, cols, rows, col, heading }: FrameScoreProps) {
  const { t, lang } = usePrefs();
  const thumb = React.useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const src = source.current, dst = thumb.current;
    if (!src || !dst || !src.width || !src.height) return;
    dst.width = src.width; dst.height = src.height;
    dst.getContext('2d')!.drawImage(src, 0, 0);
  }, [source, token]);
  const sum = useMemo(() => summarizeScore(notes, rows), [notes, rows]);
  const alt = sum.notes ? t('scAlt', { n: digits(sum.notes, lang), cols: digits(sum.columns, lang), low: sum.low ?? '', high: sum.high ?? '', loud: digits(Math.round(((sum.loudestCol ?? 0) + 0.5) / cols * 100), lang) }) : t('scSilent');
  return (
    <figure className="score" style={{ ['--ar' as string]: ar }}>
      {heading && <p className="readout score-head">{heading}</p>}
      <div className="score-box" role="img" aria-label={alt}>
        <canvas ref={thumb} className="score-thumb" aria-hidden="true" />
        <NotesLayer notes={notes} cols={cols} rows={rows} />
        <i className="score-play" aria-hidden="true" style={{ left: `${((col + 0.5) / cols) * 100}%` }} />
      </div>
      <figcaption className="score-cap">
        <span className="readout">{t('scHigh')} {sum.high ?? '–'}</span><span className="readout">{t('scAxis')}</span><span className="readout">{t('scLow')} {sum.low ?? '–'}</span>
      </figcaption>
    </figure>
  );
}

const RollLayer = memo(function RollLayer({ mapped }: { mapped: MappedPoint[] }) {
  const notes = useMemo(() => rollNotes(mapped), [mapped]);
  const n = Math.max(1, mapped.length);
  return (
    <svg className="score-svg roll-svg" viewBox={`0 0 ${n} ${ROLL_DEGREES}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {Array.from({ length: ROLL_DEGREES }, (_, d) => <line key={d} className="roll-lane" x1={0} x2={n} y1={ROLL_DEGREES - d - 0.5} y2={ROLL_DEGREES - d - 0.5} vectorEffect="non-scaling-stroke" />)}
      {notes.map((m) => <rect key={m.i} className={`roll-n roll-${m.timbre}`} x={m.i} y={ROLL_DEGREES - 1 - m.degree + 0.08} width={0.92} height={0.84} fillOpacity={0.35 + 0.65 * m.level} />)}
    </svg>
  );
});

/** A piano roll for a series: one bar per value at the note `mapSeries` gave it (pitch = scale degree from the series' fixed range, brightness = gain, colour = timbre: warm at or above the baseline, soft below, plain when there is none). A gap in the data is a gap in the roll. */
export function SeriesRoll({ mapped, cursor, heading, title }: { mapped: MappedPoint[]; cursor: number; heading?: string; title: string }) {
  const { t, lang } = usePrefs();
  const n = Math.max(1, mapped.length);
  const notes = useMemo(() => rollNotes(mapped), [mapped]);
  const lo = notes.length ? notes.reduce((a, b) => (b.degree < a.degree ? b : a)) : null, hi = notes.length ? notes.reduce((a, b) => (b.degree > a.degree ? b : a)) : null;
  const label = t('scRollAlt', { heading: heading ?? title, n: digits(notes.length, lang), low: lo?.note ?? '–', high: hi?.note ?? '–' });
  return (
    <figure className="score roll">
      {heading && <p className="readout score-head">{heading}</p>}
      <div className="score-box" role="img" aria-label={label}>
        <RollLayer mapped={mapped} />
        <i className="score-play" aria-hidden="true" style={{ left: `${((Math.min(cursor, n - 1) + 0.5) / n) * 100}%` }} />
      </div>
      <figcaption className="score-cap">
        <span className="readout">{t('scHigh')} {hi?.note ?? '–'}</span><span className="readout">{t('scRollAxis')}</span><span className="readout">{t('scLow')} {lo?.note ?? '–'}</span>
      </figcaption>
    </figure>
  );
}
