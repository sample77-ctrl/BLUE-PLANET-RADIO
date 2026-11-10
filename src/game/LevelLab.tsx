import React, { useState } from 'react';
import { Play, Volume2, Sparkles, CheckCircle2, RotateCcw, Flame, CloudRain, Waves, ArrowRight, Sliders } from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { usePrefs } from '../lib/prefs';

interface Props {
  onComplete: () => void;
}

interface Question {
  id: number;
  type: 'fire' | 'rain' | 'ocean';
  audioFn: (audio: GameAudioEngine) => void;
  options: { key: string; labelEn: string; labelBn: string; icon: React.ReactNode; correct: boolean }[];
  hintEn: string;
  hintBn: string;
  explanationEn: string;
  explanationBn: string;
}

export const LevelLab: React.FC<Props> = ({ onComplete }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const questions: Question[] = [
    {
      id: 1,
      type: 'fire',
      audioFn: (a) => a.playFire(0.65, 0, 3000),
      options: [
        { key: 'fire', labelEn: 'Wildfire (দাবানল)', labelBn: 'দাবানল (Wildfire)', icon: <Flame className="w-5 h-5 text-[var(--fire)]" />, correct: true },
        { key: 'rain', labelEn: 'Rain (বৃষ্টি)', labelBn: 'বৃষ্টি (Rain)', icon: <CloudRain className="w-5 h-5 text-[var(--rain)]" />, correct: false },
        { key: 'ocean', labelEn: 'Ocean (সমুদ্র)', labelBn: 'সমুদ্র (Ocean)', icon: <Waves className="w-5 h-5 text-[var(--teal)]" />, correct: false },
      ],
      hintEn: 'Listen closely! It crackles and sparks like burning wood.',
      hintBn: 'মন দিয়ে শোনো! পোড়া কাঠ বা শুকনো পাতার মতো পটপট আওয়াজ হচ্ছে।',
      explanationEn: 'NASA VIIRS satellites scan the planet from space. When they detect blazing heat, we turn that fire energy into crackling sparks!',
      explanationBn: 'নাসার VIIRS স্যাটেলাইট মহাকাশ থেকে আগুনের তেজ মাপলে তা এমন পটপট শব্দে পরিণত হয়!',
    },
    {
      id: 2,
      type: 'rain',
      audioFn: (a) => a.playRain(0.6, 0, 3000),
      options: [
        { key: 'snow', labelEn: 'Snow (তুষার)', labelBn: 'তুষার (Snow)', icon: <Sparkles className="w-5 h-5 text-[var(--ink-2)]" />, correct: false },
        { key: 'rain', labelEn: 'Rain (বৃষ্টি)', labelBn: 'বৃষ্টি (Rain)', icon: <CloudRain className="w-5 h-5 text-[var(--rain)]" />, correct: true },
        { key: 'fire', labelEn: 'Fire (আগুন)', labelBn: 'আগুন (Fire)', icon: <Flame className="w-5 h-5 text-[var(--fire)]" />, correct: false },
      ],
      hintEn: 'Listen to the crisp water droplets falling one by one.',
      hintBn: 'শুনলেই বুঝতে পারবে—টুপটুপ করে যেন মিষ্টি বৃষ্টির ফোঁটা ঝরছে।',
      explanationEn: 'NASA POWER measures rain in millimeters per day. Each drop is a real measurement from Earth’s clouds!',
      explanationBn: 'নাসার POWER ডেটা প্রতিদিনের বৃষ্টি মিমি-তে মাপে। প্রতিটি ফোঁটা আসলে মেঘের পরিমাপ!',
    },
    {
      id: 3,
      type: 'ocean',
      audioFn: (a) => a.playOcean(0.5, 0, 3200),
      options: [
        { key: 'ocean', labelEn: 'Ocean Heat (সমুদ্রের তাপ)', labelBn: 'সমুদ্রের তাপ (Ocean Heat)', icon: <Waves className="w-5 h-5 text-[var(--teal)]" />, correct: true },
        { key: 'thunder', labelEn: 'Thunder (বজ্রপাত)', labelBn: 'বজ্রপাত (Thunder)', icon: <Sparkles className="w-5 h-5 text-[var(--brass)]" />, correct: false },
        { key: 'rain', labelEn: 'Rain (বৃষ্টি)', labelBn: 'বৃষ্টি (Rain)', icon: <CloudRain className="w-5 h-5 text-[var(--rain)]" />, correct: false },
      ],
      hintEn: 'A deep, warm humming drone from the vast oceans.',
      hintBn: 'গভীর সাগরের মতো এক গম্ভীর ও দীর্ঘ গুঞ্জন।',
      explanationEn: 'NASA JPL PO.DAAC satellites track ocean surface temperatures. The massive ocean sings as a deep, calming bass drone.',
      explanationBn: 'নাসার জেট প্রোপালশন ল্যাব (JPL) সমুদ্রের তাপমাত্রা মাপে—যা গম্ভীর বেস সুরে গুঞ্জন তোলে।',
    },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inSandboxExperiment, setInSandboxExperiment] = useState(false);
  const [firePower, setFirePower] = useState(400); // 10 to 1000 MW

  const currentQ = questions[currentIdx];

  const handlePlaySound = () => {
    setIsPlaying(true);
    currentQ.audioFn(audio);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  const handleOptionSelect = (key: string, isCorrect: boolean) => {
    if (isAnswered) return;
    setSelectedOpt(key);
    setIsAnswered(true);

    if (isCorrect) {
      audio.playSuccess();
    } else {
      audio.playBoop();
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
      setIsPlaying(false);
    } else {
      setInSandboxExperiment(true);
    }
  };

  const handleExperimentSound = (val: number) => {
    setFirePower(val);
    const norm = Math.max(0.05, Math.min(1, val / 1000));
    audio.playFire(norm, 0, 2500);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-2">
          <span className="chip border-[var(--brass)] text-[var(--brass)] font-semibold">
            {isBn ? 'লেভেল ১' : 'Level 1'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--ink)]">
            {isBn ? 'শব্দ ল্যাব: প্রকৃতির কণ্ঠস্বর' : 'The Sound Lab: Nature’s Voices'}
          </h2>
        </div>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < currentIdx || (i === currentIdx && isAnswered && selectedOpt === currentQ.options.find((o) => o.correct)?.key)
                  ? 'bg-[var(--brass)]'
                  : i === currentIdx
                  ? 'bg-[var(--rain)] ring-2 ring-[var(--rain)] ring-offset-2 ring-offset-[var(--abyss)]'
                  : 'bg-[var(--line)]'
              }`}
            />
          ))}
          <div
            className={`w-3 h-3 rounded-full transition-colors ${
              inSandboxExperiment ? 'bg-[var(--brass)]' : 'bg-[var(--line)]'
            }`}
          />
        </div>
      </div>

      {!inSandboxExperiment ? (
        <div className="glass panel p-6 sm:p-8 flex flex-col gap-6">
          <div className="text-center flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[var(--ink-3)] font-semibold">
              {isBn ? `প্রশ্ন ${currentIdx + 1} / ${questions.length}` : `Challenge ${currentIdx + 1} of ${questions.length}`}
            </span>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-[var(--ink)]">
              {isBn ? 'মন দিয়ে শোনো—এটি কিসের শব্দ?' : 'Listen carefully: what makes this sound?'}
            </h3>
            <p className="text-sm text-[var(--ink-2)] max-w-md">
              {isBn ? currentQ.hintBn : currentQ.hintEn}
            </p>
          </div>

          {/* Big Tactile Audio Button */}
          <div className="flex justify-center my-3">
            <button
              onClick={handlePlaySound}
              className={`btn btn-brass text-base font-semibold px-8 py-5 rounded-full flex items-center gap-3 shadow-lg transform transition active:scale-95 ${
                isPlaying ? 'ring-4 ring-[var(--brass)] animate-pulse' : 'hover:scale-105'
              }`}
              aria-label={isBn ? 'শব্দটি শোনো' : 'Play Sound'}
            >
              <Volume2 className={`w-6 h-6 ${isPlaying ? 'animate-bounce' : ''}`} />
              <span>{isPlaying ? (isBn ? 'বাজছে…' : 'Playing…') : (isBn ? 'শব্দটি শোনো (Play)' : 'Play Sound')}</span>
            </button>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOpt === opt.key;
              const showResult = isAnswered && isSelected;
              const isSuccess = showResult && opt.correct;
              const isFail = showResult && !opt.correct;

              return (
                <button
                  key={opt.key}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(opt.key, opt.correct)}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer min-h-[96px] ${
                    isSuccess
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-2 ring-emerald-500 shadow-lg'
                      : isFail
                      ? 'border-rose-500 bg-rose-950/40 text-rose-200'
                      : isSelected
                      ? 'border-[var(--brass)] bg-[var(--panel-2)]'
                      : 'border-[var(--glass-border)] bg-[var(--panel)] hover:border-[var(--line)] hover:bg-[var(--panel-2)]'
                  }`}
                >
                  <div className="p-2.5 rounded-full bg-[var(--abyss)] border border-[var(--line)]">
                    {opt.icon}
                  </div>
                  <span className="font-semibold text-sm sm:text-base">
                    {isBn ? opt.labelBn : opt.labelEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback & Next Button */}
          {isAnswered && (
            <div className="p-4 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="flex items-start gap-3">
                {selectedOpt === currentQ.options.find((o) => o.correct)?.key ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <RotateCcw className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold text-sm text-[var(--ink)]">
                    {selectedOpt === currentQ.options.find((o) => o.correct)?.key
                      ? (isBn ? 'চমৎকার! একদম সঠিক!' : 'Spot on! Correct!')
                      : (isBn ? 'একটু ভুল হয়েছে, কিন্তু কোনো সমস্যা নেই!' : 'Not quite, but good try!')}
                  </h4>
                  <p className="text-xs text-[var(--ink-2)] mt-0.5">
                    {isBn ? currentQ.explanationBn : currentQ.explanationEn}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedOpt !== currentQ.options.find((o) => o.correct)?.key && (
                  <button
                    onClick={() => {
                      setSelectedOpt(null);
                      setIsAnswered(false);
                      handlePlaySound();
                    }}
                    className="btn btn-ghost text-xs"
                  >
                    {isBn ? 'আবার চেষ্টা করো' : 'Try Again'}
                  </button>
                )}
                <button
                  onClick={handleNextQuestion}
                  className="btn btn-brass text-sm font-semibold flex items-center gap-1.5"
                >
                  <span>{currentIdx + 1 < questions.length ? (isBn ? 'পরের প্রশ্ন' : 'Next Question') : (isBn ? 'মজার ল্যাব পরীক্ষা' : 'Hands-on Lab')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Hands-on Interactive Lab: More Data = Faster Crackle! */
        <div className="glass panel p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--fire)]/20 border border-[var(--fire)]/40 text-[var(--fire)]">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-[var(--ink)]">
                {isBn ? 'বিজ্ঞানের রহস্য: বেশি ডেটা = দ্রুত শব্দ!' : 'The Science Rule: More Data = Faster Sound!'}
              </h3>
              <p className="text-sm text-[var(--ink-2)]">
                {isBn
                  ? 'স্লাইডারটি টেনে আগুনের শক্তি বাড়াও বা কমাও এবং শোনো কীভাবে পটপট শব্দের গতি বদলে যায়!'
                  : 'Slide to adjust Fire Radiative Power (MW) and hear how the crackle rate shifts!'}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--abyss)] border border-[var(--line)] flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--ink-3)] font-mono">
                {isBn ? 'আগুনের শক্তি (FRP):' : 'Fire Radiative Power (FRP):'}
              </span>
              <span className="font-semibold text-[var(--fire)] text-lg font-mono">
                {firePower} MW
              </span>
            </div>

            <input
              type="range"
              min="20"
              max="1000"
              step="20"
              value={firePower}
              onChange={(e) => handleExperimentSound(Number(e.target.value))}
              className="w-full accent-[var(--fire)] cursor-pointer"
              aria-label={isBn ? 'আগুনের শক্তি নিয়ন্ত্রণ' : 'Fire power slider'}
            />

            <div className="flex justify-between text-2xs text-[var(--ink-3)] font-mono">
              <span>{isBn ? 'ছোট আগুন (ধীর পটপট)' : '20 MW (Slow pop)'}</span>
              <span>{isBn ? 'ভয়ংকর দাবানল (উন্মাদ পটপট!)' : '1000 MW (Roaring sparks!)'}</span>
            </div>

            <div className="flex justify-center mt-2">
              <button
                onClick={() => handleExperimentSound(firePower)}
                className="btn btn-brass flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>{isBn ? 'আগুনের শব্দ বাজাও' : 'Test Fire Intensity'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs sm:text-sm leading-relaxed">
            💡 {isBn
              ? 'নাসার স্যাটেলাইটগুলো এভাবেই কাজ করে: যখনই কোথাও বন বা পাহাড়ে বড় আগুন লাগে, স্যাটেলাইটের ডেটা বেশি হয়, আর আমাদের শব্দ তত দ্রুত পটপট করতে থাকে!'
              : 'This is the core concept of Sonic Earth Atlas: Larger wildfires give higher NASA power values, making the crackle bursts fire much faster!'}
          </div>

          <div className="flex justify-end mt-2">
            <button
              onClick={onComplete}
              className="btn btn-brass text-base font-semibold px-6 py-3 flex items-center gap-2"
            >
              <span>{isBn ? 'লেভেল ১ সম্পন্ন! লেভেল ২-এ চলো' : 'Level 1 Complete! Go to Level 2'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
