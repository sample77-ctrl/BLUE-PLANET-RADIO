import React, { useEffect, useRef, useState } from 'react';
import { Globe2, Play, Square } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { fmtNum, type StringKey } from '../lib/strings';
import { EIC_FRAMES } from '../lib/eicFrames';
import { CHAPTERS, chapterFormat, fmtAt, fmtPeriod, type ChapterDef, type ChapterId, type ChapterNumber } from '../lib/chapters';
import { useReactiveGlow } from '../player/reactive';
import { playPreview } from './preview';

/** True when the browser can drive animations from scroll position (CSS `animation-timeline: view()`). Otherwise an IntersectionObserver flips `data-in` and CSS transitions do the same moves. */
const hasScrollTimeline = () => typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: view()');

interface HeroProps {
  /** Real key numbers, already formatted for the language (frames count, latest global temperature anomaly). */
  metrics: { value: string; label: string }[];
  /** The global temperature record (GISTEMP, one value per year) and its years: the preview melody that moves the headline. Empty until loaded. */
  melody: number[];
  years: { from: string; to: string } | null;
  onFrame: (frameId: string) => void;
  onGlobe: () => void;
}

const OCEAN = EIC_FRAMES.find((f) => f.id === 'eic-ocean-heat')!;

/**
 * Landing hero: "Hear Earth change" in the wide cut over the ocean-heat EIC frame, which a needle sweeps slowly (visual only).
 * Nothing plays by itself. After the user presses play the headline's weight follows the sound (`--np-*` from the shared analyser, no re-render).
 * One primary action (open the Stage on this frame), the globe second, and the play preview third.
 */
