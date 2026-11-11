import React, { useState } from 'react';
import { Volume2, CheckCircle2, RotateCcw, ArrowRight, Headphones, MapPin, Compass } from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { usePrefs } from '../lib/prefs';

interface Props {
  onComplete: () => void;
}

interface SpatialChallenge {
  id: number;
  soundType: 'rain' | 'fire' | 'ocean';
  pan: number; // -1 to +1
  audioFn: (a: GameAudioEngine) => void;
  choices: {
    id: string;
    nameEn: string;
    nameBn: string;
    hemisphereEn: string;
    hemisphereBn: string;
    lon: number;
    correct: boolean;
  }[];
  hintEn: string;
  hintBn: string;
  explanationEn: string;
  explanationBn: string;
}

export const LevelCompass: React.FC<Props> = ({ onComplete }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const challenges: SpatialChallenge[] = [
    {
      id: 1,
      soundType: 'rain',
      pan: 0.8, // East / Right
      audioFn: (a) => a.playRain(0.7, 0.8, 3000),
      choices: [
        {
          id: 'bgd',
          nameEn: 'Bangladesh (Sylhet Monsoon)',
          nameBn: 'বাংলাদেশ (সিলেট বর্ষা)',
          hemisphereEn: 'Eastern Globe (+91° E) · Right Ear',
          hemisphereBn: 'পূর্ব গোলার্ধ (+৯১° পূর্ব) · ডান কান',
          lon: 91,
          correct: true,
        },
        {
          id: 'amz',
          nameEn: 'Amazon Rainforest',
          nameBn: 'আমাজন রেইনফরেস্ট',
          hemisphereEn: 'Western Globe (-60° W) · Left Ear',
          hemisphereBn: 'পশ্চিম গোলার্ধ (-৬০° পশ্চিম) · বাঁ কান',
          lon: -60,
          correct: false,
        },
      ],
      hintEn: 'Wear headphones or listen carefully: which ear is hearing the rain drops?',
      hintBn: 'হেডফোন থাকলে পরো বা কান পেতে শোনো: বৃষ্টির ফোঁটা কোন কানে বাজছে?',
      explanationEn: 'Awesome! Longitude determines where sounds are placed in your headphones. Bangladesh is in the East (+91°), so it plays in your RIGHT ear!',
      explanationBn: 'চমৎকার! দ্রাঘিমাংশ দিয়ে শব্দ কানে পৌঁছায়। বাংলাদেশ পূর্বে (+৯১°) অবস্থিত, তাই শব্দটি ডান কানে বেজেছে!',
    },
    {
      id: 2,
      soundType: 'fire',
      pan: -0.75, // West / Left
      audioFn: (a) => a.playFire(0.7, -0.75, 3000),
      choices: [
        {
          id: 'aus',
          nameEn: 'Australia Bushfires',
          nameBn: 'অস্ট্রেলিয়ার বুশফায়ার',
          hemisphereEn: 'Eastern Globe (+135° E) · Right Ear',
          hemisphereBn: 'পূর্ব গোলার্ধ (+১৩৫° পূর্ব) · ডান কান',
          lon: 135,
          correct: false,
        },
        {
          id: 'cal',
          nameEn: 'California Wildfires',
          nameBn: 'ক্যালিফোর্নিয়া দাবানল',
          hemisphereEn: 'Western Globe (-120° W) · Left Ear',
          hemisphereBn: 'পশ্চিম গোলার্ধ (-১২০° পশ্চিম) · বাঁ কান',
          lon: -120,
          correct: true,
        },
      ],
      hintEn: 'Where does the fire crackle? Listen to the stereo pan in your ears.',
      hintBn: 'আগুনের পটপট কোন কান থেকে আসছে? মন দিয়ে শোনো।',
      explanationEn: 'Exact match! California lies in the West (-120°), so the wildfire sparks in your LEFT ear!',
      explanationBn: 'একদম নিখুঁত! ক্যালিফোর্নিয়া পশ্চিমে (-১২০°) অবস্থিত, তাই দাবানলের পটপট বাঁ কানে বেজেছে!',
    },
    {
      id: 3,
      soundType: 'ocean',
      pan: 0.0, // Center / Meridian
      audioFn: (a) => a.playOcean(0.3, 0.0, 3200),
      choices: [
        {
          id: 'atl',
          nameEn: 'Atlantic Ocean (Meridian)',
          nameBn: 'আটলান্টিক মহাসাগর (মধ্যরেখা)',
          hemisphereEn: 'Center (0° Longitude) · Both Ears',
          hemisphereBn: 'মাঝখানে (০° দ্রাঘিমাংশ) · দুই কান সমান',
          lon: 0,
          correct: true,
        },
        {
          id: 'pac',
          nameEn: 'Far East Pacific Ocean',
          nameBn: 'দূর পূর্ব প্রশান্ত মহাসাগর',
          hemisphereEn: 'Far East (+170° E) · Only Right Ear',
          hemisphereBn: 'দূর পূর্ব (+১৭০° পূর্ব) · কেবল ডান কান',
          lon: 170,
          correct: false,
        },
      ],
      hintEn: 'Both ears hear this deep ocean humming equally! Where is it?',
      hintBn: 'দুই কানে সমানভাবে গম্ভীর সাগরের সুর বাজছে! এটি কোথায়?',
      explanationEn: 'Brilliant! When sound is balanced equally between your left and right ears, it sits right at the prime meridian (0°)!',
      explanationBn: 'অসাধারণ! বাঁ ও ডান কানে সমান শব্দ হলে বুঝতে হবে এটি পৃথিবীর একেবারে মধ্যরেখায় (০°) অবস্থিত!',
    },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const cur = challenges[currentIdx];

  const handlePlaySound = () => {
    setIsPlaying(true);
    cur.audioFn(audio);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  const handleSelect = (id: string, correct: boolean) => {
    if (isAnswered) return;
    setSelectedId(id);
    setIsAnswered(true);

    if (correct) {
      audio.playSuccess();
    } else {
      audio.playBoop();
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < challenges.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedId(null);
      setIsAnswered(false);
      setIsPlaying(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-2">
          <span className="chip border-[var(--signal)] text-[var(--signal)] font-semibold">
            {isBn ? 'লেভেল ২' : 'Level 2'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--ink)]">
            {isBn ? 'শব্দের কম্পাস: কান পেতে পৃথিবী খোঁজা' : 'The Ear Compass: Spatial Audio'}
          </h2>
        </div>
        <div className="flex gap-1.5">
          {challenges.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < currentIdx || (i === currentIdx && isAnswered && selectedId === cur.choices.find((c) => c.correct)?.id)
                  ? 'bg-[var(--signal)]'
                  : i === currentIdx
                  ? 'bg-[var(--rain)] ring-2 ring-[var(--rain)] ring-offset-2 ring-offset-[var(--abyss)]'
                  : 'bg-[var(--line)]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="glass panel p-6 sm:p-8 flex flex-col gap-6">
        {/* Headphone Advisory */}
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] text-xs sm:text-sm text-[var(--ink-2)]">
          <Headphones className="w-5 h-5 text-[var(--signal)] shrink-0" />
          <span>
            {isBn
              ? 'টিপস: হেডফোন পরলে বাঁ কান ও ডান কানের পার্থক্য সবচেয়ে স্পষ্ট বোঝা যায়!'
              : 'Headphones recommended: Left and right sound channels follow Earth’s longitude!'}
          </span>
        </div>

        {/* Visual Stereo Indicator */}
        <div className="p-6 rounded-2xl bg-[var(--abyss)] border border-[var(--line)] flex flex-col items-center gap-4">
          <div className="flex items-center justify-between w-full max-w-sm px-4">
            <div className={`flex flex-col items-center gap-1 transition-all ${isPlaying && cur.pan < -0.2 ? 'scale-110 text-[var(--fire)]' : 'text-[var(--ink-3)]'}`}>
              <span className="text-xs font-semibold uppercase">{isBn ? 'বাঁ কান (পশ্চিম)' : 'Left Ear (West)'}</span>
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${isPlaying && cur.pan < -0.2 ? 'border-[var(--fire)] bg-[var(--fire)]/20 animate-pulse' : 'border-[var(--line)]'}`}>
                <Volume2 className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <Compass className="w-6 h-6 text-[var(--signal)]" />
              <span className="text-2xs text-[var(--ink-3)] font-mono">0° Meridian</span>
            </div>

            <div className={`flex flex-col items-center gap-1 transition-all ${isPlaying && cur.pan > 0.2 ? 'scale-110 text-[var(--rain)]' : 'text-[var(--ink-3)]'}`}>
              <span className="text-xs font-semibold uppercase">{isBn ? 'ডান কান (পূর্ব)' : 'Right Ear (East)'}</span>
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${isPlaying && cur.pan > 0.2 ? 'border-[var(--rain)] bg-[var(--rain)]/20 animate-pulse' : 'border-[var(--line)]'}`}>
                <Volume2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          <button
            onClick={handlePlaySound}
            className={`btn btn-brass px-7 py-3 rounded-full flex items-center gap-2.5 font-semibold text-sm ${isPlaying ? 'ring-4 ring-[var(--signal)]' : 'hover:scale-105'}`}
          >
            <Volume2 className="w-5 h-5" />
            <span>{isPlaying ? (isBn ? 'শব্দ বাজছে…' : 'Playing in stereo…') : (isBn ? 'শব্দ সংকেত শোনো' : 'Play Clue Sound')}</span>
          </button>
        </div>

        {/* Challenge Prompt */}
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)]">
            {isBn ? 'শব্দটির দিক শুনে বলো এটি পৃথিবীর কোন স্থানের ঘটনা?' : 'Based on the stereo sound direction, where is this happening?'}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--ink-3)] mt-1">
            {isBn ? cur.hintBn : cur.hintEn}
          </p>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cur.choices.map((c) => {
            const isSelected = selectedId === c.id;
            const showResult = isAnswered && isSelected;
            const isSuccess = showResult && c.correct;
            const isFail = showResult && !c.correct;

            return (
              <button
                key={c.id}
                disabled={isAnswered}
                onClick={() => handleSelect(c.id, c.correct)}
                className={`p-5 rounded-xl border flex flex-col gap-2 text-left transition-all cursor-pointer ${
                  isSuccess
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-100 ring-2 ring-emerald-500'
                    : isFail
                    ? 'border-rose-500 bg-rose-950/40 text-rose-200'
                    : isSelected
                    ? 'border-[var(--signal)] bg-[var(--panel-2)]'
                    : 'border-[var(--glass-border)] bg-[var(--panel)] hover:border-[var(--line)] hover:bg-[var(--panel-2)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[var(--signal)] shrink-0" />
                  <span className="font-semibold text-base text-[var(--ink)]">
                    {isBn ? c.nameBn : c.nameEn}
                  </span>
                </div>
                <div className="text-xs text-[var(--ink-2)]">
                  {isBn ? c.hemisphereBn : c.hemisphereEn}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback & Proceed */}
        {isAnswered && (
          <div className="p-4 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {selectedId === cur.choices.find((c) => c.correct)?.id ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <RotateCcw className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-semibold text-sm text-[var(--ink)]">
                  {selectedId === cur.choices.find((c) => c.correct)?.id
                    ? (isBn ? 'দারুণ কান তোমার! একদম ঠিক!' : 'Sharp ears! Exactly correct!')
                    : (isBn ? 'কোনো সমস্যা নেই, কান পাতো আরেকবার!' : 'Not quite, listen to the stereo balance again!')}
                </h4>
                <p className="text-xs text-[var(--ink-2)] mt-0.5">
                  {isBn ? cur.explanationBn : cur.explanationEn}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedId !== cur.choices.find((c) => c.correct)?.id && (
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setIsAnswered(false);
                    handlePlaySound();
                  }}
                  className="btn btn-ghost text-xs"
                >
                  {isBn ? 'আবার চেষ্টা করো' : 'Try Again'}
                </button>
              )}
              <button
                onClick={handleNext}
                className="btn btn-brass text-sm font-semibold flex items-center gap-1.5"
              >
                <span>{currentIdx + 1 < challenges.length ? (isBn ? 'পরের সংকেত' : 'Next Clue') : (isBn ? 'লেভেল ৩-এ চলো' : 'Go to Level 3')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
