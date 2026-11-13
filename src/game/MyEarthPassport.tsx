import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  Lock,
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
  Globe,
} from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { Overlay } from '../components/Overlay';
import { useDialog } from '../lib/useDialog';

import { BADGE_RULES, derive, readModes, readStars, XP_PER_LEVEL, XP_PER_MODE, XP_PER_STAR, type BadgeId, type Stars } from './progress';
import { loadSnapshotInfo, type SnapshotInfo } from './sources';

interface Props {
  onBack: () => void;
  /** Stars per mission as the game holds them; read from storage when omitted. */
  stars?: Stars;
}

interface BadgeItem {
  id: BadgeId;
  nameEn: string;
  nameBn: string;
  descEn: string;
  descBn: string;
  icon: React.ReactNode;
}

const ic = 'w-5 h-5 text-[var(--signal)]';
/** Names and what each badge means. Whether it is unlocked is never stored here: it comes from derive(). */
const BADGES: BadgeItem[] = [
  { id: 'fire', nameEn: 'Amazon Forest Sentinel', nameBn: 'আমাজন ফরেস্ট সেন্টিনেল', descEn: 'Finished the wildfire mission, which sonifies a bundled FIRMS fire snapshot.', descBn: 'দাবানল মিশন শেষ করেছে (FIRMS-এর সংরক্ষিত স্ন্যাপশট থেকে শব্দ)।', icon: <Flame className={ic} aria-hidden="true" /> },
  { id: 'rain', nameEn: 'Bengal Rain Tracker', nameBn: 'বাংলা রেইন ট্র্যাকার', descEn: 'Finished the monsoon mission, built on a POWER rainfall snapshot.', descBn: 'বর্ষা মিশন শেষ করেছে (POWER-এর বৃষ্টির স্ন্যাপশট)।', icon: <CloudRain className={ic} aria-hidden="true" /> },
  { id: 'ocean', nameEn: 'Pacific Ocean Diver', nameBn: 'প্রশান্ত মহাসাগর ডাইভার', descEn: 'Finished the submarine mission, built on a MUR sea-surface snapshot.', descBn: 'সাবমেরিন মিশন শেষ করেছে (MUR সাগরের তাপমাত্রার স্ন্যাপশট)।', icon: <Waves className={ic} aria-hidden="true" /> },
  { id: 'orbital', nameEn: 'Orbital Harmonizer', nameBn: 'অরবিটাল হারমোনাইজার', descEn: 'Finished the orbital station mission, which plays the GISTEMP series.', descBn: 'অরবিটাল স্টেশন মিশন শেষ করেছে (GISTEMP সিরিজ বাজে)।', icon: <Radio className={ic} aria-hidden="true" /> },
  { id: 'timemachine', nameEn: 'Climate Time Traveler', nameBn: 'জলবায়ু টাইম ট্রাভেলার', descEn: 'Compared two years of the GISTEMP snapshot by ear.', descBn: 'GISTEMP স্ন্যাপশটের দুটি বছর কানে তুলনা করেছে।', icon: <Clock className={ic} aria-hidden="true" /> },
  { id: 'blind', nameEn: 'Inclusive Navigator', nameBn: 'ইনক্লুসিভ নেভিগেটর', descEn: 'Found every target by sound alone in Blind Explorer.', descBn: 'ব্লাইন্ড এক্সপ্লোরারে শুধু শব্দ শুনে সব লক্ষ্য খুঁজে পেয়েছে।', icon: <EyeOff className={ic} aria-hidden="true" /> },
  { id: 'dj', nameEn: 'Master Earth DJ', nameBn: 'মাস্টার আর্থ ডিজে', descEn: 'Layered two Earth sounds at once in the DJ studio.', descBn: 'ডিজে স্টুডিওতে পৃথিবীর দুটি শব্দ একসাথে বাজিয়েছে।', icon: <Music className={ic} aria-hidden="true" /> },
];

