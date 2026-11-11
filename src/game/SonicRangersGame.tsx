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
import { QuestHub } from './QuestHub';
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
  Award,
  Compass,
  Plane,
  Home,
} from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import './quest.css';

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
  initialScreen = 'home',
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
    setScreen('home');
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
      bgGradient: 'bg-[var(--panel)]',
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
      bgGradient: 'bg-[var(--panel)]',
      borderColor: 'border-[var(--rain)]/50',
      accentColor: 'var(--rain)',
      unlocked: true, // all four missions are open: anyone can preview any of them
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
      bgGradient: 'bg-[var(--panel)]',
      borderColor: 'border-[var(--teal)]/50',
      accentColor: 'var(--teal)',
      unlocked: true,
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
      icon: <Radio className="w-6 h-6 text-[var(--brass)]" />,
      bgGradient: 'bg-[var(--panel)]',
      borderColor: 'border-[var(--brass)]/50',
      accentColor: 'var(--brass)',
      unlocked: true,
      stars: missionStars[4] || 0,
      nasaData: 'NASA GISTEMP 1880–2026 Vital Signs',
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto pt-[calc(var(--header-h)+0.75rem)] pb-16 px-3 sm:px-6">
      <div className="max-w-[90rem] mx-auto flex flex-col gap-5">
        {/* Compact bar on the sub-screens; the hub has its own heading */}
        {screen !== 'home' && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setScreen('home')} className="btn" aria-label={isBn ? 'কোয়েস্ট হোমে ফিরে যাও' : 'Back to Quest home'}>
                <Home className="w-4 h-4" /><span>{isBn ? 'কোয়েস্ট হোম' : 'Quest home'}</span>
              </button>
              <h1 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)] tracking-tight">
                {isBn ? 'সাউন্ড কোয়েস্ট: নাসা আর্থ রেঞ্জার্স' : 'Sonic Quest: NASA Earth Rangers'}
              </h1>
            </div>
            <button onClick={() => setShowBadgeModal(true)} className="btn btn-ghost text-xs border border-[var(--line)] py-1.5 px-3 rounded-lg flex items-center gap-1 whitespace-nowrap">
              <Award className="w-4 h-4 text-[var(--signal)]" />
              <span className="hidden sm:inline">{isBn ? 'সার্টিফিকেট' : 'Badges'}</span>
            </button>
          </div>
        )}

        {/* ================= ACTIVE SCREEN DISPLAY ================= */}
        {screen === 'home' && (
          <QuestHub
            missions={missions}
            totalStars={totalStars}
            onSelectMission={(id) => setScreen(`mission${id}` as ScreenMode)}
            onOpenScreen={setScreen}
            onExplore={onExplore}
            onOpenBadges={() => setShowBadgeModal(true)}
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
              onExit={() => setScreen('home')}
              audioReady={audioReady}
              onSoundOn={onSoundOn ?? (() => {})}
              onSwitchToPlatformer={() => setUseTacticalMission(false)}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setUseTacticalMission(true)}
                  className="btn btn-brass text-xs font-semibold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>{isBn ? '৩ডি ট্যাকটিক্যাল এয়ার ও ড্রোন কমান্ড মোড' : '3D Tactical Air & Drone Command Mode'}</span>
                </button>
              </div>
              <MissionFire
                onComplete={(s) => handleMissionComplete(1, s)}
                onExit={() => setScreen('home')}
                audioReady={audioReady}
                onSoundOn={onSoundOn ?? (() => {})}
              />
            </div>
          )
        )}

        {screen === 'mission2' && (
          <MissionMonsoon
            onComplete={(s) => handleMissionComplete(2, s)}
            onExit={() => setScreen('home')}
            audioReady={audioReady}
            onSoundOn={onSoundOn ?? (() => {})}
          />
        )}

        {screen === 'mission3' && (
          <MissionOcean
            onComplete={(s) => handleMissionComplete(3, s)}
            onExit={() => setScreen('home')}
            audioReady={audioReady}
            onSoundOn={onSoundOn ?? (() => {})}
          />
        )}

        {screen === 'mission4' && (
          <MissionSatellite
            onComplete={(s) => handleMissionComplete(4, s)}
            onExit={() => setScreen('home')}
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
          <EarthDJStudio onBackToMissions={() => setScreen('home')} />
        )}

        {screen === 'lab' && (
          <LevelLab onComplete={() => setScreen('home')} />
        )}

        {/* Live 3D Globe Direct Portal (the hub has its own button) */}
        {screen !== 'home' && <div className="p-5 rounded-lg border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--panel)]">
          <div className="flex items-center gap-3">
            <Compass className="w-7 h-7 text-[var(--signal)] shrink-0" />
            <div>
              <h2 className="font-display font-bold text-sm sm:text-base text-[var(--ink)]">
                {isBn ? 'আসল স্যাটেলাইটের লাইভ ৩ডি গ্লোবে শব্দ শুনতে চাও?' : 'Ready to hear real NASA satellite observations on the 3D globe?'}
              </h2>
              <p className="text-2xs sm:text-xs text-[var(--ink-2)] mt-0.5">
                {isBn
                  ? 'গেম থেকে যা শিখলে, তা দিয়ে এবার আসল পৃথিবীর ৩ডি গ্লোবে আগুন, বৃষ্টি ও সাগরের তথ্য শোনো।'
                  : 'Take your newly trained sonic ears to explore real-time NASA observations around the world!'}
              </p>
            </div>
          </div>
          <button
            onClick={onExplore}
            className="btn btn-brass shrink-0 text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <span>{isBn ? 'লাইভ ৩ডি গ্লোবে যাও' : 'Launch 3D Globe'}</span>
          </button>
        </div>}

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
