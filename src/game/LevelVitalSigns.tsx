import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Award, Music, TrendingUp, Sparkles } from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { usePrefs } from '../lib/prefs';

interface Props {
  onComplete: () => void;
}

interface ClimateMilestone {
  year: number;
  label: string;
  anomaly: number; // °C
  pitchHz: number;
  note: string;
  eraEn: string;
  eraBn: string;
}

export const LevelVitalSigns: React.FC<Props> = ({ onComplete }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const milestones: ClimateMilestone[] = [
    { year: 1880, label: '1880', anomaly: -0.28, pitchHz: 196.0, note: 'G3', eraEn: 'Early Industrial (Cooler)', eraBn: 'শিল্পবিপ্লবের শুরু (শীতল)' },
    { year: 1910, label: '1910', anomaly: -0.42, pitchHz: 220.0, note: 'A3', eraEn: 'Calm Baseline', eraBn: 'স্বাভাবিক শান্ত সময়' },
    { year: 1940, label: '1940', anomaly: +0.08, pitchHz: 261.6, note: 'C4', eraEn: 'Mid-Century Shift', eraBn: 'শতকের মধ্যবর্তী পরিবর্তন' },
    { year: 1975, label: '1975', anomaly: -0.01, pitchHz: 293.7, note: 'D4', eraEn: 'Baseline Reference', eraBn: 'ভিত্তিরেখা পর্যায়' },
    { year: 2000, label: '2000', anomaly: +0.39, pitchHz: 392.0, note: 'G4', eraEn: 'Rapid Warming Begins', eraBn: 'দ্রুত উষ্ণতা বৃদ্ধি শুরু' },
    { year: 2016, label: '2016', anomaly: +1.02, pitchHz: 523.3, note: 'C5', eraEn: 'Historic El Niño Heat', eraBn: 'ঐতিহাসিক এল নিনো উত্তাপ' },
    { year: 2026, label: '2026', anomaly: +1.28, pitchHz: 659.3, note: 'E5', eraEn: 'Record High Temperatures', eraBn: 'সর্বকালের সর্বোচ্চ উষ্ণতা!' },
  ];

  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<'higher' | 'lower' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const timerRef = useRef<number | null>(null);

  const stopPlayback = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsPlayingSeq(false);
  };

  const playSequence = () => {
    stopPlayback();
    setIsPlayingSeq(true);

    milestones.forEach((m, idx) => {
      const t = window.setTimeout(() => {
        setActiveStep(idx);
        audio.playPentatonicNote(m.pitchHz, m.anomaly > 0 ? 'triangle' : 'sine', 0.45);

        if (idx === milestones.length - 1) {
          const doneT = window.setTimeout(() => {
            setIsPlayingSeq(false);
          }, 800);
          timerRef.current = doneT;
        }
      }, idx * 600);
      timerRef.current = t;
    });
  };

  const playSingleMilestone = (idx: number) => {
    stopPlayback();
    setActiveStep(idx);
    const m = milestones[idx];
    audio.playPentatonicNote(m.pitchHz, m.anomaly > 0 ? 'triangle' : 'sine', 0.5);
  };

  useEffect(() => {
    return () => stopPlayback();
  }, []);

  const handleAnswer = (ans: 'higher' | 'lower') => {
    if (isAnswered) return;
    setSelectedAnswer(ans);
    setIsAnswered(true);

    if (ans === 'higher') {
      audio.playSuccess();
    } else {
      audio.playBoop();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-2">
          <span className="chip border-[var(--brass)] text-[var(--brass)] font-semibold">
            {isBn ? 'লেভেল ৪ (ফাইনাল)' : 'Level 4 (Final)'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--ink)]">
            {isBn ? 'পৃথিবীর স্পন্দন: ১৪০ বছরের সুর' : 'Planet Heartbeat: 140-Year Melody'}
          </h2>
        </div>
        <div className="chip border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
          <span>{isBn ? 'গ্র্যাজুয়েশন মিশন' : 'Graduation Mission'}</span>
        </div>
      </div>

      <div className="glass panel p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--brass)]/20 border border-[var(--brass)]/40 text-[var(--brass)]">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-[var(--ink)]">
              {isBn ? 'নাসার বৈশ্বিক তাপমাত্রা (GISTEMP) কীভাবে সুর হয়?' : 'How NASA Global Temperature Becomes a Melody'}
            </h3>
            <p className="text-sm text-[var(--ink-2)]">
              {isBn
                ? '১৮৮০ থেকে ২০২৬ পর্যন্ত তাপমাত্রা শোনো। পৃথিবী যেমন একটু একটু করে গরম হয়েছে, সুরের কী পরিবর্তন হয়েছে খেয়াল করো!'
                : 'Listen to 1880 to 2026. Notice what happens to the musical notes as Earth’s temperature changes over time!'}
            </p>
          </div>
        </div>

        {/* Playback Controls & Timeline Visualizer */}
        <div className="p-5 rounded-2xl bg-[var(--abyss)] border border-[var(--line)] flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <button
              onClick={isPlayingSeq ? stopPlayback : playSequence}
              className="btn btn-brass flex items-center gap-2 font-semibold text-sm px-5 py-2.5"
            >
              {isPlayingSeq ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>
                {isPlayingSeq
                  ? (isBn ? 'বিরতি দিন' : 'Pause Melody')
                  : (isBn ? '১৪০ বছরের জলবায়ুর গান চালাও' : 'Play 140-Year Melody')}
              </span>
            </button>
            <span className="text-xs text-[var(--ink-3)] font-mono">
              {isBn ? 'যেকোনো সালে ক্লিক করে একক সুর শুনুন' : 'Click any year to play its note'}
            </span>
          </div>

          {/* Interactive Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {milestones.map((m, idx) => {
              const isActive = activeStep === idx;
              const isWarm = m.anomaly > 0;

              return (
                <button
                  key={m.year}
                  onClick={() => playSingleMilestone(idx)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer text-center ${
                    isActive
                      ? 'border-[var(--brass)] bg-[var(--panel-2)] scale-105 shadow-md ring-2 ring-[var(--brass)]'
                      : 'border-[var(--glass-border)] bg-[var(--panel)] hover:border-[var(--line)]'
                  }`}
                >
                  <span className="font-semibold text-xs sm:text-sm font-mono text-[var(--ink)]">{m.year}</span>
                  <div
                    className={`text-2xs font-semibold px-1.5 py-0.5 rounded ${
                      isWarm ? 'bg-rose-950/60 text-rose-300' : 'bg-sky-950/60 text-sky-300'
                    }`}
                  >
                    {m.anomaly > 0 ? `+${m.anomaly}` : m.anomaly}°C
                  </div>
                  <span className="text-2xs font-mono text-[var(--ink-3)]">{m.note}</span>
                </button>
              );
            })}
          </div>

          {/* Active Era Details */}
          {activeStep !== null && (
            <div className="p-3.5 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[var(--ink-2)]">
                {isBn ? milestones[activeStep].eraBn : milestones[activeStep].eraEn}
              </span>
              <span className="font-mono text-[var(--brass)] font-semibold">
                {milestones[activeStep].note} ({milestones[activeStep].pitchHz.toFixed(1)} Hz)
              </span>
            </div>
          )}
        </div>

        {/* Challenge Question */}
        <div className="text-center mt-1">
          <h4 className="text-lg font-display font-bold text-[var(--ink)]">
            {isBn ? 'সময় গড়ানোর সাথে সাথে সুরের উচ্চতা (Pitch) কেমন পরিবর্তন হলো?' : 'As time moved towards modern years, how did the melody change?'}
          </h4>
          <p className="text-xs sm:text-sm text-[var(--ink-3)] mt-0.5">
            {isBn
              ? 'শুরুর দিকের বছরগুলোর চেয়ে শেষের দিকের সুরগুলো কি উঁচুতে উঠল নাকি নিচুতে নামল?'
              : 'Compared to the 1880s, did recent years play higher or lower musical notes?'}
          </p>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            disabled={isAnswered}
            onClick={() => handleAnswer('higher')}
            className={`p-5 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
              isAnswered && selectedAnswer === 'higher'
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-100 ring-2 ring-emerald-500'
                : 'border-[var(--glass-border)] bg-[var(--panel)] hover:border-[var(--line)] hover:bg-[var(--panel-2)]'
            }`}
          >
            <div className="p-2.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-base text-[var(--ink)]">
                {isBn ? 'সুর অনেক উঁচুতে উঠেছে (Climbed Higher)' : 'It Climbed HIGHER'}
              </div>
              <div className="text-xs text-[var(--ink-2)]">
                {isBn ? 'উষ্ণতা বৃদ্ধির সাথে সাথে সুরের স্কেল উঁচুতে যায়' : 'Higher pitch represents rising global temperature'}
              </div>
            </div>
          </button>

          <button
            disabled={isAnswered}
            onClick={() => handleAnswer('lower')}
            className={`p-5 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
              isAnswered && selectedAnswer === 'lower'
                ? 'border-rose-500 bg-rose-950/40 text-rose-200 ring-2 ring-rose-500'
                : 'border-[var(--glass-border)] bg-[var(--panel)] hover:border-[var(--line)] hover:bg-[var(--panel-2)]'
            }`}
          >
            <div className="p-2.5 rounded-full bg-rose-950/50 border border-rose-500/30 text-rose-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-base text-[var(--ink)]">
                {isBn ? 'সুর নিচুতে নেমেছে (Went Lower)' : 'It Sank LOWER'}
              </div>
              <div className="text-xs text-[var(--ink-2)]">
                {isBn ? 'সুর ক্রমাগত গভীর বেস নোটে রূপ নিয়েছে' : 'Lower pitch throughout the years'}
              </div>
            </div>
          </button>
        </div>

        {/* Feedback & Graduation Trigger */}
        {isAnswered && (
          <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/40 to-emerald-950/40 border border-[var(--brass)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-[var(--brass)] shrink-0 mt-0.5 animate-bounce" />
              <div>
                <h4 className="font-semibold text-base text-[var(--brass)]">
                  {selectedAnswer === 'higher'
                    ? (isBn ? 'অভিনন্দন ক্যাডেট! তুমি পৃথিবীর সুরের গোপন সূত্র ধরে ফেলেছ!' : 'Congratulations Cadet! You decoded the Earth’s warming song!')
                    : (isBn ? 'সুরটি আসলে অনেক উঁচুতে উঠেছিল, কারণ পৃথিবী এখন বেশি গরম!' : 'The notes climbed much higher because our planet warmed up!')}
                </h4>
                <p className="text-xs sm:text-sm text-[var(--ink)] mt-1 leading-relaxed">
                  {isBn
                    ? 'নাসার GISTEMP রেকর্ড অনুযায়ী বৈশ্বিক তাপমাত্রা বাড়ার সাথে সাথে সোনফিকেশন স্কেল নিচু G3 নোট থেকে উঁচু E5 নোটে উঠে গেছে। তুমি এখন সফলভাবে সব মিশন শেষ করেছ!'
                    : 'NASA GISTEMP records prove our planet has warmed. The sonification maps higher temperature directly to higher notes on the G-major pentatonic scale!'}
                </p>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="btn btn-brass text-base font-semibold px-7 py-3 rounded-xl flex items-center gap-2 shrink-0 shadow-xl hover:scale-105"
            >
              <Award className="w-5 h-5" />
              <span>{isBn ? 'ক্যাডেট ব্যাজ গ্রহণ করো!' : 'Claim Your Cadet Badge!'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
