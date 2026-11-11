import React, { useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { Overlay } from './Overlay';
import { useDialog } from '../lib/useDialog';

export interface Command { id: string; label: string; group: string; run: () => void }

/** ⌘K / Ctrl+K or "/": jump to a view, a country, a Jukebox story or an action. A combobox over a listbox, the same pattern as the country picker. */
export const CommandPalette: React.FC<{ open: boolean; onClose: () => void; commands: Command[] }> = ({ open, onClose, commands }) => {
  const { t } = usePrefs();
  const ref = useRef<HTMLDivElement>(null);
  useDialog(open, onClose, ref);
  const [q, setQ] = useState(''), [active, setActive] = useState(0);
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (n ? commands.filter((c) => c.label.toLowerCase().includes(n)) : commands).slice(0, 30);
  }, [commands, q]);
  if (!open) return null;
  const run = (c: Command | undefined) => { if (!c) return; onClose(); c.run(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(shown[active]); }
  };
  return (
    <Overlay>
      <div className="scrim fixed inset-0 z-[90] grid place-items-start justify-items-center pt-[12vh] px-3" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div ref={ref} role="dialog" aria-modal="true" aria-label={t('paletteTitle')} className="glass-pop w-full max-w-xl p-3 space-y-2">
          <div className="flex items-center gap-2 px-1"><Search className="w-4 h-4 text-[var(--ink-3)]" aria-hidden="true" />
            <input autoFocus role="combobox" aria-expanded="true" aria-controls="cmd-list" aria-activedescendant={shown[active] ? `cmd-${shown[active].id}` : undefined} aria-autocomplete="list"
              className="flex-1 bg-transparent outline-none py-2" placeholder={t('palettePlaceholder')} value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKey} /></div>
          <ul id="cmd-list" role="listbox" aria-label={t('paletteTitle')} className="max-h-[50vh] overflow-y-auto scroll-thin">
            {shown.map((c, i) => (
              <li key={c.id} id={`cmd-${c.id}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => run(c)}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer ${i === active ? 'bg-[var(--accent-soft)]' : ''}`}>
                <span className="truncate">{c.label}</span><span className="text-xs text-[var(--ink-3)] shrink-0">{c.group}</span></li>))}
            {!shown.length && <li className="px-3 py-2 text-sm text-[var(--ink-3)]" role="presentation">{t('paletteEmpty')}</li>}
          </ul>
        </div>
      </div>
    </Overlay>
  );
};
