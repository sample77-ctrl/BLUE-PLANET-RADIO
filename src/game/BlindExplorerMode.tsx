import React, { useState, useEffect, useCallback } from 'react';
import {
  EyeOff,
  ArrowLeft,
  Volume2,
  Compass,
  Radio,
  Award,
  Activity,
} from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { gameAudio } from './gameAudio';

interface Props {
  onBack: () => void;
  onComplete?: () => void;
}

interface AcousticTarget {
  id: number;
  nameEn: string;
  nameBn: string;
  x: number; // -10 to 10
  y: number; // -10 to 10
  baseFreq: number; // Hz
  collected: boolean;
  nasaRef: string;
}

export const BlindExplorerMode: React.FC<Props> = ({ onBack, onComplete }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';

  const initialGreeting = isBn
    ? 'ব্লাইন্ড এক্সপ্লোরার মোডে স্বাগতম। এই মোডটি সম্পূর্ণ অডিও দ্বারা চালিত। ডব্লিউ এ এস ডি দিয়ে চলাচল করুন, স্পেস চেপে সোনার পিং শুনুন এবং এন্টার চেপে সেন্সর সংগ্রহ করুন।'
    : 'Welcome to Blind Explorer Mode. This mode is 100% audio-driven. Use W A S D to move, Space to pulse sonar, and Enter to calibrate sensors.';

  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [heading, setHeading] = useState(0); // 0 = North (+Y)
  const [activeSpeech, setActiveSpeech] = useState(false);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState(initialGreeting);
  const [visualSpectrum, setVisualSpectrum] = useState<{ left: number; right: number; freq: number }>({
    left: 20,
    right: 20,
    freq: 300,
  });

  // Acoustic targets
  const [targets, setTargets] = useState<AcousticTarget[]>([
    {
      id: 1,
      nameEn: 'Thermal Canopy Sensor (Amazon Basin)',
      nameBn: 'থার্মাল ক্যানোপি সেন্সর (আমাজন)',
      x: 3,
      y: 5,
      baseFreq: 440,
      collected: false,
      nasaRef: 'NASA FIRMS VIIRS Active Fire Hotspot',
    },
    {
      id: 2,
      nameEn: 'Hydrological Precipitation Gauge (Bengal Delta)',
      nameBn: 'বৃষ্টি পরিমাপক গেজ (বাংলা ডেল্টা)',
      x: -5,
      y: 4,
      baseFreq: 330,
      collected: false,
      nasaRef: 'NASA POWER Daily PRECTOTCORR',
    },
    {
      id: 3,
      nameEn: 'Deep Ocean Sonar Buoy (Pacific Trench)',
      nameBn: 'গভীর সাগর সোনার বয় (প্রশান্ত মহাসাগর)',
      x: 2,
      y: -6,
      baseFreq: 520,
      collected: false,
      nasaRef: 'JPL MUR Sea Surface Temperature',
    },
  ]);

  const [activeTargetIdx, setActiveTargetIdx] = useState(0);
  const [missionComplete, setMissionComplete] = useState(false);

  const currentTarget = targets[activeTargetIdx];

  // Speech synthesizer
  const speak = useCallback((text: string) => {
    setScreenReaderAnnouncement(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setActiveSpeech(true);
      utterance.onend = () => setActiveSpeech(false);
      utterance.onerror = () => setActiveSpeech(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Calculate distance and pan relative to player heading
  const getTargetSpatialMetrics = useCallback((target: AcousticTarget) => {
    const dx = target.x - posX;
    const dy = target.y - posY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Angle to target in radians, relative to world North
    const targetAngleRad = Math.atan2(dx, dy); // 0 = North, pi/2 = East
    const targetAngleDeg = (targetAngleRad * 180) / Math.PI;

    // Relative angle considering player heading
    let relativeAngle = (targetAngleDeg - heading) % 360;
    if (relativeAngle > 180) relativeAngle -= 360;
    if (relativeAngle < -180) relativeAngle += 360;

    // Pan: -1 (hard left) to +1 (hard right)
    const pan = Math.max(-1, Math.min(1, relativeAngle / 90));

    // Pitch rises as distance decreases: f = baseFreq * (1 + (15 - distance)/10)
    const pitch = Math.round(target.baseFreq * (1 + Math.max(0, (15 - distance) / 10)));

    return { distance, pan, pitch, relativeAngle };
  }, [posX, posY, heading]);

  // Sonar Ping Function
  const triggerSonarPing = useCallback(() => {
    if (!currentTarget) return;
    const { distance, pan, pitch } = getTargetSpatialMetrics(currentTarget);

    try {
      gameAudio.init();
      gameAudio.playTone(pitch, pan, 0.4);
    } catch {}

    // Update visual sound equivalent for hearing-impaired
    const leftAmp = Math.round(Math.max(10, (1 - pan) * 50 * Math.max(0.2, (15 - distance) / 15)));
    const rightAmp = Math.round(Math.max(10, (1 + pan) * 50 * Math.max(0.2, (15 - distance) / 15)));
    setVisualSpectrum({ left: leftAmp, right: rightAmp, freq: pitch });

    const distText = Math.round(distance);
    const dirText =
      pan < -0.3 ? (isBn ? 'বাম দিকে' : 'to your left') :
      pan > 0.3 ? (isBn ? 'ডান দিকে' : 'to your right') :
      (isBn ? 'সরাসরি সামনে' : 'straight ahead');

    const message = isBn
      ? `দূরত্ব ${distText} মিটার, সংকেত আসছে ${dirText}।`
      : `Distance ${distText} meters, signal detected ${dirText}.`;

    setScreenReaderAnnouncement(message);
  }, [currentTarget, getTargetSpatialMetrics, isBn]);

  // Initial greeting speech
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(initialGreeting);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [initialGreeting]);

  // Move or turn player
  const handleMove = useCallback((dx: number, dy: number) => {
    setPosX((x) => Math.max(-10, Math.min(10, x + dx)));
    setPosY((y) => Math.max(-10, Math.min(10, y + dy)));
    triggerSonarPing();
  }, [triggerSonarPing]);

  const handleTurn = useCallback((deg: number) => {
    setHeading((h) => (h + deg + 360) % 360);
    triggerSonarPing();
  }, [triggerSonarPing]);

  // Calibrate / Collect target
  const handleInteract = useCallback(() => {
    if (!currentTarget) return;
    const { distance } = getTargetSpatialMetrics(currentTarget);

    if (distance <= 2.0) {
      // Success!
      try {
        gameAudio.init();
        gameAudio.playSuccess();
      } catch {}

      const nextTargets = [...targets];
      nextTargets[activeTargetIdx].collected = true;
      setTargets(nextTargets);

      const successMsg = isBn
        ? `অভিনন্দন! আপনি সফলভাবে ${currentTarget.nameBn} ক্যালিব্রেট করেছেন!`
        : `Success! You calibrated the ${currentTarget.nameEn}!`;
      speak(successMsg);

      if (activeTargetIdx + 1 < targets.length) {
        setActiveTargetIdx((i) => i + 1);
      } else {
        setMissionComplete(true);
        if (onComplete) onComplete();
      }
    } else {
      const tooFarMsg = isBn
        ? `সেন্সরটি এখনও দূরে। কাছাকাছি যান। দূরত্ব ${Math.round(distance)} মিটার।`
        : `Target is still too far. Get closer. Distance ${Math.round(distance)} meters.`;
      speak(tooFarMsg);
    }
  }, [currentTarget, getTargetSpatialMetrics, targets, activeTargetIdx, isBn, speak, onComplete]);

  // Announce compass status
  const handleAnnounceStatus = useCallback(() => {
    if (!currentTarget) return;
    const { distance } = getTargetSpatialMetrics(currentTarget);
    const compassDir =
      heading >= 315 || heading < 45 ? (isBn ? 'উত্তর' : 'North') :
      heading >= 45 && heading < 135 ? (isBn ? 'পূর্ব' : 'East') :
      heading >= 135 && heading < 225 ? (isBn ? 'দক্ষিণ' : 'South') :
      (isBn ? 'পশ্চিম' : 'West');

    const msg = isBn
      ? `আপনার বর্তমান অবস্থান: (${posX}, ${posY})। আপনি ${compassDir} দিকে মুখ করে আছেন। টার্গেট দূরত্ব ${Math.round(distance)} মিটার।`
      : `Position: (${posX}, ${posY}). Facing ${compassDir}. Distance to target: ${Math.round(distance)} meters.`;
    speak(msg);
  }, [currentTarget, getTargetSpatialMetrics, heading, posX, posY, isBn, speak]);

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault();
          handleMove(0, 1);
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          handleMove(0, -1);
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          handleTurn(-45);
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          handleTurn(45);
          break;
        case ' ':
          e.preventDefault();
          triggerSonarPing();
          break;
        case 'enter':
          e.preventDefault();
          handleInteract();
          break;
        case 'm':
          e.preventDefault();
          handleAnnounceStatus();
          break;
        case 'h':
          e.preventDefault();
          speak(
            isBn
              ? 'কন্ট্রোল গাইড: ডব্লিউ দিয়ে সামনে, এস দিয়ে পেছনে, এ এবং ডি দিয়ে ঘুরুন। স্পেস চেপে সোনার পিং শুনুন। এন্টার চেপে সেন্সর ক্যালিব্রেট করুন। এম চাপলে কম্পাস শুনবেন।'
              : 'Controls: W to step forward, S backward, A and D to turn. Space for sonar ping. Enter to calibrate sensor. M for compass status.'
          );
          break;
        case 'escape':
          e.preventDefault();
          onBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleTurn, triggerSonarPing, handleInteract, handleAnnounceStatus, speak, isBn, onBack]);

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto" role="region" aria-label="Blind Explorer Mode">
      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {screenReaderAnnouncement}
      </div>

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
            <EyeOff className="w-6 h-6 text-[var(--ink)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="chip border-[var(--hair)] bg-[var(--panel-2)] text-[var(--signal)] text-2xs font-mono font-semibold uppercase">
                {isBn ? 'সেকশন ০৫ · ব্লাইন্ড এক্সপ্লোরার মোড' : 'SECTION 05 · BLIND EXPLORER MODE'}
              </span>
              <span className="text-xs font-mono text-[var(--ink-3)]">
                100% Inclusive Audio-First
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--ink)] mt-0.5">
              {isBn ? '৩ডি স্থানিক শব্দ ও ভয়েস গাইডে পৃথিবী অন্বেষণ' : '3D Spatial Audio & Voice-Guided Earth Exploration'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAnnounceStatus}
            className="btn btn-ghost border border-[var(--line)] text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
            aria-label="Speak Compass Heading"
          >
            <Compass className="w-4 h-4 text-[var(--signal)]" />
            <span>{isBn ? 'কম্পাস দিক শুনুন (M)' : 'Compass Status (M)'}</span>
          </button>
        </div>
      </div>

      {/* Main Sensory Sound Room */}
      <div className="p-8 sm:p-12 rounded-lg bg-[var(--ground)]/90 border-2 border-[var(--hair)] flex flex-col items-center justify-center gap-6 relative overflow-hidden text-center min-h-[340px]">
        {/* Subtle Ambient Sound Wave Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-96 h-96 rounded-full border border-[var(--signal)] animate-ping" />
          <div className="w-64 h-64 rounded-full border border-[var(--signal)] animate-pulse" />
        </div>

        <div className="w-20 h-20 rounded-full bg-[var(--panel-2)] border-2 border-[var(--signal)] flex items-center justify-center z-10">
          <Volume2 className={`w-10 h-10 text-[var(--signal)] ${activeSpeech ? 'animate-bounce' : ''}`} />
        </div>

        <div className="z-10 max-w-lg">
          <span className="chip bg-[var(--panel-2)] border-[var(--signal)] text-[var(--signal)] text-xs font-mono font-semibold uppercase px-3 py-1">
            {isBn ? `সক্রিয় লক্ষ্য #${activeTargetIdx + 1} / ${targets.length}` : `ACTIVE TARGET #${activeTargetIdx + 1} OF ${targets.length}`}
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-[var(--ink)] mt-2">
            {isBn ? currentTarget?.nameBn : currentTarget?.nameEn}
          </h3>
          <p className="text-xs font-mono text-[var(--ink-2)] mt-1">
            {currentTarget?.nasaRef}
          </p>
        </div>

        {/* Live Feedback Spoken Banner */}
        <div className="z-10 bg-[var(--abyss)]/80 border border-[var(--line)] rounded-lg px-5 py-3 max-w-md w-full">
          <p className="text-xs font-mono text-[var(--signal)]">
            {screenReaderAnnouncement || (isBn ? 'স্পেস চেপে সোনার পিং করুন...' : 'Press Space to send sonar ping...')}
          </p>
        </div>

        {/* Big Action Buttons (Touch + Keyboard Friendly) */}
        <div className="flex flex-wrap items-center justify-center gap-3 z-10 mt-2">
          <button
            onClick={triggerSonarPing}
            className="btn btn-brass text-xs font-semibold px-6 py-3 rounded-lg flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Radio className="w-4 h-4" />
            <span>{isBn ? 'সোনার পিং পাঠান (Space)' : 'Send Sonar Ping (Space)'}</span>
          </button>

          <button
            onClick={handleInteract}
            className="btn btn-ghost border border-[var(--signal)] bg-[var(--panel-2)] text-[var(--signal)] text-xs font-semibold px-6 py-3 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-[var(--panel-2)]"
          >
            <Award className="w-4 h-4" />
            <span>{isBn ? 'সেন্সর ক্যালিব্রেট করুন (Enter)' : 'Calibrate Sensor (Enter)'}</span>
          </button>
        </div>

        {/* Tactile Visual Sound Equivalent Spectrum (For Deaf / Hearing-Impaired) */}
        <div className="w-full max-w-md bg-[var(--ground)]/60 border border-[var(--line)] rounded-lg p-4 flex flex-col gap-2 z-10 mt-4">
          <div className="flex items-center justify-between text-2xs font-mono text-[var(--ink-3)] uppercase">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-[var(--signal)]" />
              {isBn ? 'শ্রবণ প্রতিবন্ধীদের জন্য ভিজ্যুয়াল সাউন্ড ওয়েভ' : 'Visual Equivalent for Hearing-Impaired'}
            </span>
            <span>{visualSpectrum.freq} Hz</span>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Left Channel */}
            <div className="flex flex-col gap-1">
              <span className="text-2xs font-mono text-left text-[var(--ink-2)]">LEFT EAR</span>
              <div className="h-3 rounded-full bg-[var(--panel-2)] overflow-hidden">
                <div
                  className="h-full bg-[var(--signal)] transition-all duration-200"
                  style={{ width: `${visualSpectrum.left}%` }}
                />
              </div>
            </div>

            {/* Right Channel */}
            <div className="flex flex-col gap-1">
              <span className="text-2xs font-mono text-right text-[var(--ink-2)]">RIGHT EAR</span>
              <div className="h-3 rounded-full bg-[var(--panel-2)] overflow-hidden">
                <div
                  className="h-full bg-[var(--signal)] transition-all duration-200 ml-auto"
                  style={{ width: `${visualSpectrum.right}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Quick Navigation Controls Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--line)] flex flex-col gap-2">
          <span className="text-2xs font-mono uppercase tracking-wider text-[var(--signal)] font-semibold">
            {isBn ? 'কীবোর্ড নেভিগেশন' : 'KEYBOARD NAVIGATION'}
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono mt-1">
            <span />
            <button
              onClick={() => handleMove(0, 1)}
              className="p-2 rounded-lg bg-[var(--ground)]/40 border border-[var(--line)] hover:border-[var(--signal)]"
            >
              W (↑)
            </button>
            <span />
            <button
              onClick={() => handleTurn(-45)}
              className="p-2 rounded-lg bg-[var(--ground)]/40 border border-[var(--line)] hover:border-[var(--signal)]"
            >
              A (←)
            </button>
            <button
              onClick={() => handleMove(0, -1)}
              className="p-2 rounded-lg bg-[var(--ground)]/40 border border-[var(--line)] hover:border-[var(--signal)]"
            >
              S (↓)
            </button>
            <button
              onClick={() => handleTurn(45)}
              className="p-2 rounded-lg bg-[var(--ground)]/40 border border-[var(--line)] hover:border-[var(--signal)]"
            >
              D (→)
            </button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--line)] flex flex-col gap-2">
          <span className="text-2xs font-mono uppercase tracking-wider text-[var(--signal)] font-semibold">
            {isBn ? 'অ্যাকশন শর্টকাট' : 'ACTION SHORTCUTS'}
          </span>
          <div className="flex flex-col gap-1.5 text-xs text-[var(--ink-2)]">
            <div className="flex justify-between">
              <span>Space:</span>
              <span className="font-mono text-[var(--ink)]">{isBn ? 'সোনার পিং' : 'Sonar Ping'}</span>
            </div>
            <div className="flex justify-between">
              <span>Enter:</span>
              <span className="font-mono text-[var(--ink)]">{isBn ? 'সেন্সর ইন্টারঅ্যাক্ট' : 'Calibrate / Collect'}</span>
            </div>
            <div className="flex justify-between">
              <span>M:</span>
              <span className="font-mono text-[var(--ink)]">{isBn ? 'কম্পাস হেডিং ভয়েস' : 'Speak Compass'}</span>
            </div>
            <div className="flex justify-between">
              <span>H:</span>
              <span className="font-mono text-[var(--ink)]">{isBn ? 'অডিও সাহায্য' : 'Spoken Help'}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--line)] flex flex-col justify-between gap-2">
          <div>
            <span className="text-2xs font-mono uppercase tracking-wider text-[var(--signal)] font-semibold">
              {isBn ? 'অ্যাকোস্টিক প্রোফাইল' : 'ACOUSTIC CALIBRATION'}
            </span>
            <p className="text-xs text-[var(--ink-2)] mt-1">
              {isBn
                ? 'দূরত্ব কমলে সোনার পিংয়ের ফ্রিকোয়েন্সি দ্রুত বৃদ্ধি পায়। হেডফোনে ৩ডি স্থানিক প্যানিং লক্ষ্য নির্দেশ করে।'
                : 'Sonar ping frequency accelerates as distance decreases. 3D spatial panning guides your exact azimuth.'}
            </p>
          </div>
          <div className="text-2xs font-mono text-[var(--signal)]">
            ✓ Web Audio HRTF Panning Active
          </div>
        </div>
      </div>

      {missionComplete && (
        <div className="p-6 rounded-lg bg-[var(--panel-2)] border-2 border-[var(--signal)] flex flex-col items-center justify-center text-center gap-3 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-[var(--panel-2)] border-2 border-[var(--signal)] flex items-center justify-center">
            <Award className="w-7 h-7 text-[var(--signal)] animate-bounce" />
          </div>
          <h3 className="text-xl font-display font-bold text-[var(--ink)]">
            {isBn ? 'মিশন সম্পন্ন! ৩টি সেন্সরই ক্যালিব্রেটেড!' : 'MISSION COMPLETE! ALL 3 SENSORS CALIBRATED!'}
          </h3>
          <p className="text-xs text-[var(--ink-2)] max-w-md">
            {isBn
              ? 'আপনি সম্পূর্ণ অডিও গাইডে স্থানিক শব্দ শুনে ৩টি গুরুত্বপূর্ণ পরিবেশ সেন্সর সফলভাবে সক্রিয় করেছেন।'
              : 'You successfully calibrated all 3 environmental sensors relying solely on 3D binaural spatial cues.'}
          </p>
          <button
            onClick={onBack}
            className="btn btn-brass px-6 py-2.5 rounded-lg text-xs font-semibold cursor-pointer mt-2"
          >
            {isBn ? 'গেম হোমে ফিরে যান' : 'Return to Game Home'}
          </button>
        </div>
      )}
    </div>
  );
};
