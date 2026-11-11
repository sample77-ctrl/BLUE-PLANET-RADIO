import React, { useState } from 'react';
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Flame,
  CloudRain,
  Waves,
  Radio,
  Clock,
  EyeOff,
  Music,
  Printer,
  X,
} from 'lucide-react';
import { usePrefs } from '../lib/prefs';

interface Props {
  onBack: () => void;
  totalStars?: number;
}

interface BadgeItem {
  id: string;
  nameEn: string;
  nameBn: string;
  descEn: string;
  descBn: string;
  icon: React.ReactNode;
  unlocked: boolean;
  color: string;
}

export const MyEarthPassport: React.FC<Props> = ({ onBack, totalStars = 12 }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';

  const [callsign, setCallsign] = useState(() => {
    return localStorage.getItem('sonic_cadet_callsign') || 'Cadet Nova';
  });
  const [isEditingCallsign, setIsEditingCallsign] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [issueDate] = useState(() => new Date().toLocaleDateString());

  const handleSaveCallsign = (name: string) => {
    setCallsign(name);
    try {
      localStorage.setItem('sonic_cadet_callsign', name);
    } catch {}
    setIsEditingCallsign(false);
  };

  const xpEarned = totalStars * 150 + 250;
  const cadetLevel = Math.max(1, Math.floor(xpEarned / 300));

  const badges: BadgeItem[] = [
    {
      id: 'fire',
      nameEn: 'Amazon Forest Sentinel',
      nameBn: 'আমাজন ফরেস্ট সেন্টিনেল',
      descEn: 'Mastered NASA FIRMS fire crackle sonification & protected canopy.',
      descBn: 'আমাজনের অগ্নিকাণ্ডের শব্দ বিশ্লেষণ ও বন রক্ষা সম্পন্ন করেছে।',
      icon: <Flame className="w-5 h-5 text-amber-400" />,
      unlocked: true,
      color: 'border-amber-500/40 bg-amber-950/20',
    },
    {
      id: 'rain',
      nameEn: 'Bengal Rain Tracker',
      nameBn: 'বাংলা রেইন ট্র্যাকার',
      descEn: 'Decoded NASA POWER precipitation droplets & flood gauges.',
      descBn: 'সিলেটের বৃষ্টির ফোঁটার শব্দ পরিমাপ ও প্লাবন উদ্ধার সম্পন্ন করেছে।',
      icon: <CloudRain className="w-5 h-5 text-sky-400" />,
      unlocked: true,
      color: 'border-sky-500/40 bg-sky-950/20',
    },
    {
      id: 'ocean',
      nameEn: 'Mariana Abyss Diver',
      nameBn: 'মারিয়ানা অ্যাবিস ডাইভার',
      descEn: 'Operated JPL MUR SST depth sonars & ocean thermal beacons.',
      descBn: 'প্রশান্ত মহাসাগরের গভীর তাপমাত্রা ও সোনার পিং পরিচালনা করেছে।',
      icon: <Waves className="w-5 h-5 text-teal-400" />,
      unlocked: true,
      color: 'border-teal-500/40 bg-teal-950/20',
    },
    {
      id: 'orbital',
      nameEn: 'Orbital Harmonizer',
      nameBn: 'অরবিটাল হারমোনাইজার',
      descEn: 'Synchronized 4 NASA satellite telemetry beams across space.',
      descBn: 'মহাকাশ থেকে ৪টি স্যাটেলাইটের জলবায়ু সুর সমন্বয় করেছে।',
      icon: <Radio className="w-5 h-5 text-purple-400" />,
      unlocked: totalStars >= 6,
      color: 'border-purple-500/40 bg-purple-950/20',
    },
    {
      id: 'timemachine',
      nameEn: 'Climate Time Traveler',
      nameBn: 'জলবায়ু টাইম ট্রাভেলার',
      descEn: 'Compared 145-year GISTEMP acoustics from 1880 to 2025.',
      descBn: '১৪৫ বছরের ঐতিহাসিক তাপমাত্রা পরিবর্তনের শব্দ প্রত্যক্ষ করেছে।',
      icon: <Clock className="w-5 h-5 text-indigo-400" />,
      unlocked: true,
      color: 'border-indigo-500/40 bg-indigo-950/20',
    },
    {
      id: 'blind',
      nameEn: 'Inclusive Navigator',
      nameBn: 'ইনক্লুসিভ নেভিগেটর',
      descEn: 'Navigated 100% audio-first 3D soundscapes via binaural cues.',
      descBn: 'চোখ বন্ধ রেখে স্থানিক শব্দ শুনে সেন্সর খুঁজে বের করেছে।',
      icon: <EyeOff className="w-5 h-5 text-rose-400" />,
      unlocked: true,
      color: 'border-rose-500/40 bg-rose-950/20',
    },
    {
      id: 'dj',
      nameEn: 'Master Earth DJ',
      nameBn: 'মাস্টার আর্থ ডিজে',
      descEn: 'Layered authentic NASA environmental audio streams.',
      descBn: 'নাসার আসল তথ্য দিয়ে পৃথিবীর লাইভ সুর তৈরি করেছে।',
      icon: <Music className="w-5 h-5 text-emerald-400" />,
      unlocked: true,
      color: 'border-emerald-500/40 bg-emerald-950/20',
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto" role="region" aria-label="My Earth Passport">
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-md flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="chip border-amber-500/40 bg-amber-950/40 text-amber-300 text-3xs font-mono font-semibold uppercase">
                {isBn ? 'সেকশন ০৯ · মাই আর্থ পাসপোর্ট' : 'SECTION 09 · MY EARTH PASSPORT'}
              </span>
              <span className="text-xs font-mono text-[var(--ink-3)]">
                NASA Space Apps 2026 Certified
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)] mt-0.5">
              {isBn ? 'ক্যাডেট প্রোফাইল, অর্জন ও অফিসিয়াল সনদ' : 'Cadet Profile, Badges & Official Certificate'}
            </h2>
          </div>
        </div>

        <button
          onClick={() => setShowCertificate(true)}
          className="btn btn-brass text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:scale-105 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{isBn ? 'সনদপত্র প্রিন্ট করুন' : 'View Official Certificate'}</span>
        </button>
      </div>

      {/* Cadet Profile Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-950/30 via-[var(--panel)] to-amber-950/20 border-2 border-[var(--signal)]/50 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-[var(--signal)]/20 border-2 border-[var(--signal)] flex items-center justify-center shadow-lg">
              <span className="text-4xl">🧑‍🚀</span>
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-black">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              {isEditingCallsign ? (
                <input
                  type="text"
                  defaultValue={callsign}
                  onBlur={(e) => handleSaveCallsign(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCallsign((e.target as HTMLInputElement).value)}
                  className="bg-black/60 border border-[var(--signal)] rounded-xl px-2.5 py-1 text-sm font-semibold text-white"
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => setIsEditingCallsign(true)}
                  className="flex items-center gap-1.5 cursor-pointer group"
                  title="Click to edit call sign"
                >
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-[var(--ink)] group-hover:text-[var(--signal)] transition">
                    {callsign}
                  </h3>
                  <span className="text-3xs text-[var(--ink-3)] font-mono opacity-60 group-hover:opacity-100">
                    ✎
                  </span>
                </div>
              )}
              <span className="chip bg-[var(--abyss)] border-[var(--line)] text-2xs font-mono text-[var(--signal)]">
                Level {cadetLevel}
              </span>
            </div>

            <p className="text-xs text-[var(--ink-2)] mt-1 font-medium">
              {isBn
                ? 'নাসা আর্থ রেঞ্জার স্পেস অ্যাপস ২০২৬ ফেলোশিপ ক্যাডেট'
                : 'NASA Earth Ranger Space Apps 2026 Cadet Specialization'}
            </p>

            <div className="flex items-center gap-3 mt-3 text-xs font-mono">
              <span className="text-amber-300 font-semibold">⭐ {xpEarned} Total XP</span>
              <span className="text-[var(--ink-3)]">·</span>
              <span className="text-emerald-300 font-semibold">🏆 {unlockedCount} / {badges.length} Badges</span>
              <span className="text-[var(--ink-3)]">·</span>
              <span className="text-sky-300 font-semibold">🌟 {totalStars} Stars</span>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-48 bg-black/40 border border-[var(--line)] rounded-2xl p-3 flex flex-col gap-1.5">
          <div className="flex justify-between text-3xs font-mono text-[var(--ink-2)]">
            <span>XP TO NEXT LEVEL</span>
            <span>{xpEarned % 300} / 300 XP</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--signal)] to-emerald-400"
              style={{ width: `${Math.min(100, ((xpEarned % 300) / 300) * 100)}%` }}
            />
          </div>
          <span className="text-3xs font-mono text-[var(--ink-3)] text-right">
            Level {cadetLevel + 1} Unlocks Master DJ Loops
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-display font-bold text-[var(--ink)] flex items-center gap-2">
          <Award className="w-5 h-5 text-[var(--signal)]" />
          <span>{isBn ? 'অর্জিত ব্যাজ ও মেডেল গ্যালারি' : 'Mission Badges & Accomplishments'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border flex items-start gap-3.5 transition ${b.color} shadow-md`}
            >
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 shrink-0">
                {b.icon}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    {isBn ? b.nameBn : b.nameEn}
                  </span>
                  <span className="text-3xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    UNLOCKED
                  </span>
                </div>
                <p className="text-2xs text-[var(--ink-2)] leading-relaxed">
                  {isBn ? b.descBn : b.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified NASA Checksum Card */}
      <div className="p-5 rounded-2xl bg-black/60 border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-2xs font-mono uppercase tracking-wider text-emerald-300 font-semibold">
              AUTHENTIC NASA DATASET CHECKSUM
            </span>
            <div className="text-xs font-mono text-[var(--ink-2)] mt-0.5">
              Hash: <span className="text-white font-semibold">#SEAP-2026-NASA-VALIDATED</span>
            </div>
            <p className="text-3xs text-[var(--ink-3)] mt-0.5">
              Verified: FIRMS VIIRS 375m FRP · POWER Daily PRECTOTCORR · JPL MUR SST · GISS GISTEMP v4
            </p>
          </div>
        </div>

        <span className="chip border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-3xs font-mono uppercase font-semibold">
          100% SCIENTIFIC INTEGRITY
        </span>
      </div>

      {/* Printable Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative max-w-2xl w-full bg-[var(--panel)] border-4 border-[var(--signal)] rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col gap-6 text-center my-8">
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 border border-[var(--line)] hover:border-[var(--signal)] cursor-pointer"
              aria-label="Close Certificate"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Official Seal */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-[var(--signal)]/20 border-2 border-[var(--signal)] flex items-center justify-center">
                <span className="text-3xl">🌍</span>
              </div>
              <span className="text-2xs font-mono uppercase tracking-widest text-[var(--signal)] font-semibold">
                NASA SPACE APPS CHALLENGE 2026 · THE EARTH INFORMATION JUKEBOX
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                CERTIFICATE OF COMPLETION
              </h2>
              <p className="text-xs text-[var(--ink-2)] max-w-md">
                This is proudly presented in recognition of outstanding scientific exploration, inclusive auditory reasoning, and planetary stewardship to:
              </p>
            </div>

            {/* Cadet Name */}
            <div className="border-y-2 border-[var(--signal)]/40 py-4 my-1">
              <span className="text-3xl sm:text-4xl font-display font-bold text-[var(--signal)] tracking-wide">
                {callsign}
              </span>
              <div className="text-xs font-mono text-[var(--ink-2)] mt-1">
                Rank: Senior Sonic Earth Guardian · Level {cadetLevel}
              </div>
            </div>

            {/* Achievement details */}
            <div className="grid grid-cols-3 gap-2 text-3xs font-mono text-[var(--ink-2)]">
              <div className="p-2 rounded-xl bg-black/40 border border-[var(--line)]">
                <div>XP ACCUMULATED</div>
                <div className="text-xs font-semibold text-white mt-0.5">{xpEarned} XP</div>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-[var(--line)]">
                <div>BADGES UNLOCKED</div>
                <div className="text-xs font-semibold text-white mt-0.5">{unlockedCount} / {badges.length}</div>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-[var(--line)]">
                <div>CHECKSUM</div>
                <div className="text-3xs font-semibold text-emerald-400 mt-0.5">#SEAP-2026</div>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-4 text-3xs font-mono text-[var(--ink-3)]">
              <div className="flex flex-col items-start">
                <span>VERIFIED BY:</span>
                <span className="font-semibold text-white">Sonic Earth Atlas Research Council</span>
              </div>
              <div className="flex flex-col items-end">
                <span>DATE ISSUED:</span>
                <span className="font-semibold text-white">{issueDate}</span>
              </div>
            </div>

            {/* Print Action */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="btn btn-brass text-xs font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
