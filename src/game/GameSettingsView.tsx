import React, { useState, useEffect } from 'react';
import {
  Settings,
  ArrowLeft,
  Volume2,
  Globe,
  Sliders,
  Eye,
  Keyboard,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { gameAudio } from './gameAudio';

interface Props {
  onBack: () => void;
}

export const GameSettingsView: React.FC<Props> = ({ onBack }) => {
  const { lang, highContrast, reduceMotion, set } = usePrefs();
  const isBn = lang === 'bn';

  const [masterVolume, setMasterVolume] = useState<number>(80);
  const [pitchScale, setPitchScale] = useState<'normal' | 'low' | 'high'>('normal');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [visualSoundWave, setVisualSoundWave] = useState(true);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoice) {
          setSelectedVoice(voices[0].name);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  const testAudioTone = () => {
    try {
      gameAudio.init();
      const baseFreq = pitchScale === 'low' ? 220 : pitchScale === 'high' ? 880 : 440;
      gameAudio.playTone(baseFreq, 0, 0.4);
    } catch {}
  };

  const testSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = isBn
        ? 'নাসা সনিক আর্থ অ্যাডভেঞ্চারে স্বাগতম। আপনার স্পিচ সেটিংস সক্রিয় রয়েছে।'
        : 'Welcome to NASA Sonic Earth Adventure. Your speech synthesis settings are active.';
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = speechRate;
      utt.pitch = speechPitch;
      const v = availableVoices.find((vox) => vox.name === selectedVoice);
      if (v) utt.voice = v;
      window.speechSynthesis.speak(utt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto" role="region" aria-label="Settings & Accessibility">
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-500 p-0.5 shadow-md flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="chip border-teal-500/40 bg-teal-950/40 text-teal-300 text-3xs font-mono font-semibold uppercase">
                {isBn ? 'সেকশন ১০ · সেটিংস ও অ্যাক্সেসিবিলিটি' : 'SECTION 10 · SETTINGS & ACCESSIBILITY'}
              </span>
              <span className="text-xs font-mono text-[var(--ink-3)]">
                Inclusive Design Standards
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)] mt-0.5">
              {isBn ? 'শব্দ, ভাষা, ভয়েস ও ভিজ্যুয়াল নিয়ন্ত্রণ' : 'Audio, Language, Voice & Visual Controls'}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Language & Sound Settings */}
        <div className="p-5 rounded-3xl bg-[var(--panel)] border border-[var(--line)] flex flex-col gap-5 shadow-lg">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
            <Globe className="w-5 h-5 text-[var(--signal)]" />
            <h3 className="font-display font-bold text-sm text-[var(--ink)]">
              {isBn ? 'ভাষা ও সাধারণ অডিও' : 'Language & Audio Engine'}
            </h3>
          </div>

          {/* Language Switcher */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[var(--ink-2)] font-medium">
              {isBn ? 'ইন্টারফেস ভাষা (Interface Language):' : 'Interface Language:'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => set({ lang: 'en' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  lang === 'en'
                    ? 'bg-[var(--signal)] text-black border-[var(--signal)] shadow-md'
                    : 'bg-black/30 border-[var(--line)] text-[var(--ink)] hover:border-[var(--signal)]'
                }`}
              >
                English (US)
              </button>
              <button
                onClick={() => set({ lang: 'bn' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  lang === 'bn'
                    ? 'bg-[var(--signal)] text-black border-[var(--signal)] shadow-md'
                    : 'bg-black/30 border-[var(--line)] text-[var(--ink)] hover:border-[var(--signal)]'
                }`}
              >
                বাংলা (Bengali)
              </button>
            </div>
          </div>

          {/* Master Volume */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--ink-2)]">{isBn ? 'মাস্টার সাউন্ড ভলিউম:' : 'Master Volume:'}</span>
              <span className="font-mono text-white font-semibold">{masterVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-full accent-[var(--signal)] cursor-pointer h-2 bg-black/40 rounded-lg appearance-none"
              aria-label="Master Volume"
            />
          </div>

          {/* Pitch Scale Tuning */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[var(--ink-2)] font-medium">
              {isBn ? 'সনিক স্কেল অক্টেভ টিউনিং:' : 'Sonification Pitch Octave:'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'normal', 'high'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setPitchScale(scale)}
                  className={`py-1.5 px-2 rounded-xl border text-xs font-mono font-semibold capitalize cursor-pointer transition ${
                    pitchScale === scale
                      ? 'bg-[var(--signal)] text-black border-[var(--signal)] shadow-md'
                      : 'bg-black/30 border-[var(--line)] text-[var(--ink)]'
                  }`}
                >
                  {scale}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={testAudioTone}
            className="btn btn-ghost border border-[var(--line)] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer hover:border-[var(--signal)]"
          >
            <Volume2 className="w-4 h-4 text-[var(--signal)]" />
            <span>{isBn ? 'সাউন্ড টেস্ট করুন' : 'Test Audio Tone'}</span>
          </button>
        </div>

        {/* Speech Synthesis & Screen Reader Narration */}
        <div className="p-5 rounded-3xl bg-[var(--panel)] border border-[var(--line)] flex flex-col gap-5 shadow-lg">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h3 className="font-display font-bold text-sm text-[var(--ink)]">
              {isBn ? 'স্পিচ সিন্থেসিস ও ভয়েস নিয়ন্ত্রণ' : 'Web Speech API Narration'}
            </h3>
          </div>

          {/* Voice selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[var(--ink-2)] font-medium">
              {isBn ? 'ভয়েস নির্বাচন:' : 'Speech Voice:'}
            </span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-black/50 border border-[var(--line)] rounded-xl px-2.5 py-1.5 text-xs font-mono text-white cursor-pointer"
            >
              {availableVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
              {availableVoices.length === 0 && (
                <option value="">Default System Voice</option>
              )}
            </select>
          </div>

          {/* Speech Rate */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--ink-2)]">{isBn ? 'বলার গতি (Rate):' : 'Speech Speed (Rate):'}</span>
              <span className="font-mono text-white font-semibold">{speechRate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={speechRate}
              onChange={(e) => setSpeechRate(Number(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer h-2 bg-black/40 rounded-lg appearance-none"
              aria-label="Speech Speed Rate"
            />
          </div>

          {/* Speech Pitch */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--ink-2)]">{isBn ? 'ভয়েস পিচ (Pitch):' : 'Speech Pitch:'}</span>
              <span className="font-mono text-white font-semibold">{speechPitch.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.1}
              value={speechPitch}
              onChange={(e) => setSpeechPitch(Number(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer h-2 bg-black/40 rounded-lg appearance-none"
              aria-label="Speech Pitch"
            />
          </div>

          <button
            onClick={testSpeech}
            className="btn btn-ghost border border-[var(--line)] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer hover:border-teal-400"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>{isBn ? 'ভয়েস পরীক্ষা করুন' : 'Test Speech Narration'}</span>
          </button>
        </div>
      </div>

      {/* Visual Accessibility & Hearing Assist Toggles */}
      <div className="p-5 rounded-3xl bg-[var(--panel)] border border-[var(--line)] flex flex-col gap-4 shadow-lg">
        <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
          <Eye className="w-5 h-5 text-indigo-400" />
          <h3 className="font-display font-bold text-sm text-[var(--ink)]">
            {isBn ? 'ভিজ্যুয়াল অ্যাক্সেসিবিলিটি ও বধিরবান্ধব বৈশিষ্ট্য' : 'Visual Accessibility & Deaf Inclusivity'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => set({ highContrast: !highContrast })}
            className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
              highContrast ? 'bg-indigo-950/30 border-indigo-400' : 'bg-black/30 border-[var(--line)]'
            }`}
          >
            <div>
              <span className="text-xs font-semibold text-white block">
                {isBn ? 'উচ্চ বৈসাদৃশ্য (High Contrast)' : 'High Contrast'}
              </span>
              <span className="text-3xs text-[var(--ink-3)]">
                Stronger borders & highlights
              </span>
            </div>
            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${highContrast ? 'bg-indigo-500 border-indigo-400' : 'border-[var(--line)]'}`}>
              {highContrast && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>

          <div
            onClick={() => set({ reduceMotion: !reduceMotion })}
            className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
              reduceMotion ? 'bg-indigo-950/30 border-indigo-400' : 'bg-black/30 border-[var(--line)]'
            }`}
          >
            <div>
              <span className="text-xs font-semibold text-white block">
                {isBn ? 'কম অ্যানিমেশন (Reduced Motion)' : 'Reduced Motion'}
              </span>
              <span className="text-3xs text-[var(--ink-3)]">
                Calm transitions for vestibular health
              </span>
            </div>
            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${reduceMotion ? 'bg-indigo-500 border-indigo-400' : 'border-[var(--line)]'}`}>
              {reduceMotion && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>

          <div
            onClick={() => setVisualSoundWave(!visualSoundWave)}
            className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
              visualSoundWave ? 'bg-indigo-950/30 border-indigo-400' : 'bg-black/30 border-[var(--line)]'
            }`}
          >
            <div>
              <span className="text-xs font-semibold text-white block">
                {isBn ? 'ভিজ্যুয়াল সাউন্ড ওয়েভ' : 'Visual Sound Spectrum'}
              </span>
              <span className="text-3xs text-[var(--ink-3)]">
                Graphic bars for hard-of-hearing
              </span>
            </div>
            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${visualSoundWave ? 'bg-indigo-500 border-indigo-400' : 'border-[var(--line)]'}`}>
              {visualSoundWave && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference Guide */}
      <div className="p-5 rounded-3xl bg-black/60 border border-[var(--line)] flex flex-col gap-3 shadow-inner">
        <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
          <Keyboard className="w-5 h-5 text-[var(--signal)]" />
          <h3 className="font-display font-bold text-sm text-[var(--ink)]">
            {isBn ? 'সম্পূর্ণ কীবোর্ড শর্টকাট রেফারেন্স' : 'Comprehensive Keyboard Shortcuts Reference'}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs font-mono text-[var(--ink-2)]">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-white font-semibold block">W / A / S / D</span>
            <span>Movement & Direction</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-white font-semibold block">Space</span>
            <span>Sonar Ping / Fire Water</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-white font-semibold block">Enter</span>
            <span>Interact / Calibrate</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-white font-semibold block">M / H / Esc</span>
            <span>Compass / Audio Help / Exit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
