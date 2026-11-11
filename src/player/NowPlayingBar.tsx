import { ChevronLeft, ChevronRight, Pause, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { digits } from '../jukebox/format';
import { DataScrubber } from './DataScrubber';
import { useNowPlaying } from './nowPlaying';

const SPEEDS = [0.5, 1, 2, 4];

/** The one transport, pinned at the bottom whenever a player has published itself. Hidden on the landing page. */
export function NowPlayingBar({ hidden }: { hidden?: boolean }) {
  const np = useNowPlaying();
  const { t, lang } = usePrefs();
  if (!np || hidden) return null;
  const playing = np.state === 'playing', busy = np.state === 'busy';
  const c = np.controls;
  const toggleKey = playing ? 'plPause' : np.state === 'paused' ? 'plResume' : 'plPlay';
  return (
    <section className="np-bar glass-strong safe-pb" aria-label={t('npLabel')} data-player-state={np.state}>
      <div className="np-meta min-w-0">
        <p className="np-title truncate">{np.title}</p>
        <p className="np-sub truncate">
          <span className="chip np-badge">{t(np.badge === 'sample' ? 'npSample' : 'npSnapshot')}</span> {np.subtitle}
        </p>
      </div>
      <div className="np-main">
        <div className="flex items-center gap-1">
          <button type="button" className="btn btn-icon" onClick={() => c.step(-1)} disabled={np.index <= 0} aria-label={t('jbPrev')}><ChevronLeft className="w-4 h-4" /></button>
          <button type="button" className="btn btn-brass" onClick={c.toggle} disabled={busy} aria-label={t(toggleKey)}>
            {playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}<span className="hidden sm:inline">{t(toggleKey)}</span></button>
          <button type="button" className="btn btn-icon" onClick={c.stop} disabled={!(playing || np.state === 'paused')} aria-label={t('plStop')}><Square className="w-4 h-4" /></button>
          <button type="button" className="btn btn-icon" onClick={() => c.step(1)} disabled={np.index >= np.count - 1} aria-label={t('jbNext')}><ChevronRight className="w-4 h-4" /></button>
        </div>
        <DataScrubber spark={np.spark} index={np.index} count={np.count} label={np.label} valueText={np.valueText} ariaLabel={t('plSeek')} onSeek={c.seek} />
        <p className="np-read tnum" aria-live="off"><strong>{np.label}</strong>{np.valueText && <> · {np.valueText}</>}</p>
      </div>
      <div className="np-side">
        <button type="button" className="btn btn-icon" aria-pressed={np.muted} aria-label={t('plMute')} onClick={() => c.setMuted(!np.muted)}>{np.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
        <input type="range" className="jb-range np-vol" min={0} max={100} step={5} value={Math.round(np.volume * 100)} aria-label={t('plVolume')} aria-valuetext={`${digits(Math.round(np.volume * 100), lang)}%`} onChange={(e) => c.setVolume(+e.target.value / 100)} />
        <select className="btn min-h-[40px]" value={np.speed} aria-label={t('plSpeed')} onChange={(e) => c.setSpeed(+e.target.value)}>
          {SPEEDS.map((x) => <option key={x} value={x}>{digits(x, lang)}×</option>)}</select>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{playing ? t('npNowPlaying', { title: np.title }) : ''}</p>
    </section>
  );
}
