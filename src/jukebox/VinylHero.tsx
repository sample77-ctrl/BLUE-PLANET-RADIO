import { Pause, Play } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import type { SeriesPoint } from '../datasets/series';
import type { MappedPoint } from '../sonification/series/mapping';
import { MAX_PULSES } from '../sonification/series/mapping';
import { digits, timeLabel, valueLabel } from './format';

interface Props { title: string; unit: string; point: SeriesPoint | null; mapped: MappedPoint | null; playing: boolean; onToggle: () => void; position: string }

/** The Jukebox as an instrument: a record with the Earth as its label, and a big readout of what is playing now (value, note, timbre, pulses). All values are the series' own. */
export function VinylHero({ title, unit, point, mapped, playing, onToggle, position }: Props) {
  const { t, lang } = usePrefs();
  const note = mapped?.kind === 'note' && point?.v != null ? mapped : null;
  return (
    <section className="vinyl-hero" aria-label={t('jbNowPlaying')}>
      <div className="vinyl-wrap">
        <div className="vinyl" data-spin={playing} aria-hidden="true">
          <div className="vinyl-label" />
        </div>
        <button type="button" className="vinyl-play" onClick={onToggle} aria-hidden="true" tabIndex={-1}>
          {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
        </button>
      </div>
      <div className="vinyl-info">
        <p className="hero-eyebrow">{t('jbNowPlaying')} · {position}</p>
        <h2 className="vinyl-title font-display">{title}</h2>
        <dl className="vinyl-read">
          <div><dt>{t('jbRdWhen')}</dt><dd className="big">{point ? timeLabel(point.t, lang) : '–'}</dd></div>
          <div><dt>{t('jbRdValue')}</dt><dd>{point && point.v !== null ? valueLabel(point.v, unit, lang) : '–'}</dd></div>
          <div><dt>{t('jbRdNote')}</dt><dd style={{ color: 'var(--warm)' }}>{note ? `${note.note} · ${digits(Math.round(note.freq), lang)} Hz` : '–'}</dd></div>
          <div><dt>{t('jbRdTimbre')}</dt><dd>{note ? t(note.timbre === 'warm' ? 'jbTimbreWarm' : note.timbre === 'soft' ? 'jbTimbreSoft' : 'jbTimbrePlain') : '–'}</dd></div>
          <div><dt>{t('jbRdPulses')}</dt><dd>{note ? `${digits(note.pulses, lang)} / ${digits(MAX_PULSES, lang)}` : '–'}</dd></div>
        </dl>
      </div>
    </section>
  );
}
