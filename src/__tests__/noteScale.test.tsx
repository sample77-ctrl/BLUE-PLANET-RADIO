// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { NoteScale } from '../jukebox/NoteScale';
import { freqOf, noteName, SEMITONES } from '../sonification/series/mapping';
import type { MappedPoint } from '../sonification/series/mapping';

afterEach(cleanup);

describe('NoteScale', () => {
  it('lists the eleven pentatonic notes G5 down to G3 with the real frequencies', () => {
    const { container } = render(<PrefsProvider><NoteScale current={null} /></PrefsProvider>);
    const items = [...container.querySelectorAll('li')];
    expect(items).toHaveLength(SEMITONES.length);
    expect(items[0].textContent).toContain('G5');
    expect(items[0].textContent).toContain(String(Math.round(freqOf(10))));
    expect(items[items.length - 1].textContent).toContain('G3');
    expect(container.querySelector('[data-on="true"]')).toBeNull();
  });
  it('lights only the note at the cursor and stays silent for gaps', () => {
    const note = { kind: 'note', degree: 9 } as MappedPoint;
    const { container, rerender } = render(<PrefsProvider><NoteScale current={note} /></PrefsProvider>);
    const lit = container.querySelectorAll('[data-on="true"]');
    expect(lit).toHaveLength(1);
    expect(lit[0].textContent).toContain(noteName(9));
    rerender(<PrefsProvider><NoteScale current={{ kind: 'silence' }} /></PrefsProvider>);
    expect(container.querySelector('[data-on="true"]')).toBeNull();
  });
});
