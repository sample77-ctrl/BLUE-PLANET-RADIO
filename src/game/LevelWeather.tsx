import React, { useState } from 'react';
import { Volume2, RotateCcw, ArrowRight, AlertTriangle, ShieldCheck, Waves, CloudRain } from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { usePrefs } from '../lib/prefs';

interface Props {
  onComplete: () => void;
}

interface WeatherPair {
  id: number;
  titleEn: string;
  titleBn: string;
  phenomenon: 'rain' | 'ocean';
  questionEn: string;
  questionBn: string;
  soundA: {
    labelEn: string;
    labelBn: string;
    audioFn: (a: GameAudioEngine) => void;
    isExtreme: boolean;
  };
  soundB: {
    labelEn: string;
    labelBn: string;
    audioFn: (a: GameAudioEngine) => void;
    isExtreme: boolean;
  };
  explanationEn: string;
  explanationBn: string;
}

export const LevelWeather: React.FC<Props> = ({ onComplete }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const pairs: WeatherPair[] = [
    {
      id: 1,
      titleEn: 'Rainfall Extreme: Gentle Shower vs Torrential Monsoon',
      titleBn: 'বৃষ্টির তীব্রতা: মৃদু বৃষ্টি বনাম ভয়ংকর বর্ষা',
      phenomenon: 'rain',
      questionEn: 'Which sound is the extreme monsoon rainfall recorded in Sylhet, Bangladesh?',
      questionBn: 'কোন শব্দটি সিলেটে নাসা রেকর্ডের ভয়ংকর বর্ষার প্লাবনের শব্দ?',
      soundA: {
        labelEn: 'Sound A (Light Drizzle)',
        labelBn: 'সাউন্ড ক (মৃদু বৃষ্টি)',
        audioFn: (a) => a.playRain(0.18, 0, 3000),
        isExtreme: false,
      },
      soundB: {
        labelEn: 'Sound B (Torrential Monsoon)',
        labelBn: 'সাউন্ড খ (ভয়ংকর বর্ষা)',
        audioFn: (a) => a.playRain(0.95, 0, 3000),
        isExtreme: true,
      },
      explanationEn: 'Correct! NASA POWER records show Sylhet reached up to 138 mm/day of rain during the monsoon peak. Extreme rainfall creates frantic, high-density water droplet pings!',
      explanationBn: 'একদম সঠিক! নাসার POWER ডেটা অনুযায়ী বর্ষাকালে সিলেটে দিনে ১৩৮ মিমি পর্যন্ত বৃষ্টিপাত হয়। চরম বর্ষায় শব্দের ফোঁটা অনেক দ্রুত ও ঘন ঘন ঝরে!',
    },
    {
      id: 2,
      titleEn: 'Ocean Heat: Calm Waters vs Marine Heatwave',
      titleBn: 'সমুদ্রের তাপ: স্বাভাবিক পানি বনাম বিপজ্জনক উষ্ণ সাগর',
      phenomenon: 'ocean',
      questionEn: 'Which sound signals an alarming marine heatwave (positive temperature anomaly)?',
      questionBn: 'কোন শব্দটি সাগরের বিপজ্জনক তাপমাত্রা বৃদ্ধির (Heatwave Anomaly) সতর্কবার্তা?',
      soundA: {
        labelEn: 'Sound A (Normal Calm Sea)',
        labelBn: 'সাউন্ড ক (স্বাভাবিক শান্ত সাগর)',
        audioFn: (a) => a.playOcean(0.0, 0, 3200),
        isExtreme: false,
      },
      soundB: {
        labelEn: 'Sound B (Hot Marine Heatwave)',
        labelBn: 'সাউন্ড খ (উষ্ণ সাগরের তাপপ্রবাহ)',
        audioFn: (a) => a.playOcean(2.7, 0, 3200),
        isExtreme: true,
      },
      explanationEn: 'Super! JPL PO.DAAC satellite sensors measure ocean temperature anomaly. When sea temperatures rise far above normal, the sonification drone shifts to a much higher, tense musical pitch!',
      explanationBn: 'চমৎকার! নাসার JPL স্যাটেলাইট সাগরের তাপমাত্রার বিচ্যুতি মাপে। পানি অতিরিক্ত গরম হয়ে উঠলে গম্ভীর সুরটি অনেক উঁচুতে চড়ে যায়!',
    },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [playingWhich, setPlayingWhich] = useState<'A' | 'B' | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const cur = pairs[currentIdx];

  const handlePlay = (which: 'A' | 'B') => {
    setPlayingWhich(which);
    if (which === 'A') cur.soundA.audioFn(audio);
    else cur.soundB.audioFn(audio);
    setTimeout(() => setPlayingWhich(null), 3000);
  };

  const handleSelect = (which: 'A' | 'B') => {
    if (isAnswered) return;
    setSelectedChoice(which);
    setIsAnswered(true);

    const isCorrect = (which === 'A' && cur.soundA.isExtreme) || (which === 'B' && cur.soundB.isExtreme);
    if (isCorrect) {
      audio.playSuccess();
    } else {
      audio.playBoop();
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < pairs.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedChoice(null);
      setIsAnswered(false);
      setPlayingWhich(null);
    } else {
      onComplete();
    }
  };

  const isCurrentCorrect = selectedChoice && ((selectedChoice === 'A' && cur.soundA.isExtreme) || (selectedChoice === 'B' && cur.soundB.isExtreme));

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-2">
          <span className="chip border-[var(--brass)] text-[var(--brass)] font-semibold">
            {isBn ? 'লেভেল ৩' : 'Level 3'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--ink)]">
            {isBn ? 'আবহাওয়া গোয়েন্দা: শান্ত বনাম চরম দুর্যোগ' : 'Weather Detective: Calm vs Extreme'}
          </h2>
        </div>
        <div className="flex gap-1.5">
          {pairs.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < currentIdx || (i === currentIdx && isAnswered && isCurrentCorrect)
                  ? 'bg-[var(--brass)]'
                  : i === currentIdx
                  ? 'bg-[var(--rain)] ring-2 ring-[var(--rain)] ring-offset-2 ring-offset-[var(--abyss)]'
                  : 'bg-[var(--line)]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="glass panel p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300">
            {cur.phenomenon === 'rain' ? <CloudRain className="w-6 h-6 text-[var(--rain)]" /> : <Waves className="w-6 h-6 text-[var(--teal)]" />}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)]">
              {isBn ? cur.titleBn : cur.titleEn}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-0.5">
              {isBn ? cur.questionBn : cur.questionEn}
            </p>
          </div>
        </div>

        {/* Comparison Play Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
          {/* Sound A */}
          <div className="p-5 rounded-2xl bg-[var(--abyss)] border border-[var(--line)] flex flex-col items-center gap-4 text-center">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-3)]">
              {isBn ? 'প্রথম অপশন' : 'Option 1'}
            </span>
            <button
              onClick={() => handlePlay('A')}
              className={`btn btn-ghost border border-[var(--line)] px-6 py-4 rounded-xl flex items-center gap-2.5 w-full justify-center transition-all ${
                playingWhich === 'A' ? 'border-[var(--brass)] bg-[var(--panel-2)] text-[var(--brass)]' : 'hover:border-[var(--brass)]'
              }`}
            >
              <Volume2 className={`w-5 h-5 ${playingWhich === 'A' ? 'animate-bounce' : ''}`} />
              <span className="font-semibold text-sm">
                {playingWhich === 'A' ? (isBn ? 'বাজছে…' : 'Playing Sound A…') : (isBn ? 'সাউন্ড ক শুনুন' : 'Listen to Sound A')}
              </span>
            </button>
            <button
              disabled={isAnswered}
              onClick={() => handleSelect('A')}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition cursor-pointer border ${
                selectedChoice === 'A'
                  ? cur.soundA.isExtreme
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-rose-600 text-white border-rose-500'
                  : 'bg-[var(--panel-2)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--brass)]'
              }`}
            >
              {isBn ? 'এটিই চরম দুর্যোগ!' : 'Select as Extreme Event'}
            </button>
          </div>

          {/* Sound B */}
          <div className="p-5 rounded-2xl bg-[var(--abyss)] border border-[var(--line)] flex flex-col items-center gap-4 text-center">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-3)]">
              {isBn ? 'দ্বিতীয় অপশন' : 'Option 2'}
            </span>
            <button
              onClick={() => handlePlay('B')}
              className={`btn btn-ghost border border-[var(--line)] px-6 py-4 rounded-xl flex items-center gap-2.5 w-full justify-center transition-all ${
                playingWhich === 'B' ? 'border-[var(--brass)] bg-[var(--panel-2)] text-[var(--brass)]' : 'hover:border-[var(--brass)]'
              }`}
            >
              <Volume2 className={`w-5 h-5 ${playingWhich === 'B' ? 'animate-bounce' : ''}`} />
              <span className="font-semibold text-sm">
                {playingWhich === 'B' ? (isBn ? 'বাজছে…' : 'Playing Sound B…') : (isBn ? 'সাউন্ড খ শুনুন' : 'Listen to Sound B')}
              </span>
            </button>
            <button
              disabled={isAnswered}
              onClick={() => handleSelect('B')}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition cursor-pointer border ${
                selectedChoice === 'B'
                  ? cur.soundB.isExtreme
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-rose-600 text-white border-rose-500'
                  : 'bg-[var(--panel-2)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--brass)]'
              }`}
            >
              {isBn ? 'এটিই চরম দুর্যোগ!' : 'Select as Extreme Event'}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div className="p-4 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {isCurrentCorrect ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-semibold text-sm text-[var(--ink)]">
                  {isCurrentCorrect
                    ? (isBn ? 'দুর্দান্ত গোয়েন্দা নজর! একদম সঠিক!' : 'Incredible deduction! Exactly right!')
                    : (isBn ? 'আরেকবার দুটি সাউন্ড প্লে করে তুলনা করো!' : 'Give both sounds another listen and compare speeds!')}
                </h4>
                <p className="text-xs text-[var(--ink-2)] mt-0.5">
                  {isBn ? cur.explanationBn : cur.explanationEn}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isCurrentCorrect && (
                <button
                  onClick={() => {
                    setSelectedChoice(null);
                    setIsAnswered(false);
                  }}
                  className="btn btn-ghost text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isBn ? 'পুনরায় চেষ্টা' : 'Try Again'}</span>
                </button>
              )}
              <button
                onClick={handleNext}
                className="btn btn-brass text-sm font-semibold flex items-center gap-1.5"
              >
                <span>{currentIdx + 1 < pairs.length ? (isBn ? 'পরবর্তী তুলনা' : 'Next Case') : (isBn ? 'লেভেল ৪-এ চলো' : 'Go to Level 4')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
