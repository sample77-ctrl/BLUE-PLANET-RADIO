import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Square, X, ExternalLink } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { AudioContextManager } from '../audio/audioContext';
import { useSeriesPlayer } from '../jukebox/useSeriesPlayer';
import { specFor } from '../sonification/series/specs';
import { mapSeries } from '../sonification/series/mapping';
import { linePaths } from '../jukebox/linePaths';
import { digits, timeLabel, valueLabel } from '../jukebox/format';
import { GLOBAL_STORIES } from '../stories/stories';
import { loadStorySeries } from '../stories/loadStory';
import type { DataSeries } from '../datasets/series';

interface Props {
  storyId: string;
  related: boolean; // a different dataset on the same theme: say so
  /** The picture's sweep is playing: this series pauses (one sound at a time). */
  framePlaying: boolean;
  /** This series starts: the picture stops. */
  onStart: () => void;
  onOpenStory: (id: string) => void;
  onClose: () => void;
}

/** "Hear the data behind it" on the Frame Stage: the picture stays on screen as the backdrop, and the real series that matches it plays under it, with a score line
 *  (the series drawn as a line, a cursor on it) and the same signal-coloured readout. Side A / Side B plays the first third of the series in the left ear against the
 *  last third in the right ear (same mapping, so the later period sits higher). Everything shown is the series' own: unit, period, source, method. */