export const MyEarthPassport: React.FC<Props> = ({ onBack, stars }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';

  const [callsign, setCallsign] = useState(() => {
    try { return localStorage.getItem('sonic_cadet_callsign') || ''; } catch { return ''; }
  });
  const shownCallsign = callsign || (isBn ? 'ক্যাডেট' : 'Cadet');
  const [isEditingCallsign, setIsEditingCallsign] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);
  useDialog(showCertificate, () => setShowCertificate(false), certRef);
  const [issueDate] = useState(() => new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' }));
  const [sources, setSources] = useState<SnapshotInfo[] | null>(null);
  useEffect(() => {
    let live = true;
    loadSnapshotInfo().then((r) => { if (live) setSources(r); }).catch(() => { if (live) setSources([]); });
    return () => { live = false; };
  }, []);

  const handleSaveCallsign = (name: string) => {
    const n = name.trim().slice(0, 24);
    setCallsign(n);
    try {
      localStorage.setItem('sonic_cadet_callsign', n);
    } catch {}
    setIsEditingCallsign(false);
  };

  // Everything below is derived from the real stored progress on every render.
  const d = derive(stars ?? readStars(), readModes());
  const { xp: xpEarned, level: cadetLevel, unlockedCount, totalStars } = d;
  const unlockedOf = (id: BadgeId) => d.badges.find((b) => b.id === id)?.unlocked ?? false;
  const badges = BADGES.map((b) => ({ ...b, unlocked: unlockedOf(b.id) }));

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto" role="region" aria-label="My Earth Passport">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="btn btn-ghost p-2 rounded-lg border border-[var(--line)] hover:border-[var(--signal)] cursor-pointer"
            aria-label={isBn ? 'কোয়েস্ট হাবে ফিরে যাও' : 'Back to Quest hub'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-lg p-0.5 flex items-center justify-center bg-[var(--panel)]">
            <Award className="w-6 h-6 text-[var(--ink)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="chip border-[var(--hair)] bg-[var(--panel-2)] text-[var(--signal)] text-2xs font-mono font-semibold uppercase">
                {isBn ? 'সেকশন ০৯ · মাই আর্থ পাসপোর্ট' : 'SECTION 09 · MY EARTH PASSPORT'}
              </span>
              <span className="text-xs font-mono text-[var(--ink-3)]">
                {isBn ? 'অগ্রগতি এই ব্রাউজারে সংরক্ষিত' : 'Progress is saved in this browser'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)] mt-0.5">
              {isBn ? 'ক্যাডেট প্রোফাইল, ব্যাজ ও সম্পন্নের সনদ' : 'Cadet profile, badges and certificate of completion'}
            </h2>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1">
          <button
            onClick={() => { if (unlockedCount > 0) setShowCertificate(true); }}
            aria-disabled={unlockedCount === 0}
            aria-describedby={unlockedCount === 0 ? 'cert-hint' : undefined}
            className={`btn btn-brass text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer ${unlockedCount === 0 ? 'opacity-50' : ''}`}
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>{isBn ? 'সম্পন্নের সনদ দেখুন' : 'View certificate of completion'}</span>
          </button>
          {unlockedCount === 0 && (
            <span id="cert-hint" className="text-2xs font-mono text-[var(--ink-3)]">
              {isBn ? 'সনদের জন্য অন্তত একটি ব্যাজ অর্জন করো।' : 'Earn at least one badge to issue a certificate.'}
            </span>
          )}
        </div>
      </div>

      {/* Cadet Profile Card */}
      <div className="p-6 rounded-lg border-2 border-[var(--signal)]/50 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[var(--panel)]">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-[var(--hair)] bg-[var(--panel-2)]"><img src="/images/ninja_cadet_avatar_sm.jpg" alt="" width={80} height={80} className="w-full h-full object-cover" /></div>
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[var(--signal)] text-[var(--on-signal)]">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              {isEditingCallsign ? (
                <input
                  type="text"
                  defaultValue={callsign}
                  aria-label={isBn ? 'কলসাইন' : 'Call sign'}
                  maxLength={24}
                  onBlur={(e) => handleSaveCallsign(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCallsign((e.target as HTMLInputElement).value)}
                  className="bg-[var(--ground)]/60 border border-[var(--signal)] rounded-lg px-2.5 py-1 text-sm font-semibold text-[var(--ink)]"
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => setIsEditingCallsign(true)}
                  className="flex items-center gap-1.5 cursor-pointer group"
                  title={isBn ? 'কলসাইন বদলাতে ক্লিক করো' : 'Click to edit call sign'}
                >
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-[var(--ink)] group-hover:text-[var(--signal)] transition">
                    {shownCallsign}
                  </h3>
                  <span className="text-2xs text-[var(--ink-3)] font-mono opacity-60 group-hover:opacity-100">
                    ✎
                  </span>
                </div>
              )}
              <span className="chip bg-[var(--abyss)] border-[var(--line)] text-2xs font-mono text-[var(--signal)]">
                {isBn ? `লেভেল ${cadetLevel}` : `Level ${cadetLevel}`}
              </span>
            </div>

            <p className="text-xs text-[var(--ink-2)] mt-1 font-medium">
              {isBn
                ? 'ব্লু প্ল্যানেট রেডিওর ক্যাডেট। এই অ্যাপই এই সনদ দেয়; নাসা দেয় না।'
                : 'Blue Planet Radio cadet. Progress and certificate come from this app, not from NASA.'}
            </p>

            <div className="flex items-center gap-3 mt-3 text-xs font-mono">
              <span className="text-[var(--signal)] font-semibold">{xpEarned} {isBn ? 'মোট XP' : 'Total XP'}</span>
              <span className="text-[var(--ink-3)]">·</span>
              <span className="text-[var(--signal)] font-semibold">{unlockedCount} / {badges.length} {isBn ? 'ব্যাজ' : 'Badges'}</span>
              <span className="text-[var(--ink-3)]">·</span>
              <span className="text-[var(--signal)] font-semibold">{totalStars} {isBn ? 'তারা' : 'Stars'}</span>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-48 bg-[var(--ground)]/40 border border-[var(--line)] rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex justify-between text-2xs font-mono text-[var(--ink-2)]">
            <span>{isBn ? 'পরের লেভেল পর্যন্ত XP' : 'XP TO NEXT LEVEL'}</span>
            <span>{d.xpIntoLevel} / {XP_PER_LEVEL} XP</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--ground)]/60 overflow-hidden">
            <div
              className="h-full bg-[var(--panel)]"
              style={{ width: `${Math.min(100, (d.xpIntoLevel / XP_PER_LEVEL) * 100)}%` }}
            />
          </div>
          <span className="text-2xs font-mono text-[var(--ink-3)] text-right">
            {isBn ? `১ তারা = ${XP_PER_STAR} XP, একটি মোড = ${XP_PER_MODE} XP` : `1 star = ${XP_PER_STAR} XP, 1 finished mode = ${XP_PER_MODE} XP`}
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-display font-bold text-[var(--ink)] flex items-center gap-2">
          <Award className="w-5 h-5 text-[var(--signal)]" />
          <span>{isBn ? 'ব্যাজ' : 'Badges'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              data-badge={b.id}
              data-unlocked={b.unlocked ? 'true' : 'false'}
              className={`p-4 rounded-lg border border-[var(--hair)] flex items-start gap-3.5 ${b.unlocked ? 'bg-[var(--panel-2)]' : 'bg-[var(--panel)]'}`}
            >
              <div className="p-2.5 rounded-lg bg-[var(--ground)]/40 border border-[var(--hair)] shrink-0">
                {b.icon}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    {isBn ? b.nameBn : b.nameEn}
                  </span>
                  {b.unlocked ? (
                    <span className="text-2xs font-mono text-[var(--signal)] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      {isBn ? 'অর্জিত' : 'UNLOCKED'}
                    </span>
                  ) : (
                    <span className="text-2xs font-mono text-[var(--ink-2)] font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" aria-hidden="true" />
                      {isBn ? 'লক করা' : 'LOCKED'}
                    </span>
                  )}
                </div>
                <p className="text-2xs text-[var(--ink-2)] leading-relaxed">
                  {b.unlocked ? (isBn ? b.descBn : b.descEn) : (isBn ? BADGE_RULES[b.id].earnBn : BADGE_RULES[b.id].earnEn)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data sources: read from the bundled snapshot files' own metadata */}
      <section className="p-5 rounded-lg bg-[var(--ground)]/60 border border-[var(--hair)] flex flex-col gap-3" aria-labelledby="passport-sources">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--panel-2)] border border-[var(--hair)] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-[var(--signal)]" aria-hidden="true" />
          </div>
          <div>
            <h3 id="passport-sources" className="text-2xs font-mono uppercase tracking-wider text-[var(--signal)] font-semibold">
              {isBn ? 'ব্যবহৃত ডেটার উৎস' : 'Data sources used'}
            </h3>
            <p className="text-2xs text-[var(--ink-3)] mt-0.5">
              {isBn ? 'প্রতিটি অ্যাপের সাথে আসা সংরক্ষিত স্ন্যাপশট, লাইভ নয়। নাসা এই অ্যাপ যাচাই বা অনুমোদন করেনি।' : 'Each one is a snapshot bundled with this app, not live. NASA has not reviewed or endorsed this app.'}
            </p>
          </div>
        </div>
        <ul className="grid gap-1.5 text-xs font-mono text-[var(--ink-2)]">
          {(sources ?? []).map((x) => (
            <li key={x.id}>
              <span className="text-[var(--ink)] font-semibold">{x.name}</span>
              {' · '}{isBn ? 'সংরক্ষিত স্ন্যাপশট' : 'bundled snapshot'}
              {' · '}{x.period ? `${isBn ? 'সময়কাল' : 'period'} ${x.period}` : (isBn ? 'সময়কাল পড়া যায়নি' : 'period unavailable')}
              {x.generated ? ` · ${isBn ? 'তৈরি' : 'generated'} ${x.generated}` : ''}
            </li>
          ))}
          {sources == null && <li>{isBn ? 'লোড হচ্ছে…' : 'Loading…'}</li>}
        </ul>
      </section>

      {/* Printable Certificate Modal */}
      {showCertificate && (
        <Overlay><div className="fixed inset-0 z-[70] bg-[var(--ground)]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={() => setShowCertificate(false)}>
          <div ref={certRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="certificate-title" onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full bg-[var(--panel)] border-4 border-[var(--signal)] rounded-lg p-8 sm:p-10 flex flex-col gap-6 text-center my-8">
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--ground)]/40 border border-[var(--line)] hover:border-[var(--signal)] cursor-pointer"
              aria-label={isBn ? 'সনদ বন্ধ করুন' : 'Close certificate'}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Official Seal */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full border border-[var(--signal)] flex items-center justify-center"><Globe className="w-8 h-8 text-[var(--signal)]" aria-hidden="true" /></div>
              <span className="text-2xs font-mono uppercase tracking-widest text-[var(--signal)] font-semibold">
                {isBn ? 'ব্লু প্ল্যানেট রেডিও' : 'BLUE PLANET RADIO'}
              </span>
              <h2 id="certificate-title" className="text-2xl sm:text-3xl font-display font-bold text-[var(--ink)] tracking-tight">
                {isBn ? 'সম্পন্নের সনদ' : 'CERTIFICATE OF COMPLETION'}
              </h2>
              <p className="text-xs text-[var(--ink-2)] max-w-md">
                {isBn ? 'এই সনদ ব্লু প্ল্যানেট রেডিও অ্যাপ প্রদান করেছে। নাসা এটি প্রদান বা অনুমোদন করেনি। এটি দেওয়া হলো:' : 'Issued by the Blue Planet Radio app for the progress below. It is not issued or endorsed by NASA. Presented to:'}
              </p>
            </div>

            {/* Cadet Name */}
            <div className="border-y-2 border-[var(--signal)]/40 py-4 my-1">
              <span className="text-3xl sm:text-4xl font-display font-bold text-[var(--signal)] tracking-wide">
                {shownCallsign}
              </span>
              <div className="text-xs font-mono text-[var(--ink-2)] mt-1">
                {isBn ? `লেভেল ${cadetLevel}` : `Level ${cadetLevel}`}
              </div>
            </div>

            {/* Achievement details */}
            <div className="grid grid-cols-3 gap-2 text-2xs font-mono text-[var(--ink-2)]">
              <div className="p-2 rounded-lg bg-[var(--ground)]/40 border border-[var(--line)]">
                <div>{isBn ? 'অর্জিত XP' : 'XP EARNED'}</div>
                <div className="text-xs font-semibold text-[var(--ink)] mt-0.5">{xpEarned} XP</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--ground)]/40 border border-[var(--line)]">
                <div>{isBn ? 'অর্জিত ব্যাজ' : 'BADGES UNLOCKED'}</div>
                <div className="text-xs font-semibold text-[var(--ink)] mt-0.5">{unlockedCount} / {badges.length}</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--ground)]/40 border border-[var(--line)]">
                <div>{isBn ? 'তারা' : 'STARS'}</div>
                <div className="text-xs font-semibold text-[var(--ink)] mt-0.5">{totalStars} / 12</div>
              </div>
            </div>

            {/* Sources the Quest used */}
            <div className="text-left text-2xs font-mono text-[var(--ink-2)]">
              <div className="text-[var(--ink-3)] mb-1">{isBn ? 'ব্যবহৃত ডেটার উৎস (সংরক্ষিত স্ন্যাপশট, লাইভ নয়):' : 'DATA SOURCES USED (bundled snapshots, not live):'}</div>
              <ul className="grid gap-0.5">
                {(sources ?? []).map((x) => (
                  <li key={x.id}>{x.name}{x.period ? ` · ${x.period}` : ''}</li>
                ))}
              </ul>
            </div>

            {/* Footer Signatures */}
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-4 text-2xs font-mono text-[var(--ink-3)]">
              <div className="flex flex-col items-start">
                <span>{isBn ? 'প্রদানকারী:' : 'ISSUED BY:'}</span>
                <span className="font-semibold text-[var(--ink)]">{isBn ? 'ব্লু প্ল্যানেট রেডিও অ্যাপ (নাসা নয়)' : 'the Blue Planet Radio app (not NASA)'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span>{isBn ? 'প্রদানের তারিখ:' : 'DATE ISSUED:'}</span>
                <span className="font-semibold text-[var(--ink)]">{issueDate}</span>
              </div>
            </div>

            {/* Print Action */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="btn btn-brass text-xs font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer hover:scale-105"
              >
                <Printer className="w-4 h-4" />
                <span>{isBn ? 'সনদ প্রিন্ট করুন' : 'Print certificate'}</span>
              </button>
            </div>
          </div>
        </div></Overlay>
      )}
    </div>
  );
};
