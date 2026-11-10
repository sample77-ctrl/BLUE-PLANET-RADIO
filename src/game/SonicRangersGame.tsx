import React, { useState, useEffect } from 'react';
import { WorldMapHub, type MissionInfo } from './WorldMapHub';
import { MissionFire } from './MissionFire';
import { MissionMonsoon } from './MissionMonsoon';
import { MissionOcean } from './MissionOcean';
import { MissionSatellite } from './MissionSatellite';
import { CartoonGameCanvas } from './CartoonGameCanvas';
import { EarthDJStudio } from './EarthDJStudio';
import { LevelLab } from './LevelLab';
import { QuestBadgeModal } from './QuestBadgeModal';
import { UpdatePlanStepMaster } from './UpdatePlanStepMaster';
import { GameHome } from './GameHome';
import { KidsLearningZone } from './KidsLearningZone';
import { TacticalWildfireMission } from './TacticalWildfireMission';
import { EarthTimeMachine } from './EarthTimeMachine';
import { BlindExplorerMode } from './BlindExplorerMode';
import { MyEarthPassport } from './MyEarthPassport';
import { InclusiveCoopMode } from './InclusiveCoopMode';
import { GameSettingsView } from './GameSettingsView';
import {
  Flame,
  CloudRain,
  Waves,
  Radio,
  Map,
  Sparkles,
  Music,
  Award,
  Compass,
  Sliders,
  Plane,
  Home,
  Clock,
  EyeOff,
  Smile,
  Settings,
  Users,
} from 'lucide-react';
import { usePrefs } from '../lib/prefs';

export type ScreenMode =
  | 'home'
  | 'stepMaster'
  | 'map'
  | 'mission1'
  | 'mission2'
  | 'mission3'
  | 'mission4'
  | 'freeRoam'
  | 'blind'
  | 'kids'
  | 'dj'
  | 'timemachine'
  | 'passport'
  | 'settings'
  | 'coop'
  | 'lab';

interface Props {
  onExplore: () => void;
  onSoundOn?: () => void;
  audioReady?: boolean;
  initialScreen?: ScreenMode;
}

