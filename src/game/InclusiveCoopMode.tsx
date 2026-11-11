import React, { useState, useEffect } from 'react';
import {
  Users,
  ArrowLeft,
  Volume2,
  Eye,
  Radio,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { gameAudio } from './gameAudio';

interface Props {
  onBack: () => void;
  onComplete?: () => void;
}

interface CoOpAnomaly {
  id: number;
  nameEn: string;
  nameBn: string;
  gridX: number; // 0 to 4
  gridY: number; // 0 to 4
  targetFreq: number; // e.g. 440 Hz
  resolved: boolean;
  nasaData: string;
}

export const InclusiveCoopMode: React.FC<Props> = ({ onBack, onComplete }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';

  // Player 1 (Visual Navigator) state
  const [navX, setNavX] = useState(2);
  const [navY, setNavY] = useState(2);

  // Player 2 (Acoustic Specialist) state
  const [tunedFreq, setTunedFreq] = useState(300); // 200 to 600 Hz

  // Cooperative Anomalies
  const [anomalies, setAnomalies] = useState<CoOpAnomaly[]>([
    {
      id: 1,
      nameEn: 'Amazon Rainforest Active Fire Pocket',
      nameBn: 'আমাজন রেইনফরেস্ট অগ্নিকাণ্ড ক্ষেত্র',
      gridX: 1,
      gridY: 3,
      targetFreq: 440,
      resolved: false,
      nasaData: 'NASA FIRMS VIIRS 375m FRP (Hotspot)',
    },
    {
      id: 2,
      nameEn: 'Sylhet Flash Flood Basin',
      nameBn: 'সিলেট আকস্মিক প্লাবন অঞ্চল',
      gridX: 3,
      gridY: 1,
      targetFreq: 330,
      resolved: false,
      nasaData: 'NASA POWER Daily PRECTOTCORR',
    },
    {
      id: 3,
      nameEn: 'Pacific Ocean Warm Current Pocket',
      nameBn: 'প্রশান্ত মহাসাগর উষ্ণ সামুদ্রিক স্রোত',
      gridX: 4,
      gridY: 4,
      targetFreq: 520,
      resolved: false,
      nasaData: 'JPL MUR Sea Surface Temperature',
    },
  ]);

  const [activeAnomalyIdx, setActiveAnomalyIdx] = useState(0);
  const [coopScore, setCoopScore] = useState(0);
  const [allResolved, setAllResolved] = useState(false);

  const activeAnomaly = anomalies[activeAnomalyIdx];

  // Evaluate alignment purely derived from current state
  const syncStatus: 'searching' | 'close' | 'locked' = (() => {
    if (!activeAnomaly) return 'searching';
    const isVisualAligned = navX === activeAnomaly.gridX && navY === activeAnomaly.gridY;
    const freqDiff = Math.abs(tunedFreq - activeAnomaly.targetFreq);
    const isAudioAligned = freqDiff <= 25;

    if (isVisualAligned && isAudioAligned) {
      return 'locked';
    }
    if (
      Math.abs(navX - activeAnomaly.gridX) <= 1 &&
      Math.abs(navY - activeAnomaly.gridY) <= 1 &&
      freqDiff <= 60
    ) {
      return 'close';
    }
    return 'searching';
  })();

  // Audio tone feedback when adjusting frequency
  const playTunedTone = (freq: number) => {
    try {
      gameAudio.init();
      // Calculate pan based on grid position
      const pan = (navX - 2) / 2; // -1 to +1
      gameAudio.playTone(freq, pan, 0.25);
    } catch {}
  };

  const handleTune = (delta: number) => {
    setTunedFreq((prev) => {
      const next = Math.max(200, Math.min(600, prev + delta));
      playTunedTone(next);
      return next;
    });
  };

  const handleLockTelemetry = () => {
    if (syncStatus === 'locked' && activeAnomaly) {
      try {
        gameAudio.init();
        gameAudio.playSuccess();
      } catch {}

      const updated = [...anomalies];
      updated[activeAnomalyIdx].resolved = true;
      setAnomalies(updated);
      setCoopScore((s) => s + 100);

      if (activeAnomalyIdx + 1 < anomalies.length) {
        setActiveAnomalyIdx((i) => i + 1);
      } else {
        setAllResolved(true);
        if (onComplete) onComplete();
      }
    }
  };

  // Keyboard navigation for both players
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Player 1 (Visual): Arrow Keys
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setNavY((y) => Math.max(0, y - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setNavY((y) => Math.min(4, y + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setNavX((x) => Math.max(0, x - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setNavX((x) => Math.min(4, x + 1));
      }

      // Player 2 (Audio): W/S to pitch tune, Space to Lock
      if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleTune(15);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleTune(-15);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleLockTelemetry();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto" role="region" aria-label="Inclusive Co-Op Mode">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="btn btn-ghost p-2 rounded-xl border border-[var(--line)] hover:border-[var(--signal)] cursor-pointer"
            aria-label="Back to Game Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-md flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="chip border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-3xs font-mono font-semibold uppercase">
                {isBn ? 'ইনক্লুসিভ কো-অপ মোড' : 'INCLUSIVE CO-OP MODE'}
              </span>
              <span className="text-xs font-mono text-[var(--ink-3)]">
                Two Players · One Earth
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)] mt-0.5">
              {isBn ? 'দুই খেলোয়াড়, এক পৃথিবী: দৃষ্টি ও শব্দের যুগলবন্দি' : 'Two Players, One Earth: Visual & Acoustic Synergy'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="chip bg-black/40 border-[var(--line)] text-xs font-mono text-[var(--signal)]">
            ⭐ {coopScore} Co-Op XP
          </span>
        </div>
      </div>

      {/* Overview Intro Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 to-purple-950/20 border border-[var(--line)] text-xs text-[var(--ink-2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p>
          {isBn
            ? 'খেলোয়াড় ১ (দৃষ্টিসম্পন্ন) স্যাটেলাইট ক্যামেরা গ্রিড পরিচালনা করবে; খেলোয়াড় ২ (শব্দ বিশেষজ্ঞ) কানে শুনে ফ্রিকোয়েন্সি মেলাবে। দুজনে মিলে নাসার ডেটা লক করুন!'
            : 'Player 1 guides the visual satellite grid; Player 2 tunes acoustic frequencies by ear. Combine sight and sound to lock NASA planetary observations!'}
        </p>
        <span className="font-mono text-cyan-300 text-2xs uppercase tracking-wider shrink-0 font-semibold">
          Accessible Pair Play
        </span>
      </div>

      {/* Main Co-Op Cockpit Split: Left Player 1 (Visual) | Right Player 2 (Audio) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PLAYER 1: SATELLITE NAVIGATOR */}
        <div className="p-5 rounded-3xl bg-[var(--panel)] border-2 border-cyan-500/40 flex flex-col justify-between gap-4 shadow-xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="font-display font-bold text-sm text-[var(--ink)]">
                  {isBn ? 'খেলোয়াড় ১: স্যাটেলাইট নেভিগেটর' : 'PLAYER 1: SATELLITE NAVIGATOR'}
                </h3>
              </div>
              <span className="text-3xs font-mono text-cyan-400 font-semibold">Arrow Keys (↑ ↓ ← →)</span>
            </div>
            <p className="text-2xs text-[var(--ink-2)]">
              {isBn ? 'গ্রিডে ক্লিক বা অ্যারো কি দিয়ে স্যাটেলাইট ক্যামেরা সরান।' : 'Use arrow keys or click the grid to position the satellite downlink beam.'}
            </p>
          </div>

          {/* 5x5 Satellite Telemetry Grid */}
          <div className="grid grid-cols-5 gap-1.5 p-3 rounded-2xl bg-black/60 border border-[var(--line)] aspect-square max-w-[280px] mx-auto w-full">
            {Array.from({ length: 25 }).map((_, idx) => {
              const gx = idx % 5;
              const gy = Math.floor(idx / 5);
              const isBeam = navX === gx && navY === gy;
              const hasAnomaly = activeAnomaly && activeAnomaly.gridX === gx && activeAnomaly.gridY === gy;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setNavX(gx);
                    setNavY(gy);
                  }}
                  className={`rounded-xl border transition flex items-center justify-center text-xs font-mono relative cursor-pointer ${
                    isBeam
                      ? 'bg-cyan-500/30 border-cyan-400 shadow-md ring-2 ring-cyan-400/50'
                      : 'bg-white/5 border-white/5 hover:border-cyan-500/40'
                  }`}
                  aria-label={`Grid cell (${gx}, ${gy})`}
                >
                  {isBeam && <span className="text-cyan-300 text-sm">🛰️</span>}
                  {hasAnomaly && (
                    <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-ping absolute" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-3xs font-mono text-[var(--ink-3)]">
            <span>GRID POS: ({navX}, {navY})</span>
            <span className="text-cyan-400 font-semibold">ORBITAL BEAM ONLINE</span>
          </div>
        </div>

        {/* PLAYER 2: ACOUSTIC SPECIALIST */}
        <div className="p-5 rounded-3xl bg-[var(--panel)] border-2 border-amber-500/40 flex flex-col justify-between gap-4 shadow-xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-bold text-sm text-[var(--ink)]">
                  {isBn ? 'খেলোয়াড় ২: অ্যাকোস্টিক স্পেশালিস্ট' : 'PLAYER 2: ACOUSTIC SPECIALIST'}
                </h3>
              </div>
              <span className="text-3xs font-mono text-amber-400 font-semibold">Keys: W (Up) / S (Down)</span>
            </div>
            <p className="text-2xs text-[var(--ink-2)]">
              {isBn ? 'কানে শব্দ শুনে ফ্রিকোয়েন্সি টিউন করুন যতক্ষণ না সুর মিলে।' : 'Listen carefully and tune the acoustic frequency to match the environmental resonance.'}
            </p>
          </div>

          {/* Frequency Tuning Cockpit */}
          <div className="p-4 rounded-2xl bg-black/60 border border-[var(--line)] flex flex-col items-center justify-center gap-3">
            <div className="text-3xl font-display font-bold text-amber-300">
              {tunedFreq} Hz
            </div>

            <div className="w-full flex items-center gap-3">
              <button
                onClick={() => handleTune(-20)}
                className="btn btn-ghost border border-[var(--line)] px-3 py-1.5 rounded-xl text-xs font-mono text-white cursor-pointer"
              >
                -20 Hz (S)
              </button>
              <input
                type="range"
                min={200}
                max={600}
                value={tunedFreq}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTunedFreq(val);
                  playTunedTone(val);
                }}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-black/40 rounded-lg appearance-none"
                aria-label="Acoustic Frequency Tuning"
              />
              <button
                onClick={() => handleTune(20)}
                className="btn btn-ghost border border-[var(--line)] px-3 py-1.5 rounded-xl text-xs font-mono text-white cursor-pointer"
              >
                +20 Hz (W)
              </button>
            </div>

            <button
              onClick={() => playTunedTone(tunedFreq)}
              className="btn btn-ghost border border-amber-500/40 text-xs text-amber-200 py-1.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-amber-950/30"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isBn ? 'সুর শুনুন (Play Tone)' : 'Test Pitch'}</span>
            </button>
          </div>

          <div className="flex justify-between items-center text-3xs font-mono text-[var(--ink-3)]">
            <span>BAND: 200–600 HZ</span>
            <span className="text-amber-400 font-semibold">SYNTH ENGINE READY</span>
          </div>
        </div>
      </div>

      {/* Synchronization & Lock-in HUD */}
      <div className="p-5 rounded-3xl bg-black/80 border-2 border-[var(--signal)]/50 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xl">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-2xl bg-[var(--signal)]/20 border border-[var(--signal)] flex items-center justify-center shrink-0">
            <Radio className={`w-6 h-6 text-[var(--signal)] ${syncStatus === 'locked' ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-2xs font-mono uppercase tracking-wider text-[var(--ink-3)]">
                TARGET TELEMETRY
              </span>
              <span
                className={`chip text-3xs font-mono uppercase px-2 py-0.5 rounded-lg font-semibold ${
                  syncStatus === 'locked'
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                    : syncStatus === 'close'
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                    : 'bg-white/10 border-white/10 text-[var(--ink-2)]'
                }`}
              >
                {syncStatus === 'locked' ? '✓ READY TO LOCK' : syncStatus === 'close' ? '≈ SIGNAL NEARBY' : '... SEARCHING'}
              </span>
            </div>
            <h4 className="text-base font-display font-bold text-white mt-0.5">
              {isBn ? activeAnomaly?.nameBn : activeAnomaly?.nameEn}
            </h4>
            <p className="text-xs font-mono text-[var(--ink-2)]">
              {activeAnomaly?.nasaData}
            </p>
          </div>
        </div>

        <button
          onClick={handleLockTelemetry}
          disabled={syncStatus !== 'locked'}
          className={`btn px-7 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xl transition ${
            syncStatus === 'locked'
              ? 'btn-brass animate-pulse hover:scale-105'
              : 'bg-white/10 text-[var(--ink-3)] cursor-not-allowed border border-white/10'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isBn ? 'টেলিমেট্রি লক করুন (Space)' : 'Lock Telemetry (Space)'}</span>
        </button>
      </div>

      {/* Completion Modal */}
      {allResolved && (
        <div className="p-6 rounded-3xl bg-emerald-950/40 border-2 border-emerald-400 flex flex-col items-center justify-center text-center gap-3 animate-fade-in shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
            <Award className="w-7 h-7 text-emerald-400 animate-bounce" />
          </div>
          <h3 className="text-xl font-display font-bold text-white">
            {isBn ? 'অসাধারণ কো-অপ অংশীদারিত্ব!' : 'OUTSTANDING CO-OP PARTNERSHIP!'}
          </h3>
          <p className="text-xs text-[var(--ink-2)] max-w-md">
            {isBn
              ? 'আপনারা দুজন মিলে প্রমাণ করলেন কীভাবে দৃষ্টি ও শব্দের যৌথ ব্যবহারে নাসার ডেটা আরও নিখুঁতভাবে অনুধাবন করা সম্ভব।'
              : 'You demonstrated the true power of inclusive collaboration—pairing visual telemetry with auditory discernment.'}
          </p>
          <button
            onClick={onBack}
            className="btn btn-brass px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer mt-2"
          >
            {isBn ? 'গেম হোমে ফিরে যান' : 'Return to Game Home'}
          </button>
        </div>
      )}
    </div>
  );
};
