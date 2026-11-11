import React from 'react';
import { Lock, Play, Rocket } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import type { MissionInfo } from './WorldMapHub';
import type { ScreenMode } from './SonicRangersGame';

interface Props {
  missions: MissionInfo[];
  totalStars: number;
  onSelectMission: (id: number) => void;
  onOpenScreen: (s: ScreenMode) => void;
  onExplore: () => void;
  onOpenBadges: () => void;
}

const DATA_CLASS = ['q-fire', 'q-rain', 'q-ocean', 'q-sat']; // the dataset each mission plays: FIRMS fire, POWER rain, MUR ocean, GISTEMP greenhouse

/** Card art: the bundled mission pictures where there are any, small inline scenes (token colours) for the other two. */
const Art: React.FC<{ id: number }> = ({ id }) => {
  if (id === 1) return <img src="/images/game/wildfire_tactical_command_sm.jpg" alt="" loading="lazy" />;
  if (id === 4) return <img src="/images/game/nasa_satellite_drone_mesh_sm.jpg" alt="" loading="lazy" />;
  if (id === 2) return (
    <svg viewBox="0 0 260 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="260" height="200" fill="var(--panel-2)" />
      <g stroke="var(--rain)" strokeWidth="2" opacity=".7"><path d="M20 10l-12 40M60 0l-12 40M100 20l-12 40M140 0l-12 40M180 15l-12 40M220 0l-12 40M250 25l-12 40M40 80l-12 40M90 70l-12 40M150 85l-12 40M200 70l-12 40" /></g>
      <path d="M0 150 Q40 130 80 148 T160 146 T260 140 V200 H0z" fill="var(--rain)" opacity=".35" /><path d="M0 172 Q50 157 100 172 T200 170 T260 168 V200 H0z" fill="var(--rain)" opacity=".55" /><rect x="110" y="132" width="46" height="16" rx="2" fill="var(--ink-2)" /></svg>
  );
  return (
    <svg viewBox="0 0 260 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="260" height="200" fill="var(--panel-2)" />
      <g fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M0 50 Q32 30 65 50 T130 50 T195 50 T260 50" opacity=".5" /><path d="M0 100 Q32 80 65 100 T130 100 T195 100 T260 100" opacity=".7" /></g>
      <ellipse cx="130" cy="140" rx="50" ry="18" fill="var(--ink-2)" /><rect x="118" y="112" width="22" height="14" rx="2" fill="var(--ink-2)" />
      <g fill="var(--panel-2)"><circle cx="110" cy="140" r="5" /><circle cx="130" cy="140" r="5" /><circle cx="150" cy="140" r="5" /></g>
      <g fill="none" stroke="var(--teal)" strokeWidth="2"><circle cx="205" cy="165" r="10" /><circle cx="205" cy="165" r="20" opacity=".6" /><circle cx="205" cy="165" r="30" opacity=".3" /></g></svg>
  );
};

