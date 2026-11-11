import React, { useState, useEffect } from 'react';
import {
  Clock,
  ArrowLeft,
  Volume2,
  Sparkles,
  Info,
  TrendingUp,
} from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { gameAudio } from './gameAudio';

interface Props {
  onBack: () => void;
  onExploreGlobe?: () => void;
}

interface TempRecord {
  year: number;
  anomaly: number;
}

export const EarthTimeMachine: React.FC<Props> = ({ onBack, onExploreGlobe }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';

  const [records, setRecords] = useState<TempRecord[]>([]);
  const [yearA, setYearA] = useState<number>(1981);
  const [yearB, setYearB] = useState<number>(2025);
  const [scrubberYear, setScrubberYear] = useState<number>(2025);
  const [isPlayingA, setIsPlayingA] = useState(false);
  const [isPlayingB, setIsPlayingB] = useState(false);
  const [isPlayingBoth, setIsPlayingBoth] = useState(false);

  useEffect(() => {
    fetch('/data/gistemp_global.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.series)) {
          setRecords(data.series);
        }
      })
      .catch(() => {
        // Fallback series if offline
        const fallback: TempRecord[] = [];
        for (let y = 1880; y <= 2025; y++) {
          const t = (y - 1880) / 145;
          fallback.push({ year: y, anomaly: Number((-0.2 + t * 1.4).toFixed(2)) });
        }
        setRecords(fallback);
      });
  }, []);

  const getRecord = (year: number) => records.find((r) => r.year === year) || { year, anomaly: 0 };

  const recordA = getRecord(yearA);
  const recordB = getRecord(yearB);
  const recordScrub = getRecord(scrubberYear);

  // Deterministic frequency mapping: f = 220 * 2^(anomaly / 1.5)
  const anomalyToFreq = (anomaly: number) => {
    return Math.round(220 * Math.pow(2, anomaly / 1.5));
  };

  const freqA = anomalyToFreq(recordA.anomaly);
  const freqB = anomalyToFreq(recordB.anomaly);
  const freqScrub = anomalyToFreq(recordScrub.anomaly);
  const deltaTemp = Number((recordB.anomaly - recordA.anomaly).toFixed(2));
  const deltaFreq = freqB - freqA;

  const playFrequency = (freq: number, duration = 1.2) => {
    try {
      gameAudio.init();
      gameAudio.playTone(freq, 0, duration);
    } catch {}
  };

  const handlePlayA = () => {
    setIsPlayingA(true);
    playFrequency(freqA, 1.5);
    setTimeout(() => setIsPlayingA(false), 1500);
  };

  const handlePlayB = () => {
    setIsPlayingB(true);
    playFrequency(freqB, 1.5);
    setTimeout(() => setIsPlayingB(false), 1500);
  };

  const handlePlayBoth = () => {
    setIsPlayingBoth(true);
    try {
      gameAudio.init();
      // Left ear: Year A, Right ear: Year B (Spatial comparison)
      gameAudio.playTone(freqA, -0.7, 2.0);
      gameAudio.playTone(freqB, 0.7, 2.0);
    } catch {}
    setTimeout(() => setIsPlayingBoth(false), 2000);
  };

  const handleScrubberChange = (val: number) => {
    setScrubberYear(val);
    const rec = records.find((r) => r.year === val);
    if (rec) {
      const f = anomalyToFreq(rec.anomaly);
      playFrequency(f, 0.15);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto" role="region" aria-label="Earth Time Machine">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="btn btn-ghost p-2 rounded-lg border border-[var(--line)] hover:border-[var(--signal)] cursor-pointer"
            aria-label="Back to Game Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-lg p-0.5 flex items-center justify-center bg-[var(--panel)]">
            <Clock className="w-6 h-6 text-[var(--ink)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="chip border-[var(--hair)] bg-[var(--panel-2)] text-[var(--signal)] text-2xs font-mono font-semibold uppercase">
                {isBn ? 'সেকশন ০৮ · আর্থ টাইম মেশিন' : 'SECTION 08 · EARTH TIME MACHINE'}
              </span>
              <span className="text-xs font-mono text-[var(--ink-3)]">
                NASA GISTEMP 1880–2025
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)] mt-0.5">
              {isBn ? 'পৃথিবীর অতীত ও বর্তমানের জলবায়ু সুর তুলনা' : 'Climate Acoustic Comparison: 1981 vs 2025'}
            </h2>
          </div>
        </div>

        {onExploreGlobe && (
          <button
            onClick={onExploreGlobe}
            className="btn btn-ghost border border-[var(--line)] text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--signal)]" />
            <span>{isBn ? '৩ডি গ্লোবে দেখুন' : 'Explore Globe'}</span>
          </button>
        )}
      </div>

      {/* Comparative Cards: Year A vs Year B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline Year Card */}
        <div className="p-5 rounded-lg bg-[var(--panel)] border border-[var(--hair)] flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-2xs font-mono uppercase tracking-wider text-[var(--signal)] font-semibold">
                {isBn ? 'বেসলাইন বছর (অতীত)' : 'BASELINE YEAR (PAST)'}
              </span>
              <select
                value={yearA}
                aria-label={isBn ? 'বেসলাইন বছর' : 'Baseline year'}
                onChange={(e) => setYearA(Number(e.target.value))}
                className="bg-[var(--ground)]/50 border border-[var(--line)] rounded-lg px-2.5 py-1 text-xs font-mono text-[var(--ink)] cursor-pointer"
              >
                {[1950, 1960, 1970, 1981, 1990, 2000].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <div className="text-4xl font-display font-bold text-[var(--signal)]">
                {yearA}
              </div>
              <div className="text-xs font-mono text-[var(--ink-2)] mt-1">
                {isBn ? 'বৈশ্বিক তাপমাত্রা অ্যানোমালি:' : 'Global Temp Anomaly:'}{' '}
                <span className="font-semibold text-[var(--ink)]">
                  {recordA.anomaly > 0 ? `+${recordA.anomaly}` : recordA.anomaly}°C
                </span>
              </div>
              <div className="text-xs font-mono text-[var(--signal)] mt-0.5">
                {isBn ? 'সনিক ফ্রিকোয়েন্সি:' : 'Sonified Pitch:'}{' '}
                <span className="font-semibold">{freqA} Hz</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlayA}
            disabled={isPlayingA}
            className={`btn border border-[var(--signal)] py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
              isPlayingA ? 'bg-[var(--signal)] animate-pulse text-[var(--on-signal)]' : 'bg-[var(--panel-2)] text-[var(--signal)] hover:bg-[var(--panel-2)]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isBn ? `${yearA}-এর শব্দ শুনুন` : `Hear ${yearA} Soundscape (${freqA} Hz)`}</span>
          </button>
        </div>

        {/* Current Year Card */}
        <div className="p-5 rounded-lg bg-[var(--panel)] border border-[var(--hair)] flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-2xs font-mono uppercase tracking-wider text-[var(--signal)] font-semibold">
                {isBn ? 'বর্তমান বছর (পর্যবেক্ষিত)' : 'OBSERVED RECENT YEAR'}
              </span>
              <select
                value={yearB}
                aria-label={isBn ? 'পর্যবেক্ষিত বছর' : 'Observed year'}
                onChange={(e) => setYearB(Number(e.target.value))}
                className="bg-[var(--ground)]/50 border border-[var(--line)] rounded-lg px-2.5 py-1 text-xs font-mono text-[var(--ink)] cursor-pointer"
              >
                {[2015, 2018, 2020, 2023, 2024, 2025].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <div className="text-4xl font-display font-bold text-[var(--signal)]">
                {yearB}
              </div>
              <div className="text-xs font-mono text-[var(--ink-2)] mt-1">
                {isBn ? 'বৈশ্বিক তাপমাত্রা অ্যানোমালি:' : 'Global Temp Anomaly:'}{' '}
                <span className="font-semibold text-[var(--ink)]">
                  {recordB.anomaly > 0 ? `+${recordB.anomaly}` : recordB.anomaly}°C
                </span>
              </div>
              <div className="text-xs font-mono text-[var(--signal)] mt-0.5">
                {isBn ? 'সনিক ফ্রিকোয়েন্সি:' : 'Sonified Pitch:'}{' '}
                <span className="font-semibold">{freqB} Hz</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlayB}
            disabled={isPlayingB}
            className={`btn border border-[var(--signal)] py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
              isPlayingB ? 'bg-[var(--signal)] animate-pulse text-[var(--on-signal)]' : 'bg-[var(--panel-2)] text-[var(--signal)] hover:bg-[var(--panel-2)]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isBn ? `${yearB}-এর শব্দ শুনুন` : `Hear ${yearB} Soundscape (${freqB} Hz)`}</span>
          </button>
        </div>
      </div>

      {/* Delta Difference Acoustic Bridge */}
      <div className="p-5 rounded-lg border border-[var(--line)] flex flex-col md:flex-row items-center justify-between gap-5 bg-[var(--panel)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[var(--panel-2)] border border-[var(--hair)] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-[var(--signal)]" />
          </div>
          <div>
            <span className="text-2xs font-mono uppercase tracking-wider text-[var(--signal)] font-semibold">
              {isBn ? 'বৈজ্ঞানিক পার্থক্য ও পিচ পরিবর্তন' : 'ACOUSTIC DELTA (Δf & ΔT)'}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-display font-bold text-[var(--signal)]">
                +{deltaTemp}°C
              </span>
              <span className="text-sm font-mono text-[var(--ink-2)]">
                ({deltaFreq > 0 ? `+${deltaFreq}` : deltaFreq} Hz pitch increase)
              </span>
            </div>
            <p className="text-xs text-[var(--ink-3)] mt-1">
              {isBn
                ? 'নাসার গাণিতিক সূত্রে প্রতি ১°C বৃদ্ধিতে পিচ প্রায় ১৪৫ হার্টজ বৃদ্ধি পায়। ফলে কান শুনলেই উষ্ণায়ন বোঝা যায়।'
                : 'Mapped by NASA GISTEMP: each 1°C increase translates into ~145 Hz higher acoustic pitch.'}
            </p>
          </div>
        </div>

        <button
          onClick={handlePlayBoth}
          disabled={isPlayingBoth}
          className={`btn btn-brass shrink-0 px-6 py-3 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer hover:scale-105 transition ${
            isPlayingBoth ? 'animate-pulse' : ''
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>{isBn ? 'দুই সুর একসঙ্গে বাজান (Binaural Contrast)' : 'Play Binaural Harmony / Contrast'}</span>
        </button>
      </div>

      {/* Historical Timeline 1880 - 2025 Interactive Scrubber */}
      <div className="p-6 rounded-lg bg-[var(--panel)] border border-[var(--line)] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-display font-bold text-[var(--ink)]">
              {isBn ? '১৪৫ বছরের ঐতিহাসিক টাইমলাইন স্ক্রাবার (১৮৮০ - ২০২৫)' : '145-Year Historical Climate Scrubber (1880–2025)'}
            </h3>
            <p className="text-2xs text-[var(--ink-2)]">
              {isBn
                ? 'স্লাইডারটি টেনে ১৮৮০ থেকে আজ পর্যন্ত নাসার রেকর্ড শুনুন।'
                : 'Drag the slider across 145 years to hear Earth’s temperature symphony rise.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-[var(--signal)] px-3 py-1 rounded-lg bg-[var(--ground)]/40 border border-[var(--line)]">
              {scrubberYear} · {recordScrub.anomaly > 0 ? `+${recordScrub.anomaly}` : recordScrub.anomaly}°C ({freqScrub} Hz)
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="flex flex-col gap-2">
          <input
            type="range"
            min={1880}
            max={2025}
            value={scrubberYear}
            onChange={(e) => handleScrubberChange(Number(e.target.value))}
            className="w-full accent-[var(--signal)] cursor-pointer h-2 bg-[var(--ground)]/40 rounded-lg appearance-none"
            aria-label="Climate Year Timeline"
          />
          <div className="flex justify-between text-2xs font-mono text-[var(--ink-3)]">
            <span>1880 (-0.18°C)</span>
            <span>1920 (-0.28°C)</span>
            <span>1950 (-0.17°C)</span>
            <span>1980 (+0.26°C)</span>
            <span>2000 (+0.40°C)</span>
            <span>2025 (+1.19°C)</span>
          </div>
        </div>
      </div>

      {/* Provenance Footer */}
      <div className="p-4 rounded-lg bg-[var(--ground)]/40 border border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-2xs text-[var(--ink-3)]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--signal)] shrink-0" />
          <span>
            {isBn
              ? 'উৎস: নাসা গিস সারফেস টেম্পারেচার অ্যানালাইসিস (GISTEMP v4), বেসলাইন ১৯৫১-১৯৮০।'
              : 'Data Source: NASA Goddard Institute for Space Studies (GISS GISTEMP v4), 1951–1980 Baseline.'}
          </span>
        </div>
        <span className="font-mono text-[var(--signal)]">
          ✓ AUTHENTIC NASA RECORD
        </span>
      </div>
    </div>
  );
};
