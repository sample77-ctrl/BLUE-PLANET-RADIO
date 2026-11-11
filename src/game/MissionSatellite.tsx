import React, { useState, useEffect } from 'react';
import { Sparkles, Award, RotateCw, Globe, Music, Flame, CloudRain, Waves, CheckCircle2 } from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { usePrefs } from '../lib/prefs';

interface Props {
  onComplete: (starsEarned: number) => void;
  onExit: () => void;
  audioReady: boolean;
  onSoundOn: () => void;
}

interface SatelliteBeam {
  id: string;
  nameEn: string;
  nameBn: string;
  dataset: string;
  color: string;
  icon: React.ReactNode;
  aligned: boolean;
  angle: number; // 0 to 360
  targetAngle: number;
}

export const MissionSatellite: React.FC<Props> = ({ onComplete, onExit, audioReady: _audioReady, onSoundOn: _onSoundOn }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const [beams, setBeams] = useState<SatelliteBeam[]>([
    {
      id: 'fire',
      nameEn: 'FIRMS Fire Satellite',
      nameBn: 'এফআইআরএমএস ফায়ার স্যাটেলাইট',
      dataset: 'VIIRS 375m FRP',
      color: 'text-[var(--fire)] border-[var(--fire)]/50 bg-[var(--fire)]/10',
      icon: <Flame className="w-5 h-5 text-[var(--fire)]" />,
      aligned: false,
      angle: 45,
      targetAngle: 90,
    },
    {
      id: 'rain',
      nameEn: 'POWER Rain Satellite',
      nameBn: 'পাওয়ার রেইন স্যাটেলাইট',
      dataset: 'Daily Precipitation mm/day',
      color: 'text-[var(--rain)] border-[var(--rain)]/50 bg-[var(--rain)]/10',
      icon: <CloudRain className="w-5 h-5 text-[var(--rain)]" />,
      aligned: false,
      angle: 120,
      targetAngle: 180,
    },
    {
      id: 'ocean',
      nameEn: 'PO.DAAC Ocean Satellite',
      nameBn: 'পিও.ডিএএসি ওশান স্যাটেলাইট',
      dataset: 'MUR SST Anomaly °C',
      color: 'text-[var(--teal)] border-[var(--teal)]/50 bg-[var(--teal)]/10',
      icon: <Waves className="w-5 h-5 text-[var(--teal)]" />,
      aligned: false,
      angle: 210,
      targetAngle: 270,
    },
    {
      id: 'climate',
      nameEn: 'GISTEMP Vital Signs Satellite',
      nameBn: 'জিআইএসটেম্প প্রাণচিহ্ন স্যাটেলাইট',
      dataset: '1880–2026 Climate Symphony',
      color: 'text-violet-400 border-violet-500/50 bg-violet-950/20',
      icon: <Music className="w-5 h-5 text-violet-400" />,
      aligned: false,
      angle: 300,
      targetAngle: 0,
    },
  ]);

  const [levelWon, setLevelWon] = useState(false);
  const radioMsg = isBn
    ? '📻 কমান্ডার নোভা: "চূড়ান্ত মিশন! মহাকাশ থেকে ৪টি নাসা স্যাটেলাইটের ডেটা-বিম পৃথিবীর সাথে সামঞ্জস্য করো এবং পৃথিবীর মহা-সিম্ফনি বাজাও!"'
    : '📻 Commander Nova: "Final mission! Align the 4 NASA observation satellite beams with Earth to unleash the grand Earth Symphony!"';

  useEffect(() => {
    audio.playRadioBeep();
  }, [audio]);

  const rotateSatellite = (id: string) => {
    setBeams((prev) => {
      const updated = prev.map((b) => {
        if (b.id === id && !b.aligned) {
          const nextAngle = (b.angle + 45) % 360;
          const isNowAligned = nextAngle === b.targetAngle;

          if (isNowAligned) {
            audio.playSuccess();
            if (b.id === 'fire') audio.playFire(0.7, -0.6, 2000);
            if (b.id === 'rain') audio.playRain(0.8, 0.6, 2000);
            if (b.id === 'ocean') audio.playOcean(2.0, 0, 2000);
            if (b.id === 'climate') audio.playPentatonicNote(784.0, 'triangle', 0.6);
          } else {
            audio.playPentatonicNote(392.0, 'sine', 0.15);
          }

          return { ...b, angle: nextAngle, aligned: isNowAligned };
        }
        return b;
      });

      if (updated.every((b) => b.aligned)) {
        setLevelWon(true);
        audio.playSuccess();
      }

      return updated;
    });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass border border-[var(--line)]">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="btn btn-ghost text-xs px-2.5 py-1">
            ← {isBn ? 'ম্যাপে ফেরত' : 'Exit Mission'}
          </button>
          <div className="chip border-[var(--signal)] text-[var(--signal)] font-semibold text-xs py-1 px-3">
            🛰️ {isBn ? 'স্যাটেলাইট সামঞ্জস্য:' : 'Aligned:'} {beams.filter((b) => b.aligned).length} / 4
          </div>
        </div>

        <div className="text-xs text-[var(--ink-2)] font-mono">
          NASA ORBITAL COMMAND CENTER
        </div>
      </div>

      {/* Main Orbital Harmonizer Console */}
      <div className="p-6 sm:p-10 rounded-3xl border-2 border-[var(--signal)]/40 relative bg-gradient-to-b from-[#030712] via-[#0b1926] to-[#040810] shadow-2xl flex flex-col items-center gap-8">
        {/* Radio Dialogue with Eco-Ninja Cadet Portrait */}
        <div className="w-full max-w-lg p-2.5 rounded-2xl glass-pop border border-[var(--signal)] flex items-center gap-3 text-xs sm:text-sm font-semibold text-[var(--ink)] shadow-xl">
          <img src="/images/ninja_cadet_avatar.png" alt="Cadet" className="w-10 h-10 rounded-xl border border-[var(--signal)] shrink-0 object-cover shadow-sm" />
          <span className="leading-snug">{radioMsg}</span>
        </div>

        {/* Central Rotating Holographic Earth */}
        <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full flex items-center justify-center border-4 border-cyan-500/30 shadow-[0_0_50px_rgba(56,189,248,0.25)] bg-[var(--abyss)]">
          <Globe className="w-32 h-32 sm:w-40 sm:h-40 text-cyan-400 animate-spin" style={{ animationDuration: '24s' }} />

          {/* Glowing Center Ring */}
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping opacity-25" />

          {/* Active Beams indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {beams.map((b) =>
              b.aligned ? (
                <div
                  key={b.id}
                  className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--signal)] to-transparent"
                  style={{ transform: `rotate(${b.targetAngle}deg)` }}
                />
              ) : null
            )}
          </div>
        </div>

        {/* 4 Satellite Beam Alignment Dials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {beams.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                b.aligned
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-lg'
                  : 'border-[var(--line)] bg-[var(--panel)] hover:border-[var(--signal)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${b.color}`}>
                  {b.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display font-bold text-sm text-[var(--ink)]">
                      {isBn ? b.nameBn : b.nameEn}
                    </h2>
                    {b.aligned && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-2xs font-mono text-[var(--ink-3)]">{b.dataset}</span>
                </div>
              </div>

              <button
                disabled={b.aligned}
                onClick={() => rotateSatellite(b.id)}
                className={`btn text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md ${
                  b.aligned
                    ? 'bg-emerald-600 text-white border-emerald-500 cursor-default'
                    : 'btn-brass text-slate-950 hover:scale-105'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${b.aligned ? '' : 'animate-spin'}`} style={{ animationDuration: '6s' }} />
                <span>{b.aligned ? (isBn ? 'লকড ✓' : 'Aligned ✓') : (isBn ? 'ঘোরাও' : 'Tune Beam')}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Level Complete Win Overlay */}
        {levelWon && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4 animate-fade-in rounded-3xl">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[var(--signal)] shadow-2xl">
                <img src="/images/ninja_cadet_avatar.png" alt="Cadet" className="w-full h-full object-cover" />
              </div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center text-slate-950 shadow-2xl animate-bounce">
                <Award className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[var(--signal)]">
              {isBn ? 'পৃথিবীর মহাশিবির সিম্ফনি সফল! ⭐⭐⭐' : 'Earth Symphony Harmonized! ⭐⭐⭐'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-md">
              {isBn
                ? 'তুমি নাসার ৪টি স্যাটেলাইটকে সফলভাবে টিউন করেছ! পৃথিবী এখন মহাকাশ জুড়ে তার নিজস্ব প্রাকৃতিক সুর ছড়িয়ে দিচ্ছে।'
                : 'All 4 NASA observation beams are tuned in harmony! Earth is singing its complete climate story across the cosmos!'}
            </p>
            <button
              onClick={() => onComplete(3)}
              className="btn btn-brass font-semibold px-7 py-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105"
            >
              <span>{isBn ? 'গ্র্যাজুয়েশন সার্টিফিকেট গ্রহণ করো' : 'Claim Earth Guardian Graduation'}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