/** Sonic Quest home: the mascot, the four real-data missions, the other ways to play. The mission list and progress come from SonicRangersGame. */
export const QuestHub: React.FC<Props> = ({ missions, totalStars, onSelectMission, onOpenScreen, onExplore, onOpenBadges }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const more: { screen: ScreenMode; en: string; bn: string }[] = [
    { screen: 'dj', en: 'Earth DJ studio', bn: 'আর্থ ডিজে স্টুডিও' },
    { screen: 'freeRoam', en: 'Free Roam', bn: 'মুক্ত ভ্রমণ' },
    { screen: 'kids', en: 'Kids Zone', bn: 'কিডস জোন' },
    { screen: 'blind', en: 'Blind Explorer', bn: 'ব্লাইন্ড এক্সপ্লোরার' },
    { screen: 'timemachine', en: 'Time Machine', bn: 'টাইম মেশিন' },
    { screen: 'lab', en: 'Science Lab', bn: 'বিজ্ঞান ল্যাব' },
    { screen: 'coop', en: 'Co-Op', bn: 'কো-অপ' },
    { screen: 'passport', en: 'Earth Passport', bn: 'আর্থ পাসপোর্ট' },
  ];
  return (
    <div className="q-hub" role="region" aria-label={isBn ? 'কোয়েস্ট হোম' : 'Quest home'}>
      <div className="q-side">
        <div className="q-card flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="q-avatar"><img src="/images/ninja_cadet_avatar_sm.jpg" width={96} height={96} decoding="async" alt={isBn ? 'ইকো-নিনজা ক্যাডেট' : 'Eco-Ninja cadet'} /></div>
            <p className="q-sub">{isBn ? 'হ্যালো রেঞ্জার! প্রতিটি মিশনে নাসার আসল ডেটা বাজে। মন দিয়ে শোনো, স্যাটেলাইট যা পেয়েছে তুমিও তা খুঁজে পাবে।' : 'Hi, ranger! Each mission plays real NASA data. Listen closely and you will find what the satellites found.'}</p>
          </div>
        </div>
        <div className="q-card flex flex-col gap-2">
          <span className="q-label">{isBn ? 'তারা' : 'Stars'}</span>
          <p className="tnum font-mono text-[var(--ink)]" aria-live="polite">{totalStars} / 12</p>
          <div className="q-meter" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} className={i < totalStars ? 'on' : ''} />)}</div>
        </div>
        <button type="button" onClick={onExplore} className="btn btn-brass"><Rocket className="w-4 h-4" aria-hidden="true" />{isBn ? 'লাইভ ৩ডি গ্লোবে যাও' : 'Launch 3D Globe'}</button>
      </div>

      <div className="q-main">
        <div>
          <p className="q-label">{isBn ? 'তোমার মিশন বেছে নাও' : 'Choose your mission'}</p>
          <h1 className="q-title font-display mt-1">{isBn ? 'সাউন্ড কোয়েস্ট: নাসা আর্থ রেঞ্জার্স' : 'Sonic Quest: NASA Earth Rangers'}</h1>
        </div>
        <ul className="q-cards">
          {missions.map((m, i) => {
            const title = isBn ? m.titleBn : m.titleEn;
            const act = m.stars > 0 ? (isBn ? 'আবার খেলো' : 'Replay') : (isBn ? 'শুরু করো' : 'Deploy');
            return (
              <li key={m.id} className={`q-mission ${DATA_CLASS[i] ?? ''}`}>
                <div className="q-art"><Art id={m.id} /></div>
                <div className="q-body">
                  <div className="flex items-center gap-2"><div className="q-meter w-16" role="img" aria-label={`${m.stars} / 3 ${isBn ? 'তারা' : 'stars'}`}>{[0, 1, 2].map((k) => <i key={k} className={k < m.stars ? 'on' : ''} />)}</div></div>
                  <h2 className="q-name font-display">{title}</h2>
                  <p className="q-sub">{isBn ? m.descBn : m.descEn}</p>
                  <small className="q-src"><span className="q-sw" aria-hidden="true" />{m.nasaData}</small>
                  <button type="button" className="btn btn-brass mt-auto" disabled={!m.unlocked} onClick={() => onSelectMission(m.id)} aria-label={`${act}: ${title}`}>
                    {m.unlocked ? <Play className="w-4 h-4" aria-hidden="true" /> : <Lock className="w-4 h-4" aria-hidden="true" />}
                    {m.unlocked ? act : (isBn ? 'আগে তারা জিতো' : 'Earn stars first')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="q-more">
          <span className="q-label me-2">{isBn ? 'আরও খেলার উপায়' : 'More ways to play'}</span>
          {more.map((x) => <button key={x.screen} type="button" className="btn" onClick={() => onOpenScreen(x.screen)}>{isBn ? x.bn : x.en}</button>)}
          <button type="button" onClick={onOpenBadges} className="btn q-chip-on">{isBn ? 'সার্টিফিকেট ও ব্যাজ' : 'Badges'}</button>
        </div>
      </div>
    </div>
  );
};
