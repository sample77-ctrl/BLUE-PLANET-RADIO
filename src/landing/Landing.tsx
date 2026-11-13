import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { EarthObservation } from '../types/dataset';
import { usePrefs } from '../lib/prefs';
import { fmtNum } from '../lib/strings';
import { EIC_FRAMES } from '../lib/eicFrames';
import type { Track } from '../lib/nav';
import { Footer } from '../components/Footer';
import { applyParallax } from './parallax';
import { Sparkles, ArrowRight } from 'lucide-react';
import { WorldCarousel, type WorldData } from './WorldCarousel';
import type { WorldId } from './worlds';
import { LandingHero, LandingChapters } from './Chapters';

const TopicCarousel = lazy(() => import('../stories/TopicCarousel').then((m) => ({ default: m.TopicCarousel })));

/** Renders its children only once the placeholder is within `margin` of the viewport (or immediately without IntersectionObserver): the topic carousel is several screens down and loads its code and data from there. */
const WhenNear: React.FC<{ children: React.ReactNode; margin?: string; minH?: string }> = ({ children, margin = '900px', minH = '24rem' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: `${margin} 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, [near, margin]);
  return near ? <>{children}</> : <div ref={ref} style={{ minHeight: minH }} aria-hidden="true" />;
};

interface Props {
  fireObs: EarthObservation[];
  onPick: (t: Track) => void;
  onListen: () => void;
  onTour: () => void;
  onSilent: () => void;
  onAbout: () => void;
  onTopic: (storyId: string) => void;
  onOpenHarmonium?: () => void;
  /** Opens the Frame Stage on this EIC frame. */
  onFrame: (frameId: string) => void;
}

/**
 * Landing page. (0) The hero ("Hear Earth change" over the ocean-heat EIC frame) and four chapters, one EIC frame each (roadmap v5, V3);
 * (1) the world carousel: four Earths, one per track, with three levels of depth (overview → detail → immersive);
 * (2) the topic carousel and how data becomes sound; (3) the footer. The 3D planets are the carousel's own scene (WorldScene); the Atlas globe is not loaded here.
 * Only the starfield layers move with the scroll (parallax). The 3D Earth stays pinned behind the sections below as their backdrop.
 */
export const Landing: React.FC<Props> = ({ fireObs, onPick, onListen, onTour, onSilent, onAbout, onTopic, onOpenHarmonium, onFrame }) => {
  const { t, lang, reduceMotion } = usePrefs();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; applyParallax(root.scrollTop, []); }); };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => { root.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); applyParallax(0, []); };
  }, []);

  const [rain, setRain] = useState<{ cityDots: WorldData['cityDots']; sylhet: number[]; from: string; to: string }>({ cityDots: [], sylhet: [], from: '', to: '' });
  const [gis, setGis] = useState<{ year: number; anomaly: number }[]>([]);
  useEffect(() => {
    fetch('/data/bangladesh_monsoon.json').then((r) => r.json()).then((j: { dates2026: string[]; cities: { name: string; lat: number; lon: number; p2026?: number[] }[] }) => setRain({
      cityDots: j.cities.map((c) => ({ lat: c.lat, lon: c.lon, w: 1 })),
      sylhet: j.cities.find((c) => c.name === 'Sylhet')?.p2026 ?? [],
      from: j.dates2026[0] ?? '', to: j.dates2026[j.dates2026.length - 1] ?? '',
    })).catch(() => {});
    fetch('/data/gistemp_global.json').then((r) => r.json()).then((j: { series: { year: number; anomaly: number }[] }) => setGis(j.series)).catch(() => {});
  }, []);

  const data = useMemo<WorldData>(() => {
    const byLon = [...fireObs].sort((a, b) => a.longitude - b.longitude);
    const melody: Partial<Record<WorldId, number[]>> = { fire: byLon.map((o) => o.value), monsoon: rain.sylhet, pulse: gis.map((p) => p.anomaly) };
    // Key numbers for the split view: counted from the same bundled files the tracks play.
    const n = (v: number, o?: Intl.NumberFormatOptions) => fmtNum(v, lang, o), day = (d: string) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
    const top = fireObs.reduce<EarthObservation | null>((m, o) => (!m || o.value > m.value ? o : m), null), last = gis[gis.length - 1];
    const metrics: WorldData['metrics'] = {
      fire: fireObs.length ? [{ value: n(fireObs.length), label: t('mFires', { date: day(fireObs[0].timestamp.slice(0, 10)) }) }, ...(top ? [{ value: n(top.value, { maximumFractionDigits: 0 }), label: t('mStrongest', { unit: top.unit }) }] : [])] : [],
      frames: [{ value: n(EIC_FRAMES.length), label: t('mFrames') }],
      monsoon: rain.cityDots.length ? [{ value: n(rain.cityDots.length), label: t('mCities') }, { value: n(rain.sylhet.reduce((a, b) => a + b, 0), { maximumFractionDigits: 0 }), label: t('mSylhet', { from: day(rain.from), to: day(rain.to) }) }] : [],
      pulse: last ? [{ value: `${last.anomaly > 0 ? '+' : ''}${n(last.anomaly, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label: t('mAnomaly', { year: n(last.year, { useGrouping: false }) }) }, { value: n(gis.length), label: t('mYears') }] : [],
    };
    return { fireDots: fireObs.map((o) => ({ lat: o.latitude, lon: o.longitude, w: o.normalizedValue })), cityDots: rain.cityDots, melody, metrics };
  }, [fireObs, rain, gis, t, lang]);

  const heroMetrics = useMemo(() => [...(data.metrics.frames ?? []), ...(data.metrics.pulse?.slice(0, 1) ?? [])], [data.metrics]);
  const years = useMemo(() => (gis.length ? { from: fmtNum(gis[0].year, lang, { useGrouping: false }), to: fmtNum(gis[gis.length - 1].year, lang, { useGrouping: false }) } : null), [gis, lang]);
  const scrollDown = () => document.getElementById('landing-more')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  return (
    <div ref={ref} id="landing" tabIndex={-1} className="hero-layer landing outline-none fixed inset-x-0 bottom-0 top-0 z-30 overflow-y-auto overflow-x-hidden">
      <LandingHero metrics={heroMetrics} melody={data.melody.pulse ?? []} years={years} onFrame={onFrame} onGlobe={() => onPick('atlas')} />
      <LandingChapters onFrame={onFrame} />
      <WorldCarousel data={data} onOpen={onPick} onTour={onTour} onListen={onListen} onSilent={onSilent} onDown={scrollDown} onOpenHarmonium={onOpenHarmonium}>
      <div id="landing-more" data-cover className="landing-more">
        {/* Topic carousel (Feature D), then how data becomes sound */}
        <WhenNear><Suspense fallback={<div className="min-h-[24rem]" />}><TopicCarousel onListen={onTopic} /></Suspense></WhenNear>
        <section className="reveal max-w-6xl mx-auto px-5 sm:px-10 py-20" aria-labelledby="how-title">
          <h2 id="how-title" className="land-title">{t('howTitle')}</h2>
          <hr className="world-rule land-rule" />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {([['how1', 'how1d'], ['how2', 'how2d'], ['how3', 'how3d'], ['how4', 'how4d']] as const).map(([h, d], k) => (
              <li key={h} className="glass-flat how-step">
                <span className="how-num tnum" aria-hidden="true">{k + 1}</span>
                <div className="font-semibold text-base text-[var(--ink)]"><span className="sr-only">{k + 1}. </span>{t(h)}</div>
                <p className="text-[var(--ink-2)] leading-relaxed">{t(d)}</p>
              </li>
            ))}
          </ol>
          <button className="mt-8 btn btn-brass world-pill" onClick={onAbout}>{t('readAbout')}</button>
        </section>

        {/* Sonic Quest invite for kids and learners */}
        <section className="reveal max-w-6xl mx-auto px-5 sm:px-10 pb-12" aria-labelledby="quest-banner-title">
          <div className="glass-flat p-6 sm:p-8 rounded-2xl border border-[var(--signal)]/50 bg-[var(--accent-surface)] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--teal)] p-0.5 shadow-xl border-2 border-[var(--signal)] shrink-0 overflow-hidden">
                <img src="/images/ninja_cadet_avatar_sm.jpg" width={96} height={96} loading="lazy" decoding="async" alt="Sonic Eco-Ninja Cadet" className="w-full h-full object-cover rounded-[14px]" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--signal)] font-semibold font-mono mx-auto sm:mx-0">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('questTagline')}</span>
                </div>
                <h3 id="quest-banner-title" className="text-2xl sm:text-3xl font-display font-bold text-[var(--ink)]">
                  {t('questHeroTitle')}
                </h3>
                <p className="text-sm text-[var(--ink-2)] max-w-xl">
                  {t('questHeroDesc')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {onOpenHarmonium && (
                <button
                  onClick={onOpenHarmonium}
                  className="btn shrink-0 text-base font-semibold px-6 py-3.5 rounded-full flex items-center gap-2 shadow-lg cursor-pointer border border-[var(--fire)]"
                >
                  <span aria-hidden="true">🪗</span>
                  <span>{lang === 'bn' ? 'হারমোনিয়াম চ্যাট' : 'Harmonium Chat'}</span>
                </button>
              )}
              <button
                onClick={() => onPick('quest')}
                className="btn btn-brass shrink-0 text-base font-semibold px-7 py-3.5 rounded-full flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>{lang === 'bn' ? 'গেম শুরু করুন (Start Game)' : 'Start Game (Blue Planet Radio)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <Footer onAbout={onAbout} />
      </div>
      </WorldCarousel>
    </div>
  );
};
