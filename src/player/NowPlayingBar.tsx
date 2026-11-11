import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pause, Play, SkipForward, Square, Volume2, VolumeX, X } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { digits } from '../jukebox/format';
import { DataScrubber } from './DataScrubber';
import { useNowPlaying, type NowPlaying } from './nowPlaying';
import { setFullTab, toggleFullPlayer, useFullPlayer, type FullTab } from './ui';
import { useReactiveGlow } from './reactive';

const SPEEDS = [0.5, 1, 2, 4];

/** The one transport, pinned at the bottom whenever a player has published itself. Hidden on the landing page. */
type Tab = FullTab;

/** The full player: Up next, Narration (the "lyrics" of the data) and How it sounds. Opens above the bar. */
function FullPlayer({ np }: { np: NowPlaying }) {
  const { t } = usePrefs();
  const { tab } = useFullPlayer(), setTab = setFullTab;
  const tabs: { id: Tab; key: 'npTabUpNext' | 'npTabNarration' | 'npTabHow' | 'npTabSignal' }[] = [{ id: 'next', key: 'npTabUpNext' }, { id: 'narration', key: 'npTabNarration' }, { id: 'how', key: 'npTabHow' }, ...(np.signal ? [{ id: 'signal' as Tab, key: 'npTabSignal' as const }] : [])];
  const cur: Tab = tab === 'signal' && !np.signal ? 'next' : tab; // another player is on: the Atlas-only tab is gone
  return (
    <div id="np-full" className="np-full glass-strong" role="region" aria-label={t('npExpand')}>
      <div className="np-full-head" style={{ viewTransitionName: 'np-title' }}>{/* the bar's title morphs into this one */}
        <p className="np-title truncate">{np.title}</p>
        {np.label && <p className="np-full-read tnum"><strong>{np.label}</strong>{np.valueText && <> · {np.valueText}</>}</p>}
      </div>
      <div role="tablist" aria-label={np.title} className="flex gap-1">
        {tabs.map((x) => <button key={x.id} id={`np-tab-${x.id}`} role="tab" type="button" aria-selected={cur === x.id} aria-controls="np-panel" className="btn btn-ghost" onClick={() => setTab(x.id)}>{t(x.key)}</button>)}
      </div>
      <div id="np-panel" role="tabpanel" aria-labelledby={`np-tab-${cur}`} className="np-panel scroll-thin">
        {cur === 'next' && (np.upNext?.length ? <>
          <ol className="space-y-1">{np.upNext.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-2 text-sm"><span className="truncate">{u.title}</span>
              <button type="button" className="btn btn-icon !min-h-[32px]" aria-label={t('jbQueueRemove', { title: u.title })} onClick={() => np.controls.dequeue?.(u.id)}><X className="w-3.5 h-3.5" aria-hidden="true" /></button></li>))}</ol>
          <button type="button" className="btn btn-ghost mt-2" onClick={np.controls.clearQueue}>{t('npClearQueue')}</button></> : <p className="text-sm text-[var(--ink-3)]">{t('npQueueEmpty')}</p>)}
        {cur === 'narration' && <p className="text-sm text-[var(--ink-2)] leading-relaxed">{np.details?.narration || t('npNoNarration')}</p>}
        {cur === 'signal' && np.signal}
        {cur === 'how' && (np.details?.mapping.length ? <ul className="text-sm text-[var(--ink-2)] space-y-1 list-disc pl-4">{np.details.mapping.map((m) => <li key={m}>{m}</li>)}</ul> : <p className="text-sm text-[var(--ink-3)]">{t('npNoMapping')}</p>)}
      </div>
    </div>
  );
}

