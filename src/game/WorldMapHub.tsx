import React from 'react';
import { Sparkles, Award, Play, CheckCircle2, Lock } from 'lucide-react';
import { usePrefs } from '../lib/prefs';

export interface MissionInfo {
  id: number;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  descEn: string;
  descBn: string;
  icon: React.ReactNode;
  bgGradient: string;
  borderColor: string;
  accentColor: string;
  unlocked: boolean;
  stars: number; // 0 to 3
  nasaData: string;
}

interface Props {
  missions: MissionInfo[];
  onSelectMission: (id: number) => void;
  onOpenBadgeModal: () => void;
  totalStars: number;
}

export const WorldMapHub: React.FC<Props> = ({ missions, onSelectMission, onOpenBadgeModal, totalStars }) => {
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
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Top Profile & Rank Bar */}
      <div className="glass panel p-5 rounded-3xl border border-[var(--line)] flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-amber-400 to-emerald-400 p-0.5 shadow-xl border-2 border-[var(--brass)] flex items-center justify-center overflow-hidden shrink-0">
            <img src="/images/ninja_cadet_avatar.png" alt="Sonic Eco-Ninja Cadet" className="w-full h-full object-cover rounded-[14px]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)]">
                {isBn ? 'ইকো-নিনজা ক্যাডেট পাইপ' : 'Eco-Ninja Cadet Pip'}
              </h2>
              <span className="chip border-[var(--brass)] text-[var(--brass)] text-2xs font-semibold">
                {cadetRank}
              </span>
            </div>
            <p className="text-xs text-[var(--ink-2)] mt-0.5">
              {isBn
                ? 'নাসা স্পেস অ্যাপস ২০২৬ · সোনিক আর্থ রেঞ্জার হেডকোয়ার্টার'
                : 'NASA Space Apps 2026 · Sonic Earth Ranger HQ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-2.5 px-4 rounded-2xl bg-[var(--abyss)] border border-[var(--line)]">
            <Sparkles className="w-5 h-5 text-[var(--brass)] animate-spin" />
            <div className="flex flex-col">
              <span className="text-2xs font-mono text-[var(--ink-3)] uppercase">{isBn ? 'মোট স্টার' : 'Total Stars'}</span>
              <span className="text-base font-semibold font-mono text-[var(--brass)]">{totalStars} / 12 ⭐</span>
            </div>
          </div>

          <button
            onClick={onOpenBadgeModal}
            className="btn btn-brass py-2.5 px-4 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-md cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>{isBn ? 'সার্টিফিকেট' : 'Badges & Certificate'}</span>
          </button>
        </div>
      </div>

      {/* Overland Journey Banner */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-4">
          <div>
            <span className="text-2xs font-mono uppercase tracking-widest text-[var(--brass)] font-semibold">
              NASA SOUND MISSIONS
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[var(--ink)] mt-0.5">
              {isBn ? 'পৃথিবীর সাউন্ড রেসকিউ ওভারওয়ার্ল্ড' : 'Earth Sound Rescue Overworld'}
            </h3>
          </div>
          <span className="text-xs text-[var(--ink-3)] font-mono">
            {isBn ? 'যেকোনো মিশন বেছে নিয়ে মাঠে নামো!' : 'Select any mission to deploy!'}
          </span>
        </div>

        {/* 4 Mission Cards Grid with Visual Overworld Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((m, idx) => {
            return (
              <div
                key={m.id}
                className={`relative rounded-3xl p-6 border-2 transition-all flex flex-col justify-between gap-5 overflow-hidden ${
                  m.unlocked
                    ? `${m.borderColor} ${m.bgGradient} shadow-xl hover:scale-[1.01] hover:border-[var(--brass)]`
                    : 'border-[var(--line)] bg-[var(--abyss)] opacity-60'
                }`}
              >
                {/* Background Number Watermark */}
                <span className="absolute -bottom-6 -right-3 text-8xl font-black font-display opacity-10 pointer-events-none select-none text-[var(--ink)]">
                  {idx + 1}
                </span>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center shrink-0 shadow-md">
                      {m.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-mono font-semibold uppercase tracking-wider text-[var(--brass)]">
                          {isBn ? `মিশন ${idx + 1}` : `Mission ${idx + 1}`}
                        </span>
                        {m.stars === 3 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <h4 className="text-lg font-display font-bold text-[var(--ink)] mt-0.5">
                        {isBn ? m.titleBn : m.titleEn}
                      </h4>
                      <p className="text-xs text-[var(--ink-2)] mt-1 leading-relaxed">
                        {isBn ? m.descBn : m.descEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--line)]/60">
                  <div className="flex flex-col">
                    <span className="text-2xs font-mono text-[var(--ink-3)]">
                      {m.nasaData}
                    </span>
                    <div className="flex items-center gap-0.5 mt-0.5 text-xs text-[var(--brass)]">
                      {'⭐'.repeat(m.stars) || <span className="text-2xs text-[var(--ink-3)] font-mono">{isBn ? 'স্টার নেই' : '0 Stars'}</span>}
                    </div>
                  </div>

                  <button
                    disabled={!m.unlocked}
                    onClick={() => onSelectMission(m.id)}
                    className={`btn text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md ${
                      m.unlocked
                        ? 'btn-brass text-slate-950 hover:scale-105'
                        : 'btn-ghost border border-[var(--line)] cursor-not-allowed text-[var(--ink-3)]'
                    }`}
                  >
                    {!m.unlocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isBn ? 'লকড' : 'Locked'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>{m.stars > 0 ? (isBn ? 'পুনরায় খেলো' : 'Replay') : (isBn ? 'অভিযান শুরু' : 'Deploy')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