export function SeriesUnderFrame({ storyId, related, framePlaying, onStart, onOpenStory, onClose }: Props) {
  const { t, lang } = usePrefs();
  const story = GLOBAL_STORIES.find((s) => s.id === storyId) ?? null;
  const [series, setSeries] = useState<DataSeries | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [ab, setAb] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [player, pstate] = useSeriesPlayer();
  const startRef = useRef(onStart);
  useEffect(() => { startRef.current = onStart; });

  useEffect(() => {
    let off = false;
    if (!story) return;
    loadStorySeries(story).then((s) => { if (!off) { setSeries(s); setStatus(s ? 'ready' : 'error'); } }).catch(() => { if (!off) setStatus('error'); });
    return () => { off = true; };
  }, [story]);

  const pts = series?.points ?? [];
  const third = Math.floor(pts.length / 3);
  const canAb = third >= 3;
  const useAb = ab && canAb;
  const aPts = useAb ? pts.slice(0, third) : pts;
  const bPts = useAb ? pts.slice(pts.length - third) : null;
  const spec = useMemo(() => (series ? specFor(series.id, series.points.map((p) => p.v)) : null), [series]);
  const mapped = useMemo(() => (spec ? mapSeries(aPts, spec) : []), [spec, aPts]);

  useEffect(() => { if (spec && aPts.length) { player.load({ points: aPts, spec, compare: bPts ? { b: bPts, layout: 'split' } : null }); } }, [spec, useAb, series]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => player.listen({ cursor: setCursor }), [player]);
  useEffect(() => { if (framePlaying && player.state === 'playing') player.pause(); }, [framePlaying, player]);

  const play = async () => {
    if (player.state === 'paused') { player.resume(); return; }
    try { await AudioContextManager.init(); } catch { /* reported below */ }
    startRef.current();
    setBlocked(!AudioContextManager.isReady() || !player.start(0));
  };

  const W = 1000, H = 160, vals = pts.map((p) => p.v).filter((v): v is number => v !== null);
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  const x = (i: number) => (pts.length > 1 ? (i / (pts.length - 1)) * W : W / 2);
  const y = (v: number) => H - 10 - ((v - lo) / span) * (H - 20);
  const paths = linePaths(pts, x, y);
  const idxA = cursor, p = aPts[idxA] ?? null, m = mapped[idxA];
  const note = m?.kind === 'note' ? m : null;
  const title = story ? (lang === 'bn' ? story.titleBn : story.title) : '';
  const playing = pstate === 'playing';

  return (
    <section className="stage-series" aria-label={t('stSeriesTitle')}>
      <div className="stage-series-head">
        <div>
          <p className="readout">{t('stSeriesTitle')}</p>
          <h2 className="stage-series-title font-display">{title}</h2>
        </div>
        <button type="button" className="btn btn-icon" onClick={() => { player.stop(); onClose(); }} aria-label={t('close')}><X className="w-4 h-4" /></button>
      </div>
      {related && <p className="stage-note">{t('stRelatedNote')}</p>}
      {status === 'loading' && <p className="stage-note">…</p>}
      {status === 'error' && <p role="alert" className="stage-note">{t('stSeriesError')}</p>}
      {status === 'ready' && series && (
        <>
          <div className="stage-chart">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${series.variable}, ${series.period}`}>
              {useAb && <>
                <rect className="ab-a" x={0} y={0} width={x(third - 1)} height={H} />
                <rect className="ab-b" x={x(pts.length - third)} y={0} width={W - x(pts.length - third)} height={H} />
              </>}
              {paths.map((d, i) => <path key={i} d={d} fill="none" stroke="var(--ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" />)}
              {p && <line x1={x(idxA)} x2={x(idxA)} y1={0} y2={H} stroke="var(--signal)" strokeWidth={3} vectorEffect="non-scaling-stroke" />}
              {useAb && bPts && p && <line x1={x(pts.length - third + idxA)} x2={x(pts.length - third + idxA)} y1={0} y2={H} stroke="var(--signal)" strokeWidth={3} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />}
            </svg>
            {useAb && <><span className="stage-side chip ab-lbl-a">{t('stSideA')} · {t('stLeftEar')} · {timeLabel(pts[0].t, lang)}–{timeLabel(pts[third - 1].t, lang)}</span><span className="stage-side chip ab-lbl-b">{t('stSideB')} · {t('stRightEar')} · {timeLabel(pts[pts.length - third].t, lang)}–{timeLabel(pts[pts.length - 1].t, lang)}</span></>}
          </div>
          <div className="stage-series-read">
            <div><span className="readout">{t('jbRdWhen')}</span><div className="stage-series-big">{p ? timeLabel(p.t, lang) : '–'}</div></div>
            <div><span className="readout">{t('jbRdValue')}</span><div className="tnum">{p && p.v !== null ? valueLabel(p.v, series.unit, lang) : '–'}</div></div>
            <div><span className="readout">{t('jbRdNote')}</span><div className="tnum">{note ? `${note.note} · ${digits(Math.round(note.freq), lang)} Hz` : '–'}</div></div>
          </div>
          <div className="stage-ctl">
            <button type="button" className="btn btn-brass stage-play" onClick={playing ? () => player.pause() : play} disabled={pstate === 'loading' || pstate === 'error'}>
              {playing ? <><Pause className="w-4 h-4" /> {t('pause')}</> : <><Play className="w-4 h-4" /> {t('play')}</>}
            </button>
            <button type="button" className="btn" onClick={() => { player.stop(); setCursor(0); }} aria-label={t('stop')}><Square className="w-4 h-4" /></button>
            <button type="button" className="btn" aria-pressed={useAb} disabled={!canAb} onClick={() => { player.stop(); setCursor(0); setAb(!ab); }}>{t('stSideA')} / {t('stSideB')}</button>
            <button type="button" className="btn" onClick={() => onOpenStory(storyId)}><ExternalLink className="w-4 h-4" /> {t('stOpenJukebox')}</button>
          </div>
          {blocked && <p role="alert" className="stage-note">{t('audioBlocked')}</p>}
          <dl className="stage-facts">
            <div><dt className="readout">{t('stSource')}</dt><dd>{series.source} · {series.period} · {series.unit} · {series.isSample ? t('npSample') : t('npSnapshot')}</dd></div>
            <div><dt className="readout">{t('stMethod')}</dt><dd>{series.method}</dd></div>
            {useAb && <div><dt className="readout">{t('stSideA')} / {t('stSideB')}</dt><dd>{t('stAbNote')}</dd></div>}
          </dl>
        </>
      )}
    </section>
  );
}
