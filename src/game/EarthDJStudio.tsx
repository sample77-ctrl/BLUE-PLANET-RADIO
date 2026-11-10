import React, { useState, useEffect } from 'react';
import { Sparkles, Music, Flame, CloudRain, Waves, Play, Pause, RotateCcw } from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { usePrefs } from '../lib/prefs';

interface Props {
  onBackToMissions: () => void;
}

interface NotePad {
  note: string;
  freq: number;
  color: string;
}

export const EarthDJStudio: React.FC<Props> = ({ onBackToMissions }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const [fireActive, setFireActive] = useState(false);
  const [rainActive, setRainActive] = useState(false);
  const [oceanActive, setOceanActive] = useState(false);

  const [fireIntensity, setFireIntensity] = useState(0.6);
  const [rainIntensity, setRainIntensity] = useState(0.7);
  const [oceanAnomaly, setOceanAnomaly] = useState(0.5);

  const pentatonicNotes: NotePad[] = [
    { note: 'G3', freq: 196.0, color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200' },
    { note: 'A3', freq: 220.0, color: 'border-teal-500/40 bg-teal-950/30 text-teal-200' },
    { note: 'C4', freq: 261.6, color: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200' },
    { note: 'D4', freq: 293.7, color: 'border-blue-500/40 bg-blue-950/30 text-blue-200' },
    { note: 'E4', freq: 329.6, color: 'border-indigo-500/40 bg-indigo-950/30 text-indigo-200' },
    { note: 'G4', freq: 392.0, color: 'border-violet-500/40 bg-violet-950/30 text-violet-200' },
    { note: 'A4', freq: 440.0, color: 'border-amber-500/40 bg-amber-950/30 text-amber-200' },
    { note: 'C5', freq: 523.3, color: 'border-rose-500/40 bg-rose-950/30 text-rose-200' },
  ];

  const [activePad, setActivePad] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      audio.stopAll();
    };
  }, [audio]);

  const toggleFire = () => {
    if (fireActive) {
      setFireActive(false);
      audio.stopAll();
      // Resume others if active
      if (rainActive) audio.playRain(rainIntensity, 0.4, 10000);
      if (oceanActive) audio.playOcean(oceanAnomaly, -0.4, 10000);
    } else {
      setFireActive(true);
      audio.playFire(fireIntensity, -0.6, 12000);
    }
  };

  const toggleRain = () => {
    if (rainActive) {
      setRainActive(false);
      audio.stopAll();
      if (fireActive) audio.playFire(fireIntensity, -0.6, 10000);
      if (oceanActive) audio.playOcean(oceanAnomaly, -0.4, 10000);
    } else {
      setRainActive(true);
      audio.playRain(rainIntensity, 0.6, 12000);
    }
  };

  const toggleOcean = () => {
    if (oceanActive) {
      setOceanActive(false);
      audio.stopAll();
      if (fireActive) audio.playFire(fireIntensity, -0.6, 10000);
      if (rainActive) audio.playRain(rainIntensity, 0.6, 10000);
    } else {
      setOceanActive(true);
      audio.playOcean(oceanAnomaly, 0.0, 15000);
    }
  };

  const triggerNote = (pad: NotePad) => {
    setActivePad(pad.note);
    audio.playPentatonicNote(pad.freq, 'triangle', 0.5);
    setTimeout(() => setActivePad(null), 300);
  };

  const stopAllLoops = () => {
    setFireActive(false);
    setRainActive(false);
    setOceanActive(false);
    audio.stopAll();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--brass)]/20 border border-[var(--brass)]/40 text-[var(--brass)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--ink)]">
              {isBn ? 'আর্থ ডিজে স্টুডিও (Earth DJ Studio)' : 'Earth DJ Studio: Remix NASA Sounds'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-2)]">
              {isBn
                ? 'নাসার আসল শব্দ উপাদানগুলো দিয়ে তোমার নিজস্ব পৃথিবীর সিম্ফনি তৈরি করো!'
                : 'Mix real NASA satellite sonifications into your own planetary groove!'}
            </p>
          </div>
        </div>

        <button
          onClick={onBackToMissions}
          className="btn btn-ghost text-xs sm:text-sm border border-[var(--line)]"
        >
          {isBn ? 'সব মিশন' : 'Back to Missions'}
        </button>
      </div>

      {/* Main Studio Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fire Deck */}
        <div className={`glass panel p-5 rounded-2xl flex flex-col gap-4 border transition-all ${fireActive ? 'border-[var(--fire)] shadow-lg shadow-[var(--fire)]/10 ring-1 ring-[var(--fire)]' : 'border-[var(--line)]'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--fire)] font-semibold">
              <Flame className="w-5 h-5" />
              <span>{isBn ? 'দাবানল (Fire)' : 'Wildfire'}</span>
            </div>
            <button
              onClick={toggleFire}
              className={`p-2 rounded-full border transition ${
                fireActive
                  ? 'bg-[var(--fire)] text-[var(--abyss)] border-[var(--fire)] shadow-md'
                  : 'bg-[var(--panel-2)] text-[var(--ink-2)] border-[var(--line)]'
              }`}
              aria-label={isBn ? 'আগুন চালু/বন্ধ' : 'Toggle fire'}
            >
              {fireActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between text-2xs text-[var(--ink-3)] font-mono">
              <span>{isBn ? 'তীব্রতা' : 'Intensity'}</span>
              <span>{Math.round(fireIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={fireIntensity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFireIntensity(val);
                if (fireActive) audio.playFire(val, -0.6, 12000);
              }}
              className="accent-[var(--fire)]" aria-label={isBn ? 'আগুনের তীব্রতা' : 'Fire intensity'}
            />
          </div>

          <div className="text-2xs text-[var(--ink-3)]">
            {isBn ? 'বাঁ কান স্টেরিওতে পটপট শব্দ করে।' : 'Panned slightly left (-60° Lon)'}
          </div>
        </div>

        {/* Rain Deck */}
        <div className={`glass panel p-5 rounded-2xl flex flex-col gap-4 border transition-all ${rainActive ? 'border-[var(--rain)] shadow-lg shadow-[var(--rain)]/10 ring-1 ring-[var(--rain)]' : 'border-[var(--line)]'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--rain)] font-semibold">
              <CloudRain className="w-5 h-5" />
              <span>{isBn ? 'বর্ষা (Rain)' : 'Monsoon Rain'}</span>
            </div>
            <button
              onClick={toggleRain}
              className={`p-2 rounded-full border transition ${
                rainActive
                  ? 'bg-[var(--rain)] text-[var(--abyss)] border-[var(--rain)] shadow-md'
                  : 'bg-[var(--panel-2)] text-[var(--ink-2)] border-[var(--line)]'
              }`}
              aria-label={isBn ? 'বৃষ্টি চালু/বন্ধ' : 'Toggle rain'}
            >
              {rainActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between text-2xs text-[var(--ink-3)] font-mono">
              <span>{isBn ? 'তীব্রতা' : 'Rain Drip Rate'}</span>
              <span>{Math.round(rainIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={rainIntensity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRainIntensity(val);
                if (rainActive) audio.playRain(val, 0.6, 12000);
              }}
              className="accent-[var(--rain)]" aria-label={isBn ? 'বৃষ্টির তীব্রতা' : 'Rain intensity'}
            />
          </div>

          <div className="text-2xs text-[var(--ink-3)]">
            {isBn ? 'ডান কান স্টেরিওতে টুপটুপ বৃষ্টির ফোঁটা।' : 'Panned right (+90° Lon)'}
          </div>
        </div>

        {/* Ocean Deck */}
        <div className={`glass panel p-5 rounded-2xl flex flex-col gap-4 border transition-all ${oceanActive ? 'border-[var(--teal)] shadow-lg shadow-[var(--teal)]/10 ring-1 ring-[var(--teal)]' : 'border-[var(--line)]'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--teal)] font-semibold">
              <Waves className="w-5 h-5" />
              <span>{isBn ? 'সাগর (Ocean Drone)' : 'Ocean Bass'}</span>
            </div>
            <button
              onClick={toggleOcean}
              className={`p-2 rounded-full border transition ${
                oceanActive
                  ? 'bg-[var(--teal)] text-[var(--abyss)] border-[var(--teal)] shadow-md'
                  : 'bg-[var(--panel-2)] text-[var(--ink-2)] border-[var(--line)]'
              }`}
              aria-label={isBn ? 'সাগর চালু/বন্ধ' : 'Toggle ocean'}
            >
              {oceanActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between text-2xs text-[var(--ink-3)] font-mono">
              <span>{isBn ? 'তাপমাত্রা বিচ্যুতি' : 'SST Anomaly'}</span>
              <span>{oceanAnomaly > 0 ? `+${oceanAnomaly.toFixed(1)}` : oceanAnomaly.toFixed(1)}°C</span>
            </div>
            <input
              type="range"
              min="-2"
              max="3"
              step="0.2"
              value={oceanAnomaly}
              onChange={(e) => {
                const val = Number(e.target.value);
                setOceanAnomaly(val);
                if (oceanActive) audio.playOcean(val, 0.0, 15000);
              }}
              className="accent-[var(--teal)]" aria-label={isBn ? 'সমুদ্রের তাপমাত্রার অসামঞ্জস্য' : 'Ocean heat anomaly'}
            />
          </div>

          <div className="text-2xs text-[var(--ink-3)]">
            {isBn ? 'দুই কানে সমান গম্ভীর বেস তরঙ্গ।' : 'Center baseline ocean drone'}
          </div>
        </div>
      </div>

      {/* Interactive Pentatonic Keyboard (Vital Signs Lead Synth) */}
      <div className="glass panel p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[var(--brass)]" />
            <h3 className="text-base sm:text-lg font-semibold text-[var(--ink)]">
              {isBn ? 'জলবায়ু পিয়ানো (G-Major Pentatonic Scale)' : 'Climate Piano: Pentatonic Sound Pads'}
            </h3>
          </div>
          {(fireActive || rainActive || oceanActive) && (
            <button
              onClick={stopAllLoops}
              className="btn btn-ghost text-xs text-rose-300 border border-rose-500/30 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isBn ? 'সব লুপ বন্ধ করো' : 'Stop All Layers'}</span>
            </button>
          )}
        </div>

        <p className="text-xs text-[var(--ink-2)]">
          {isBn
            ? 'প্যাডগুলোতে ট্যাপ করো এবং তোমার তৈরি করা আগুনের পটপট ও বৃষ্টির ছন্দের ওপর নিজের সুর বাজাও!'
            : 'Tap the pads to jam real G-Major pentatonic notes over your Earth background loops!'}
        </p>

        {/* Note Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 mt-2">
          {pentatonicNotes.map((p) => {
            const isPlaying = activePad === p.note;
            return (
              <button
                key={p.note}
                onClick={() => triggerNote(p)}
                className={`py-5 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer transform active:scale-90 ${p.color} ${
                  isPlaying ? 'ring-2 ring-white scale-105 shadow-lg brightness-125' : 'hover:scale-102 hover:brightness-110'
                }`}
              >
                <span className="font-semibold text-lg font-mono">{p.note}</span>
                <span className="text-2xs opacity-75 font-mono">{Math.round(p.freq)} Hz</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
