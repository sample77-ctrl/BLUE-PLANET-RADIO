import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  CloudRain,
  Waves,
} from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { usePrefs } from '../lib/prefs';

interface Props {
  onBack: () => void;
  onOpenPassport?: () => void;
  onExploreGlobe?: () => void;
}

type DifficultyTier = 'beginner' | 'explorer' | 'advanced';

interface KidsQuizItem {
  id: number;
  tier: DifficultyTier;
  questionEn: string;
  questionBn: string;
  hintEn: string;
  hintBn: string;
  audioTrigger: (audio: GameAudioEngine) => void;
  options: {
    key: string;
    textEn: string;
    textBn: string;
    icon: React.ReactNode;
    isCorrect: boolean;
  }[];
  explanationEn: string;
  explanationBn: string;
}

export const KidsLearningZone: React.FC<Props> = ({
  onBack,
  onOpenPassport: _onOpenPassport,
  onExploreGlobe: _onExploreGlobe,
}) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const [activeTier, setActiveTier] = useState<DifficultyTier>('beginner');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [speechActive, setSpeechActive] = useState(false);

  const quizPool: KidsQuizItem[] = [
    {
      id: 1,
      tier: 'beginner',
      questionEn: 'Sound Detective: Listen closely! Which nature sound is Earth singing right now?',
      questionBn: 'সাউন্ড ডিটেকটিভ: মন দিয়ে শোনো! পৃথিবী এখন প্রকৃতির কোন সুর গাইছে?',
      hintEn: 'It sounds like crisp water droplets falling from a cloud onto a leaf!',
      hintBn: 'মেঘ থেকে পাতার ওপর টুপটুপ করে মিষ্টি পানির ফোঁটা ঝরছে!',
      audioTrigger: (a) => a.playRain(0.65, 0, 2500),
      options: [
        { key: 'rain', textEn: 'Monsoon Rain (বৃষ্টি)', textBn: 'বৃষ্টির ফোঁটা (Monsoon Rain)', icon: <CloudRain className="w-4 h-4 text-sky-400" />, isCorrect: true },
        { key: 'fire', textEn: 'Wildfire (দাবানল)', textBn: 'দাবানল (Wildfire)', icon: <Flame className="w-4 h-4 text-amber-400" />, isCorrect: false },
        { key: 'ocean', textEn: 'Deep Ocean (সাগর)', textBn: 'সাগর (Deep Ocean)', icon: <Waves className="w-4 h-4 text-teal-400" />, isCorrect: false },
      ],
      explanationEn: 'Correct! NASA POWER satellites measure daily rainfall in millimeters. The droplet rhythm speeds up when downpours get heavier!',
      explanationBn: 'একদম সঠিক! নাসার POWER স্যাটেলাইট প্রতিদিনের বৃষ্টিপাত মাপে। বেশি বৃষ্টি হলে ফোঁটার আওয়াজ দ্রুত বাজে!',
    },
    {
      id: 2,
      tier: 'beginner',
      questionEn: 'Wildfire Detective: Can you identify this crackling sound captured from space?',
      questionBn: 'ওয়াইল্ডফায়ার ডিটেকটিভ: মহাকাশ থেকে ধরা এই পটপট শব্দটিকে কীসের সংকেত?',
      hintEn: 'It sounds like dry twigs and leaves sparking in heat!',
      hintBn: 'শুকনো ডালপালা আর পাতা রোদে পুড়ে পটপট আওয়াজ হচ্ছে!',
      audioTrigger: (a) => a.playFire(0.7, 0, 2500),
      options: [
        { key: 'wind', textEn: 'Gentle Wind (বাতাস)', textBn: 'বাতাস (Gentle Wind)', icon: <Sparkles className="w-4 h-4 text-slate-300" />, isCorrect: false },
        { key: 'fire', textEn: 'Active Wildfire (দাবানল)', textBn: 'সক্রিয় দাবানল (Active Wildfire)', icon: <Flame className="w-4 h-4 text-amber-400" />, isCorrect: true },
        { key: 'ocean', textEn: 'Ocean Wave (ঢেউ)', textBn: 'সাগরের ঢেউ (Ocean Wave)', icon: <Waves className="w-4 h-4 text-teal-400" />, isCorrect: false },
      ],
      explanationEn: 'Awesome! NASA FIRMS VIIRS satellites measure Fire Radiative Power (MW). High heat produces dense crackles!',
      explanationBn: 'দারুণ! নাসার FIRMS স্যাটেলাইট আগুনের তেজ বা ফায়ার রেডিয়েটিভ পাওয়ার মাপে, যা এমন পটপট শব্দ তৈরি করে!',
    },
    {
      id: 3,
      tier: 'explorer',
      questionEn: 'Ocean Explorer: This deep resonant hum is coming from the Pacific. What does it mean?',
      questionBn: 'ওশান এক্সপ্লোরার: প্রশান্ত মহাসাগর থেকে এই গম্ভীর সুরটি আসছে। এর অর্থ কী?',
      hintEn: 'It is a low sub-bass drone that rises in pitch as water gets warmer.',
      hintBn: 'এটি একটি গভীর বেস সুর, যা পানি যত গরম হয় তত উপরে ওঠে।',
      audioTrigger: (a) => a.playOcean(0.7, 0, 2800),
      options: [
        { key: 'ocean', textEn: 'Sea Surface Warmth (সমুদ্রের তাপ)', textBn: 'সমুদ্রের উষ্ণতা (Sea Warmth)', icon: <Waves className="w-4 h-4 text-teal-400" />, isCorrect: true },
        { key: 'thunder', textEn: 'Lightning Thunder (বজ্রপাত)', textBn: 'বজ্রপাত (Thunder)', icon: <Sparkles className="w-4 h-4 text-amber-300" />, isCorrect: false },
        { key: 'rain', textEn: 'Light Drizzle (গুঁড়ি বৃষ্টি)', textBn: 'গুঁড়ি বৃষ্টি (Light Drizzle)', icon: <CloudRain className="w-4 h-4 text-sky-400" />, isCorrect: false },
      ],
      explanationEn: 'Super job! JPL MUR Sea Surface Temperature anomalies are mapped to low vibrating bass frequencies.',
      explanationBn: 'অসাধারণ! নাসা JPL-এর সমুদ্রের তাপমাত্রার তারতম্যকে গভীর বেস ফ্রিকোয়েন্সিতে প্রকাশ করা হয়।',
    },
    {
      id: 4,
      tier: 'advanced',
      questionEn: 'Climate Detective: Earth’s 140-year temperature melody is playing. What do higher musical notes indicate?',
      questionBn: 'ক্লাইমেট ডিটেকটিভ: পৃথিবীর ১৪০ বছরের সুর বাজছে। সুরের উচ্চ কম্পাঙ্ক (High Pitch) কী প্রকাশ করে?',
      hintEn: 'Listen to the musical pitch. As temperatures rise above the baseline, the pitch climbs higher.',
      hintBn: 'সুরটি শোনো। তাপমাত্রা যত বাড়ে, সুরের পর্দা তত উপরে ওঠে।',
      audioTrigger: (a) => a.playPentatonicNote(784, 'triangle', 1.8),
      options: [
        { key: 'cold', textEn: 'Colder Glaciers (হিমবাহ ঠান্ডা)', textBn: 'হিমবাহ ঠান্ডা হচ্ছে', icon: <Sparkles className="w-4 h-4 text-blue-300" />, isCorrect: false },
        { key: 'warm', textEn: 'Atmospheric Warming (বায়ুমণ্ডলের উষ্ণায়ন)', textBn: 'বায়ুমণ্ডলের উষ্ণায়ন (Warming)', icon: <Flame className="w-4 h-4 text-red-400" />, isCorrect: true },
        { key: 'rain', textEn: 'Heavy Rainfall (ভারী বর্ষণ)', textBn: 'ভারী বর্ষণ (Heavy Rain)', icon: <CloudRain className="w-4 h-4 text-sky-400" />, isCorrect: false },
      ],
      explanationEn: 'Brilliant! NASA GISTEMP records map warming anomalies to the G-pentatonic scale, shifting up to G5 (784 Hz).',
      explanationBn: 'চমৎকার! নাসা GISTEMP ডেটা অনুযায়ী তাপমাত্রা বৃদ্ধি পেলে সুরের স্কেল উপরে উঠে G5 (784 Hz) পর্যন্ত পৌঁছায়।',
    },
  ];

  const currentQuestions = quizPool.filter((q) => q.tier === activeTier || activeTier === 'beginner');
  const activeQ = currentQuestions[currentIdx % currentQuestions.length];

  const handlePlaySound = () => {
    activeQ.audioTrigger(audio);
  };

  const handleSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isBn ? 'bn-BD' : 'en-US';
      setSpeechActive(true);
      utterance.onend = () => setSpeechActive(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectOption = (key: string, isCorrect: boolean) => {
    if (showFeedback) return;
    setSelectedKey(key);
    setShowFeedback(true);

    if (isCorrect) {
      audio.playSuccess();
      setScore((s) => s + 10);
    } else {
      audio.playBoop();
    }
  };

  const handleNext = () => {
    setSelectedKey(null);
    setShowFeedback(false);
    setCurrentIdx((prev) => (prev + 1) % currentQuestions.length);
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto" role="region" aria-label="Kids Learning Zone">
      {/* Header Banner */}
      <div className="glass panel p-5 rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-[var(--panel)] to-cyan-950/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="btn btn-ghost p-2 rounded-xl border border-[var(--line)] cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center">
            <span className="text-2xl">🧒</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="chip border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-3xs font-mono font-semibold uppercase">
                {isBn ? 'কিডস লার্নিং জোন' : 'KIDS LEARNING ZONE'}
              </span>
              <span className="text-xs font-mono font-semibold text-amber-300">
                ⭐ {score} XP Earned
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)] mt-0.5">
              {isBn ? 'সাউন্ড ডিটেকটিভ ও আর্থ সায়েন্স অ্যাডভেঞ্চার' : 'Sound Detective & Earth Science Adventures'}
            </h2>
          </div>
        </div>

        {/* Difficulty Tier Selector (3 Tiers: Beginner, Explorer, Advanced) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-[var(--line)]">
          {(['beginner', 'explorer', 'advanced'] as DifficultyTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => {
                setActiveTier(tier);
                setCurrentIdx(0);
                setShowFeedback(false);
                setSelectedKey(null);
              }}
              className={`text-2xs font-semibold py-1.5 px-3 rounded-xl transition cursor-pointer capitalize ${
                activeTier === tier
                  ? 'bg-emerald-500 text-black font-semibold shadow-md'
                  : 'text-[var(--ink-2)] hover:text-white'
              }`}
            >
              {tier === 'beginner' ? '🌟 Beginner' : tier === 'explorer' ? '🚀 Explorer' : '🔬 Advanced'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Quiz Card */}
      <div className="glass panel p-6 sm:p-8 rounded-3xl border border-[var(--line)] flex flex-col gap-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-[var(--abyss)] text-[var(--brass)] border border-[var(--line)]">
              {isBn ? `চ্যালেঞ্জ #${(currentIdx % currentQuestions.length) + 1}` : `Challenge #${(currentIdx % currentQuestions.length) + 1}`}
            </span>
            <span className="text-xs text-[var(--ink-3)] font-mono">
              Ages 8–14 · No Penalties
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSpeak(isBn ? activeQ.questionBn : activeQ.questionEn)}
              className="btn btn-ghost text-xs border border-[var(--line)] py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className={`w-3.5 h-3.5 ${speechActive ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span>{isBn ? 'প্রশ্নটি শুনুন' : 'Read to Me'}</span>
            </button>
          </div>
        </div>

        {/* Question Text */}
        <h3 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)] leading-snug">
          {isBn ? activeQ.questionBn : activeQ.questionEn}
        </h3>

        {/* Play Mystery Audio Button */}
        <div className="p-4 rounded-2xl bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--ink)] block">
                {isBn ? 'নাসার আসল অডিও ক্লিপ' : 'Authentic NASA Acoustic Clip'}
              </span>
              <p className="text-2xs text-[var(--ink-3)]">
                {isBn ? activeQ.hintBn : activeQ.hintEn}
              </p>
            </div>
          </div>

          <button
            onClick={handlePlaySound}
            className="btn btn-brass shrink-0 text-xs font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md hover:scale-105"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isBn ? 'শব্দ শুনুন (Play Sound)' : 'Play Nature Sound'}</span>
          </button>
        </div>

        {/* Multiple Choice Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {activeQ.options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleSelectOption(opt.key, opt.isCorrect)}
                disabled={showFeedback}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  showFeedback && opt.isCorrect
                    ? 'bg-emerald-950/40 border-emerald-400 text-emerald-200'
                    : showFeedback && isSelected && !opt.isCorrect
                    ? 'bg-red-950/40 border-red-400 text-red-200'
                    : isSelected
                    ? 'bg-[var(--brass)] text-black font-semibold border-[var(--brass)]'
                    : 'bg-[var(--abyss)]/60 border-[var(--line)] hover:border-[var(--brass)] text-[var(--ink)]'
                }`}
              >
                <div className="p-2 rounded-xl bg-black/40 shrink-0">
                  {opt.icon}
                </div>
                <span className="text-xs font-semibold">
                  {isBn ? opt.textBn : opt.textEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Positive Explanation Feedback */}
        {showFeedback && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-[var(--panel)] border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-emerald-300">
                  {selectedKey === activeQ.options.find((o) => o.isCorrect)?.key
                    ? isBn ? '🎉 চমৎকার! সঠিক উত্তর!' : '🎉 Great job! Correct Answer!'
                    : isBn ? '💡 ভালো চেষ্টা! সঠিক তথ্যটি শিখে নাও:' : '💡 Good try! Here is what NASA tells us:'}
                </span>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn ? activeQ.explanationBn : activeQ.explanationEn}
                </p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="btn btn-brass shrink-0 text-xs font-semibold py-2.5 px-5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105"
            >
              <span>{isBn ? 'পরবর্তী চ্যালেঞ্জ' : 'Next Challenge'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
