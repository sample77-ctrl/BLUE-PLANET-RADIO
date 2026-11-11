import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  X,
  Volume2,
  Sparkles,
  Search,
  Brain,
  Send,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Compass,
  Play,
  Pause,
  Radio,
  Clock,
  KeyRound,
  CircleDot,
  WifiOff,
} from 'lucide-react';
import { Harmonium3D } from './Harmonium3D';
import {
  harmoniumAudio,
  HARMONIUM_KEYS,
  type HarmoniumNote,
  type PlayedNoteEvent,
} from './harmoniumAudio';
import { matchHarmoniumSound, type SoundMatchResult } from './earthSoundMatcher';
import {
  predictFutureClimateFromHarmonium,
  sendHarmoniumChatMessageDetailed,
  getAiStatus,
  subscribeAiStatus,
  PITCH_METHOD_EN,
  PITCH_METHOD_BN,
  type FuturePrediction,
  type ChatMessage,
} from './groqPredictor';
import { usePrefs } from '../lib/prefs';
import { Overlay } from '../components/Overlay';
import { useDialog } from '../lib/useDialog';
import { useHT } from './strings';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExploreGlobe?: () => void;
}

export const HarmoniumChatModal: React.FC<Props> = ({ isOpen, onClose, onExploreGlobe }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const ht = useHT();
  const aiStatus = useSyncExternalStore(subscribeAiStatus, getAiStatus);

  const [lastPlayedNote, setLastPlayedNote] = useState<HarmoniumNote | null>(null);
  const [matchResult, setMatchResult] = useState<SoundMatchResult | null>(null);
  const [futurePrediction, setFuturePrediction] = useState<FuturePrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPredictingAi, setIsPredictingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'chat'>('explorer');

  // Saved Voice Playback & Sequencing State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [isPlayingFutureVoice, setIsPlayingFutureVoice] = useState(false);
  const [savedNotes, setSavedNotes] = useState<PlayedNoteEvent[]>([]);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init',
      role: 'assistant',
      content: isBn
        ? 'নমস্কার! আমি হারমোনিয়াম আর্থ এআই (Harmonium Earth AI)। হারমোনিয়ামের যেকোনো সুর বাজান এবং সুরটি স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে। এরপর "Explore Sound in NASA Data" বাটনে ক্লিক করলে জানতে পারবেন এটি কত বছর আগের ঘটনার সাথে মিলে, অথবা "AI Future Predict" দিয়ে জানুন ভবিষ্যতে কত বছর পর এমন সুর ও উষ্ণায়ন ঘটতে পারে!'
        : 'Welcome to Harmonium Earth AI! Play any melody on the 3D harmonium; your voice sequence is automatically saved. Then click "Explore Sound in NASA Data" to discover how many years ago this event occurred, or click "AI Future Predict" to forecast what kind of future soundscape and year this represents!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeModal = () => { harmoniumAudio.stopAll(); onClose(); };
  useDialog(isOpen, closeModal, dialogRef);

  if (!isOpen) return null;

  const handleNotePlayed = (note: HarmoniumNote) => {
    setLastPlayedNote(note);
    const summary = harmoniumAudio.getPlayedSummary();
    setSavedNotes(summary.notes);
  };

  // Playback saved harmonium voice melody
  const handlePlaySavedVoice = async () => {
    if (isPlayingVoice) {
      harmoniumAudio.stopSavedSequence();
      setIsPlayingVoice(false);
      setActiveNoteIdx(null);
      return;
    }

    if (savedNotes.length === 0) {
      // If nothing played yet, play Sa as default
      harmoniumAudio.playNote('C4', 261.63);
      setSavedNotes(harmoniumAudio.getPlayedSummary().notes);
    }

    setIsPlayingVoice(true);
    await harmoniumAudio.playSavedSequence(
      (_note, idx) => setActiveNoteIdx(idx),
      () => {
        setIsPlayingVoice(false);
        setActiveNoteIdx(null);
      }
    );
  };

  // Play future synthesized climate soundscape
  const handlePlayFutureVoice = async () => {
    if (isPlayingFutureVoice) {
      harmoniumAudio.stopFutureVoicePreview();
      setIsPlayingFutureVoice(false);
      return;
    }

    const freq = lastPlayedNote?.freq || 523.25;
    const anomaly = futurePrediction?.temperatureAnomaly || 1.88;
    setIsPlayingFutureVoice(true);
    await harmoniumAudio.playFutureVoicePreview(freq, anomaly);
    window.setTimeout(() => setIsPlayingFutureVoice(false), 2900);
  };

  // Load curated voice presets
  const handleLoadPreset = (preset: 'historical-1981' | 'record-2024' | 'future-2055') => {
    harmoniumAudio.loadPresetVoice(preset);
    const summary = harmoniumAudio.getPlayedSummary();
    setSavedNotes(summary.notes);
    const last = summary.notes[summary.notes.length - 1];
    if (last) {
      setLastPlayedNote(HARMONIUM_KEYS.find((k) => k.key === last.key) || null);
    }
    setMatchResult(null);
    setFuturePrediction(null);
  };

  // Step 1: Match saved voice against NASA Historical Database
  const handleExploreSound = async () => {
    setIsAnalyzing(true);
    setFuturePrediction(null);

    const summary = harmoniumAudio.getPlayedSummary();
    const dominantPitch = lastPlayedNote ? lastPlayedNote.freq : summary.dominantFreq;

    setTimeout(async () => {
      const result = matchHarmoniumSound(dominantPitch);
      setMatchResult(result);
      setIsAnalyzing(false);

      // If it doesn't match historical or exceeds historical records, automatically trigger AI future prediction
      if (result.requiresAiPrediction || !result.matched) {
        handleTriggerAiPrediction(dominantPitch, summary.swaraSequence, result.mappedAnomaly);
      }
    }, 600);
  };

  // Step 2: Trigger Groq AI Future Climate Prediction
  const handleTriggerAiPrediction = async (
    freq?: number,
    swaras?: string,
    anomaly?: number
  ) => {
    setIsPredictingAi(true);
    const summary = harmoniumAudio.getPlayedSummary();
    const targetFreq = freq || (lastPlayedNote ? lastPlayedNote.freq : summary.dominantFreq);
    const targetSwaras = swaras || summary.swaraSequence;
    const targetAnomaly = anomaly !== undefined ? anomaly : matchResult?.mappedAnomaly || 1.6;

    try {
      const pred = await predictFutureClimateFromHarmonium(targetFreq, targetSwaras, targetAnomaly);
      setFuturePrediction(pred);

      // Add to chat as well
      const method = isBn ? PITCH_METHOD_BN : PITCH_METHOD_EN;
      const aiNote = isBn
        ? `${ht('predictionNote')}: ${ht('notForecast')}\n${ht('predictionWhy', { y: pred.predictedYear, n: pred.yearsFromNow, a: pred.temperatureAnomaly, f: Math.round(targetFreq) })}\n\n${pred.futureVoiceCharacterBn || pred.futureVoiceCharacterEn}\n\n${pred.whyAndHowBn}\n\n${method}`
        : `${ht('predictionNote')}: ${ht('notForecast')}\n${ht('predictionWhy', { y: pred.predictedYear, n: pred.yearsFromNow, a: pred.temperatureAnomaly, f: Math.round(targetFreq) })}\n\n${pred.futureVoiceCharacterEn}\n\n${pred.whyAndHowEn}\n\n${method}`;

      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: 'assistant',
          content: aiNote,
          source: pred.source,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      // Fallback handled inside predictor
    } finally {
      setIsPredictingAi(false);
    }
  };

  // Handle sending a chat message to Groq
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isChatSending) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setIsChatSending(true);

    try {
      const summary = harmoniumAudio.getPlayedSummary();
      const currentPitch = lastPlayedNote ? lastPlayedNote.freq : summary.dominantFreq;
      const mappedAnomaly = matchHarmoniumSound(currentPitch).mappedAnomaly;

      const aiReply = await sendHarmoniumChatMessageDetailed(
        [...chatMessages, newMsg].map((m) => ({ role: m.role, content: m.content })),
        { freq: currentPitch, swaraSequence: summary.swaraSequence, mappedAnomaly },
        lang,
      );

      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: aiReply.text,
          source: aiReply.source,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setChatMessages((prev) => [...prev, { id: String(Date.now() + 1), role: 'assistant', source: 'built-in', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: isBn ? 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।' : 'Something went wrong. Please try again.' }]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleReset = () => {
    harmoniumAudio.clearRecordings();
    harmoniumAudio.stopAll();
    setSavedNotes([]);
    setLastPlayedNote(null);
    setMatchResult(null);
    setFuturePrediction(null);
    setIsPlayingVoice(false);
    setIsPlayingFutureVoice(false);
  };

  const playedSummary = harmoniumAudio.getPlayedSummary();
  const dominantFreq = lastPlayedNote ? lastPlayedNote.freq : playedSummary.dominantFreq;
  const currentAnomaly = matchHarmoniumSound(dominantFreq).mappedAnomaly;

  return (
    <Overlay><div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in" onClick={closeModal}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="harmonium-title" onClick={(e) => e.stopPropagation()} className="relative max-w-4xl w-full bg-[var(--panel)] border-2 border-amber-500/50 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-5 my-4 max-h-[92vh] overflow-y-auto scroll-thin">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-red-600 p-0.5 shadow-md flex items-center justify-center">
              <span className="text-2xl" aria-hidden="true">🪗</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="chip border-amber-500/40 bg-amber-950/40 text-amber-300 text-3xs font-mono font-semibold uppercase">
                  {ht('eyebrow')}
                </span>
                <span role="status" className="text-3xs font-mono font-semibold flex items-center gap-1 text-[var(--ink-2)]">
                  {aiStatus === 'connected' ? <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> : aiStatus === 'offline' ? <WifiOff className="w-3 h-3" aria-hidden="true" /> : aiStatus === 'idle' ? <CircleDot className="w-3 h-3" aria-hidden="true" /> : <KeyRound className="w-3 h-3" aria-hidden="true" />}
                  {ht(aiStatus === 'connected' ? 'aiConnected' : aiStatus === 'offline' ? 'aiOffline' : aiStatus === 'idle' ? 'aiIdle' : 'aiUnconfigured')}
                </span>
              </div>
              <h2 id="harmonium-title" className="text-lg sm:text-xl font-display font-bold text-[var(--ink)] mt-0.5">
                {isBn ? 'হারমোনিয়াম চ্যাট: ভারতীয় সুর ও নাসার জলবায়ু অনুসন্ধান' : 'Harmonium Chat: Acoustic Resonance & Planetary Prediction'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Explorer vs AI Chat */}
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-[var(--line)]">
              <button
                onClick={() => setActiveTab('explorer')}
                className={`text-2xs font-semibold py-1 px-3 rounded-lg transition cursor-pointer ${
                  activeTab === 'explorer'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-[var(--ink-2)] hover:text-white'
                }`}
              >
                {isBn ? 'হারমোনিয়াম ও অনুসন্ধান' : 'Harmonium Explorer'}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`text-2xs font-semibold py-1 px-3 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'chat'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-[var(--ink-2)] hover:text-white'
                }`}
              >
                <Brain className="w-3 h-3" />
                <span>{isBn ? 'এআই চ্যাট' : 'AI Chat'}</span>
              </button>
            </div>

            <button
              onClick={closeModal}
              className="p-2 rounded-xl bg-black/40 border border-[var(--line)] hover:border-amber-400 cursor-pointer text-[var(--ink-2)] hover:text-white"
              aria-label="Close Harmonium Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= TAB 1: HARMONIUM EXPLORER ================= */}
        {activeTab === 'explorer' && (
          <div className="flex flex-col gap-4">
            {/* 3D Interactive Harmonium Instrument */}
            <Harmonium3D onNotePlayed={handleNotePlayed} isBn={isBn} />

            {/* ================= SECTION: SAVED VOICE & TIMELINE ================= */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-950 via-black to-stone-950 border border-amber-500/40 shadow-xl flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>{isBn ? 'সংরক্ষিত সুর (Saved Voice Track)' : 'Saved Voice & Melody Track'}</span>
                      <span className="chip border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-4xs font-mono">
                        {savedNotes.length > 0 ? `${savedNotes.length} Notes Saved` : 'Ready to Record'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Quick Presets for Instant Exploration */}
                <div className="flex items-center gap-1.5 text-3xs font-mono">
                  <span className="text-[var(--ink-3)] hidden md:inline">{isBn ? 'নমুনা সুর:' : 'Presets:'}</span>
                  <button
                    onClick={() => handleLoadPreset('historical-1981')}
                    className="py-1 px-2 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-400 text-emerald-300 hover:bg-emerald-950/30 cursor-pointer transition"
                    title="Load 1981 Baseline Sound (262 Hz)"
                  >
                    1981 Baseline (Sa)
                  </button>
                  <button
                    onClick={() => handleLoadPreset('record-2024')}
                    className="py-1 px-2 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400 text-amber-300 hover:bg-amber-950/30 cursor-pointer transition"
                    title="Load 2024 Historic Record Heat (392 Hz)"
                  >
                    2024 Record (Pa)
                  </button>
                  <button
                    onClick={() => handleLoadPreset('future-2055')}
                    className="py-1 px-2 rounded-lg bg-white/5 border border-white/10 hover:border-red-400 text-red-300 hover:bg-red-950/30 cursor-pointer transition"
                    title="Load Unprecedented Future Pitch (523 Hz)"
                  >
                    Future Pitch (Sa')
                  </button>
                </div>
              </div>

              {/* Saved Notes Sequence Strip */}
              <div className="flex items-center gap-2 overflow-x-auto scroll-thin py-1 min-h-[44px]">
                {savedNotes.length === 0 ? (
                  <span className="text-2xs font-mono text-[var(--ink-3)] italic">
                    {isBn
                      ? 'হারমোনিয়ামের চাবি চাপলেই সুর এখানে স্বয়ংক্রিয়ভাবে সেভ হবে...'
                      : 'Play any keys on the harmonium above; notes save here automatically...'}
                  </span>
                ) : (
                  savedNotes.map((note, idx) => {
                    const isStepActive = activeNoteIdx === idx;
                    return (
                      <div
                        key={`${note.key}-${note.timestamp}-${idx}`}
                        className={`shrink-0 px-2.5 py-1.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
                          isStepActive
                            ? 'bg-amber-400 text-black border-amber-300 font-semibold scale-110 shadow-lg'
                            : 'bg-white/5 border-white/10 text-stone-200'
                        }`}
                      >
                        <span className="font-semibold">{note.swara}</span>
                        <span className="text-3xs font-mono opacity-70">({Math.round(note.freq)}Hz)</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Voice Player & Action Buttons: Explore Sound in NASA Data & AI Future Predict */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  {/* Play Saved Voice Button */}
                  <button
                    onClick={handlePlaySavedVoice}
                    disabled={savedNotes.length === 0}
                    className={`btn text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition ${
                      isPlayingVoice
                        ? 'bg-red-600 text-white hover:bg-red-500'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500'
                    } disabled:opacity-50`}
                    title="Play back the saved harmonium melody"
                  >
                    {isPlayingVoice ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>
                      {isPlayingVoice
                        ? (isBn ? 'সুর থামান' : 'Stop Voice')
                        : (isBn ? 'সুর শুনুন (Play Saved Voice)' : 'Play Saved Voice')}
                    </span>
                  </button>

                  {/* Reset Saved Notes */}
                  <button
                    onClick={handleReset}
                    className="btn btn-ghost border border-[var(--line)] py-2 px-3 rounded-xl text-xs font-semibold text-[var(--ink-2)] hover:text-white cursor-pointer"
                    title="Clear saved voice and start new"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isBn ? 'মুছুন' : 'Reset'}</span>
                  </button>

                  <div className="text-3xs font-mono text-[var(--ink-3)] hidden md:block">
                    Dominant: <span className="text-amber-300 font-semibold">{Math.round(dominantFreq)} Hz</span> · Anomaly: <span className="text-amber-300 font-semibold">+{currentAnomaly}°C</span>
                  </div>
                </div>

                {/* THE TWO CORE USER-REQUESTED BUTTONS */}
                <div className="flex items-center gap-2">
                  {/* BUTTON 1: Explore Sound in NASA Data */}
                  <button
                    onClick={handleExploreSound}
                    disabled={isAnalyzing}
                    className="btn btn-brass py-2.5 px-4.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl hover:scale-105 transition cursor-pointer border border-amber-300/40"
                    title="Search historical NASA satellite database for this voice"
                  >
                    <Search className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>{isBn ? 'নাসার তথ্যে খুঁজুন (Explore Sound in NASA Data)' : 'Explore Sound in NASA Data'}</span>
                  </button>

                  {/* BUTTON 2: AI Future Predict */}
                  <button
                    onClick={() => handleTriggerAiPrediction()}
                    disabled={isPredictingAi}
                    className="btn bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white py-2.5 px-4.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xl hover:scale-105 transition cursor-pointer border border-red-400"
                    title="Forecast future planetary year, voice timbre, and causes via Groq AI"
                  >
                    <Brain className={`w-3.5 h-3.5 ${isPredictingAi ? 'animate-pulse' : ''}`} />
                    <span>{isBn ? 'ভবিষ্যৎ অনুমান (AI Future Predict)' : 'AI Future Predict'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Loading Analysis Indicator */}
            {isAnalyzing && (
              <div className="p-6 rounded-2xl bg-black/40 border border-amber-500/30 flex items-center justify-center gap-3 animate-pulse">
                <Search className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-xs font-mono text-amber-300">
                  {isBn
                    ? 'নাসার ১৪৫ বছরের স্যাটেলাইট ও তাপমাত্রা ডেটাসেটে সংরক্ষিত সুরের অনুসন্ধান চলছে...'
                    : 'Searching 145 years of NASA satellite and surface climate archives for this saved voice...'}
                </span>
              </div>
            )}

            {/* ================= RESULT CARD 1: HISTORICAL NASA MATCH ================= */}
            {matchResult && matchResult.matched && (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[var(--panel)] to-amber-950/30 border-2 border-emerald-500/50 shadow-2xl flex flex-col gap-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="chip border-emerald-500/50 bg-emerald-950/60 text-emerald-300 text-3xs font-mono font-semibold uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {isBn ? 'কাছাকাছি নাসা বছর' : 'CLOSEST NASA YEAR'}
                    </span>
                    <span className="text-xs font-mono text-emerald-300 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {matchResult.matchedYear} ({matchResult.yearsAgo} {isBn ? 'বছর আগের ডেটা' : 'Years Ago'})
                    </span>
                  </div>
                  <span className="text-3xs font-mono text-emerald-400">
                    {isBn ? 'পার্থক্য' : 'Difference'}: {(1 - matchResult.confidenceScore).toFixed(2)}°C
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <div>
                      <span className="text-3xs font-mono uppercase text-[var(--ink-3)] block">
                        {isBn ? 'কিসের ডেটা (What Data This Represents):' : 'NASA Dataset & Observation Category:'}
                      </span>
                      <h3 className="text-lg font-display font-bold text-white mt-0.5">
                        {isBn ? matchResult.mappedPhenomenonBn : matchResult.mappedPhenomenon}
                      </h3>
                    </div>

                    <p className="text-xs text-[var(--ink-2)] leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                      {isBn ? matchResult.historicalDetailsBn : matchResult.historicalDetailsEn}
                    </p>

                    <div className="text-2xs font-mono text-[var(--ink-3)] flex flex-wrap items-center gap-2">
                      <span className="text-stone-300">Dataset: {matchResult.nasaDataset}</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">{matchResult.nasaDataValue}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 flex flex-col justify-between gap-2 text-center">
                    <div>
                      <span className="text-3xs font-mono text-[var(--ink-3)] uppercase block">
                        {isBn ? 'কত বছর আগের ঘটনা' : 'HISTORICAL TIMELINE'}
                      </span>
                      <span className="text-3xl font-display font-bold text-emerald-400 block mt-0.5">
                        {matchResult.matchedYear}
                      </span>
                      <span className="text-xs font-mono text-white/80 block mt-0.5">
                        {matchResult.yearsAgo} {isBn ? 'বছর আগের ডেটা' : 'Years in the Past'}
                      </span>
                    </div>

                    {onExploreGlobe && (
                      <button
                        onClick={onExploreGlobe}
                        className="btn btn-ghost border border-emerald-500/40 text-emerald-300 text-3xs font-semibold py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer hover:bg-emerald-900/30"
                      >
                        <Compass className="w-3 h-3" />
                        <span>{isBn ? '৩ডি গ্লোবে দেখুন' : 'View on 3D Globe'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= RESULT CARD 2: UNMATCHED HISTORICAL ALERT ================= */}
            {matchResult && !matchResult.matched && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-display font-bold text-amber-300">
                      {isBn ? 'অতীতের ঐতিহাসিক রেকর্ডে মেলেনি (Above Historical Maximum)' : 'No Historical Past Match (Unprecedented Warming Level)'}
                    </h4>
                    <p className="text-xs text-[var(--ink-2)] mt-0.5 max-w-xl">
                      {isBn
                        ? `আপনার বাজানো সুরের কম্পাঙ্ক (${matchResult.frequency} Hz) নাসার ১৪৫ বছরের অতীতের কোনো রেকর্ডের সাথে মেলেনি, কারণ এটি ২০২৪ সালের সর্বোচ্চ রেকর্ডকেও ছাড়িয়ে গেছে।`
                        : `Your harmonium pitch (${matchResult.frequency} Hz) maps to +${matchResult.mappedAnomaly}°C, which exceeds the highest NASA observed record (+1.29°C in 2024).`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleTriggerAiPrediction()}
                  disabled={isPredictingAi}
                  className="btn bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5 shrink-0 shadow-lg cursor-pointer hover:scale-105"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>{isBn ? 'এআই দিয়ে ভবিষ্যৎ জানুন' : 'Predict Future with AI'}</span>
                </button>
              </div>
            )}

            {/* ================= RESULT CARD 3: AI FUTURE CLIMATE PREDICTION (GROQ) ================= */}
            {futurePrediction && (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[var(--panel)] to-red-950/40 border-2 border-amber-500/60 shadow-2xl flex flex-col gap-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="chip border-amber-500/50 bg-amber-950/60 text-amber-300 text-3xs font-mono font-semibold uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {futurePrediction.source === 'ai' ? ht('predBadgeAi') : ht('predBadgeBuiltIn')}
                    </span>
                    <span className="text-xs font-mono text-red-300 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isBn ? `সাল ${futurePrediction.predictedYear} (${futurePrediction.yearsFromNow} বছর পর)` : `Year ${futurePrediction.predictedYear} (+${futurePrediction.yearsFromNow} Years Ahead)`}
                    </span>
                  </div>
                  <span className="text-3xs font-mono text-amber-400 font-semibold">
                    {isBn ? 'পিচ থেকে অসংগতি' : 'Anomaly from pitch'}: +{futurePrediction.temperatureAnomaly}°C
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 flex flex-col gap-2.5">
                    <div>
                      <span className="text-3xs font-mono uppercase text-[var(--ink-3)] block">
                        {ht('predictionTitle')}:
                      </span>
                      <h3 className="text-lg font-display font-bold text-amber-200 mt-0.5">
                        {isBn ? futurePrediction.phenomenonTitleBn : futurePrediction.phenomenonTitleEn}
                      </h3>
                    </div>

                    {/* Future Voice Character ("ভবিষ্যতে কেমন সুর/পরিবেশ হতে পারে") */}
                    <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-2xs font-mono uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                          {isBn ? 'ভবিষ্যতে কেমন সুর ও শব্দ হতে পারে (Future Voice Character):' : 'Future Voice & Sonic Atmosphere:'}
                        </span>

                        {/* Interactive Future Voice Sonification Preview Button */}
                        <button
                          onClick={handlePlayFutureVoice}
                          className={`py-1 px-2.5 rounded-lg text-3xs font-semibold flex items-center gap-1 border transition cursor-pointer ${
                            isPlayingFutureVoice
                              ? 'bg-red-600 border-red-400 text-white animate-pulse'
                              : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                          }`}
                          title="Listen to synthesized future planetary voice"
                        >
                          {isPlayingFutureVoice ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{isPlayingFutureVoice ? (isBn ? 'থামান' : 'Stop') : (isBn ? 'ভবিষ্যতের রূপ শুনুন' : 'Listen to Future Voice')}</span>
                        </button>
                      </div>
                      <p className="text-xs text-stone-200 leading-relaxed italic">
                        "{isBn ? (futurePrediction.futureVoiceCharacterBn || futurePrediction.futureVoiceCharacterEn) : futurePrediction.futureVoiceCharacterEn}"
                      </p>
                    </div>

                    {/* Why and How it will happen ("কেন ও কীভাবে হবে") */}
                    <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-900/60 flex flex-col gap-1.5">
                      <span className="text-2xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        {isBn ? 'কেন ও কীভাবে এই উষ্ণায়ন ঘটবে (Why & How):' : 'Why & How This State Will Emerge:'}
                      </span>
                      <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                        {isBn ? futurePrediction.whyAndHowBn : futurePrediction.whyAndHowEn}
                      </p>
                    </div>

                    {/* Key Drivers List */}
                    <div className="flex flex-col gap-1 mt-0.5">
                      <span className="text-3xs font-mono text-[var(--ink-3)] uppercase">
                        {isBn ? 'প্রধান প্রভাবক ও জলবায়ু চালক:' : 'Key Climate Drivers & Feedback Loops:'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-3xs font-mono">
                        {(isBn ? futurePrediction.keyDriversBn : futurePrediction.keyDrivers).map((d, i) => (
                          <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5 text-stone-300">
                            • {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Future Year & Musical Raga Analogy Card */}
                  <div className="p-4 rounded-2xl bg-black/70 border border-amber-500/40 flex flex-col justify-between gap-3 text-center">
                    <div>
                      <span className="text-3xs font-mono text-[var(--ink-3)] uppercase block">
                        {isBn ? 'দৃষ্টান্তমূলক সাল' : 'ILLUSTRATIVE YEAR'}
                      </span>
                      <span className="text-4xl font-display font-bold text-amber-400 block mt-1">
                        {futurePrediction.predictedYear}
                      </span>
                      <span className="text-2xs font-mono text-amber-300/80 block mt-0.5">
                        {isBn ? `ভবিষ্যতে ${futurePrediction.yearsFromNow} বছর পর` : `In ${futurePrediction.yearsFromNow} Years Ahead`}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-3xs text-left">
                      <span className="text-amber-300 font-semibold block mb-0.5">
                        {isBn ? 'রাগ ও সুরের তাৎপর্য:' : 'Musical Raga Analogy:'}
                      </span>
                      <p className="text-[var(--ink-2)]">
                        {isBn ? futurePrediction.musicalRagaAnalogyBn : futurePrediction.musicalRagaAnalogy}
                      </p>
                    </div>

                    <div className="text-4xs font-mono text-[var(--ink-3)]">
                      {isBn ? PITCH_METHOD_BN : PITCH_METHOD_EN}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: AI CHAT WITH HARMONIUM EARTH ================= */}
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-4 min-h-[460px]">
            {/* Live Context Banner */}
            <div className="p-3 rounded-2xl bg-black/60 border border-[var(--line)] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white">Harmonium Earth AI</span>
              </div>
              <span className="text-3xs font-mono text-amber-400">
                Pitched at: {lastPlayedNote ? `${lastPlayedNote.swara} (${Math.round(lastPlayedNote.freq)} Hz)` : '261 Hz (Sa)'}
              </span>
            </div>

            {/* Chat Messages Stream */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto max-h-[380px] p-3 rounded-2xl bg-black/40 border border-[var(--line)] flex flex-col gap-3 scroll-thin"
            >
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-auto bg-[var(--signal)] text-black font-medium'
                      : 'mr-auto bg-stone-900/90 text-stone-200 border border-amber-900/40'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && msg.source === 'built-in' && msg.id !== 'init' && <span className="text-3xs font-mono mt-1 text-stone-300">{ht('chatSourceBuiltIn')}</span>}
                  <span className={`text-4xs font-mono mt-1 ${msg.role === 'user' ? 'text-black/60 text-right' : 'text-stone-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              ))}
              {isChatSending && (
                <div className="mr-auto bg-stone-900/90 text-amber-300 border border-amber-900/40 rounded-2xl p-3 text-xs flex items-center gap-2 animate-pulse">
                  <Brain className="w-4 h-4 animate-spin" />
                  <span>{isBn ? 'হারমোনিয়াম এআই চিন্তা করছে...' : 'Harmonium Earth AI is thinking...'}</span>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 text-3xs font-mono">
              <button
                onClick={() => setInputMessage(isBn ? 'এই সুরটি কি আমাজনের দাবানলের সাথে মেলে?' : 'Does this pitch relate to Amazon wildfires?')}
                className="py-1 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400 text-[var(--ink-2)] hover:text-white cursor-pointer"
              >
                {isBn ? 'আমাজনের দাবানল?' : 'Amazon wildfires?'}
              </button>
              <button
                onClick={() => setInputMessage(isBn ? 'ভবিষ্যতে তাপমাত্রা ২ ডিগ্রি বাড়লে কী হবে?' : 'What happens if temperatures rise by 2°C?')}
                className="py-1 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400 text-[var(--ink-2)] hover:text-white cursor-pointer"
              >
                {isBn ? '২ ডিগ্রি বাড়লে কী হবে?' : 'What if temps rise 2°C?'}
              </button>
              <button
                onClick={() => setInputMessage(isBn ? 'ভারতীয় রাগের সাথে নাসার তথ্যের সম্পর্ক কী?' : 'How do Indian ragas connect to NASA satellite data?')}
                className="py-1 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400 text-[var(--ink-2)] hover:text-white cursor-pointer"
              >
                {isBn ? 'রাগের সাথে নাসার সম্পর্ক?' : 'Ragas & NASA data?'}
              </button>
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isBn ? 'হারমোনিয়ামের সুর বা ভবিষ্যৎ জলবায়ু নিয়ে প্রশ্ন করুন...' : 'Ask about harmonium sound, NASA observations, or future climate...'}
                className="flex-1 bg-black/60 border border-[var(--line)] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-[var(--ink-3)] focus:border-amber-400 outline-none"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isChatSending}
                className="btn btn-brass py-2.5 px-4 rounded-2xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isBn ? 'পাঠান' : 'Send'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div></Overlay>
  );
};