export function NowPlayingBar({ hidden }: { hidden?: boolean }) {
  const np = useNowPlaying();
  const { t, lang } = usePrefs();
  const { open } = useFullPlayer();
  const { reduceMotion } = usePrefs();
  const barRef = useRef<HTMLElement>(null);
  useReactiveGlow(barRef, !!np && !hidden && np.state === 'playing', reduceMotion);
  const theme = hidden ? undefined : np?.dataset;
  useEffect(() => { // the accent follows what is playing
    const el = document.documentElement;
    if (theme) el.dataset.dataset = theme; else delete el.dataset.dataset;
    return () => { delete el.dataset.dataset; };
  }, [theme]);
  if (!np || hidden) return null;
  const playing = np.state === 'playing', busy = np.state === 'busy';
  const c = np.controls;
  const toggleKey = playing ? (np.pauses === false ? 'plStop' : 'plPause') : np.state === 'paused' ? 'plResume' : 'plPlay';
  return (
    <section ref={barRef} className="np-bar glass-strong safe-pb" aria-label={t('npLabel')} data-player-state={np.state}>
      <div className="np-meta min-w-0" style={{ viewTransitionName: open ? undefined : 'np-title' }}>
        <p className="np-title truncate">{np.title}</p>
        <p className="np-sub truncate">
          <span className="chip np-badge">{t(np.badge === 'sample' ? 'npSample' : 'npSnapshot')}</span> {np.subtitle}
        </p>
      </div>
      <div className="np-main">
        <div className="np-ctl flex items-center gap-1">
          {c.step && <button type="button" className="btn btn-icon" onClick={() => c.step!(-1)} disabled={np.index <= 0} aria-label={t('jbPrev')}><ChevronLeft className="w-4 h-4" /></button>}
          <button type="button" className="btn btn-brass" onClick={c.toggle} disabled={busy} aria-label={t(toggleKey)}>
            {playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}<span className="hidden sm:inline">{t(toggleKey)}</span></button>
          {np.pauses !== false && <button type="button" className="btn btn-icon max-[599px]:hidden" onClick={c.stop} disabled={!(playing || np.state === 'paused')} aria-label={t('plStop')}><Square className="w-4 h-4" /></button>}
          {c.nextStory && !!np.upNext?.length && <button type="button" className="btn btn-icon" onClick={c.nextStory} aria-label={t('npNextStory')}><SkipForward className="w-4 h-4" aria-hidden="true" /></button>}
          {c.step && <button type="button" className="btn btn-icon" onClick={() => c.step!(1)} disabled={np.index >= np.count - 1} aria-label={t('jbNext')}><ChevronRight className="w-4 h-4" /></button>}
        </div>
        {c.seek && np.count > 0 && <DataScrubber spark={np.spark} index={np.index} count={np.count} label={np.label} valueText={np.valueText} ariaLabel={t('plSeek')} onSeek={c.seek} />}
        {np.label && <p className="np-read tnum" aria-live="off"><strong>{np.label}</strong>{np.valueText && <> · {np.valueText}</>}</p>}
      </div>
      <div className="np-side">
        {c.setMuted && <button type="button" className="btn btn-icon" aria-pressed={!!np.muted} aria-label={t('plMute')} onClick={() => c.setMuted!(!np.muted)}>{np.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>}
        {c.setVolume && <input type="range" className="jb-range np-vol" min={0} max={100} step={5} value={Math.round((np.volume ?? 1) * 100)} aria-label={t('plVolume')} aria-valuetext={`${digits(Math.round((np.volume ?? 1) * 100), lang)}%`} onChange={(e) => c.setVolume!(+e.target.value / 100)} />}
        {c.setSpeed && <select className="btn min-h-[40px]" value={np.speed ?? 1} aria-label={t('plSpeed')} onChange={(e) => c.setSpeed!(+e.target.value)}>
          {SPEEDS.map((x) => <option key={x} value={x}>{digits(x, lang)}×</option>)}</select>}
      </div>
      <button type="button" className="btn btn-icon np-expand" aria-expanded={open} aria-controls="np-full" aria-label={t(open ? 'npCollapse' : 'npExpand')} onClick={toggleFullPlayer}>{open ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronUp className="w-4 h-4" aria-hidden="true" />}</button>
      {open && <FullPlayer np={np} />}
      <p className="sr-only" role="status" aria-live="polite">{playing ? t('npNowPlaying', { title: np.title }) : ''}</p>
    </section>
  );
}
