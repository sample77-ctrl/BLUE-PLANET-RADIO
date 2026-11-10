import { usePrefs } from '../lib/prefs';
import { freqOf, noteName, SEMITONES, type MappedPoint } from '../sonification/series/mapping';
import { digits } from './format';

/** The G-major pentatonic scale every Jukebox series is played on (G3–G5), with the note at the cursor lit. Decorative: the legend next to the chart says the same in words. */
export function NoteScale({ current }: { current: MappedPoint | null }) {
  const { t, lang } = usePrefs();
  const on = current?.kind === 'note' ? current.degree : -1;
  const degrees = SEMITONES.map((_, i) => i).reverse();
  return (
    <aside className="note-scale" aria-hidden="true">
      <h3 className="note-scale-h">{t('jbNoteScale')}</h3>
      <p className="note-scale-sub">{t('jbNoteScaleSub')}</p>
      <ol>
        {degrees.map((d) => (
          <li key={d} data-on={d === on}>
            <span className="n">{noteName(d)}</span>
            <i style={{ '--w': `${30 + (d / 10) * 70}%` } as React.CSSProperties} />
            <span className="hz">{digits(Math.round(freqOf(d)), lang)} Hz</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
