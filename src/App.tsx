import { decodeLocation, buildUrl, encodeShare, encodeLegacyShare } from './lib/shareLink';
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import type { EarthObservation, PhenomenonType, DatasetTimeSlice } from './types/dataset';
import { DatasetAdapter, type AdapterResult } from './datasets/adapter';
import { AudioContextManager } from './audio/audioContext';
import { SonificationEngine } from './audio/sonificationEngine';
import { Accessible2DMap } from './map/Accessible2DMap';
import { AudioFirstMode } from './accessibility/AudioFirstMode';
import { Header } from './components/Header';
import { sectionOf, type Track } from './lib/nav';
import { Landing } from './landing/Landing';
import { GlobeBoundary } from './components/GlobeBoundary';
import { usePlaybackReport } from './lib/playbackContext';
import { InspectLocationModal } from './components/InspectLocationModal';
import { MobileSheet } from './atlas/MobileSheet';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { SettingsDialog } from './components/SettingsDialog';
import { DataMethodDialog } from './components/DataMethodDialog';
import { LayersPanel } from './atlas/LayersPanel';
import { HearingPanel, HearingSignal } from './atlas/HearingPanel';
import { TimelineBar } from './atlas/TimelineBar';
import { TourBar } from './demo/TourBar';
import { NowPlayingBar } from './player/NowPlayingBar';
import { usePublishNowPlaying } from './player/nowPlaying';
import { setQueue } from './player/queue';
import { installMediaSession } from './player/mediaSession';
import { getNowPlaying } from './player/nowPlaying';
import { setFullPlayer, toggleFullPlayer, withViewTransition } from './player/ui';
import { CommandPalette, type Command } from './components/CommandPalette';
import { storiesFor } from './stories/stories';
import { countryLabel } from './lib/placesBn';
import { formatDay } from './atlas/formatDay';
import { digits } from './jukebox/format';
import { usePrefs } from './lib/prefs';
import { useCountry } from './countries/useCountry';
import { CountryPanel } from './countries/CountryPanel';
import { ProfileDataContext } from './countries/profileContext';
import { gibsUrl } from './lib/gibs';
import { Globe, Map as MapIcon, List, Satellite, RotateCw, Layers, AudioLines, MapPinned, Shuffle, Crosshair, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

const GlobeCanvas = lazy(() => import('./globe/GlobeCanvas').then((m) => ({ default: m.GlobeCanvas })));
const FrameJukebox = lazy(() => import('./tracks/FrameJukebox').then((m) => ({ default: m.FrameJukebox })));
const BangladeshMonsoon = lazy(() => import('./tracks/BangladeshMonsoon').then((m) => ({ default: m.BangladeshMonsoon })));
const VitalSigns = lazy(() => import('./tracks/VitalSigns').then((m) => ({ default: m.VitalSigns })));
const JukeboxView = lazy(() => import('./jukebox/JukeboxView').then((m) => ({ default: m.JukeboxView })));
const AboutPage = lazy(() => import('./about/AboutPage').then((m) => ({ default: m.AboutPage })));
const SonicQuest = lazy(() => import('./game/SonicQuest').then((m) => ({ default: m.SonicQuest })));
const HarmoniumChatModal = lazy(() => import('./harmonium/HarmoniumChatModal').then((m) => ({ default: m.HarmoniumChatModal })));

type View = '3d-globe' | '2d-map' | 'audio-first';
const LAYERS: PhenomenonType[] = ['fire', 'precipitation', 'sst'];
const TUNE_RADIUS = 30; // degrees
const angleBetween = (la1: number, lo1: number, la2: number, lo2: number) => {
  const r = Math.PI / 180, c = Math.sin(la1 * r) * Math.sin(la2 * r) + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.cos((lo1 - lo2) * r);
  return Math.acos(Math.max(-1, Math.min(1, c))) / r;
};

export function App() {
  const { t, lang, set, keyShortcuts } = usePrefs();
  const [initialShare] = useState(() => { const d = decodeLocation(window.location.pathname, window.location.search, window.location.hash, { frames: [], pairs: [] }); if (d?.q) setQueue(d.q); return d; });
  const [showHero, setShowHero] = useState(!initialShare?.track);
  const [autoListen, setAutoListen] = useState(false);
  const [track, setTrack] = useState<Track>(initialShare?.track ?? 'atlas');
  const [lastJukebox, setLastJukebox] = useState<Track>(initialShare?.track && sectionOf(initialShare.track) === 'jukebox' ? initialShare.track : 'jukebox');
  // What the Jukebox opens on; `n` remounts it when the landing carousel or a country profile asks for a story.
  const [jbStart, setJbStart] = useState<{ story?: string; t?: string; n: number }>(() => (initialShare?.track === 'jukebox' ? { story: initialShare.story, t: initialShare.t, n: 0 } : { n: 0 }));
  const [globeFailed, setGlobeFailed] = useState(false);
  const [view, setView] = useState<View>('3d-globe');
  const [audioReady, setAudioReady] = useState(false);
  const [soundState, setSoundState] = useState<'off' | 'starting' | 'on' | 'blocked'>('off'); // blocked = the browser kept the audio context suspended
  const [volume, setVolume] = useState(0.7);
  const [spatialMode, setSpatialMode] = useState<'spatial-hrtf' | 'stereo-panning'>('stereo-panning');
  const [autoRotate, setAutoRotate] = useState(false);
  const [imagery, setImagery] = useState(false);
  const [focus, setFocus] = useState<{ lat: number; lon: number } | null>(null);

  const [data, setData] = useState<AdapterResult | null>(null);
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // Atlas day-step speed
  const [muted, setMuted] = useState<Record<PhenomenonType, boolean>>({ fire: false, precipitation: false, sst: false });
  const [tune, setTune] = useState(false); // hear only what is near the middle of the globe
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [leftOpen, setLeftOpen] = useState(true), [rightOpen, setRightOpen] = useState(true);
  const [hearChange, setHearChange] = useState(false);
  const [enabled, setEnabled] = useState<Record<PhenomenonType, boolean>>({ fire: true, precipitation: false, sst: false });
  const [selected, setSelected] = useState<EarthObservation | null>(null);

  const [tourOpen, setTourOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState(false);
  const [sheet, setSheet] = useState<'layers' | 'hearing' | 'country' | null>(null);
  const [harmoniumOpen, setHarmoniumOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Lazy data (roadmap §3 weight): the NASA snapshots are for the landing numbers, the Atlas and the Jukebox country profiles; the borders for the Atlas, Jukebox and the palette. Once wanted, they stay.
  const [dataWanted, setDataWanted] = useState(false), [bordersWanted, setBordersWanted] = useState(false);
  if (!dataWanted && (showHero || track === 'atlas' || track === 'jukebox')) setDataWanted(true);
  if (!bordersWanted && ((!showHero && (track === 'atlas' || track === 'jukebox')) || paletteOpen)) setBordersWanted(true);
  const cty = useCountry(initialShare?.c, bordersWanted);

  useEffect(() => { if (initialShare?.lang && initialShare.lang !== lang) set({ lang: initialShare.lang }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dataWanted) return;
    DatasetAdapter.loadDatasets('live').then(setData).catch(() => DatasetAdapter.loadDatasets('demo').then(setData));
  }, [dataWanted]);

  const slices: DatasetTimeSlice[] = useMemo(() => data?.slices ?? [], [data]);
  const slice = slices[day] ?? slices[0];
  const observations = useMemo(() => slice?.observations ?? [], [slice]);
  // What is heard: layers that are on and not muted; in tune mode only sounds within 30° of the middle of the globe.
  const audibleLayers = useMemo(() => ({ fire: enabled.fire && !muted.fire, precipitation: enabled.precipitation && !muted.precipitation, sst: enabled.sst && !muted.sst }), [enabled, muted]);
  const audible = useMemo(() => (tune && center && view === '3d-globe' ? observations.filter((o) => angleBetween(o.latitude, o.longitude, center.lat, center.lon) <= TUNE_RADIUS) : observations), [observations, tune, center, view]);
  // The landing carousel draws the first snapshot's fires on its Earth and plays them in the preview.
  const landingFire = useMemo(() => slices[0]?.observations.filter((o) => o.phenomenon === 'fire') ?? [], [slices]);
  const counts = useMemo(() => {
    const c: Record<PhenomenonType, number> = { fire: 0, precipitation: 0, sst: 0 };
    observations.forEach((o) => c[o.phenomenon]++);
    return c;
  }, [observations]);

  useEffect(() => {
    const curShare = decodeLocation(window.location.pathname, window.location.search, window.location.hash, { frames: [], pairs: [] });
    if (showHero) {
      const target = window.location.search ? `/${window.location.search}` : '/';
      if (window.location.pathname !== '/' || window.location.hash) {
        history.replaceState(null, '', target);
      }
    } else {
      const isLegacyHash = window.location.hash && window.location.hash.includes('v1&');
      if (isLegacyHash) {
        const nextHash = encodeLegacyShare({ ...curShare, track, c: cty.id ?? undefined });
        if (window.location.hash !== nextHash) history.replaceState(null, '', nextHash);
      } else {
        const own = track === 'jukebox' ? {} : { story: undefined, t: undefined };
        const nextUrl = buildUrl({ ...curShare, ...own, track, c: cty.id ?? undefined });
        if (window.location.pathname + window.location.search + window.location.hash !== nextUrl) {
          history.replaceState(null, '', nextUrl);
        }
      }
    }
  }, [track, showHero, cty.id]);
  // The landing page is laid out for a 90% type scale on desktop (see html.landing-open in index.css)
  useEffect(() => { document.documentElement.classList.toggle('landing-open', showHero); return () => document.documentElement.classList.remove('landing-open'); }, [showHero]);

  useEffect(() => installMediaSession(), []);
  // The Atlas scrubber's chart: how many observations each day holds on the layers that are switched on (real counts from the loaded slices).
  const dayCounts = useMemo(() => slices.map((sl) => sl.observations.filter((o) => enabled[o.phenomenon]).length), [slices, enabled]);
  usePublishNowPlaying('atlas', track === 'atlas' && !showHero && view !== '2d-map' && slices.length > 0 ? {
    id: 'atlas', dataset: enabled.fire ? 'fire' : enabled.precipitation ? 'rain' : enabled.sst ? 'teal' : undefined, title: t('track1'), subtitle: `${t('npAtlasSub')} · ${formatDay(slices[0].dateLabel, lang)}–${formatDay(slices[slices.length - 1].dateLabel, lang)}`, badge: 'snapshot', state: playing ? 'playing' : 'ready',
    index: day, count: slices.length, label: formatDay(slices[day]?.dateLabel ?? slices[0].dateLabel, lang), valueText: t('npAtlasCount', { n: digits(dayCounts[day] ?? 0, lang) }), spark: dayCounts,
    speed, signal: <HearingSignal observations={observations} enabled={enabled} audioReady={audioReady} />, controls: { setSpeed, toggle: () => setPlaying((p) => !p), stop: () => setPlaying(false), step: (by) => setDay((d) => (d + by + slices.length) % slices.length), seek: setDay },
  } : null);
  usePlaybackReport('atlas', t('track1'), playing && track === 'atlas' && !showHero, () => setPlaying(false));

  useEffect(() => { AudioContextManager.setMasterVolume(volume); }, [volume, audioReady]);
  useEffect(() => { SonificationEngine.getInstance().setHearChangeMode(hearChange); }, [hearChange]);

  // The spatial engine only plays while the Atlas track is on screen.
  useEffect(() => {
    const eng = SonificationEngine.getInstance();
    if (audioReady && track === 'atlas' && !showHero) eng.syncObservations(audible, audibleLayers);
    else eng.stopAllVoices();
  }, [audioReady, audible, audibleLayers, track, showHero]);

  const soundOn = useCallback(async () => {
    setSoundState('starting');
    try { await AudioContextManager.init(); } catch { /* reported as blocked below */ }
    if (!AudioContextManager.isReady()) { setAudioReady(false); setSoundState('blocked'); return; } // autoplay policy, silent mode or no audio device
    SonificationEngine.getInstance().setAudioUnlocked(true);
    AudioContextManager.setMasterVolume(volume);
    setAudioReady(true);
    setSoundState('on');
  }, [volume]);
  const soundOff = useCallback(() => { SonificationEngine.getInstance().setAudioUnlocked(false); setAudioReady(false); setSoundState('off'); }, []);

  const toggleSpatial = () => {
    const next = spatialMode === 'spatial-hrtf' ? 'stereo-panning' : 'spatial-hrtf';
    setSpatialMode(next);
    SonificationEngine.getInstance().setSpatialMode(next);
  };

  const navigate = (tr: Track) => { setTrack(tr); if (sectionOf(tr) === 'jukebox') setLastJukebox(tr); };
  const goAbout = () => { navigate('about'); setShowHero(false); setTourOpen(false); };
  const openJukebox = (story?: string) => { setJbStart((j) => ({ story, n: j.n + 1 })); navigate('jukebox'); setShowHero(false); setTourOpen(false); };
  const pickTrack = async (tr: Track) => {
    navigate(tr);
    setShowHero(false);
    if ((tr === 'atlas' || tr === 'quest') && !audioReady) await soundOn();
  };
  // One click from the landing page: sound on and an Earth Information Center frame playing.
  const listenNow = async () => {
    navigate('frames'); setShowHero(false); setAutoListen(true);
    if (!audioReady) await soundOn();
  };
  const startTour = async () => {
    setTrack('atlas'); setView('3d-globe'); setShowHero(false);
    if (!audioReady) await soundOn();
    setTourOpen(true);
  };

  /** Solo: this layer on and heard, every other layer muted (still visible). Solo again clears the mutes. */
  const solo = (p: PhenomenonType) => setMuted((m) => {
    const others = LAYERS.filter((x) => x !== p), isSolo = !m[p] && others.every((x) => m[x] || !enabled[x]);
    return Object.fromEntries(LAYERS.map((x) => [x, isSolo ? false : x !== p])) as Record<PhenomenonType, boolean>;
  });
  const surprise = () => {
    if (cty.list.length) cty.select(cty.list[Math.floor(Math.random() * cty.list.length)]);
    if (slices.length) setDay(Math.floor(Math.random() * slices.length));
  };
  const commands = ((): Command[] => {
    const view = (id: string, label: string, run: () => void): Command => ({ id: `v-${id}`, label, group: t('paletteViews'), run });
    return [
      view('atlas', t('navExplore'), () => { navigate('atlas'); setShowHero(false); }),
      view('jukebox', t('navJukebox'), () => openJukebox()),
      view('quest', t('navQuest'), () => { void pickTrack('quest'); }),
      view('about', t('navAbout'), goAbout),
      view('frames', t('track2'), () => { void pickTrack('frames'); }),
      view('monsoon', t('track3'), () => { void pickTrack('monsoon'); }),
      view('pulse', t('track4'), () => { void pickTrack('pulse'); }),
      { id: 'a-sound', label: t(audioReady ? 'soundOff' : 'soundOn'), group: t('paletteAction'), run: () => (audioReady ? soundOff() : soundOn()) },
      { id: 'a-tour', label: t('tour'), group: t('paletteAction'), run: startTour },
      { id: 'a-settings', label: t('settings'), group: t('paletteAction'), run: () => setSettingsOpen(true) },
      ...storiesFor(null).filter((s) => s.visual === 'chart').map((s): Command => ({ id: `s-${s.id}`, label: lang === 'bn' ? s.titleBn : s.title, group: t('paletteStory'), run: () => openJukebox(s.id) })),
      ...cty.list.map((c): Command => ({ id: `c-${c.id}`, label: countryLabel(c.id, c.name, lang), group: t('paletteCountry'), run: () => { cty.select(c); navigate('atlas'); setShowHero(false); } })),
    ];
  })();

  // Keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') { // the one shortcut that is not a single key, so it stays on
        if (document.querySelector('[aria-modal="true"]')) return;
        e.preventDefault(); setPaletteOpen(true); return;
      }
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[aria-modal="true"]')) return; // a dialog is open: it owns the keyboard
      if (!keyShortcuts) return; // WCAG 2.1.4: single-key shortcuts can be turned off in Settings
      const k = e.key.toLowerCase();
      if (k === '?' || k === ',') { setSettingsOpen(true); return; }
      if (k === '/') { e.preventDefault(); setPaletteOpen(true); return; }
      const np = getNowPlaying();
      if (np && !showHero) { // the shared transport: whatever is published to the Now-Playing bar
        const c = np.controls;
        if ((e.key === ' ' && tag !== 'BUTTON' && tag !== 'A') || k === 'k') { e.preventDefault(); c.toggle(); return; }
        if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && c.seek && np.count > 0) { e.preventDefault(); c.seek(Math.max(0, Math.min(np.count - 1, np.index + (e.key === 'ArrowRight' ? 10 : -10)))); return; }
        if (!e.shiftKey && k === 'n' && (c.nextStory && np.upNext?.length ? (c.nextStory(), true) : c.step ? (c.step(1), true) : false)) return;
        if (!e.shiftKey && k === 'p' && c.step) { c.step(-1); return; }
        if (e.shiftKey && k === 'm' && c.setMuted) { c.setMuted(!np.muted); return; }
        if (!e.shiftKey && k === 'e') { toggleFullPlayer(); return; }
        if (!e.shiftKey && k === 'q') { setFullPlayer(true, 'next'); return; }
      }
      if (k === 'h') { setHarmoniumOpen((o) => !o); return; }
      if (showHero) return;
      if (k === 's') { if (audioReady) soundOff(); else soundOn(); return; }
      if (k === 't') { startTour(); return; }
      if (track !== 'atlas') return;
      if (e.key === ' ' && tag !== 'BUTTON') { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === 'ArrowRight' && view !== '2d-map') setDay((d) => (d + 1) % Math.max(1, slices.length));
      else if (e.key === 'ArrowLeft' && view !== '2d-map') setDay((d) => (d - 1 + slices.length) % Math.max(1, slices.length));
      else if (e.shiftKey && /^Digit[123]$/.test(e.code)) solo(LAYERS[+e.code.slice(5) - 1]);
      else if (k === '1' || k === '2' || k === '3') { const p = (['fire', 'precipitation', 'sst'] as PhenomenonType[])[+k - 1]; setEnabled((o) => ({ ...o, [p]: !o[p] })); }
      else if (k === 'g') setView('3d-globe');
      else if (k === 'm') setView('2d-map');
      else if (k === 'l') setView('audio-first');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const profileData = useMemo(() => ({
    slices, snapshotDates: data?.snapshotDates, isFallback: !!data?.isFallback, loading: !data,
    onExplore: (c: string) => openJukebox(`c-${c.toLowerCase()}-temp`),
  }), [slices, data]); // eslint-disable-line react-hooks/exhaustive-deps

  // A Jukebox story opens its full collection; an EIC picture opens on that frame (FrameJukebox reads the hash on mount).
  const openCollection = (tr: Track, frameId?: string) => {
    if (tr === 'frames' && frameId) history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${encodeShare({ track: 'frames', frame: frameId, c: cty.id ?? undefined })}`);
    pickTrack(tr);
  };

  const jbFront = track === 'jukebox' && !showHero;
  const [jbSeen, setJbSeen] = useState(false);
  if (jbFront && !jbSeen) setJbSeen(true); // derived during render, so the first visit mounts in the same pass
  const jbOn = jbSeen || jbFront;

  const imageryUrl = imagery && slice && /^\d{4}-\d{2}-\d{2}$/.test(slice.dateLabel) ? gibsUrl('VIIRS_SNPP_CorrectedReflectance_TrueColor', slice.dateLabel, 'jpeg', 2048) : null;

  const layersPanel = (
    <LayersPanel enabled={enabled} onToggle={(p) => setEnabled((o) => ({ ...o, [p]: !o[p] }))} counts={counts} muted={muted}
      onMute={(p) => setMuted((o) => ({ ...o, [p]: !o[p] }))} onSolo={solo}
      statuses={data?.layerStatuses} isFallback={!!data?.isFallback} statusMessage={data?.statusMessage ?? 'Loading NASA data…'}
      audioReady={audioReady} onOpenData={() => setDataOpen(true)} />
  );
  const countryPanel = <CountryPanel list={cty.list} country={cty.country} point={cty.point} onSelect={cty.select} />;
  const hearingPanel = <HearingPanel observations={observations} enabled={enabled} audioReady={audioReady} onSelect={(o) => { setSelected(o); SonificationEngine.getInstance().playObservation(o); }} />;

  return (
    <ProfileDataContext.Provider value={profileData}>
    <div className={`${showHero ? 'hero-open ' : ''}flex flex-col h-[100dvh] w-full max-w-[100vw] overflow-hidden`}>
      <a href={showHero ? '#landing' : '#main'} className="sr-only-focusable absolute z-[80] left-2 top-2 btn btn-brass">{t('skip')}</a>
      {showHero && <Landing fireObs={landingFire} onPick={(tr) => withViewTransition(() => { void pickTrack(tr); }, document.querySelector('main'))}
        onTour={startTour} onListen={() => openJukebox()} onSilent={() => { setShowHero(false); setTrack('atlas'); }} onAbout={goAbout} onTopic={openJukebox} onFrame={(id) => withViewTransition(() => { openCollection('frames', id); }, document.querySelector('main'))} onOpenHarmonium={() => setHarmoniumOpen(true)} />}

      <Header track={track} onLanding={showHero} onTrack={(tr) => withViewTransition(() => { navigate(tr); setShowHero(false); setTourOpen(false); }, document.querySelector('main'))} lastJukebox={lastJukebox}
        audioReady={audioReady} soundState={soundState} onToggleAudio={() => (audioReady ? soundOff() : soundOn())} onListen={listenNow}
        onHome={() => { setShowHero(true); setTourOpen(false); }} onTour={startTour} onData={() => setDataOpen(true)} onSettings={() => setSettingsOpen(true)} settingsOpen={settingsOpen} onOpenHarmonium={() => setHarmoniumOpen(true)} />

      <p className="sr-only" role="status" aria-live="polite">{soundState === 'on' ? t('soundOn') : soundState === 'starting' ? t('soundStarting') : soundState === 'blocked' ? t('audioBlocked') : ''}</p>
      {soundState === 'blocked' && (
        <div role="alert" className="sound-alert glass-pop">
          <p>{t('audioBlocked')}</p>
          <div className="flex gap-2"><button className="btn btn-brass" onClick={() => soundOn()}>{t('soundRetry')}</button><button className="btn btn-ghost" onClick={() => setSoundState('off')}>{t('soundDismiss')}</button></div>
        </div>
      )}
      <main id="main" className="flex-1 relative w-full overflow-hidden">
        {/* First child = the visual canvas (the landing hero shows the globe from here). */}
        <div className="absolute inset-0">
          {track === 'atlas' && !showHero && <h1 className="sr-only">{t('navExplore')}: {t('track1')}</h1>}
          {track === 'atlas' && !showHero && view === '3d-globe' && (
            <GlobeBoundary onFail={() => setGlobeFailed(true)} fallback={<Accessible2DMap observations={observations} enabledPhenomena={enabled} selectedObservation={selected} onSelectObservation={setSelected}
                countries={cty.list} country={cty.country} onSelectCountry={cty.select} />}>
              <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-sm text-[var(--ink-3)]">{t('loadingGlobe')}</div>}>
                <GlobeCanvas observations={observations} enabledPhenomena={enabled} selectedObservation={selected}
                  onSelectObservation={setSelected} autoRotate={autoRotate} targetFocus={focus} imageryUrl={imageryUrl}
                  framing="explore"
                  countries={cty.list} country={cty.country} countryPoint={cty.point} onSelectCountry={cty.select} onCenter={tune ? (lat, lon) => setCenter({ lat, lon }) : undefined} />
              </Suspense>
            </GlobeBoundary>
          )}
          {track === 'atlas' && !showHero && view === '2d-map' && (
            <Accessible2DMap observations={observations} enabledPhenomena={enabled} selectedObservation={selected} onSelectObservation={setSelected}
                countries={cty.list} country={cty.country} onSelectCountry={cty.select} />
          )}
          {track === 'atlas' && !showHero && view === 'audio-first' && (
            <div className={`w-full h-full overflow-y-auto pb-6 pt-[calc(var(--header-h)+1.5rem)] ${leftOpen ? 'lg:pl-[372px]' : ''} ${rightOpen ? 'lg:pr-[372px]' : ''}`}>
              <AudioFirstMode observations={observations.filter((o) => enabled[o.phenomenon])} currentDateLabel={slice?.dateLabel ?? ''} selectedObservation={selected}
                onSelectObservation={setSelected} onExitAudioFirst={() => setView('3d-globe')}
                countries={{ list: cty.list, country: cty.country, point: cty.point, onSelect: cty.select }} />
            </div>
          )}
          {/* The Jukebox stays mounted after its first visit so its sound keeps playing in other views (roadmap §3.1 D9). */}
          {jbOn && (
            <Suspense fallback={jbFront ? <div className="h-full grid place-items-center text-sm text-[var(--ink-3)]">{t('loadingView')}</div> : null}>
              <JukeboxView key={jbStart.n} mode={jbFront ? 'front' : showHero ? 'off' : 'back'} initialStory={jbStart.story} initialT={jbStart.t} onOpenCollection={openCollection}
                countries={{ list: cty.list, country: cty.country, point: cty.point, onSelect: cty.select }} />
            </Suspense>
          )}
          {track !== 'atlas' && !showHero && (
            <Suspense fallback={<div className="h-full grid place-items-center text-sm text-[var(--ink-3)]">{t('loadingView')}</div>}>
              {track === 'frames' && <FrameJukebox autoPlay={autoListen} onAutoPlayed={() => setAutoListen(false)} onPlay={() => { if (!audioReady) soundOn(); }} onOpenStory={(id) => openJukebox(id)} />}
              {track === 'monsoon' && <BangladeshMonsoon />}
              {track === 'pulse' && <VitalSigns />}
              {track === 'about' && <AboutPage onOpenMethod={() => setDataOpen(true)} />}
              {track === 'quest' && <SonicQuest onExplore={() => { setTrack('atlas'); setShowHero(false); }} onSoundOn={soundOn} audioReady={audioReady} />}
            </Suspense>
          )}
        </div>

        {track === 'atlas' && !showHero && (
          <>
            <TourBar open={tourOpen} onClose={() => { setTourOpen(false); setFocus(null); }}
              onApply={(layers, d, change, f) => { setEnabled(layers); setDay(Math.min(d, Math.max(0, slices.length - 1))); setHearChange(change); setFocus(f); if (view !== '3d-globe') setView('3d-globe'); }} />

            {/* Desktop side column */}
            <div className={`${leftOpen ? "hidden lg:flex" : "hidden"} flex-col gap-3 absolute left-3 top-[calc(var(--header-h)+.75rem)] bottom-[75px] w-[340px] max-h-[calc(100vh-var(--header-h)-5.25rem)] overflow-y-auto scroll-thin z-20 pb-4`}>
              {view !== 'audio-first' && countryPanel}
              {layersPanel}
            </div>

            {/* Desktop right rail: what you are hearing (live waveform, spectrum, stereo position) */}
            <div className={`${rightOpen ? "hidden lg:flex" : "hidden"} flex-col gap-3 absolute right-3 top-[calc(var(--header-h)+.75rem)] bottom-[75px] w-[340px] max-h-[calc(100vh-var(--header-h)-5.25rem)] overflow-y-auto scroll-thin z-20 pb-4`} data-ctl="hearing">
              {hearingPanel}
            </div>
            <button type="button" className="btn btn-icon hidden lg:inline-flex absolute z-30 top-[calc(var(--header-h)+.75rem)] transition-[left] duration-200" style={{ left: leftOpen ? 360 : 12 }} aria-expanded={leftOpen} aria-label={t(leftOpen ? 'collapseLeft' : 'openLeft')} title={t(leftOpen ? 'collapseLeft' : 'openLeft')} onClick={() => setLeftOpen((o) => !o)}>{leftOpen ? <PanelLeftClose className="w-4 h-4" aria-hidden="true" /> : <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />}</button>
            <button type="button" className="btn btn-icon hidden lg:inline-flex absolute z-30 top-[calc(var(--header-h)+.75rem)] transition-[right] duration-200" style={{ right: rightOpen ? 360 : 12 }} aria-expanded={rightOpen} aria-label={t(rightOpen ? 'collapseRight' : 'openRight')} title={t(rightOpen ? 'collapseRight' : 'openRight')} onClick={() => setRightOpen((o) => !o)}>{rightOpen ? <PanelRightClose className="w-4 h-4" aria-hidden="true" /> : <PanelRightOpen className="w-4 h-4" aria-hidden="true" />}</button>
            {view === '3d-globe' && tune && <><div className="tune-reticle" aria-hidden="true" /><p className="sr-only" role="status" aria-live="polite">{t('tuneStatus', { n: audible.length })}</p></>}
            {view === '3d-globe' && <div className="globe-hud hud-frame hidden lg:block" aria-hidden="true"><i /></div>}

            {/* View switch and globe options */}
            <div data-ctl="views" className="absolute left-[3.75rem] right-3 justify-end flex-wrap top-[calc(var(--header-h)+3.5rem)] lg:top-[calc(var(--header-h)+.75rem)] lg:left-1/2 lg:right-auto lg:justify-start lg:flex-nowrap lg:-translate-x-1/2 z-20 flex flex-row items-start lg:items-center gap-2">
              <div className="glass p-1 flex gap-1" role="group" aria-label={t('viewGroup')}>
                {([['3d-globe', Globe, 'globe'], ['2d-map', MapIcon, 'map'], ['audio-first', List, 'list']] as const).map(([v, Icon, key]) => (
                  <button key={v} className="btn btn-ghost min-h-[36px] pointer-coarse:min-h-[44px] px-2.5" aria-pressed={view === v} aria-label={t(key)} onClick={() => setView(v)}>
                    <Icon className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline" aria-hidden="true">{t(key)}</span>
                  </button>
                ))}
              </div>
              <div className="glass p-1 flex flex-row gap-1">
                <button className="btn btn-ghost min-h-[36px] px-2.5" onClick={surprise} title={t('surpriseHint')}><Shuffle className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline lg:max-2xl:sr-only">{t('surprise')}</span></button>
                {view === '3d-globe' && <button className="btn btn-ghost min-h-[36px] px-2.5" aria-pressed={tune} onClick={() => setTune((v) => !v)} title={t('tuneHint')}><Crosshair className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline lg:max-2xl:sr-only">{t('tune')}</span></button>}
              </div>
              {view === '3d-globe' && (
                <div className="glass p-1 flex flex-row gap-1">
                  <button className="btn btn-ghost min-h-[36px] px-2.5 justify-start" aria-pressed={imagery} onClick={() => setImagery(!imagery)} title={t('imageryHint')}><Satellite className="w-4 h-4" /><span className="hidden sm:inline lg:max-2xl:sr-only">{t('imagery')}</span></button>
                  <button className="btn btn-ghost min-h-[36px] px-2.5 justify-start" aria-pressed={autoRotate} onClick={() => setAutoRotate(!autoRotate)} aria-label={t('spinHint')}><RotateCw className="w-4 h-4" /><span className="hidden sm:inline lg:max-2xl:sr-only">{t('spin')}</span></button>
                </div>
              )}
            </div>

            {/* Mobile panel buttons */}
            <div data-ctl="bar" className="lg:hidden absolute left-3 right-3 top-[calc(var(--header-h)+.5rem)] z-20 flex gap-2 overflow-x-auto scroll-thin fade-x pe-7">
              <button className="btn glass shrink-0" onClick={() => setSheet('layers')}><Layers className="w-4 h-4" />{t('layers')}</button>
              <button className="btn glass shrink-0" onClick={() => setSheet('hearing')}><AudioLines className="w-4 h-4" />{t('nowHearing')}</button>
              {view !== 'audio-first' && <button className="btn glass shrink-0" onClick={() => setSheet('country')}><MapPinned className="w-4 h-4" />{t('country')}</button>}
            </div>
            {sheet && (
              <MobileSheet onClose={() => setSheet(null)}>
                {sheet === 'layers' ? layersPanel : sheet === 'country' ? countryPanel : hearingPanel}
              </MobileSheet>
            )}

            <div data-ctl="timeline" className="absolute bottom-2 sm:bottom-3 left-2 right-2 lg:left-[var(--tl-l)] lg:right-3 z-20" style={{ ['--tl-l' as string]: leftOpen ? '340px' : '12px' }}>
              {globeFailed && view === '3d-globe' && <p role="status" className="glass px-3 py-2 mb-2 text-sm text-[var(--ink-2)] w-fit max-w-full">{t('webglOff')}</p>}
              <TimelineBar slices={slices} index={day} onChange={setDay} playing={playing}
                hearChange={hearChange} onToggleHearChange={() => setHearChange(!hearChange)} enabled={enabled} speed={speed} />
            </div>
          </>
        )}
      </main>

      <NowPlayingBar hidden={showHero} />
      {paletteOpen && <CommandPalette open onClose={() => setPaletteOpen(false)} commands={commands} />}

      <InspectLocationModal observation={selected} onClose={() => setSelected(null)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} volume={volume} onVolume={setVolume} spatialMode={spatialMode}
        onToggleSpatial={toggleSpatial} showDiagnostics={diagnostics} onToggleDiagnostics={() => setDiagnostics(!diagnostics)} />
      <DataMethodDialog open={dataOpen} onClose={() => setDataOpen(false)} sstGlobal={data?.sstGlobal} onAbout={track === 'about' && !showHero ? undefined : () => { setDataOpen(false); goAbout(); }} />
      {harmoniumOpen && (
        <Suspense fallback={null}>
          <HarmoniumChatModal
            isOpen={harmoniumOpen}
            onClose={() => setHarmoniumOpen(false)}
            onExploreGlobe={() => {
              setHarmoniumOpen(false);
              setShowHero(false);
              setTrack('atlas');
            }}
          />
        </Suspense>
      )}
      {diagnostics && <DiagnosticsPanel activeDatasetCount={observations.length} currentTimestep={day} totalTimesteps={slices.length} isOpen onToggle={() => setDiagnostics(false)} />}
    </div>
    </ProfileDataContext.Provider>
  );
}
export default App;
