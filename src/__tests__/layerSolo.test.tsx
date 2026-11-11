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
    expect((screen.getByRole('button', { name: 'Solo Ocean heat' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('is unchanged without the new props', () => {
    render(<PrefsProvider><LayersPanel {...base} /></PrefsProvider>);
    expect(screen.queryByRole('button', { name: /^Solo/ })).toBeNull();
  });
});
