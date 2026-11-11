import React from 'react';
import {
  Sparkles,
  Play,
  EyeOff,
  ArrowRight,
  Settings,
  Compass,
} from 'lucide-react';
import { usePrefs } from '../lib/prefs';

interface Props {
  onStartAdventure: () => void;
  onOpenHub: () => void;
  onOpenMissions: () => void;
  onOpenExplorer: () => void;
  onOpenBlindMode: () => void;
  onOpenKidsZone: () => void;
  onOpenDJ: () => void;
  onOpenTimeMachine: () => void;
  onOpenPassport: () => void;
  onOpenSettings: () => void;
  onOpenCoop: () => void;
  onOpenStepGuide: () => void;
  totalStars: number;
}

export const GameHome: React.FC<Props> = ({
  onStartAdventure,
  onOpenHub,
  onOpenMissions,
  onOpenExplorer,
  onOpenBlindMode,
  onOpenKidsZone,
  onOpenDJ,
  onOpenTimeMachine,
  onOpenPassport,
  onOpenSettings,
  onOpenCoop,
  onOpenStepGuide,
  totalStars,
}) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';

  const cadetRank =
    totalStars >= 12
      ? isBn ? 'লেজেন্ডারি আর্থ গার্ডিয়ান' : 'Legendary Earth Guardian'
      : totalStars >= 8
      ? isBn ? 'সনিক মাস্টার ক্যাডেট' : 'Sonic Master Cadet'
      : totalStars >= 4
      ? isBn ? 'জুনিয়র আর্থ রেঞ্জার' : 'Junior Earth Ranger'
      : isBn ? 'নতুন অভিযাত্রী' : 'Rookie Cadet';

  return (
    <div className="w-full flex flex-col gap-8 max-w-5xl mx-auto" role="region" aria-label="Game Home">
      {/* Hero Banner: 3D Animated Earth Sphere + Brand Identity */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[var(--signal)]/50 bg-gradient-to-br from-blue-950/40 via-[var(--panel)] to-amber-950/30 p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 text-2xs uppercase tracking-widest text-[var(--signal)] font-semibold font-mono mx-auto md:mx-0">
            <Sparkles className="w-4 h-4" />
            <span>NASA Space Apps 2026 · The Earth Information Jukebox</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-bold text-[var(--ink)] tracking-tight leading-tight">
            SONIC EARTH <span className="text-[var(--signal)]">ADVENTURE</span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--ink-2)] max-w-xl font-medium">
            {isBn
              ? 'পৃথিবীকে শুধু দেখা নয়, শব্দ শুনে অনুভব করো। নাসার বাস্তব স্যাটেলাইট ডেটা ও ৩ডি গেমপ্লে দিয়ে গড়ে তোলো আগামীর পৃথিবী।'
              : '"Hear the Earth. Explore the Planet. Save Our Future." Experience real NASA satellite observations transformed into interactive sound and 3D gameplay.'}
          </p>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
            <button
              onClick={onStartAdventure}
              className="btn btn-brass text-sm sm:text-base font-semibold px-7 py-3 rounded-2xl flex items-center gap-2 shadow-xl hover:scale-105 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isBn ? 'অ্যাডভেঞ্চার শুরু করুন' : 'Start Adventure'}</span>
            </button>

            <button
              onClick={onOpenStepGuide}
              className="btn btn-ghost border border-[var(--signal)]/60 text-xs sm:text-sm font-semibold px-5 py-3 rounded-2xl flex items-center gap-2 cursor-pointer hover:bg-[var(--signal)]/10"
            >
              <Sparkles className="w-4 h-4 text-[var(--signal)]" />
              <span>{isBn ? '🌟 আপডেট প্ল্যান (ধাপে ধাপে)' : '🌟 Step-by-Step Guide'}</span>
            </button>

            <button
              onClick={onOpenBlindMode}
              className="btn btn-ghost border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl flex items-center gap-1.5 cursor-pointer hover:bg-rose-950/20"
            >
              <EyeOff className="w-4 h-4 text-rose-400" />
              <span>{isBn ? 'ব্লাইন্ড মোড' : 'Blind Mode'}</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="btn btn-ghost border border-[var(--line)] text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl flex items-center gap-1.5 cursor-pointer hover:border-[var(--signal)]"
            >
              <Settings className="w-4 h-4 text-teal-400" />
              <span>{isBn ? 'সেটিংস' : 'Settings'}</span>
            </button>
          </div>
        </div>

        {/* Tactical Mission Thumbnail / Character Avatar */}
        <div className="relative shrink-0 flex flex-col items-center gap-3">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-emerald-600 via-amber-400 to-cyan-500 p-1 shadow-2xl border-2 border-[var(--signal)] flex items-center justify-center overflow-hidden">
            <img
              src="/images/game/nasa_satellite_drone_mesh.jpg"
              alt="NASA Satellite Drone Mesh"
              className="w-full h-full object-cover rounded-[22px] hover:scale-105 transition duration-500"
            />
          </div>
          <div className="text-center">
            <span className="chip border-[var(--signal)] text-[var(--signal)] text-3xs font-mono font-semibold">
              {cadetRank}
            </span>
            <div className="text-xs font-mono font-semibold text-[var(--ink)] mt-1">
              ⭐ {totalStars} / 12 Stars Earned
            </div>
          </div>
        </div>
      </div>

      {/* 10 Core Game Sections Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
          <h2 className="text-lg font-display font-bold text-[var(--ink)] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[var(--signal)]" />
            <span>{isBn ? 'গেমের ১০টি মূল সেকশন' : 'The Ten Game Sections'}</span>
          </h2>
          <span className="text-xs text-[var(--ink-3)] font-mono">
            {isBn ? 'যেকোনো সেকশনে ক্লিক করুন' : 'Click to launch any section'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Section 02: Adventure Hub */}
          <div
            onClick={onOpenHub}
            className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--signal)] transition cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">🗺️</span>
                <h3 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-[var(--signal)] transition">
                  {isBn ? '০২. অ্যাডভেঞ্চার হাব (Adventure Hub)' : '02. Adventure Hub'}
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {isBn
                  ? '৩ডি গ্লোবে বিভিন্ন বায়োম ও অঞ্চল নির্বাচন করুন। সোনিক ক্যাডেট চরিত্র নিয়ে মুক্তভাবে হেঁটে পরিবেশের ডেটা স্ক্যান করুন।'
                  : 'Explore 3D Earth biomes, navigate regions, and roam freely with Sonic Cadet scanning real-time environmental frequencies.'}
              </p>
            </div>
            <span className="text-2xs font-semibold text-[var(--signal)] flex items-center gap-1">
              <span>{isBn ? 'হাবে প্রবেশ করুন' : 'Launch Hub'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>

          {/* Section 03: Mission Center */}
          <div
            onClick={onOpenMissions}
            className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--fire)] transition cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">🔥</span>
                <h3 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-amber-400 transition">
                  {isBn ? '০৩. মিশন সেন্টার (Mission Center)' : '03. Mission Center'}
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {isBn
                  ? '৪টি বাস্তব নাসা মিশন: আমাজন দাবানল ট্যাকটিক্যাল রেসকিউ, বাংলা বর্ষা প্লাবন, প্রশান্ত মহাসাগর সাবমেরিন ও অরবিটাল সিম্ফনি।'
                  : '4 NASA data missions: Tactical Wildfire Command, Bengal Monsoon Rescue, Pacific Ocean Submarine, and Orbital Harmonizer.'}
              </p>
            </div>
            <span className="text-2xs font-semibold text-amber-400 flex items-center gap-1">
              <span>{isBn ? 'মিশন খেলুন' : 'Deploy Missions'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>

          {/* Section 04: Earth Explorer */}
          <div
            onClick={onOpenExplorer}
            className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-cyan-400 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">🌐</span>
                <h3 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-cyan-400 transition">
                  {isBn ? '০৪. আর্থ এক্সপ্লোরার (Earth Explorer)' : '04. Earth Explorer'}
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {isBn
                  ? 'নাসার Earth Information Center (EIC) ভিজ্যুয়াল ফ্রেমের সাথে রিয়েল-টাইম ডায়নামিক সাউনিফিকেশনের সংযোগ।'
                  : 'Interactive 3D Earth paired with Earth Information Center (EIC) visual frames and real-time mathematical sonification.'}
              </p>
            </div>
            <span className="text-2xs font-semibold text-cyan-400 flex items-center gap-1">
              <span>{isBn ? '৩ডি গ্লোব এক্সপ্লোর' : 'Open Explorer'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>

          {/* Section 05: Blind Explorer Mode */}
          <div
            onClick={onOpenBlindMode}
            className="p-5 rounded-2xl bg-[var(--panel)] border border-rose-500/30 hover:border-rose-400 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">🎧</span>
                <h3 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-rose-400 transition">
                  {isBn ? '০৫. ব্লাইন্ড এক্সপ্লোরার মোড' : '05. Blind Explorer Mode'}
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {isBn
                  ? 'দৃষ্টিপ্রতিবন্ধীদের জন্য ১০০% অডিও-ফার্স্ট গেমপ্লে। ৩ডি স্প্যাশিয়াল অডিও, ভয়েস গাইডেন্স এবং কীবোর্ড নেভিগেশন।'
                  : 'True audio-first gaming. 3D spatial audio beacons, natural language spoken navigation, and keyboard-only controls.'}
              </p>
            </div>
            <span className="text-2xs font-semibold text-rose-400 flex items-center gap-1">
              <span>{isBn ? 'অডিও মিশন খেলুন' : 'Audio-First Mode'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>

          {/* Section 06: Kids Learning Zone */}
          <div
            onClick={onOpenKidsZone}
            className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-emerald-400 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">🧒</span>
                <h3 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-emerald-400 transition">
                  {isBn ? '০৬. কিডস লার্নিং জোন' : '06. Kids Learning Zone'}
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {isBn
                  ? '৮-১৪ বছর বয়সী শিশুদের জন্য ৩টি সহজ স্তর, সাউন্ড ডিটেকটিভ কুইজ, বন্ধুত্বপূর্ণ ভয়েস নির্দেশনা ও নো-পেনাল্টি লার্নিং।'
                  : 'Ages 8–14. 3 difficulty tiers (Beginner, Explorer, Advanced), Sound Detective quiz, and zero-failure learning.'}
              </p>
            </div>
            <span className="text-2xs font-semibold text-emerald-400 flex items-center gap-1">
              <span>{isBn ? 'কিডস জোনে যান' : 'Enter Kids Zone'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>

          {/* Section 07: Earth DJ Studio */}
          <div
            onClick={onOpenDJ}
            className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-purple-400 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">🎛️</span>
                <h3 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-purple-400 transition">
                  {isBn ? '০৭. আর্থ ডিজে স্টুডিও' : '07. Earth DJ Studio'}
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {isBn
                  ? 'নাসার বৃষ্টি, দাবানল ও সাগরের ডেটা লুপ মিক্স করে পৃথিবীর নিজস্ব সুর কম্পোজ করুন এবং স্পেকট্রাম ভিজ্যুয়ালাইজারে দেখুন।'
                  : 'Interactive 4-track remix desk. Balance precipitation rhythms, wildfire crackles, and ocean sub-bass drones.'}
              </p>
            </div>
            <span className="text-2xs font-semibold text-purple-400 flex items-center gap-1">
              <span>{isBn ? 'সাউন্ড মিক্স করুন' : 'Open DJ Studio'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>

          {/* Section 08: Earth Time Machine */}
          <div
            onClick={onOpenTimeMachine}
            className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-indigo-400 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">⏳</span>
                <h3 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-indigo-400 transition">
                  {isBn ? '০৮. আর্থ টাইম মেশিন (1981 vs 2025)' : '08. Earth Time Machine'}
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {isBn
                  ? '১৯৮১ সালের ঐতিহাসিক সুর বনাম ২০২৫ সালের ক্লাইমেট পরিবর্তন। অ্যাকোস্টিক পিচ শিফট (Δf) কানে শুনে তুলনা করুন।'
                  : 'Listen to multi-decade climate shifts between 1981 baseline and 2025 observations through acoustic pitch deltas.'}
              </p>
            </div>
            <span className="text-2xs font-semibold text-indigo-400 flex items-center gap-1">
              <span>{isBn ? 'টাইম ট্রাভেল করুন' : 'Launch Time Travel'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>

          {/* Section 09: My Earth Passport */}
          <div
            onClick={onOpenPassport}
            className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-amber-400 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">🛂</span>
                <h3 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-amber-400 transition">
                  {isBn ? '০৯. মাই আর্থ পাসপোর্ট' : '09. My Earth Passport'}
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {isBn
                  ? 'প্লেয়ারের অর্জিত ব্যাজ, XP, সম্পূর্ণ মিশন হিস্ট্রি এবং নাসা ডেটাসেটের যাচাইকৃত ডিজিটাল সার্টিফিকেট।'
                  : 'Track earned badges, level progression, and verifiable learning credentials backed by authentic NASA metadata.'}
              </p>
            </div>
            <span className="text-2xs font-semibold text-amber-400 flex items-center gap-1">
              <span>{isBn ? 'পাসপোর্ট দেখুন' : 'View Passport'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>

          {/* Section 10: Settings & Inclusive Co-op */}
          <div
            onClick={onOpenCoop}
            className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-teal-400 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">🤝</span>
                <h3 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-teal-400 transition">
                  {isBn ? '১০. ইনক্লুসিভ কো-অপ (Two Players)' : '10. Inclusive Co-op & Settings'}
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {isBn
                  ? 'একজন দেখতে পাওয়া নেভিগেটর এবং একজন শুনতে পাওয়া অডিও বিশেষজ্ঞ মিলে একসঙ্গে খেলুন। সাথে সম্পূর্ণ অ্যাক্সেসিবিলিটি সেটিংস।'
                  : 'Two Players, One Earth: Sighted navigator + blind audio specialist collaborate to solve planetary missions.'}
              </p>
            </div>
            <span className="text-2xs font-semibold text-teal-400 flex items-center gap-1">
              <span>{isBn ? 'কো-অপ মোড' : 'Launch Co-op'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