export const LandingHero: React.FC<HeroProps> = ({ metrics, melody, years, onFrame, onGlobe }) => {
  const { t, reduceMotion } = usePrefs();
  const ref = useRef<HTMLElement>(null), stopRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  useReactiveGlow(ref, playing, reduceMotion);
  useEffect(() => () => { stopRef.current?.(); stopRef.current = null; }, []);
  const toggle = async () => {
    if (playing) { stopRef.current?.(); stopRef.current = null; setPlaying(false); return; }
    setPlaying(true);
    stopRef.current = await playPreview(melody, () => { stopRef.current = null; setPlaying(false); });
  };
  const words = t('lhTitle').split(' ');
  return (
    <section ref={ref} className="lh" data-playing={playing} aria-labelledby="lh-title">
      <div className="lh-pic" aria-hidden="true">
        <img src={OCEAN.src} alt="" width={1024} height={1024} fetchPriority="high" decoding="async" />
        <div className="lh-sweep"><i /></div>
      </div>
      <div className="lh-shade" aria-hidden="true" />
      <div className="lh-id">
        <img src="/images/space-apps-logo.png" alt={t('spaceAppsLogoAlt')} width={440} height={172} />
        <p>{t('heroKicker')}</p>
      </div>
      <div className="lh-copy">
        <p className="hero-eyebrow">{t('lhKicker')}</p>
        <h1 id="lh-title" className="lh-title">{words.map((w, i) => <React.Fragment key={i}>{i > 0 && ' '}<span className="lh-w">{w}</span></React.Fragment>)}</h1>
        <p className="hero-lead">{t('lhLead')}</p>
        <div className="hero-actions">
          <button onClick={() => onFrame(OCEAN.id)} className="btn btn-brass hero-cta">
            <span className="hero-cta-icon" aria-hidden="true"><Play className="w-4 h-4" /></span>
            <span>{t('heroFrame')}</span>
          </button>
          <button onClick={onGlobe} className="btn hero-secondary"><Globe2 className="w-4 h-4" />{t('heroExplore')}</button>
          {melody.length > 0 && years && (
            <button onClick={toggle} aria-pressed={playing} className="btn hero-secondary">
              {playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{playing ? t('lhStop') : t('lhPlay', { from: years.from, to: years.to })}</span>
            </button>
          )}
        </div>
        {!!metrics.length && (
          <dl className="hero-tele hud-frame" aria-label={t('heroTeleLabel')}>
            {metrics.map((m) => <div key={m.label}><dd className="tnum">{m.value}</dd><dt>{m.label}</dt></div>)}
            <div className="hero-tele-note"><dt>{t('heroSnapshot')}</dt></div>
          </dl>
        )}
        <p className="sr-only" role="status">{playing ? t('lhPlaying') : ''}</p>
      </div>
      <p className="lh-cue readout" aria-hidden="true">{t('lhScrollCue')} ↓</p>
    </section>
  );
};

/** One chapter: its EIC frame full width (a needle that follows the scroll, a marker only), a field flooded with the signal colour, the one real number, and "Hear this frame". */
const Chapter: React.FC<{ def: ChapterDef; n: number; total: number; num: ChapterNumber | null | undefined; on: boolean; onFrame: (id: string) => void; reg: (el: HTMLElement | null) => void }> = ({ def, n, total, num, on, onFrame, reg }) => {
  const { t, lang } = usePrefs();
  const frame = EIC_FRAMES.find((f) => f.id === def.frameId)!, cap = def.id[0].toUpperCase() + def.id.slice(1);
  const title = t(`lc${cap}Title` as StringKey), key = `lc${cap}Num` as StringKey;
  const region = frame.soundRegion ?? { x: 0, y: 0, w: 1, h: 1 };
  const dims = def.id === 'ghg' ? [1920, 800] : def.id === 'ocean' ? [1024, 1024] : def.id === 'rain' ? [2216, 646] : [1024, 576];
  return (
    <section ref={reg} className="lc" id={`lc-${def.id}`} data-c={def.color} data-in={on} aria-labelledby={`lc-${def.id}-t`}>
      <div className="lc-pic">
        <div className="lc-img" style={{ ['--ar' as string]: dims[0] / dims[1] }}>
          <img src={frame.src} alt={lang === 'bn' ? frame.longBn : frame.longEn} width={dims[0]} height={dims[1]} loading="lazy" decoding="async" />
          <div className="lc-sweep" aria-hidden="true" style={{ left: `${region.x * 100}%`, width: `${region.w * 100}%` }}><i /></div>
        </div>
      </div>
      <div className="lc-band">
        <div className="lc-text">
          <p className="lc-kicker readout">{t('lcKicker', { n: fmtNum(n, lang), total: fmtNum(total, lang) })}</p>
          <h2 id={`lc-${def.id}-t`} className="lc-title">{title}</h2>
          <p className="lc-body">{t(`lc${cap}Body` as StringKey)}</p>
        </div>
        <div className="lc-data">
          {num === undefined ? <p className="lc-note">{t('lcLoading')}</p> : num === null ? <p className="lc-note">{t('lcFail')}</p> : (
            <dl className="lc-num">
              <div>
                <dt>{t(key, { at: fmtAt(num.at, lang) })}</dt>
                <dd><span className="lc-big tnum">{fmtNum(num.value, lang, chapterFormat(def))}</span> <span className="lc-unit">{num.unit}</span></dd>
              </div>
              <div className="lc-meta">
                <dt>{t('lcPeriod')}</dt><dd>{fmtPeriod(num.period, lang)}</dd>
                <dt>{t('lcSource')}</dt><dd><a href={num.sourceUrl} target="_blank" rel="noopener noreferrer">{num.source}</a></dd>
              </div>
            </dl>
          )}
          {!!num && (
            <p className="lc-badges">
              {def.related && <span className="lc-badge">{t('lcRelated')}</span>}
              <span className="lc-badge">{t('lcSnapshot')}</span>
              {num.isSample && <span className="lc-badge">{t('lcSample')}</span>}
            </p>
          )}
          <button type="button" className="lc-hear" onClick={() => onFrame(def.frameId)} aria-label={t('lcHearAria', { title: lang === 'bn' ? frame.titleBn : frame.title })}>
            <Play className="w-4 h-4" aria-hidden="true" /><span>{t('lcHear')}</span>
          </button>
        </div>
      </div>
    </section>
  );
};

/** The four chapters. Scroll-driven where the browser supports it (`data-st`), else an IntersectionObserver sets `data-in` once a chapter is a quarter on screen; reduced motion shows everything static. */
export const LandingChapters: React.FC<{ onFrame: (frameId: string) => void }> = ({ onFrame }) => {
  const { t, reduceMotion } = usePrefs();
  const [st] = useState(hasScrollTimeline);
  const timeline = st && !reduceMotion;
  const [nums, setNums] = useState<Record<ChapterId, ChapterNumber | null> | undefined>();
  const els = useRef(new Map<string, HTMLElement>());
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const ac = new AbortController();
    import('./chapterData').then((m) => m.loadChapterNumbers(ac.signal)).then((r) => { if (!ac.signal.aborted) setNums(r); }).catch(() => { if (!ac.signal.aborted) setNums({ ghg: null, ocean: null, rain: null, elnino: null }); });
    return () => ac.abort();
  }, []);
  const observing = !timeline && !reduceMotion && typeof IntersectionObserver !== 'undefined';
  useEffect(() => {
    if (!observing) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const id = (e.target as HTMLElement).dataset.id ?? ''; setSeen((s) => (s[id] ? s : { ...s, [id]: true })); io.unobserve(e.target); } }), { threshold: 0.25 });
    els.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [observing]);
  return (
    <div className="lands" data-st={timeline ? '1' : undefined} data-static={!timeline && !observing ? '1' : undefined} role="region" aria-label={t('lcLabel')}>
      <p className="sr-only">{t('lcNeedleHint')}</p>
      {CHAPTERS.map((c, i) => (
        <Chapter key={c.id} def={c} n={i + 1} total={CHAPTERS.length} num={nums ? nums[c.id] : undefined} on={!observing || !!seen[c.id]}
          reg={(el) => { if (el) { el.dataset.id = c.id; els.current.set(c.id, el); } else els.current.delete(c.id); }} onFrame={onFrame} />
      ))}
    </div>
  );
};
