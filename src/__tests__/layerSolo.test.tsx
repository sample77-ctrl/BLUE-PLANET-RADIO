// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { LayersPanel } from '../atlas/LayersPanel';

afterEach(cleanup);
const base = { enabled: { fire: true, precipitation: true, sst: false }, onToggle: () => {}, counts: { fire: 3, precipitation: 2, sst: 1 }, isFallback: true, statusMessage: 'x', audioReady: false, onOpenData: () => {} };

describe('layer solo and mute', () => {
  it('shows solo and mute per layer, calls back, reflects muted state, and disables them for layers that are off', () => {
    const onSolo = vi.fn(), onMute = vi.fn();
    render(<PrefsProvider><LayersPanel {...base} muted={{ fire: true, precipitation: false, sst: false }} onSolo={onSolo} onMute={onMute} /></PrefsProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Solo Rain' }));
    expect(onSolo).toHaveBeenCalledWith('precipitation');
    const fireMute = screen.getByRole('button', { name: 'Mute Wildfires' });
    expect(fireMute.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(fireMute); expect(onMute).toHaveBeenCalledWith('fire');
    // off layers: aria-disabled (focusable, so the reason is reachable by keyboard); pressing does nothing
    const offSolo = screen.getByRole('button', { name: 'Solo Ocean heat' }) as HTMLButtonElement;
    expect(offSolo.getAttribute('aria-disabled')).toBe('true');
    expect(offSolo.disabled).toBe(false);
    offSolo.focus(); expect(document.activeElement).toBe(offSolo);
    fireEvent.click(offSolo); fireEvent.click(screen.getByRole('button', { name: 'Mute Ocean heat' }));
    expect(onSolo).not.toHaveBeenCalledWith('sst'); expect(onMute).not.toHaveBeenCalledWith('sst');
  });
  it('explains why a disabled Mute/Solo is disabled, and exposes solo with aria-pressed', () => {
    const on = { fire: true, precipitation: true, sst: false };
    const { rerender } = render(<PrefsProvider><LayersPanel {...base} enabled={on} muted={{ fire: false, precipitation: false, sst: false }} onSolo={() => {}} onMute={() => {}} /></PrefsProvider>);
    const off = screen.getByRole('button', { name: 'Solo Ocean heat' });
    expect(off.getAttribute('title')).toBe('Ocean heat is off. Switch it on from its card first.');
    expect(document.getElementById(off.getAttribute('aria-describedby')!)?.textContent).toBe('Ocean heat is off. Switch it on from its card first.');
    expect(screen.getByRole('button', { name: 'Solo Rain' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: 'Solo Rain' }).getAttribute('aria-describedby')).toBeNull();
    rerender(<PrefsProvider><LayersPanel {...base} enabled={on} muted={{ fire: true, precipitation: false, sst: false }} onSolo={() => {}} onMute={() => {}} /></PrefsProvider>);
    expect(screen.getByRole('button', { name: 'Solo Rain' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Solo Wildfires' }).getAttribute('aria-pressed')).toBe('false');
  });
  it('is unchanged without the new props', () => {
    render(<PrefsProvider><LayersPanel {...base} /></PrefsProvider>);
    expect(screen.queryByRole('button', { name: /^Solo/ })).toBeNull();
  });
});
