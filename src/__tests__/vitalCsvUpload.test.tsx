// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { VitalSigns } from '../tracks/VitalSigns';

vi.mock('../audio/audioContext', () => ({ AudioContextManager: { getContext: () => null } }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const upload = async (input: HTMLInputElement, name: string, text: string) => {
  const file = new File([text], name, { type: 'text/csv' });
  Object.defineProperty(file, 'text', { value: () => Promise.resolve(text) });
  fireEvent.change(input, { target: { files: [file] } });
};

describe('Vital Signs own-data upload', () => {
  it('keeps the earlier valid file, shows a named alert for a bad one, and clears it on the next good file', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ series: [] }) })));
    render(<PrefsProvider><VitalSigns /></PrefsProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Your data' }));
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    await upload(input, 'good.csv', '2000,1\n2001,2\n2002,3');
    await waitFor(() => screen.getByText('good.csv: 3 rows'));
    await upload(input, 'bad.csv', 'a,b\nc,d');
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('“bad.csv” was not loaded');
    expect(alert.textContent).toContain('two numeric columns');
    expect(alert.textContent).toContain('“good.csv” is still loaded');
    expect(screen.getByText('good.csv: 3 rows')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Choose another file' })).toBeTruthy();
    await upload(input, 'ok2.csv', '1,1\n2,2');
    await waitFor(() => screen.getByText('ok2.csv: 2 rows'));
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('names the reason for a one-row file', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ series: [] }) })));
    render(<PrefsProvider><VitalSigns /></PrefsProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Your data' }));
    await upload(document.querySelector('input[type=file]') as HTMLInputElement, 'one.csv', '2000,1');
    expect((await screen.findByRole('alert')).textContent).toContain('fewer than 2 usable rows');
  });
});