export const SonicRangersGame: React.FC<Props> = ({
  onExplore,
  onSoundOn,
  audioReady = false,
  initialScreen = 'stepMaster',
}) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';

  const [screen, setScreen] = useState<ScreenMode>(initialScreen);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [useTacticalMission, setUseTacticalMission] = useState(false);

  // Load saved stars
  const [missionStars, setMissionStars] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('sonic_rangers_stars');
      return saved ? JSON.parse(saved) : { 1: 0, 2: 0, 3: 0, 4: 0 };
    } catch {
      return { 1: 0, 2: 0, 3: 0, 4: 0 };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sonic_rangers_stars', JSON.stringify(missionStars));
    } catch {}
  }, [missionStars]);

  const totalStars = Object.values(missionStars).reduce((a, b) => a + b, 0);

  const handleMissionComplete = (missionId: number, starsEarned: number) => {
    setMissionStars((prev) => {
      const updated = { ...prev, [missionId]: Math.max(prev[missionId] || 0, starsEarned) };
      return updated;
    });
    setScreen('map');
    if (missionId === 4 || totalStars + starsEarned >= 12) {
      setShowBadgeModal(true);
    }
  };

  const missions: MissionInfo[] = [
    {
      id: 1,
      titleEn: 'Amazon Wildfire Extinguisher',
      titleBn: 'আমাজন দাবানল ও সাউন্ড ট্র্যাকার',
      subtitleEn: 'Track crackles & extinguish fires',
      subtitleBn: 'শব্দ শুনে আগুন খুঁজে নিভিয়ে দাও',
      descEn: 'Listen for crackling fire sounds. Track hotspots and spray water to protect the forest!',
      descBn: 'আগুনের পটপট শব্দ শুনে এগিয়ে যাও, ওয়াটার ব্লাস্টার দিয়ে দাবানল নিভিয়ে বন বাঁচাও!',
      icon: <Flame className="w-6 h-6 text-[var(--fire)]" />,
      bgGradient: 'bg-gradient-to-br from-amber-950/30 to-[var(--panel)]',
      borderColor: 'border-[var(--fire)]/50',
      accentColor: 'var(--fire)',
      unlocked: true,
      stars: missionStars[1] || 0,
      nasaData: 'NASA FIRMS VIIRS (375m FRP)',
    },
    {
      id: 2,
      titleEn: 'Bengal Monsoon Flood Rescue',
      titleBn: 'বাংলা বর্ষার প্লাবন ও বন্যপ্রাণী উদ্ধার',
      subtitleEn: 'Hop rafts & collect rainfall data',
      subtitleBn: 'ভেলায় চড়ে বৃষ্টি মেপে প্রাণী বাঁচাও',
      descEn: 'Navigate flooded deltas in Sylhet, catch rain droplets to fill the gauge, and rescue wildlife!',
      descBn: 'সিলেটের প্লাবনে ভেলায় লাফিয়ে ১০০ মিমি বৃষ্টি রেকর্ড করো এবং বন্য হরিণদের উদ্ধার করো!',
      icon: <CloudRain className="w-6 h-6 text-[var(--rain)]" />,
      bgGradient: 'bg-gradient-to-br from-sky-950/30 to-[var(--panel)]',
      borderColor: 'border-[var(--rain)]/50',
      accentColor: 'var(--rain)',
      unlocked: (missionStars[1] || 0) > 0 || totalStars > 0,
      stars: missionStars[2] || 0,
      nasaData: 'NASA POWER Daily PRECTOTCORR',
    },
    {
      id: 3,
      titleEn: 'Pacific Ocean Submarine Dive',
      titleBn: 'প্রশান্ত মহাসাগরের সাবমেরিন ডাইভ',
      subtitleEn: 'Pilot yellow sub & guide whales',
      subtitleBn: 'হলুদ সাবমেরিন নিয়ে সাগরে ডুব দাও',
      descEn: 'Pilot the submarine into deep trenches, fire sonar pings, and plant SST buoys near whales!',
      descBn: 'সাবমেরিন চালিয়ে সাগরের গভীর তাপমাত্রা মাপো এবং সোনার পিং দিয়ে তিমিদের পথ দেখাও!',
      icon: <Waves className="w-6 h-6 text-[var(--teal)]" />,
      bgGradient: 'bg-gradient-to-br from-teal-950/30 to-[var(--panel)]',
      borderColor: 'border-[var(--teal)]/50',
      accentColor: 'var(--teal)',
      unlocked: (missionStars[2] || 0) > 0 || totalStars >= 3,
      stars: missionStars[3] || 0,
      nasaData: 'JPL PO.DAAC MUR SST Anomaly',
    },
    {
      id: 4,
      titleEn: 'NASA Orbital Space Station',
      titleBn: 'মহাকাশ স্যাটেলাইট কন্ট্রোল স্টেশন',
      subtitleEn: 'Harmonize the Earth Symphony',
      subtitleBn: '৪টি স্যাটেলাইট বিম টিউন করো',
      descEn: 'Align 4 observation beams with Earth and broadcast the 140-year climate melody across space!',
      descBn: 'মহাকাশ থেকে ৪টি স্যাটেলাইটের তরঙ্গ সামঞ্জস্য করে বাজাও পৃথিবীর মহা-সিম্ফনি!',
      icon: <Radio className="w-6 h-6 text-violet-400" />,
      bgGradient: 'bg-gradient-to-br from-violet-950/30 to-[var(--panel)]',
      borderColor: 'border-violet-500/50',
      accentColor: '#a855f7',
      unlocked: (missionStars[3] || 0) > 0 || totalStars >= 6,
      stars: missionStars[4] || 0,
      nasaData: 'NASA GISTEMP 1880–2026 Vital Signs',
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto pt-[calc(var(--header-h)+0.75rem)] pb-16 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        {/* Top Master Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌍</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-[var(--ink)] tracking-tight">
                {isBn ? 'সাউন্ড কোয়েস্ট: নাসা আর্থ রেঞ্জার্স' : 'Sonic Quest: NASA Earth Rangers'}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ink-2)]">
                {isBn
                  ? 'খেলার ছলে আবিষ্কার করো পৃথিবীর আসল আগুন, বৃষ্টি, সাগর ও জলবায়ুর সুর!'
                  : 'Play detailed missions and discover real NASA soundscapes by ear!'}
              </p>
            </div>
          </div>

          {/* Quick View Navigation for all 10 sections */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--panel)] border border-[var(--line)] overflow-x-auto scroll-thin">
            <button
              onClick={() => setScreen('home')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'home'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isBn ? 'হোম' : 'Home'}</span>
            </button>

            <button
              onClick={() => setScreen('stepMaster')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'stepMaster'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isBn ? '🌟 আপডেট প্ল্যান (ধাপে ধাপে)' : '🌟 Step-by-Step (Update Plan)'}</span>
            </button>

            <button
              onClick={() => setScreen('map')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'map'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>{isBn ? 'মিশন ম্যাপ' : 'Overworld Map'}</span>
            </button>

            <button
              onClick={() => setScreen('kids')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'kids'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Smile className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isBn ? 'কিডস জোন' : 'Kids Zone'}</span>
            </button>

            <button
              onClick={() => setScreen('blind')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'blind'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
              <span>{isBn ? 'ব্লাইন্ড মোড' : 'Blind Mode'}</span>
            </button>

            <button
              onClick={() => setScreen('timemachine')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'timemachine'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isBn ? 'টাইম মেশিন' : 'Time Machine'}</span>
            </button>

            <button
              onClick={() => setScreen('freeRoam')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'freeRoam'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{isBn ? 'মুক্ত ভ্রমণ' : 'Free Roam'}</span>
            </button>

            <button
              onClick={() => setScreen('dj')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'dj'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>{isBn ? 'ডিজে স্টুডিও' : 'DJ Studio'}</span>
            </button>

            <button
              onClick={() => setScreen('coop')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'coop'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isBn ? 'কো-অপ' : 'Co-Op'}</span>
            </button>

            <button
              onClick={() => setScreen('lab')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'lab'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{isBn ? 'বিজ্ঞান ল্যাব' : 'Science Lab'}</span>
            </button>

            <button
              onClick={() => setScreen('passport')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'passport'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Award className="w-4 h-4 text-[var(--brass)]" />
              <span>{isBn ? 'পাসপোর্ট' : 'Passport'}</span>
            </button>

            <button
              onClick={() => setScreen('settings')}
              className={`nav-link text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                screen === 'settings'
                  ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-md'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{isBn ? 'সেটিংস' : 'Settings'}</span>
            </button>

            <button
              onClick={() => setShowBadgeModal(true)}
              className="btn btn-ghost text-xs border border-[var(--line)] py-1.5 px-3 rounded-xl flex items-center gap-1 whitespace-nowrap"
            >
              <Award className="w-4 h-4 text-[var(--brass)]" />
              <span className="hidden sm:inline">{isBn ? 'সার্টিফিকেট' : 'Badges'}</span>
            </button>
          </div>
        </div>

        {/* ================= ACTIVE SCREEN DISPLAY ================= */}
        {screen === 'home' && (
          <GameHome
            onStartAdventure={() => setScreen('stepMaster')}
            onOpenHub={() => setScreen('map')}
            onOpenMissions={() => setScreen('map')}
            onOpenExplorer={onExplore}
            onOpenBlindMode={() => setScreen('blind')}
            onOpenKidsZone={() => setScreen('kids')}
            onOpenDJ={() => setScreen('dj')}
            onOpenTimeMachine={() => setScreen('timemachine')}
            onOpenPassport={() => setScreen('passport')}
            onOpenSettings={() => setScreen('settings')}
            onOpenCoop={() => setScreen('coop')}
            onOpenStepGuide={() => setScreen('stepMaster')}
            totalStars={totalStars}
          />
        )}

        {screen === 'stepMaster' && (
          <UpdatePlanStepMaster
            onSelectMission={(id) => setScreen(`mission${id}` as ScreenMode)}
            onOpenFreeRoam={() => setScreen('freeRoam')}
            onOpenDJ={() => setScreen('dj')}
            onOpenLab={() => setScreen('lab')}
            onOpenBadgeModal={() => setShowBadgeModal(true)}
            onExploreGlobe={onExplore}
            audioReady={audioReady}
            onSoundOn={onSoundOn}
          />
        )}

        {screen === 'map' && (
          <WorldMapHub
            missions={missions}
            onSelectMission={(id) => setScreen(`mission${id}` as ScreenMode)}
            onOpenBadgeModal={() => setShowBadgeModal(true)}
            totalStars={totalStars}
          />
        )}

        {screen === 'kids' && (
          <KidsLearningZone
            onBack={() => setScreen('home')}
            onExploreGlobe={onExplore}
          />
        )}

        {screen === 'blind' && (
          <BlindExplorerMode
            onBack={() => setScreen('home')}
            onComplete={() => setScreen('passport')}
          />
        )}

        {screen === 'timemachine' && (
          <EarthTimeMachine
            onBack={() => setScreen('home')}
            onExploreGlobe={onExplore}
          />
        )}

        {screen === 'passport' && (
          <MyEarthPassport
            onBack={() => setScreen('home')}
            totalStars={totalStars}
          />
        )}

        {screen === 'settings' && (
          <GameSettingsView
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'coop' && (
          <InclusiveCoopMode
            onBack={() => setScreen('home')}
            onComplete={() => setScreen('passport')}
          />
        )}

        {screen === 'mission1' && (
          useTacticalMission ? (
            <TacticalWildfireMission
              onComplete={(s) => handleMissionComplete(1, s)}
              onExit={() => setScreen('map')}
              audioReady={audioReady}
              onSoundOn={onSoundOn ?? (() => {})}
              onSwitchToPlatformer={() => setUseTacticalMission(false)}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setUseTacticalMission(true)}
                  className="btn btn-brass text-xs font-semibold py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>{isBn ? '🚁 ৩ডি ট্যাকটিক্যাল এয়ার ও ড্রোন কমান্ড মোড' : '🚁 3D Tactical Air & Drone Command Mode'}</span>
                </button>
              </div>
              <MissionFire
                onComplete={(s) => handleMissionComplete(1, s)}
                onExit={() => setScreen('map')}
                audioReady={audioReady}
                onSoundOn={onSoundOn ?? (() => {})}
              />
            </div>
          )
        )}

        {screen === 'mission2' && (
          <MissionMonsoon
            onComplete={(s) => handleMissionComplete(2, s)}
            onExit={() => setScreen('map')}
            audioReady={audioReady}
            onSoundOn={onSoundOn ?? (() => {})}
          />
        )}

        {screen === 'mission3' && (
          <MissionOcean
            onComplete={(s) => handleMissionComplete(3, s)}
            onExit={() => setScreen('map')}
            audioReady={audioReady}
            onSoundOn={onSoundOn ?? (() => {})}
          />
        )}

        {screen === 'mission4' && (
          <MissionSatellite
            onComplete={(s) => handleMissionComplete(4, s)}
            onExit={() => setScreen('map')}
            audioReady={audioReady}
            onSoundOn={onSoundOn ?? (() => {})}
          />
        )}

        {screen === 'freeRoam' && (
          <CartoonGameCanvas
            onComplete={() => setShowBadgeModal(true)}
            onExploreGlobe={onExplore}
            audioReady={audioReady}
            onSoundOn={onSoundOn ?? (() => {})}
          />
        )}

        {screen === 'dj' && (
          <EarthDJStudio onBackToMissions={() => setScreen('map')} />
        )}

        {screen === 'lab' && (
          <LevelLab onComplete={() => setScreen('map')} />
        )}

        {/* Live 3D Globe Direct Portal */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-cyan-950/20 via-[var(--panel)] to-amber-950/20 border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Compass className="w-7 h-7 text-[var(--brass)] shrink-0" />
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-[var(--ink)]">
                {isBn ? 'আসল স্যাটেলাইটের লাইভ ৩ডি গ্লোবে শব্দ শুনতে চাও?' : 'Ready to hear real NASA satellite observations on the 3D globe?'}
              </h3>
              <p className="text-2xs sm:text-xs text-[var(--ink-2)] mt-0.5">
                {isBn
                  ? 'গেম থেকে যা শিখলে, তা দিয়ে এবার আসল পৃথিবীর ৩ডি গ্লোবে আগুন, বৃষ্টি ও সাগরের তথ্য শোনো।'
                  : 'Take your newly trained sonic ears to explore real-time NASA observations around the world!'}
              </p>
            </div>
          </div>
          <button
            onClick={onExplore}
            className="btn btn-brass shrink-0 text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>{isBn ? 'লাইভ ৩ডি গ্লোবে যাও' : 'Launch 3D Globe'}</span>
          </button>
        </div>

        {/* Cadet Badge & Graduation Certificate Modal */}
        {showBadgeModal && (
          <QuestBadgeModal
            onClose={() => setShowBadgeModal(false)}
            onExploreGlobe={onExplore}
            onOpenDJ={() => {
              setShowBadgeModal(false);
              setScreen('dj');
            }}
          />
        )}
      </div>
    </div>
  );
};
