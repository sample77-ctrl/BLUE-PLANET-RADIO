import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Settings, Database, Compass, Menu, X, Pause, Play, Piano } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { usePlayback } from '../lib/playbackContext';
import { useNowPlaying } from '../player/nowPlaying';
import { JUKEBOX_TRACKS, sectionOf, type Section, type Track } from '../lib/nav';
import type { StringKey } from '../lib/strings';

/** Collections row: the Jukebox's own stories view, then A2/B1/B2. */
const COLLECTIONS: { id: Track; key: StringKey; code: string }[] = [{ id: 'jukebox', key: 'jbStoriesNav', code: '♪' }, ...JUKEBOX_TRACKS];

interface Props {
  track: Track;
  onLanding: boolean;
  onTrack: (t: Track) => void;
  lastJukebox: Track;
  audioReady: boolean;
  soundState?: 'off' | 'starting' | 'on' | 'blocked';
  onToggleAudio: () => void;
  onHome: () => void;
  onListen: () => void;
  onTour: () => void;
  onData: () => void;
  onSettings: () => void;
  settingsOpen?: boolean;
  onOpenHarmonium?: () => void;
}

export const Header: React.FC<Props> = ({ track, onLanding, onTrack, lastJukebox, audioReady, soundState = audioReady ? 'on' : 'off', onToggleAudio, onHome, onListen, onTour, onData, onSettings, settingsOpen, onOpenHarmonium }) => {
  const { t, lang, set } = usePrefs();
  const { active: activeAny, pause } = usePlayback();
  const barShown = !!useNowPlaying() && !onLanding; // the Now-Playing bar replaces the header chip
  const active = barShown ? null : activeAny;
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const section = onLanding ? null : sectionOf(track);
  const headerRef = useRef<HTMLElement>(null);
  const viewKey = `${track}|${onLanding}`;
  const [scrollState, setScrollState] = useState({ key: '', on: false }); // valid for one view only: a new view starts at the top
  const scrolled = scrollState.key === viewKey && scrollState.on;

  // The header is fixed and content scrolls under it. Publish its real height (the Jukebox adds a second row) as --header-h.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    set();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(set) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  // Denser glass once a page-sized scroller has moved (scroll events don't bubble, so listen in the capture phase).
  useEffect(() => {
    const on = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el?.nodeType === 1 && el.clientHeight > window.innerHeight * 0.5) setScrollState({ key: viewKey, on: el.scrollTop > 8 });
    };
    document.addEventListener('scroll', on, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', on, { capture: true });
  }, [viewKey]);

  const sections: { id: Section; label: string; go: Track }[] = [
    { id: 'frames', label: t('navFrames'), go: 'frames' },
    { id: 'explore', label: t('navExplore'), go: 'atlas' },
    { id: 'jukebox', label: t('navJukebox'), go: lastJukebox },
    { id: 'quest', label: t('navQuest'), go: 'quest' },
    { id: 'about', label: t('navAbout'), go: 'about' },
  ];
  const go = (tr: Track) => { setMenu(false); onTrack(tr); };

  // Mobile menu: focus the first item, trap Tab inside, Esc closes and returns focus to the button.
  useEffect(() => {
    if (!menu) return;
    const panel = menuPanel.current;
    const items = () => Array.from(panel?.querySelectorAll<HTMLElement>('button, a[href]') ?? []);
    items()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setMenu(false); menuBtn.current?.focus(); return; }
      if (e.key !== 'Tab') return;
      const list = items(), first = list[0], last = list[list.length - 1];
      if (!first) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  return (
    <header ref={headerRef} data-scrolled={scrolled ? 'true' : 'false'} className="site-header z-40">
      <div className="flex items-center gap-2 px-3 sm:px-4 h-[var(--header-row)]">
        <button ref={menuBtn} className="btn btn-ghost btn-icon lg:hidden" aria-expanded={menu} aria-controls="site-menu" onClick={() => setMenu(!menu)} aria-label={t('menu')}>
          {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <button onClick={onHome} className="flex items-center justify-center gap-2 cursor-pointer shrink-0 pointer-coarse:min-h-[44px] pointer-coarse:min-w-[44px]" aria-label={`${t('appName')}, ${t('home')}`}>
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">{/* a needle over a frame: the mark of the Frame Jukebox */}
            <rect x="1" y="3" width="24" height="20" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <path d="M1 17 L7 11 L12 15 L18 7 L25 13" fill="none" stroke="var(--signal)" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="15" y="0" width="2.5" height="26" fill="var(--signal)" />
          </svg>
          <span className="wordmark hidden sm:inline">{t('appName')}</span>
        </button>

        <nav className="hidden lg:flex items-center gap-1 ml-4" aria-label={t('mainNav')}>
          {sections.map((s) => (
            <button key={s.id} className="nav-link" onClick={() => go(s.go)} aria-current={section === s.id ? 'page' : undefined}>{s.label}</button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 min-w-0">
          {active && (
            <button className="chip max-w-[11rem] sm:max-w-[16rem] min-h-[36px] pointer-coarse:min-h-[44px] cursor-pointer border-[var(--signal)] text-[var(--ink)]" onClick={pause} aria-label={t('pausePlayback', { label: active.label })}>
              <Pause className="w-3.5 h-3.5 shrink-0 text-[var(--signal)]" />
              <span className="truncate">{t('playingNow', { label: active.label })}</span>
            </button>
          )}
          {!activeAny && !onLanding && <button className="btn hidden md:inline-flex" onClick={onListen}><Play className="w-4 h-4" />{t('listenNow')}</button>}
          <button className="btn btn-ghost px-2.5 min-h-[36px] pointer-coarse:min-h-[44px] pointer-coarse:min-w-[44px] font-semibold" lang={lang === 'bn' ? 'en' : 'bn'} aria-label={t('switchLang')} title={t('switchLang')} onClick={() => set({ lang: lang === 'bn' ? 'en' : 'bn' })}>{lang === 'bn' ? 'EN' : 'বাংলা'}</button>
          {onOpenHarmonium && (
            <button
              className="btn btn-ghost hidden md:inline-flex items-center gap-1.5 border border-[var(--line)] px-2.5"
              onClick={onOpenHarmonium}
              aria-label="Harmonium Chat"
              title="3D Harmonium & AI Climate Chat"
            >
              <Piano className="w-4 h-4" aria-hidden="true" />
              <span className="hidden xl:inline font-semibold">Harmonium</span>
            </button>
          )}
          <button className="btn btn-ghost hidden md:inline-flex" onClick={onTour} aria-label={t('tour')} title={t('tour')}><Compass className="w-4 h-4" /><span className="hidden 2xl:inline">{t('tour')}</span></button>
          <button className="btn btn-ghost btn-icon" onClick={() => { setMenu(false); onData(); }} aria-haspopup="dialog" aria-label={t('data')} title={t('data')}><Database className="w-4 h-4" /></button>
          <button className="btn btn-ghost btn-icon" onClick={() => { setMenu(false); onSettings(); }} aria-haspopup="dialog" aria-expanded={!!settingsOpen} aria-label={t('settings')} title={t('settings')}><Settings className="w-4.5 h-4.5" /></button>
          {(() => { const label = t(soundState === 'on' ? 'soundOn' : soundState === 'starting' ? 'soundStarting' : soundState === 'blocked' ? 'soundBlocked' : 'soundOff'); return (
          <button className="btn sound-btn" data-state={soundState} onClick={onToggleAudio} aria-pressed={audioReady} title={`${label} (S)`} aria-label={label}>
            {audioReady ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden xl:inline">{label}</span>
          </button>); })()}
        </div>
      </div>

      {/* Jukebox collections: a second row only inside the Data Jukebox */}
      {section === 'jukebox' && (
        <nav className="flex gap-1 px-2 sm:px-4 pb-2 pe-7 overflow-x-auto scroll-snap-x fade-x" aria-label={t('collections')}>
          {COLLECTIONS.map((tr) => (
            <button key={tr.id} onClick={() => go(tr.id)} aria-current={track === tr.id ? 'page' : undefined} className="nav-link shrink-0">
              {t(tr.key)}
            </button>
          ))}
        </nav>
      )}

      {menu && (
        <div ref={menuPanel} id="site-menu" className="lg:hidden absolute left-0 right-0 top-full glass-pop rounded-none p-3 max-h-[calc(100dvh-var(--header-h))] overflow-y-auto">
          <nav aria-label={t('mainNav')}>
            <ul className="flex flex-col gap-1">
              <li><button className="nav-link w-full min-h-[44px]" onClick={() => go('frames')} aria-current={section === 'frames' ? 'page' : undefined}>{t('navFrames')}</button></li>
              <li><button className="nav-link w-full min-h-[44px]" onClick={() => go('atlas')} aria-current={section === 'explore' ? 'page' : undefined}>{t('navExplore')}</button></li>
              <li>
                <button className="nav-link w-full min-h-[44px]" onClick={() => go(lastJukebox)} aria-current={section === 'jukebox' ? 'page' : undefined}>{t('navJukebox')}</button>
                <ul className="ml-4 mt-1 flex flex-col gap-1 border-l border-[var(--line)] pl-2" aria-label={t('collections')}>
                  {COLLECTIONS.map((tr) => (
                    <li key={tr.id}><button className="nav-link w-full min-h-[44px]" onClick={() => go(tr.id)} aria-current={track === tr.id && !onLanding ? 'page' : undefined}>{t(tr.key)}</button></li>
                  ))}
                </ul>
              </li>
              <li><button className="nav-link w-full min-h-[44px]" onClick={() => go('quest')} aria-current={section === 'quest' ? 'page' : undefined}>{t('navQuest')}</button></li>
              <li><button className="nav-link w-full min-h-[44px]" onClick={() => go('about')} aria-current={section === 'about' ? 'page' : undefined}>{t('navAbout')}</button></li>
            </ul>
          </nav>
          <div className="mt-3 pt-3 border-t border-[var(--line)] flex flex-wrap gap-2">
            {onOpenHarmonium && (
              <button
                className="btn flex items-center gap-2"
                onClick={() => { setMenu(false); onOpenHarmonium(); }}
              >
                <Piano className="w-4 h-4" aria-hidden="true" />
                <span>Harmonium Chat</span>
              </button>
            )}
            <button className="btn" onClick={() => { setMenu(false); onListen(); }}><Play className="w-4 h-4" />{t('listenNow')}</button>
            <button className="btn" onClick={() => { setMenu(false); onTour(); }}><Compass className="w-4 h-4" />{t('tour')}</button>
            <button className="btn" onClick={() => { setMenu(false); onData(); }}><Database className="w-4 h-4" />{t('data')}</button>
          </div>
        </div>
      )}
    </header>
  );
};
