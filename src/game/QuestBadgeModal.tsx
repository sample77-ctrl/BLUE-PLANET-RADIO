import React, { useRef, useState } from 'react';
import { Award, Sparkles, X, Globe, Music, CheckCircle2, Lock } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { Overlay } from '../components/Overlay';
import { useDialog } from '../lib/useDialog';
import { readStars, type Stars } from './progress';

interface Props {
  onClose: () => void;
  onExploreGlobe: () => void;
  onOpenDJ: () => void;
  /** Stars per mission; read from storage when omitted. */
  stars?: Stars;
}

export const QuestBadgeModal: React.FC<Props> = ({ onClose, onExploreGlobe, onOpenDJ, stars }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const [cadetName, setCadetName] = useState(isBn ? 'ক্যাডেট অভিযাত্রী' : 'Cadet Explorer');

  const st = stars ?? readStars();
  const tiles = [
    { id: 1, en: 'Fire & Nature', bn: 'আগুন ও প্রকৃতি' },
    { id: 2, en: 'Monsoon Rain', bn: 'বর্ষার বৃষ্টি' },
    { id: 3, en: 'Ocean Heat', bn: 'সাগরের তাপ' },
    { id: 4, en: 'Climate Singer', bn: 'জলবায়ুর সুর' },
  ].map((t) => ({ ...t, done: (st[t.id] ?? 0) > 0 }));
  const doneCount = tiles.filter((t) => t.done).length;

  const ref = useRef<HTMLDivElement>(null);
  useDialog(true, onClose, ref);

  return (
    <Overlay><div className="fixed inset-0 z-[70] flex items-center justify-center p-4 scrim backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="quest-badge-title" onClick={(e) => e.stopPropagation()} className="glass-pop max-w-lg w-full p-6 sm:p-8 flex flex-col items-center gap-5 relative border-2 border-[var(--signal)] ">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
          aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Golden Seal & Eco-Ninja Hero Avatar */}
        <div className="flex items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-lg p-0.5 border-2 border-[var(--signal)] overflow-hidden shrink-0 bg-[var(--panel)]">
            <img src="/images/ninja_cadet_avatar.png" alt="Sonic Eco-Ninja Cadet" className="w-full h-full object-cover rounded-[14px]" />
          </div>
          <div className="relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-[var(--on-signal)] border-4 border-[var(--signal)] bg-[var(--signal)]">
              <Award className="w-10 h-10 animate-pulse" />
            </div>
            <Sparkles className="w-6 h-6 text-[var(--signal)] absolute -top-1 -right-1 animate-bounce" />
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-[var(--signal)] font-semibold font-mono">
            {isBn ? 'সনিক আর্থ অ্যাটলাস' : 'SONIC EARTH ATLAS'}
          </span>
          <h2 id="quest-badge-title" className="text-2xl sm:text-3xl font-extrabold font-display text-[var(--ink)] mt-1">
            {isBn ? 'সনিক ক্যাডেট ব্যাজ' : 'Sonic Cadet badge'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-1">
            {isBn
              ? `${doneCount} / ৪টি মিশন শেষ। এই অ্যাপ দিচ্ছে, নাসা নয়।`
              : `${doneCount} / 4 missions finished. Given by this app, not by NASA.`}
          </p>
        </div>

        {/* Editable Name Field */}
        <div className="w-full max-w-xs flex flex-col items-center gap-1">
          <label htmlFor="cadet-name" className="text-2xs text-[var(--ink-3)]">
            {isBn ? 'তোমার নাম লিখো:' : 'Explorer Name:'}
          </label>
          <input
            id="cadet-name"
            type="text"
            value={cadetName}
            onChange={(e) => setCadetName(e.target.value)}
            className="w-full text-center font-bold text-lg text-[var(--signal)] bg-[var(--panel-2)] border border-[var(--line)] rounded-lg py-1.5 px-3 focus:outline-none focus:border-[var(--signal)] font-display"
          />
        </div>

        {/* One tile per mission: ticked only when that mission has at least one saved star */}
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full my-1">
          {tiles.map((t) => (
            <li key={t.id} data-done={t.done ? 'true' : 'false'} className="p-2.5 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] flex flex-col items-center text-center gap-1">
              <span className="text-2xs font-semibold text-[var(--ink)]">{isBn ? t.bn : t.en}</span>
              {t.done ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--signal)]" aria-hidden="true" /> : <Lock className="w-3.5 h-3.5 text-[var(--ink-3)]" aria-hidden="true" />}
              <span className="text-2xs font-mono text-[var(--ink-3)]">{t.done ? (isBn ? 'শেষ' : 'done') : (isBn ? 'বাকি' : 'to do')}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-center text-[var(--ink-2)] leading-relaxed px-2">
          {isBn
            ? `অভিনন্দন ${cadetName}! তুমি এখন একজন দক্ষ শব্দ অনুসন্ধানকারী। তুমি শিখে গেছ কীভাবে ডেটা শব্দ হয়ে ওঠে এবং কান দিয়ে কীভাবে পুরো বিশ্বকে চেনা যায়!`
            : `Congratulations ${cadetName}! You are officially certified to explore real NASA Earth data by ear!`}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
          <button
            onClick={() => {
              onClose();
              onExploreGlobe();
            }}
            className="btn btn-brass w-full justify-center text-sm font-semibold py-3 flex items-center gap-2 "
          >
            <Globe className="w-4 h-4" />
            <span>{isBn ? '৩ডি গ্লোব এক্সপ্লোর করো' : 'Explore the 3D globe'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenDJ();
            }}
            className="btn btn-ghost border border-[var(--line)] w-full justify-center text-sm py-3 flex items-center gap-2"
          >
            <Music className="w-4 h-4" />
            <span>{isBn ? 'আর্থ ডিজে স্টুডিও' : 'Launch DJ Studio'}</span>
          </button>
        </div>
      </div>
    </div></Overlay>
  );
};
