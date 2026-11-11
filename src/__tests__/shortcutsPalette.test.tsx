// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { CommandPalette, type Command } from '../components/CommandPalette';

afterEach(() => { cleanup(); localStorage.clear(); });
const cmds = (run: (id: string) => void): Command[] => [
  { id: 'a', label: 'Explore Earth', group: 'View', run: () => run('a') },
  { id: 'b', label: 'Bangladesh', group: 'Country', run: () => run('b') },
  { id: 'c', label: 'Global temperature since 1880', group: 'Story', run: () => run('c') },
];
const open = (run = vi.fn(), onClose = vi.fn()) => { render(<PrefsProvider><CommandPalette open onClose={onClose} commands={cmds(run)} /></PrefsProvider>); return { run, onClose }; };

describe('command palette', () => {
  it('filters as you type, moves with the arrows and runs the chosen command on Enter, closing first', () => {
    const { run, onClose } = open();
    const box = screen.getByRole('combobox');
    expect(screen.getAllByRole('option')).toHaveLength(3);
    fireEvent.change(box, { target: { value: 'glob' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Global temperature since 1880Story']);
    fireEvent.change(box, { target: { value: '' } });
    fireEvent.keyDown(box, { key: 'ArrowDown' }); fireEvent.keyDown(box, { key: 'ArrowDown' });
    expect(box.getAttribute('aria-activedescendant')).toBe('cmd-c');
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onClose).toHaveBeenCalled(); expect(run).toHaveBeenCalledWith('c');
  });
  it('says so when nothing matches, and runs nothing on Enter', () => {
    const { run } = open();
    const box = screen.getByRole('combobox');
    fireEvent.change(box, { target: { value: 'zzzz' } });
    expect(screen.getByText('Nothing matches.')).toBeTruthy();
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(run).not.toHaveBeenCalled();
  });
  it('is a labelled modal dialog', () => {
    open();
    expect(screen.getByRole('dialog', { name: 'Search and jump' }).getAttribute('aria-modal')).toBe('true');
  });
});
