// @vitest-environment jsdom
// The three overlays added outside the useDialog pattern: role/aria, focus in, Tab trap, Esc, scrim, focus back.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { PrefsProvider } from '../lib/prefs';
import { QuestBadgeModal } from '../game/QuestBadgeModal';
import { MyEarthPassport } from '../game/MyEarthPassport';
import { HarmoniumChatModal } from '../harmonium/HarmoniumChatModal';
import { harmoniumAudio } from '../harmonium/harmoniumAudio';

afterEach(() => { cleanup(); document.getElementById('overlay-root')?.remove(); document.getElementById('root')?.remove(); });
beforeEach(() => {
  localStorage.clear();
  const root = document.createElement('div'); root.id = 'root'; document.body.appendChild(root);
  vi.spyOn(harmoniumAudio, 'noteOn').mockImplementation(async () => {});
  vi.spyOn(harmoniumAudio, 'noteOff').mockImplementation(() => {});
  vi.spyOn(harmoniumAudio, 'stopAll').mockImplementation(() => {});
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

/** A real opener button that toggles the dialog, rendered inside #root like the app. */
function Host({ children }: { children: (open: boolean, close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  return <PrefsProvider><button onClick={() => setOpen(true)}>opener</button>{children(open, () => setOpen(false))}</PrefsProvider>;
}
const mount = (ui: (open: boolean, close: () => void) => ReactNode) => render(<Host>{ui}</Host>, { container: document.getElementById('root')! });
const focusables = (d: HTMLElement) => Array.from(d.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));

function checkDialog(dialog: HTMLElement) {
  expect(dialog.getAttribute('aria-modal')).toBe('true');
  const label = dialog.getAttribute('aria-labelledby');
  expect(label).toBeTruthy();
  expect(document.getElementById(label!)?.textContent?.trim().length).toBeGreaterThan(0);
  expect(dialog.contains(document.activeElement)).toBe(true); // focus moved in
  const list = focusables(dialog);
  list[list.length - 1].focus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(document.activeElement).toBe(list[0]); // forward Tab wraps
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(list[list.length - 1]); // Shift+Tab wraps back
}

describe('overlay dialog semantics', () => {
  it('QuestBadgeModal: dialog, trap, Esc, scrim, focus back', () => {
    const onClose = vi.fn();
    mount((open, close) => open && <QuestBadgeModal onClose={() => { onClose(); close(); }} onExploreGlobe={() => {}} onOpenDJ={() => {}} />);
    const opener = screen.getByText('opener'); opener.focus(); fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    checkDialog(dialog);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    fireEvent.click(opener); fireEvent.click(screen.getByRole('dialog').parentElement!); // scrim
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('MyEarthPassport: the view is not a dialog; the certificate overlay is', () => {
    render(<PrefsProvider><MyEarthPassport onBack={() => {}} stars={{ 1: 3, 2: 3, 3: 3, 4: 3 }} /></PrefsProvider>, { container: document.getElementById('root')! });
    expect(screen.queryByRole('dialog')).toBeNull();
    const opener = screen.getByText(/certificate/i, { selector: 'button *, button' }).closest('button') as HTMLElement;
    opener.focus(); fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    checkDialog(dialog);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText('Back')).toBeDefined();
    expect(document.activeElement).toBe(opener);
  });

  it('HarmoniumChatModal: dialog, trap, Esc closes, note keys play and do not close, focus back', () => {
    const onClose = vi.fn();
    mount((open, close) => <HarmoniumChatModal isOpen={open} onClose={() => { onClose(); close(); }} />);
    const opener = screen.getByText('opener'); opener.focus(); fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    checkDialog(dialog);
    const down = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    act(() => { window.dispatchEvent(down); });
    expect(harmoniumAudio.noteOn).toHaveBeenCalledWith('C4');
    expect(down.defaultPrevented).toBe(true);
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    act(() => { window.dispatchEvent(space); });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(harmoniumAudio.stopAll).toHaveBeenCalled();
    expect(document.activeElement).toBe(opener);
  });
});
