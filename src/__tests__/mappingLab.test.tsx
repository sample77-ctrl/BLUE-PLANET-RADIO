// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { MappingLab } from '../about/MappingLab';
import { normalizeValue } from '../sonification/normalizer';

afterEach(cleanup);
const lab = () => render(<PrefsProvider><MappingLab /></PrefsProvider>);

describe('MappingLab (Science page)', () => {
  it('shows the real normalised value for the slider and updates it', () => {
    lab();
    expect(screen.getByText(`norm = ${normalizeValue('fire', 450).toFixed(2)}`)).toBeDefined();
    fireEvent.change(screen.getByLabelText(/Value/i), { target: { value: '100' } });
    expect(screen.getByText(`norm = ${normalizeValue('fire', 100).toFixed(2)}`)).toBeDefined();
  });
  it('switches layer and resets to that layer\'s reference value, with its own formula', () => {
    lab();
    fireEvent.click(screen.getByRole('radio', { name: /Ocean heat/i }));
    expect(screen.getByText(`norm = ${normalizeValue('sst', 2.3).toFixed(2)}`)).toBeDefined();
    expect(screen.getByText(/Anomaly - \(-5\.0\)/)).toBeDefined();
    expect(screen.getByText(/steady drone/i)).toBeDefined();
  });
  it('says the sound is a reference, not a recording', () => {
    lab();
    expect(screen.getByText(/not a recording and not an observation/i)).toBeDefined();
  });
});
