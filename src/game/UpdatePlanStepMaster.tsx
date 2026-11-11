import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  Play,
  Volume2,
  Radio,
  Flame,
  CloudRain,
  Waves,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Compass,
  Sliders,
  Headphones,
  EyeOff,
  Clock,
} from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { usePrefs } from '../lib/prefs';

interface Props {
  onSelectMission: (missionId: number) => void;
  onOpenFreeRoam: () => void;
  onOpenDJ: () => void;
  onOpenLab: () => void;
  onOpenBadgeModal: () => void;
  onExploreGlobe: () => void;
  audioReady?: boolean;
  onSoundOn?: () => void;
}

export const UpdatePlanStepMaster: React.FC<Props> = ({
  onSelectMission,
  onOpenFreeRoam,
  onOpenDJ,
  onOpenLab,
  onOpenBadgeModal,
  onExploreGlobe,
  audioReady = false,
  onSoundOn,
}) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const [activeStep, setActiveStep] = useState<number>(1);
  const totalSteps = 7;

  // Interactive states for Step 4 (Formula demo)
  const [demoFrp, setDemoFrp] = useState<number>(350);
  const [demoRain, setDemoRain] = useState<number>(45);
  const [demoSst, setDemoSst] = useState<number>(1.8);

  // Interactive states for Step 5 (Time Travel 1981 vs 2025)
  const [timeTravelYear, setTimeTravelYear] = useState<'1981' | '2025'>('1981');
  const [isPlayingYear, setIsPlayingYear] = useState<boolean>(false);

  // Interactive states for Step 6 (Blind Mode voice & spatial)
  const [spokenMessage, setSpokenMessage] = useState<string>('');

  const ensureAudio = () => {
    if (!audioReady && onSoundOn) {
      onSoundOn();
    }
  };

  const handleSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isBn ? 'bn-BD' : 'en-US';
      utterance.rate = 1.0;
      setSpokenMessage(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const playTimeTravel = (year: '1981' | '2025') => {
    ensureAudio();
    setIsPlayingYear(true);
    setTimeTravelYear(year);

    if (year === '1981') {
      // Historical baseline: moderate temperature (G3 ~196Hz), steady rain
      audio.playPentatonicNote(196, 'triangle', 1.8);
      setTimeout(() => audio.playRain(0.35, 0, 2000), 400);
    } else {
      // 2025 observation: elevated thermal anomaly (G5 ~784Hz), volatile rain
      audio.playPentatonicNote(784, 'triangle', 1.8);
      setTimeout(() => audio.playRain(0.85, 0, 2000), 300);
    }

    setTimeout(() => setIsPlayingYear(false), 2400);
  };

  const stepsList = [
    {
      num: 1,
      titleEn: 'Mission Briefing & Authentic Science',
      titleBn: 'মিশন পরিচিতি ও আসল বিজ্ঞান',
      icon: <ShieldCheck className="w-4 h-4 text-[var(--signal)]" />,
    },
    {
      num: 2,
      titleEn: 'The 7 Explorer Game Modes',
      titleBn: '৭টি গেম ও এক্সপ্লোরার মোড',
      icon: <Sliders className="w-4 h-4 text-[var(--signal)]" />,
    },
    {
      num: 3,
      titleEn: '4 Playable NASA Missions',
      titleBn: '৪টি বাস্তব নাসা মিশন',
      icon: <Flame className="w-4 h-4 text-[var(--signal)]" />,
    },
    {
      num: 4,
      titleEn: 'Scientific Audio Legend & Live Badges',
      titleBn: 'সাউন্ড ফর্মুলা ও লাইভ ব্যাজ',
      icon: <Volume2 className="w-4 h-4 text-[var(--signal)]" />,
    },
    {
      num: 5,
      titleEn: 'Time Travel: 1981 vs 2025',
      titleBn: 'টাইম ট্রাভেল: ১৯৮১ বনাম ২০২৫',
      icon: <Clock className="w-4 h-4 text-[var(--signal)]" />,
    },
    {
      num: 6,
      titleEn: 'Blind Explorer & Spatial Audio',
      titleBn: 'দৃষ্টিপ্রতিবন্ধী মোড ও ৩ডি অডিও',
      icon: <EyeOff className="w-4 h-4 text-[var(--signal)]" />,
    },
    {
      num: 7,
      titleEn: 'Earth Sound Passport & Certification',
      titleBn: 'আর্থ সাউন্ড পাসপোর্ট ও সার্টিফিকেট',
      icon: <Award className="w-4 h-4 text-[var(--signal)]" />,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6" role="region" aria-label="Update Plan Step Master">
      {/* Stepper Navigation Header */}
      <div className="glass panel p-4 sm:p-5 rounded-lg border border-[var(--line)] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-3">
                        <div>
              <div className="inline-flex items-center gap-2 text-2xs uppercase tracking-widest text-[var(--signal)] font-semibold font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isBn ? 'মাস্টার আপডেট প্ল্যান' : 'Master Update Plan Roadmap'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--ink)]">
                {isBn ? 'সনিক আর্থ অ্যাডভেঞ্চার: স্টেপ-বাই-স্টেপ গাইড' : 'Sonic Earth Adventure: Step-by-Step Experience'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[var(--panel)] border border-[var(--line)] text-[var(--signal)]">
              {isBn ? `ধাপ ${activeStep} / ${totalSteps}` : `Step ${activeStep} of ${totalSteps}`}
            </span>
          </div>
        </div>

        {/* Step Tabs Row */}
        <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-2" role="tablist" aria-label="Steps">
          {stepsList.map((step) => {
            const isCurrent = activeStep === step.num;
            const isCompleted = activeStep > step.num;
            return (
              <button
                key={step.num}
                role="tab"
                aria-selected={isCurrent}
                onClick={() => setActiveStep(step.num)}
                className={`flex items-center gap-2 py-2 px-3 sm:px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  isCurrent
                    ? 'bg-[var(--signal)] text-[var(--on-signal)] border-[var(--signal)] '
                    : isCompleted
                    ? 'bg-[var(--panel)] text-[var(--ink)] border-[var(--hair)] hover:border-[var(--signal)]'
                    : 'bg-[var(--abyss)]/60 text-[var(--ink-3)] border-[var(--line)] hover:text-[var(--ink)]'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--signal)]" /> : step.icon}
                <span>{step.num}. {isBn ? step.titleBn : step.titleEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= STEP CONTENT PANELS ================= */}

      {/* STEP 1: Vision & Authentic Science */}
      {activeStep === 1 && (
        <div className="glass panel p-6 sm:p-8 rounded-lg border border-[var(--line)] flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--panel-2)] border border-[var(--hair)] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[var(--signal)]" />
            </div>
            <div>
              <span className="text-2xs font-mono text-[var(--signal)] uppercase font-semibold">
                NASA Space Apps Challenge 2026 · The Earth Information Jukebox
              </span>
              <h3 className="text-2xl font-display font-bold text-[var(--ink)] mt-0.5">
                {isBn ? 'ধাপ ১: বাস্তব নাসা ডেটা ও বৈজ্ঞানিক সাউনিফিকেশন' : 'Step 1: Authentic NASA Earth Science & Sonification'}
              </h3>
              <p className="text-sm text-[var(--ink-2)] mt-1.5 leading-relaxed max-w-3xl">
                {isBn
                  ? 'সনিক আর্থ অ্যাডভেঞ্চার কোনো কাল্পনিক খেলা নয়। এটি নাসার লাইভ স্যাটেলাইট এবং ঐতিহাসিক ক্লাইমেট মডেলের বাস্তব ডেটা ব্যবহার করে তৈরি। কোনো মনগড়া বা কৃত্রিম মান তৈরি করা হয় না—প্রতিটি সুরের পেছনে রয়েছে সুনির্দিষ্ট গাণিতিক সূত্র।'
                  : 'Sonic Earth Adventure is not a fictional simulator. It directly transforms genuine NASA satellite observations and historical climate models into sound using published mathematical mappings. Every sound is calculated from a real measurement; nothing is invented.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[var(--fire)]" />
                <span className="font-semibold text-xs text-[var(--ink)]">NASA FIRMS VIIRS</span>
              </div>
              <p className="text-2xs text-[var(--ink-2)]">
                {isBn ? '৩৭৫ মিটার রেজোলিউশনের ফায়ার রেডিয়েটিভ পাওয়ার (FRP)। আগুনের তেজ বাড়লে সাউন্ডের পিচ ও স্পার্ক বাড়ে।' : '375m active fire detection with Fire Radiative Power (MW). Panning matches geographic longitude.'}
              </p>
              <span className="chip border-[var(--hair)] text-[var(--signal)] text-2xs font-mono w-fit">[SNAPSHOT · 2–7 OCT 2026]</span>
            </div>

            <div className="p-4 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-[var(--rain)]" />
                <span className="font-semibold text-xs text-[var(--ink)]">NASA POWER</span>
              </div>
              <p className="text-2xs text-[var(--ink-2)]">
                {isBn ? '১৯৮১-২০২৫ সালের ৪৫ বছরের ঐতিহাসিক বৃষ্টিপাত ও তাপমাত্রা। ফোঁটার গতি দিয়ে বৃষ্টির তীব্রতা প্রকাশ পায়।' : '45-year precipitation models (mm/day). Droplet rhythm and impact pitch map directly to rain intensity.'}
              </p>
              <span className="chip border-[var(--hair)] text-[var(--signal)] text-2xs font-mono w-fit">[HISTORICAL BASELINE]</span>
            </div>

            <div className="p-4 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-[var(--teal)]" />
                <span className="font-semibold text-xs text-[var(--ink)]">JPL MUR SST</span>
              </div>
              <p className="text-2xs text-[var(--ink-2)]">
                {isBn ? 'জেট প্রোপালশন ল্যাবরেটরির সাগরের পৃষ্ঠের তাপমাত্রা অ্যানোমালি। গভীর বেস সুরে সাগরের তাপের রূপান্তর।' : 'Sea surface temperature anomalies. Modulates sub-bass drone and harmonic detune ratios.'}
              </p>
              <span className="chip border-[var(--hair)] text-[var(--signal)] text-2xs font-mono w-fit">[OBSERVATION MODEL]</span>
            </div>

            <div className="p-4 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[var(--signal)]" />
                <span className="font-semibold text-xs text-[var(--ink)]">NASA GISS GISTEMP</span>
              </div>
              <p className="text-2xs text-[var(--ink-2)]">
                {isBn ? '১৮৮০ থেকে বর্তমান পর্যন্ত ১৪০+ বছরের তাপমাত্রা পরিবর্তন। জি-পেন্টাটোনিক স্কেলে পৃথিবীর বৈশ্বিক সুর।' : '140-year instrumental temperature anomaly mapped to G-major pentatonic harmonic scales (G3 to G5).'}
              </p>
              <span className="chip border-[var(--hair)] text-[var(--signal)] text-2xs font-mono w-fit">[CLIMATOLOGY]</span>
            </div>
          </div>

          {/* Quick Mission Deploy Grid in Step 1 */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display font-bold text-sm text-[var(--ink)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--signal)]" />
              <span>{isBn ? 'নাসার ৪টি বৈজ্ঞানিক সাউন্ড মিশন:' : 'Four Authentic NASA Sound Missions:'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-[var(--panel)] border border-[var(--fire)]/40 flex flex-col justify-between gap-2">
                <div>
                  <span className="font-semibold text-xs text-[var(--ink)] block">Amazon Wildfire Extinguisher</span>
                  <span className="text-2xs text-[var(--ink-2)]">NASA FIRMS VIIRS (375m FRP)</span>
                </div>
                <button
                  onClick={() => onSelectMission(1)}
                  className="btn btn-brass text-2xs py-1.5 px-3 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <span>{isBn ? 'মিশন ১ শুরু' : 'Deploy Mission 1'}</span>
                  <Play className="w-3 h-3" />
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-[var(--panel)] border border-[var(--rain)]/40 flex flex-col justify-between gap-2">
                <div>
                  <span className="font-semibold text-xs text-[var(--ink)] block">Bengal Monsoon Flood Rescue</span>
                  <span className="text-2xs text-[var(--ink-2)]">NASA POWER Precipitation</span>
                </div>
                <button
                  onClick={() => onSelectMission(2)}
                  className="btn btn-brass text-2xs py-1.5 px-3 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <span>{isBn ? 'মিশন ২ শুরু' : 'Deploy Mission 2'}</span>
                  <Play className="w-3 h-3" />
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-[var(--panel)] border border-[var(--teal)]/40 flex flex-col justify-between gap-2">
                <div>
                  <span className="font-semibold text-xs text-[var(--ink)] block">Pacific Ocean Submarine Dive</span>
                  <span className="text-2xs text-[var(--ink-2)]">JPL MUR SST Thermal Anomalies</span>
                </div>
                <button
                  onClick={() => onSelectMission(3)}
                  className="btn btn-brass text-2xs py-1.5 px-3 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <span>{isBn ? 'মিশন ৩ শুরু' : 'Deploy Mission 3'}</span>
                  <Play className="w-3 h-3" />
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-[var(--panel)] border border-[var(--hair)] flex flex-col justify-between gap-2">
                <div>
                  <span className="font-semibold text-xs text-[var(--ink)] block">NASA Orbital Space Station</span>
                  <span className="text-2xs text-[var(--ink-2)]">Vital Signs & Climate Harmonizer</span>
                </div>
                <button
                  onClick={() => onSelectMission(4)}
                  className="btn btn-brass text-2xs py-1.5 px-3 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <span>{isBn ? 'মিশন ৪ শুরু' : 'Deploy Mission 4'}</span>
                  <Play className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Educational Disclaimer Banner */}
          <div className="p-4 rounded-lg bg-[var(--panel-2)] border border-[var(--hair)] flex items-start gap-3">
                        <div className="text-xs text-[var(--ink-2)]">
              <strong className="text-[var(--signal)] font-semibold">
                {isBn ? 'শিক্ষামূলক সিমুলেশন বিজ্ঞপ্তি: ' : 'Educational Simulation Notice: '}
              </strong>
              {isBn
                ? 'গেমের মধ্যে অগ্নিনির্বাপণ বা বন্যার উদ্ধারকার্য একটি শিক্ষামূলক সিমুলেশন। এটি নাসার ডেটা ব্যাখ্যা শেখার উদ্দেশ্যে তৈরি এবং বাস্তব জীবনের দুর্যোগ মোকাবিলার নির্দেশিকা নয়।'
                : 'In-game rescue challenges and water spraying interactions are educational simulations designed to train interpretation of satellite observations, not operational firefighting procedures.'}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: The 7 Game Modes */}
      {activeStep === 2 && (
        <div className="glass panel p-6 sm:p-8 rounded-lg border border-[var(--line)] flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--panel-2)] border border-[var(--hair)] flex items-center justify-center shrink-0">
              <Sliders className="w-6 h-6 text-[var(--signal)]" />
            </div>
            <div>
              <span className="text-2xs font-mono text-[var(--signal)] uppercase font-semibold">
                Universal Architecture · Everyone Can Play
              </span>
              <h3 className="text-2xl font-display font-bold text-[var(--ink)] mt-0.5">
                {isBn ? 'ধাপ ২: ৭টি এক্সপ্লোরার গেম মোড' : 'Step 2: The Seven Explorer Game Modes'}
              </h3>
              <p className="text-sm text-[var(--ink-2)] mt-1.5 leading-relaxed max-w-3xl">
                {isBn
                  ? 'শিশু, শিক্ষার্থী, সাধারণ ব্যবহারকারী কিংবা দৃষ্টিপ্রতিবন্ধী—সবার জন্য আলাদা কিন্তু বৈজ্ঞানিকভাবে সংযুক্ত ৭টি খেলার অভিজ্ঞতা।'
                  : 'Designed to cater to diverse audiences: children, science enthusiasts, visually impaired explorers, and creative remixers.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Mode 1 */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col justify-between gap-4 hover:border-[var(--signal)] transition">
              <div>
                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-sm text-[var(--ink)]">
                    {isBn ? '১. অ্যাডভেঞ্চার মোড' : '1. Adventure Mode'}
                  </h4>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? '৩ডি ইকো-নিনজা ক্যাডেট চরিত্র নিয়ে নাসার ৪টি বৈজ্ঞানিক মিশনে অংশ নিন। আগুন শনাক্ত করা ও বৃষ্টিপাত রেকর্ড করার শিক্ষামূলক মিশন।'
                    : 'Control 3D Eco-Ninja Cadet across 4 authentic NASA environmental missions with movement, jumping, and sound scanning.'}
                </p>
              </div>
              <button
                onClick={() => onSelectMission(1)}
                className="btn btn-brass text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer"
              >
                <span>{isBn ? 'মিশন শুরু করুন' : 'Launch Missions'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode 2 */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col justify-between gap-4 hover:border-[var(--signal)] transition">
              <div>
                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-sm text-[var(--ink)]">
                    {isBn ? '২. মুক্ত ভ্রমণ (Free Roam)' : '2. Free Roam Biomes'}
                  </h4>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? 'নির্দিষ্ট কোনো মিশন ছাড়াই নিজের ইচ্ছামতো বন, নদী, সমুদ্র ও মেরু অঞ্চলে হেঁটে বেড়ান এবং পরিবেশের আসল ডেটা শুনুন।'
                    : 'Freely explore Earth biomes without constraints. Scan coordinates and listen to localized climate frequencies.'}
                </p>
              </div>
              <button
                onClick={onOpenFreeRoam}
                className="btn btn-ghost border border-[var(--line)] text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer"
              >
                <span>{isBn ? 'মুক্ত ভ্রমণে যান' : 'Launch Free Roam'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode 3 */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col justify-between gap-4 hover:border-[var(--signal)] transition">
              <div>
                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-sm text-[var(--ink)]">
                    {isBn ? '৩. ব্লাইন্ড এক্সপ্লোরার (Sonic Adventure)' : '3. Blind Explorer Mode'}
                  </h4>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? 'চোখে না দেখেও ১০০% খেলা যায়। ৩ডি বাইনোরাল স্প্যাশিয়াল অডিও এবং ভয়েস গাইডেন্স ব্যবহার করে শব্দ শুনে অভিযান সম্পন্ন করুন।'
                    : '100% audio-first gaming. Directional binaural 3D beacons, natural language voice guidance, and keyboard-only controls.'}
                </p>
              </div>
              <button
                onClick={() => setActiveStep(6)}
                className="btn btn-ghost border border-[var(--hair)] text-[var(--signal)] text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer"
              >
                <span>{isBn ? 'ব্লাইন্ড মোড পরীক্ষা' : 'Test Blind Mode'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode 4 */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col justify-between gap-4 hover:border-[var(--signal)] transition">
              <div>
                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-sm text-[var(--ink)]">
                    {isBn ? '৪. আর্থ ডিজে স্টুডিও' : '4. Earth DJ Studio'}
                  </h4>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? 'নাসার বৃষ্টি, দাবানল ও সাগরের ডেটা লুপ একসঙ্গে মিক্স করে পৃথিবীর নিজস্ব মিউজিক কম্পোজ করুন এবং সেভ করুন।'
                    : 'Interactive 4-track scientific mixer. Balance rainfall, wildfires, ocean drones, and melodic chimes into audio compositions.'}
                </p>
              </div>
              <button
                onClick={onOpenDJ}
                className="btn btn-ghost border border-[var(--line)] text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer"
              >
                <span>{isBn ? 'ডিজে স্টুডিও খুলুন' : 'Open DJ Studio'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode 5 */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col justify-between gap-4 hover:border-[var(--signal)] transition">
              <div>
                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-sm text-[var(--ink)]">
                    {isBn ? '৫. সনিক কুইজ (Sound Detective)' : '5. Sonic Quiz / Lab'}
                  </h4>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? 'শুধু শব্দ শুনে চিহ্নিত করুন কোনটি আগুন, কোনটি বৃষ্টি বা কোনটি সমুদ্রের তাপ। বৈজ্ঞানিক শ্রবণশক্তি যাচাইয়ের কুইজ।'
                    : 'Ear-training scientific quiz. Listen to acoustic clips and classify the underlying NASA phenomenon correctly.'}
                </p>
              </div>
              <button
                onClick={onOpenLab}
                className="btn btn-ghost border border-[var(--line)] text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer"
              >
                <span>{isBn ? 'সায়েন্স ল্যাব কুইজ' : 'Open Science Lab'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode 6 & 7 */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col justify-between gap-4 hover:border-[var(--signal)] transition">
              <div>
                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-sm text-[var(--ink)]">
                    {isBn ? '৬ ও ৭. কিডস জোন ও ইনক্লুসিভ কো-অপ' : '6 & 7. Kids & Inclusive Co-op'}
                  </h4>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? 'শিশুদের জন্য সহজ মিশন এবং দুজন খেলোয়াড়ের সমন্বিত কো-অপ (একজন চোখে দেখে ম্যাপ চালাবে, অন্যজন শব্দ শুনে দিকনির্দেশনা দেবে)।'
                    : 'Kids Zone with 3-minute mini games + Two Players, One Earth (sighted navigator + blind acoustic specialist).'}
                </p>
              </div>
              <button
                onClick={() => setActiveStep(5)}
                className="btn btn-ghost border border-[var(--line)] text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer"
              >
                <span>{isBn ? 'পরবর্তী ফিচার দেখুন' : 'View Next Features'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 4 Authentic NASA Missions */}
      {activeStep === 3 && (
        <div className="glass panel p-6 sm:p-8 rounded-lg border border-[var(--line)] flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--panel-2)] border border-[var(--hair)] flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-[var(--signal)]" />
            </div>
            <div>
              <span className="text-2xs font-mono text-[var(--signal)] uppercase font-semibold">
                Authentic NASA Missions
              </span>
              <h3 className="text-2xl font-display font-bold text-[var(--ink)] mt-0.5">
                {isBn ? 'ধাপ ৩: ৪টি প্লেয়েবল নাসা মিশন' : 'Step 3: Four Playable NASA Data Missions'}
              </h3>
              <p className="text-sm text-[var(--ink-2)] mt-1.5 leading-relaxed max-w-3xl">
                {isBn
                  ? 'প্রতিটি মিশনে নাসার নির্দিষ্ট উপগ্রহ ও গবেষণা কেন্দ্রের বাস্তব ডেটাসেট ব্যবহার করা হয়েছে। শব্দ শুনে বিপদ শনাক্ত করুন ও সিদ্ধান্ত নিন।'
                  : 'Each mission is powered by a specific NASA satellite instrument. Players analyze acoustic indicators to complete challenges.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mission 1 */}
            <div className="p-5 rounded-lg border border-[var(--fire)]/50 flex flex-col justify-between gap-4 bg-[var(--panel)]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[var(--fire)]" />
                    <span className="font-display font-bold text-base text-[var(--ink)]">
                      {isBn ? 'মিশন ১: আমাজন দাবানল ট্র্যাকার' : 'Mission 1: Amazon Wildfire Extinguisher'}
                    </span>
                  </div>
                  <span className="chip text-2xs font-mono border-[var(--hair)] text-[var(--signal)]">FIRMS VIIRS</span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? 'আমাজন রেইনফরেস্টে আগুনের পটপট আওয়াজ শুনে হটস্পট শনাক্ত করুন। ওয়াটার ব্লাস্টার দিয়ে ড্রোন সিমুলেশন চালান।'
                    : 'Locate wildfire hotspots in the Amazon basin using crackling audio frequency cues and operate a simulated containment drone.'}
                </p>
              </div>
              <button
                onClick={() => onSelectMission(1)}
                className="btn btn-brass text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isBn ? 'মিশন ১ খেলুন' : 'Deploy Mission 1'}</span>
              </button>
            </div>

            {/* Mission 2 */}
            <div className="p-5 rounded-lg border border-[var(--rain)]/50 flex flex-col justify-between gap-4 bg-[var(--panel)]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-5 h-5 text-[var(--rain)]" />
                    <span className="font-display font-bold text-base text-[var(--ink)]">
                      {isBn ? 'মিশন ২: বাংলা বর্ষা প্লাবন উদ্ধার' : 'Mission 2: Bengal Monsoon Flood Rescue'}
                    </span>
                  </div>
                  <span className="chip text-2xs font-mono border-[var(--hair)] text-[var(--signal)]">NASA POWER</span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? 'সিলেট ও চট্টগ্রাম অঞ্চলে বৃষ্টির ফোঁটার শব্দ রেকর্ড করুন এবং ভেলা নিয়ে নিরাপদ উদ্ধারপথ নির্বাচন করুন।'
                    : 'Measure heavy monsoon rainfall across Sylhet and Chattogram deltas, record precipitation metrics, and chart safe rescue paths.'}
                </p>
              </div>
              <button
                onClick={() => onSelectMission(2)}
                className="btn btn-brass text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isBn ? 'মিশন ২ খেলুন' : 'Deploy Mission 2'}</span>
              </button>
            </div>

            {/* Mission 3 */}
            <div className="p-5 rounded-lg border border-[var(--teal)]/50 flex flex-col justify-between gap-4 bg-[var(--panel)]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-[var(--teal)]" />
                    <span className="font-display font-bold text-base text-[var(--ink)]">
                      {isBn ? 'মিশন ৩: প্রশান্ত মহাসাগর সাবমেরিন ডাইভ' : 'Mission 3: Pacific Ocean Submarine Dive'}
                    </span>
                  </div>
                  <span className="chip text-2xs font-mono border-[var(--hair)] text-[var(--signal)]">JPL MUR SST</span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? 'সাবমেরিন চালিয়ে সাগরের গভীর তাপমাত্রা মাপুন এবং সোনার পিং দিয়ে থার্মাল অ্যানোমালি শনাক্ত করুন।'
                    : 'Pilot an oceanographic submarine into deep trenches, fire sonar pings, and track sea surface temperature warming anomalies.'}
                </p>
              </div>
              <button
                onClick={() => onSelectMission(3)}
                className="btn btn-brass text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isBn ? 'মিশন ৩ খেলুন' : 'Deploy Mission 3'}</span>
              </button>
            </div>

            {/* Mission 4 */}
            <div className="p-5 rounded-lg border border-[var(--signal)] flex flex-col justify-between gap-4 bg-[var(--panel)]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-[var(--signal)]" />
                    <span className="font-display font-bold text-base text-[var(--ink)]">
                      {isBn ? 'মিশন ৪: মহাকাশ স্যাটেলাইট কন্ট্রোল স্টেশন' : 'Mission 4: NASA Orbital Space Station (Harmonizer)'}
                    </span>
                  </div>
                  <span className="chip text-2xs font-mono border-[var(--hair)] text-[var(--signal)]">GISTEMP & Vital Signs</span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? 'পৃথিবীর চারপাশের ৪টি স্যাটেলাইট বিম টিউন করে ১৪০ বছরের ক্লাইমেট সুর মহাকাশে সম্প্রচার করুন।'
                    : 'Align 4 orbital observation beams with Earth and calibrate multi-spectral planetary frequencies to complete graduation.'}
                </p>
              </div>
              <button
                onClick={() => onSelectMission(4)}
                className="btn btn-brass text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isBn ? 'মিশন ৪ খেলুন' : 'Deploy Mission 4'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Scientific Audio Legend & Live Verification */}
      {activeStep === 4 && (
        <div className="glass panel p-6 sm:p-8 rounded-lg border border-[var(--line)] flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--panel-2)] border border-[var(--hair)] flex items-center justify-center shrink-0">
              <Volume2 className="w-6 h-6 text-[var(--signal)]" />
            </div>
            <div>
              <span className="text-2xs font-mono text-[var(--signal)] uppercase font-semibold">
                Transparent Sonification Engine
              </span>
              <h3 className="text-2xl font-display font-bold text-[var(--ink)] mt-0.5">
                {isBn ? 'ধাপ ৪: সাউন্ড লেজেন্ড ও লাইভ ভেরিফিকেশন' : 'Step 4: Scientific Audio Legend & Verification Matrix'}
              </h3>
              <p className="text-sm text-[var(--ink-2)] mt-1.5 leading-relaxed max-w-3xl">
                {isBn
                  ? 'প্রতিটি শব্দ কেন তৈরি হচ্ছে তার সুনির্দিষ্ট সূত্র রয়েছে। নিচে স্লাইডার পরিবর্তন করে লাইভ সাউন্ড পরীক্ষা করুন।'
                  : 'Every sound has an exact mathematical foundation. Adjust the parameters below to hear the deterministic frequency shifts live.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Fire Formula Demo */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--fire)]/40 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-[var(--ink)] flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-[var(--fire)]" />
                    {isBn ? 'দাবানল (Fire FRP)' : 'Fire Radiative Power'}
                  </span>
                  <span className="font-mono text-xs text-[var(--signal)]">{demoFrp} MW</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--ground)]/40 font-mono text-2xs text-[var(--ink-2)] border border-[var(--line)] mb-3">
                  f = 800 + 2200 × log10(1 + FRP/800) Hz
                </div>
                <label className="text-2xs text-[var(--ink-3)] block mb-1">
                  {isBn ? 'আগুনের তীব্রতা পরিবর্তন করুন:' : 'Adjust Fire Intensity:'}
                </label>
                <input
                  type="range"
                  min="20"
                  max="800"
                  value={demoFrp}
                  onChange={(e) => setDemoFrp(Number(e.target.value))}
                  className="w-full accent-[var(--fire)] cursor-pointer"
                />
              </div>
              <button
                onClick={() => {
                  ensureAudio();
                  audio.playFire(demoFrp / 800, 0, 2200);
                }}
                className="btn btn-ghost border border-[var(--fire)]/50 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--fire)]/10"
              >
                <Play className="w-3.5 h-3.5 text-[var(--fire)]" />
                <span>{isBn ? 'সাউন্ড শুনুন' : 'Test Fire Sound'}</span>
              </button>
            </div>

            {/* Rain Formula Demo */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--rain)]/40 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-[var(--ink)] flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-[var(--rain)]" />
                    {isBn ? 'বৃষ্টিপাত (Rain mm/day)' : 'Precipitation Rate'}
                  </span>
                  <span className="font-mono text-xs text-[var(--signal)]">{demoRain} mm</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--ground)]/40 font-mono text-2xs text-[var(--ink-2)] border border-[var(--line)] mb-3">
                  N_drops = 2 + 18 × √(Rain / 100)
                </div>
                <label className="text-2xs text-[var(--ink-3)] block mb-1">
                  {isBn ? 'বৃষ্টির পরিমাণ পরিবর্তন করুন:' : 'Adjust Rainfall Rate:'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={demoRain}
                  onChange={(e) => setDemoRain(Number(e.target.value))}
                  className="w-full accent-[var(--rain)] cursor-pointer"
                />
              </div>
              <button
                onClick={() => {
                  ensureAudio();
                  audio.playRain(demoRain / 100, 0, 2200);
                }}
                className="btn btn-ghost border border-[var(--rain)]/50 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--rain)]/10"
              >
                <Play className="w-3.5 h-3.5 text-[var(--rain)]" />
                <span>{isBn ? 'সাউন্ড শুনুন' : 'Test Rain Sound'}</span>
              </button>
            </div>

            {/* Ocean Heat Demo */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--teal)]/40 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-[var(--ink)] flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-[var(--teal)]" />
                    {isBn ? 'সাগরের তাপ (SST Anomaly)' : 'Ocean SST Anomaly'}
                  </span>
                  <span className="font-mono text-xs text-[var(--signal)]">+{demoSst}°C</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--ground)]/40 font-mono text-2xs text-[var(--ink-2)] border border-[var(--line)] mb-3">
                  f = 110 × 2^(ΔT / 3.0) Hz Sub-bass
                </div>
                <label className="text-2xs text-[var(--ink-3)] block mb-1">
                  {isBn ? 'তাপমাত্রা পরিবর্তন করুন:' : 'Adjust Temperature Delta:'}
                </label>
                <input
                  type="range"
                  min="-2"
                  max="3"
                  step="0.1"
                  value={demoSst}
                  onChange={(e) => setDemoSst(Number(e.target.value))}
                  className="w-full accent-[var(--teal)] cursor-pointer"
                />
              </div>
              <button
                onClick={() => {
                  ensureAudio();
                  audio.playOcean(demoSst / 3.0, 0, 2400);
                }}
                className="btn btn-ghost border border-[var(--teal)]/50 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--teal)]/10"
              >
                <Play className="w-3.5 h-3.5 text-[var(--teal)]" />
                <span>{isBn ? 'সাউন্ড শুনুন' : 'Test Ocean Sound'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Time Travel: 1981 vs 2025 */}
      {activeStep === 5 && (
        <div className="glass panel p-6 sm:p-8 rounded-lg border border-[var(--line)] flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--panel-2)] border border-[var(--hair)] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-[var(--signal)]" />
            </div>
            <div>
              <span className="text-2xs font-mono text-[var(--signal)] uppercase font-semibold">
                Earth Sound Comparison Studio
              </span>
              <h3 className="text-2xl font-display font-bold text-[var(--ink)] mt-0.5">
                {isBn ? 'ধাপ ৫: টাইম ট্রাভেল — ১৯৮১ বনাম ২০২৫ সালের শব্দ' : 'Step 5: Time Travel — Hear Earth in 1981 vs 2025'}
              </h3>
              <p className="text-sm text-[var(--ink-2)] mt-1.5 leading-relaxed max-w-3xl">
                {isBn
                  ? 'শুধু চার্ট দেখে নয়, ৪৪ বছরের ব্যবধানে পৃথিবীর পরিবর্তন কানে শুনে অনুভব করুন। ১৯৮১ সালের স্বাভাবিক সুর বনাম ২০২৫ সালের উষ্ণায়নের তীব্র সুর।'
                  : 'Instead of just examining graphs, hear multi-decade climate shifts through acoustic pitch deltas (Δf) and precipitation rhythm volatility.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 1981 Card */}
            <div
              className={`p-6 rounded-lg border transition flex flex-col justify-between gap-4 ${
                timeTravelYear === '1981'
                  ? 'border-[var(--signal)] bg-[var(--panel)]'
                  : 'bg-[var(--abyss)]/60 border-[var(--line)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-xl text-[var(--signal)]">1981 Baseline</span>
                  <span className="chip border-[var(--hair)] text-[var(--signal)] text-2xs font-mono">Historical Record</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-[var(--ink-2)]">
                  <div>Global Anomaly: <strong className="text-[var(--ink)]">+0.12°C</strong></div>
                  <div>Acoustic Pitch: <strong className="text-[var(--ink)]">G3 (196 Hz)</strong></div>
                  <div>Rain Volatility: <strong className="text-[var(--ink)]">Standard seasonal cadence</strong></div>
                </div>
              </div>
              <button
                onClick={() => playTimeTravel('1981')}
                disabled={isPlayingYear}
                className="btn btn-ghost border border-[var(--signal)] text-[var(--signal)] text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--panel-2)]"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isBn ? '১৯৮১ সালের সাউন্ড শুনুন' : 'Hear Earth in 1981'}</span>
              </button>
            </div>

            {/* 2025 Card */}
            <div
              className={`p-6 rounded-lg border transition flex flex-col justify-between gap-4 ${
                timeTravelYear === '2025'
                  ? 'border-[var(--signal)] bg-[var(--panel)]'
                  : 'bg-[var(--abyss)]/60 border-[var(--line)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-xl text-[var(--signal)]">2025 Current</span>
                  <span className="chip border-[var(--hair)] text-[var(--signal)] text-2xs font-mono">Near-Real-Time</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-[var(--ink-2)]">
                  <div>Global Anomaly: <strong className="text-[var(--signal)]">+1.28°C</strong></div>
                  <div>Acoustic Pitch: <strong className="text-[var(--signal)]">G5 (784 Hz) — High Pitch</strong></div>
                  <div>Rain Volatility: <strong className="text-[var(--signal)]">Accelerated droplet clusters (+42%)</strong></div>
                </div>
              </div>
              <button
                onClick={() => playTimeTravel('2025')}
                disabled={isPlayingYear}
                className="btn btn-brass text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isBn ? '২০২৫ সালের সাউন্ড শুনুন' : 'Hear Earth in 2025'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--abyss)]/90 border border-[var(--line)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                            <div>
                <h4 className="font-semibold text-xs text-[var(--ink)]">
                  {isBn ? 'অ্যাকোস্টিক ডেল্টা (Acoustic Delta Δf): +588 Hz' : 'Acoustic Delta Shift: +588 Hz (2 Octaves Up)'}
                </h4>
                <p className="text-2xs text-[var(--ink-2)]">
                  {isBn
                    ? 'তাপমাত্রা বৃদ্ধির ফলে সুরের কম্পাঙ্ক উল্লেখযোগ্যভাবে বৃদ্ধি পেয়েছে, যা যে কেউ খালি কানে শুনেই বুঝতে পারবে।'
                    : 'The pitch transition demonstrates measurable long-term atmospheric warming that is audibly obvious without looking.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Blind Explorer & Spatial Audio */}
      {activeStep === 6 && (
        <div className="glass panel p-6 sm:p-8 rounded-lg border border-[var(--line)] flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--panel-2)] border border-[var(--hair)] flex items-center justify-center shrink-0">
              <EyeOff className="w-6 h-6 text-[var(--signal)]" />
            </div>
            <div>
              <span className="text-2xs font-mono text-[var(--signal)] uppercase font-semibold">
                True Blind-First Accessibility Architecture
              </span>
              <h3 className="text-2xl font-display font-bold text-[var(--ink)] mt-0.5">
                {isBn ? 'ধাপ ৬: দৃষ্টিপ্রতিবন্ধী মোড ও ৩ডি স্প্যাশিয়াল অডিও' : 'Step 6: Blind Explorer Mode & 3D Spatial Audio'}
              </h3>
              <p className="text-sm text-[var(--ink-2)] mt-1.5 leading-relaxed max-w-3xl">
                {isBn
                  ? 'একজন দৃষ্টিপ্রতিবন্ধী ব্যবহারকারী যেন স্ক্রিন না দেখেও হেডফোনে শব্দের দিক ও অবস্থান শুনে পুরো ওয়েবসাইট এবং গেম খেলতে পারেন।'
                  : 'Empowers visually impaired explorers to navigate using binaural 3D panning (HRTF), screen reader semantics, and spoken feedback.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Spatial Audio Direction Test */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[var(--signal)]" />
                <h4 className="font-semibold text-xs text-[var(--ink)]">
                  {isBn ? 'হেডফোনে ৩ডি স্প্যাশিয়াল অডিও টেস্ট' : '3D Binaural Spatial Audio Test'}
                </h4>
              </div>
              <p className="text-2xs text-[var(--ink-2)]">
                {isBn
                  ? 'হেডফোন পরে নিচের বাটনগুলোতে ক্লিক করে বাম, মধ্যম বা ডান দিকের শব্দ পরীক্ষা করুন:'
                  : 'Wear headphones and test directional audio beacons (West = Left, Prime Meridian = Center, East = Right):'}
              </p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => {
                    ensureAudio();
                    audio.playTone(320, -0.9, 1400);
                  }}
                  className="btn btn-ghost border border-[var(--line)] text-2xs py-2 px-2 rounded-lg text-center cursor-pointer hover:border-[var(--signal)]"
                >
                  ◀ {isBn ? 'বাম কান (-90°)' : 'Left Ear (-90°)'}
                </button>
                <button
                  onClick={() => {
                    ensureAudio();
                    audio.playTone(440, 0, 1400);
                  }}
                  className="btn btn-ghost border border-[var(--line)] text-2xs py-2 px-2 rounded-lg text-center cursor-pointer hover:border-[var(--signal)]"
                >
                  ▲ {isBn ? 'সামনে (0°)' : 'Center (0°)'}
                </button>
                <button
                  onClick={() => {
                    ensureAudio();
                    audio.playTone(580, 0.9, 1400);
                  }}
                  className="btn btn-ghost border border-[var(--line)] text-2xs py-2 px-2 rounded-lg text-center cursor-pointer hover:border-[var(--signal)]"
                >
                  {isBn ? 'ডান কান (+90°)' : 'Right Ear (+90°)'} ▶
                </button>
              </div>
            </div>

            {/* Voice Guidance Test */}
            <div className="p-5 rounded-lg bg-[var(--abyss)]/80 border border-[var(--line)] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-4 h-4 text-[var(--signal)]" />
                  <h4 className="font-semibold text-xs text-[var(--ink)]">
                    {isBn ? 'ন্যাচারাল ভয়েস গাইডেন্স (Web Speech API)' : 'Spoken NASA Data Narration'}
                  </h4>
                </div>
                <p className="text-2xs text-[var(--ink-2)]">
                  {isBn
                    ? 'নাসার ডেটা পড়ে শোনানোর বাংলা ও ইংরেজি ভয়েস টেস্ট:'
                    : 'Hear spoken summaries of the real data:'}
                </p>
              </div>
              <button
                onClick={() => {
                  const msg = isBn
                    ? 'আপনি বাংলাদেশের আবহাওয়ার তথ্য শুনছেন। দৈনিক গড় বৃষ্টিপাত ১৪.২ মিলিমিটার, যা ঐতিহাসিক গড়ের চেয়ে ২.৩ মিলিমিটার বেশি।'
                    : 'You are inspecting Bangladesh climate data. Daily rainfall is 14.2 millimeters, which is 2.3 mm above the 45-year baseline.';
                  handleSpeak(msg);
                }}
                className="btn btn-brass text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isBn ? 'ভয়েস গাইডেন্স চালান' : 'Speak NASA Data Summary'}</span>
              </button>
              {spokenMessage && (
                <p className="text-2xs font-mono text-[var(--signal)] bg-[var(--ground)]/40 p-2 rounded-lg border border-[var(--line)]" role="status">
                  "{spokenMessage}"
                </p>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Matrix */}
          <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--line)] flex flex-col gap-2">
            <span className="font-semibold text-xs text-[var(--ink)]">
              {isBn ? 'কীবোর্ড নেভিগেশন চার্ট (মাউস ছাড়া খেলা):' : 'Keyboard Accessibility Control Matrix:'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs text-[var(--ink-2)]">
              <div><kbd className="px-1.5 py-0.5 rounded bg-[var(--abyss)] font-mono text-[var(--ink)]">Tab</kbd> : {isBn ? 'পরবর্তী অপশন' : 'Next Control'}</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-[var(--abyss)] font-mono text-[var(--ink)]">Space</kbd> : {isBn ? 'সাউন্ড প্লে / পজ' : 'Play / Pause Sound'}</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-[var(--abyss)] font-mono text-[var(--ink)]">H</kbd> : {isBn ? 'ভয়েস হেল্প' : 'Voice Help'}</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-[var(--abyss)] font-mono text-[var(--ink)]">M</kbd> : {isBn ? 'মিশন তথ্য' : 'Mission Status'}</div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: Earth Sound Passport & Certification */}
      {activeStep === 7 && (
        <div className="glass panel p-6 sm:p-8 rounded-lg border border-[var(--line)] flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--panel-2)] border border-[var(--hair)] flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-[var(--signal)]" />
            </div>
            <div>
              <span className="text-2xs font-mono text-[var(--signal)] uppercase font-semibold">
                Verifiable Learning Credential
              </span>
              <h3 className="text-2xl font-display font-bold text-[var(--ink)] mt-0.5">
                {isBn ? 'ধাপ ৭: আর্থ সাউন্ড পাসপোর্ট ও সার্টিফিকেট' : 'Step 7: Earth Sound Passport & Graduation'}
              </h3>
              <p className="text-sm text-[var(--ink-2)] mt-1.5 leading-relaxed max-w-3xl">
                {isBn
                  ? 'মিশন সম্পন্ন করলে খেলোয়াড় একটি ভেরিফায়েবল ডিজিটাল পাসপোর্ট ও নাসার সার্টিফিকেট অর্জন করে, যেখানে তার শেখা সব বৈজ্ঞানিক ডেটার প্রমাণ থাকে।'
                  : 'Completing missions earns an official verifiable Earth Sound Passport certifying mastered NASA satellite datasets and acoustic comprehension.'}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-lg border-2 border-[var(--signal)]/60 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[var(--panel)]">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg p-0.5 border-2 border-[var(--signal)] flex items-center justify-center overflow-hidden shrink-0 bg-[var(--panel)]">
                <img src="/images/ninja_cadet_avatar.png" alt="Sonic Eco-Ninja Cadet" className="w-full h-full object-cover rounded-[14px]" />
              </div>
              <div>
                <span className="chip border-[var(--signal)] text-[var(--signal)] text-2xs font-mono font-semibold">
                  OFFICIAL CADET CREDENTIAL
                </span>
                <h4 className="font-display font-bold text-lg text-[var(--ink)] mt-1">
                  {isBn ? 'সনিক আর্থ ক্যাডেট পাসপোর্ট' : 'Sonic Earth Cadet Passport'}
                </h4>
                <p className="text-xs text-[var(--ink-2)] mt-0.5 font-mono">
                  VERIFIED HASH: #SEAP-2026-NASA-VALIDATED
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onOpenBadgeModal}
                className="btn btn-brass text-xs font-semibold py-3 px-5 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer hover:scale-105"
              >
                <Award className="w-4 h-4" />
                <span>{isBn ? 'সার্টিফিকেট ও ব্যাজ দেখুন' : 'View Official Certificate'}</span>
              </button>

              <button
                onClick={onExploreGlobe}
                className="btn btn-ghost border border-[var(--line)] text-xs font-semibold py-3 px-5 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[var(--signal)]" />
                <span>{isBn ? '৩ডি গ্লোব অন্বেষণ' : 'Launch 3D Globe'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Navigation Footer Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
          disabled={activeStep === 1}
          className={`btn btn-ghost border border-[var(--line)] text-xs py-2.5 px-4 rounded-lg flex items-center gap-2 ${
            activeStep === 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--ink)]'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isBn ? 'পূর্ববর্তী ধাপ' : 'Previous Step'}</span>
        </button>

        <span className="text-xs text-[var(--ink-3)] font-mono">
          {activeStep} / {totalSteps}
        </span>

        {activeStep < totalSteps ? (
          <button
            onClick={() => setActiveStep((prev) => Math.min(totalSteps, prev + 1))}
            className="btn btn-brass text-xs py-2.5 px-5 rounded-lg flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <span>{isBn ? 'পরবর্তী ধাপ' : 'Next Step'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => onSelectMission(1)}
            className="btn btn-brass text-xs py-2.5 px-5 rounded-lg flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <span>{isBn ? 'গেম শুরু করুন (Mission 1)' : 'Start Game (Deploy Mission 1)'}</span>
            <Play className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
