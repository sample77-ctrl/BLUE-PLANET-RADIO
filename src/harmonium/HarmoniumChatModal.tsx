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
import '../game/quest.css';
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
        ? 'নমস্কার! হারমোনিয়ামে যেকোনো সুর বাজান, সুরটি নিজে থেকে সংরক্ষিত হবে। "নাসার ডেটায় খুঁজুন" চাপলে দেখবেন সুরের উচ্চতা GISTEMP স্ন্যাপশটের কোন বছরের কাছাকাছি, আর "ভবিষ্যৎ দৃষ্টান্ত" দেখাবে সুর থেকে একটি দৃষ্টান্তমূলক সাল। এটি পূর্বাভাস নয়।'
        : 'Welcome! Play any melody on the harmonium; it is saved automatically. "Explore Sound in NASA Data" finds the year in the GISTEMP snapshot whose anomaly is closest to your pitch, and "AI Future Predict" shows an illustrative year from the same pitch mapping. It is not a forecast.',
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

  const statusIcon = aiStatus === 'connected' ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> : aiStatus === 'offline' ? <WifiOff className="w-3.5 h-3.5" aria-hidden="true" /> : aiStatus === 'idle' ? <CircleDot className="w-3.5 h-3.5" aria-hidden="true" /> : <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />;
  const statusText = ht(aiStatus === 'connected' ? 'aiConnected' : aiStatus === 'offline' ? 'aiOffline' : aiStatus === 'idle' ? 'aiIdle' : 'aiUnconfigured');
  const method = isBn ? PITCH_METHOD_BN : PITCH_METHOD_EN;
  const presets: { id: 'historical-1981' | 'record-2024' | 'future-2055'; label: string; title: string }[] = [
    { id: 'historical-1981', label: isBn ? '১৯৮১ ভিত্তি (সা)' : '1981 baseline (Sa)', title: isBn ? '১৯৮১-র ভিত্তি সুর (২৬২ Hz) লোড করুন' : 'Load the 1981 baseline sound (262 Hz)' },
    { id: 'record-2024', label: isBn ? '২০২৪ রেকর্ড (পা)' : '2024 record (Pa)', title: isBn ? '২০২৪-এর রেকর্ড উষ্ণতার সুর (৩৯২ Hz) লোড করুন' : 'Load the 2024 record-heat sound (392 Hz)' },
    { id: 'future-2055', label: isBn ? 'উঁচু সুর (সা\')' : "High pitch (Sa')", title: isBn ? 'নথিভুক্ত সবকিছুর ওপরের সুর (৫২৩ Hz) লোড করুন' : 'Load a pitch above every recorded value (523 Hz)' },
  ];

  return (
    <Overlay><div className="fixed inset-0 z-[70] scrim backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in" onClick={closeModal}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="harmonium-title" onClick={(e) => e.stopPropagation()} className="q-dialog relative max-w-4xl w-full p-4 sm:p-6 flex flex-col gap-4 my-4 max-h-[92vh] overflow-y-auto scroll-thin">
        {/* Header. DOM order is title, tabs, close (CSS order puts close beside the title): the first focusable is a tab, not Close,
            so a Space press meant to pump the bellows can never activate Close. */}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-4">
          <div className="min-w-0 flex-1 order-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="q-label">{ht('eyebrow')}</span>
              <span role="status" className="chip">{statusIcon}{statusText}</span>
            </div>
            <h2 id="harmonium-title" className="text-xl sm:text-2xl font-display font-bold text-[var(--ink)] mt-1">
              {isBn ? 'হারমোনিয়াম চ্যাট: সুর ও নাসার জলবায়ু ডেটা' : 'Harmonium Chat: pitch and NASA climate data'}
            </h2>
          </div>
          <div role="tablist" aria-label={ht('tabsLabel')} className="order-3 w-full flex border-b border-[var(--hair)] -mx-1">
            <button type="button" role="tab" id="hm-tab-explorer" aria-selected={activeTab === 'explorer'} aria-controls="hm-panel-explorer" tabIndex={activeTab === 'explorer' ? 0 : -1} onClick={() => setActiveTab('explorer')} className="q-tab">{ht('tabExplorer')}</button>
            <button type="button" role="tab" id="hm-tab-chat" aria-selected={activeTab === 'chat'} aria-controls="hm-panel-chat" tabIndex={activeTab === 'chat' ? 0 : -1} onClick={() => setActiveTab('chat')} className="q-tab"><Brain className="w-4 h-4" aria-hidden="true" />{ht('tabChat')}</button>
          </div>
          <button type="button" onClick={closeModal} className="btn btn-icon shrink-0 order-2" aria-label={ht('closeHarmonium')} title={ht('closeHarmonium')}>
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* ================= EXPLORER ================= */}
        {activeTab === 'explorer' && (
          <div role="tabpanel" id="hm-panel-explorer" aria-labelledby="hm-tab-explorer" className="flex flex-col gap-4">
            <Harmonium3D onNotePlayed={handleNotePlayed} isBn={isBn} />

            {/* Saved voice */}
            <div className="q-card flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[var(--ink-2)]" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-[var(--ink)]">{isBn ? 'সংরক্ষিত সুর' : 'Saved melody'}</h3>
                  <span className="chip">{savedNotes.length > 0 ? (isBn ? `${savedNotes.length}টি স্বর` : `${savedNotes.length} notes`) : (isBn ? 'ফাঁকা' : 'empty')}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="q-label">{isBn ? 'নমুনা সুর:' : 'Sample melodies:'}</span>
                  {presets.map((p) => (
                    <button key={p.id} type="button" onClick={() => handleLoadPreset(p.id)} className="btn text-xs" title={p.title}>{p.label}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto scroll-thin py-1 min-h-[44px]" aria-label={isBn ? 'সংরক্ষিত স্বর' : 'Saved notes'}>
                {savedNotes.length === 0 ? (
                  <span className="text-xs text-[var(--ink-3)]">
                    {isBn ? 'হারমোনিয়ামের চাবি চাপলেই সুর এখানে সেভ হবে।' : 'Play any keys above; notes save here automatically.'}
                  </span>
                ) : (
                  savedNotes.map((note, idx) => (
                    <span key={`${note.key}-${note.timestamp}-${idx}`} aria-current={activeNoteIdx === idx ? 'true' : undefined}
                      className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${activeNoteIdx === idx ? 'bg-[var(--signal)] text-[var(--on-signal)] border-[var(--signal)] font-semibold' : 'bg-[var(--ground)] border-[var(--hair)] text-[var(--ink)]'}`}>
                      <span className="font-semibold">{note.swara}</span>
                      <span className="font-mono opacity-80">{Math.round(note.freq)} Hz</span>
                    </span>
                  ))
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--hair)]">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={handlePlaySavedVoice} disabled={savedNotes.length === 0} className="btn text-sm disabled:opacity-50" title={isBn ? 'সংরক্ষিত সুর বাজান' : 'Play back the saved melody'}>
                    {isPlayingVoice ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                    <span>{isPlayingVoice ? (isBn ? 'থামান' : 'Stop') : (isBn ? 'সংরক্ষিত সুর শুনুন' : 'Play saved melody')}</span>
                  </button>
                  <button type="button" onClick={handleReset} className="btn btn-ghost text-sm" title={isBn ? 'সংরক্ষিত সুর মুছে নতুন করে শুরু' : 'Clear the saved melody and start again'}>
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>{isBn ? 'মুছুন' : 'Reset'}</span>
                  </button>
                  <p className="text-xs font-mono text-[var(--ink-2)]">
                    {isBn ? 'প্রধান সুর' : 'Dominant'}: <span className="text-[var(--ink)] font-semibold">{Math.round(dominantFreq)} Hz</span> · {isBn ? 'সুর থেকে অসংগতি (দৃষ্টান্ত)' : 'Anomaly from pitch (illustrative)'}: <span className="text-[var(--ink)] font-semibold">+{currentAnomaly}°C</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={handleExploreSound} disabled={isAnalyzing} className="btn btn-brass text-sm" title={isBn ? 'নাসার GISTEMP স্ন্যাপশটে কাছাকাছি বছর খুঁজুন' : 'Find the closest year in the NASA GISTEMP snapshot'}>
                    <Search className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} aria-hidden="true" />
                    <span>{isBn ? 'নাসার ডেটায় খুঁজুন' : 'Explore Sound in NASA Data'}</span>
                  </button>
                  <button type="button" onClick={() => handleTriggerAiPrediction()} disabled={isPredictingAi} className="btn text-sm" title={isBn ? 'সুর থেকে একটি দৃষ্টান্তমূলক ভবিষ্যৎ সাল' : 'An illustrative future year from your pitch'}>
                    <Brain className={`w-4 h-4 ${isPredictingAi ? 'animate-pulse' : ''}`} aria-hidden="true" />
                    <span>{isBn ? 'ভবিষ্যৎ দৃষ্টান্ত' : 'AI Future Predict'}</span>
                  </button>
                </div>
              </div>
              {aiStatus === 'unconfigured' && <p className="text-xs text-[var(--ink-3)]">{ht('predictHint')}</p>}
            </div>

            {isAnalyzing && (
              <div role="status" className="q-card flex items-center justify-center gap-3">
                <Search className="w-4 h-4 text-[var(--ink-2)] animate-spin" aria-hidden="true" />
                <span className="text-xs font-mono text-[var(--ink-2)]">
                  {isBn ? 'নাসার ১৪৬ বছরের GISTEMP স্ন্যাপশটে খোঁজা হচ্ছে...' : 'Searching the bundled 146-year NASA GISTEMP snapshot...'}
                </span>
              </div>
            )}

            {/* Result 1: closest NASA year */}
            {matchResult && matchResult.matched && (
              <div className="q-card border-l-[3px] border-l-[var(--warm)] flex flex-col gap-3 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="chip"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />{isBn ? 'কাছাকাছি নাসা বছর' : 'CLOSEST NASA YEAR'}</span>
                  <span className="text-xs font-mono text-[var(--ink-2)]">{isBn ? 'পার্থক্য' : 'Difference'}: {(1 - matchResult.confidenceScore).toFixed(2)}°C</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <span className="q-label">{isBn ? 'এটি কিসের ডেটা' : 'What this year is known for'}</span>
                    <h3 className="text-lg font-display font-bold text-[var(--ink)]">{isBn ? matchResult.mappedPhenomenonBn : matchResult.mappedPhenomenon}</h3>
                    <p className="text-sm text-[var(--ink-2)] leading-relaxed">{isBn ? matchResult.historicalDetailsBn : matchResult.historicalDetailsEn}</p>
                    <p className="text-xs font-mono text-[var(--ink-3)]">{matchResult.nasaDataset} · {matchResult.nasaDataValue}</p>
                  </div>
                  <div className="q-panel p-3 flex flex-col justify-between gap-2 text-center">
                    <div>
                      <span className="q-label block">{isBn ? 'বছর' : 'YEAR'}</span>
                      <span className="text-3xl font-display font-bold text-[var(--ink)] block mt-1 tnum">{matchResult.matchedYear}</span>
                      <span className="text-xs font-mono text-[var(--ink-2)] block mt-1">{matchResult.yearsAgo} {isBn ? 'বছর আগে' : 'years ago'}</span>
                    </div>
                    {onExploreGlobe && (
                      <button type="button" onClick={onExploreGlobe} className="btn text-xs"><Compass className="w-4 h-4" aria-hidden="true" /><span>{isBn ? '৩ডি গ্লোবে দেখুন' : 'View on 3D Globe'}</span></button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Result 2: above every NASA value */}
            {matchResult && !matchResult.matched && (
              <div className="q-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--ink-2)]" aria-hidden="true" />
                  <div>
                    <h4 className="text-sm font-display font-bold text-[var(--ink)]">{isBn ? 'নাসার রেকর্ডে কাছাকাছি কোনো বছর নেই' : 'No close year in the NASA record'}</h4>
                    <p className="text-sm text-[var(--ink-2)] mt-0.5 max-w-xl">
                      {isBn
                        ? `আপনার সুর (${matchResult.frequency} Hz) একটি দৃষ্টান্তমূলক নিয়মে +${matchResult.mappedAnomaly}°C-এ রূপান্তরিত হয়েছে। এটি GISTEMP স্ন্যাপশটের কোনো বছরের কাছাকাছি নয় (সর্বোচ্চ ২০২৪ সালে +১.২৯°C)।`
                        : `Your pitch (${matchResult.frequency} Hz) maps to +${matchResult.mappedAnomaly}°C by an illustrative rule. That is not close to any year in the GISTEMP snapshot (highest: +1.29°C in 2024).`}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => handleTriggerAiPrediction()} disabled={isPredictingAi} className="btn text-sm shrink-0">
                  <Brain className="w-4 h-4" aria-hidden="true" /><span>{isBn ? 'ভবিষ্যৎ দৃষ্টান্ত দেখুন' : 'Show an illustrative future'}</span>
                </button>
              </div>
            )}

            {/* Result 3: illustrative future */}
            {futurePrediction && (
              <div className="q-card border-l-[3px] border-l-[var(--brass)] flex flex-col gap-3 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="chip"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" />{futurePrediction.source === 'ai' ? ht('predBadgeAi') : ht('predBadgeBuiltIn')}</span>
                  <span className="text-xs font-mono text-[var(--ink)] font-semibold">{ht('notForecast')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 flex flex-col gap-3">
                    <div>
                      <span className="q-label block">{ht('predictionTitle')}</span>
                      <h3 className="text-lg font-display font-bold text-[var(--ink)] mt-1">{isBn ? futurePrediction.phenomenonTitleBn : futurePrediction.phenomenonTitleEn}</h3>
                    </div>
                    <div className="q-panel p-3 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="q-label flex items-center gap-1.5"><Volume2 className="w-4 h-4" aria-hidden="true" />{isBn ? 'কেমন শোনাতে পারে' : 'How it might sound'}</span>
                        <button type="button" onClick={handlePlayFutureVoice} aria-pressed={isPlayingFutureVoice} className="btn text-xs" title={isBn ? 'সংশ্লেষিত শব্দ শুনুন' : 'Listen to the synthesized sound'}>
                          {isPlayingFutureVoice ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                          <span>{isPlayingFutureVoice ? (isBn ? 'থামান' : 'Stop') : (isBn ? 'শুনুন' : 'Listen')}</span>
                        </button>
                      </div>
                      <p className="text-sm text-[var(--ink)] leading-relaxed italic">“{isBn ? (futurePrediction.futureVoiceCharacterBn || futurePrediction.futureVoiceCharacterEn) : futurePrediction.futureVoiceCharacterEn}”</p>
                    </div>
                    <div className="q-panel p-3 flex flex-col gap-1.5">
                      <span className="q-label">{isBn ? 'প্রসঙ্গ' : 'Context'}</span>
                      <p className="text-sm text-[var(--ink-2)] leading-relaxed">{isBn ? futurePrediction.whyAndHowBn : futurePrediction.whyAndHowEn}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="q-label">{isBn ? 'প্রধান জলবায়ু প্রক্রিয়া' : 'Climate processes involved'}</span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        {(isBn ? futurePrediction.keyDriversBn : futurePrediction.keyDrivers).map((d, i) => (
                          <li key={i} className="q-panel p-2 text-[var(--ink-2)]">{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="q-panel p-3 flex flex-col justify-between gap-3 text-center">
                    <div>
                      <span className="q-label block">{isBn ? 'দৃষ্টান্তমূলক সাল' : 'ILLUSTRATIVE YEAR'}</span>
                      <span className="text-4xl font-display font-bold text-[var(--ink)] block mt-1 tnum">{futurePrediction.predictedYear}</span>
                      <span className="text-xs font-mono text-[var(--ink-2)] block mt-1">{isBn ? `${futurePrediction.yearsFromNow} বছর পর` : `+${futurePrediction.yearsFromNow} years`} · +{futurePrediction.temperatureAnomaly}°C</span>
                    </div>
                    <div className="q-panel p-2.5 text-xs text-left">
                      <span className="text-[var(--ink)] font-semibold block mb-0.5">{isBn ? 'রাগের সঙ্গে তুলনা:' : 'Raga analogy:'}</span>
                      <p className="text-[var(--ink-2)]">{isBn ? futurePrediction.musicalRagaAnalogyBn : futurePrediction.musicalRagaAnalogy}</p>
                    </div>
                    <p className="text-xs font-mono text-[var(--ink-3)] text-left">{method}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= CHAT ================= */}
        {activeTab === 'chat' && (
          <div role="tabpanel" id="hm-panel-chat" aria-labelledby="hm-tab-chat" className="flex flex-col gap-3 min-h-[420px]">
            <div className="q-panel p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-semibold text-[var(--ink)]"><Brain className="w-4 h-4 text-[var(--ink-2)]" aria-hidden="true" />Harmonium Earth AI</span>
              <span className="text-xs font-mono text-[var(--ink-2)]">{isBn ? 'সুর' : 'Pitch'}: {lastPlayedNote ? `${lastPlayedNote.swara} (${Math.round(lastPlayedNote.freq)} Hz)` : '262 Hz (Sa)'}</span>
            </div>

            <div ref={chatScrollRef} role="log" tabIndex={0} aria-live="polite" aria-label={isBn ? 'চ্যাট' : 'Chat'} className="flex-1 overflow-y-auto max-h-[380px] p-3 bg-[var(--ground)] border border-[var(--hair)] rounded-lg flex flex-col gap-3 scroll-thin">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col max-w-[88%] rounded-lg p-3 text-sm leading-relaxed ${msg.role === 'user' ? 'ml-auto bg-[var(--signal)] text-[var(--on-signal)] font-medium' : 'mr-auto bg-[var(--panel-2)] text-[var(--ink)] border border-[var(--hair)]'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && msg.source === 'built-in' && msg.id !== 'init' && <span className="text-xs font-mono mt-1.5 text-[var(--ink-2)]">{ht('chatSourceBuiltIn')}</span>}
                  <span className={`text-xs font-mono mt-1 ${msg.role === 'user' ? 'text-[var(--on-signal)] text-right' : 'text-[var(--ink-3)]'}`}>{msg.timestamp}</span>
                </div>
              ))}
              {isChatSending && (
                <div role="status" className="mr-auto bg-[var(--panel-2)] text-[var(--ink-2)] border border-[var(--hair)] rounded-lg p-3 text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 animate-pulse" aria-hidden="true" />
                  <span>{isBn ? 'হারমোনিয়াম এআই ভাবছে...' : 'Harmonium Earth AI is thinking...'}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { en: 'Does this pitch relate to Amazon wildfires?', bn: 'এই সুরটি কি আমাজনের দাবানলের সাথে মেলে?', sEn: 'Amazon wildfires?', sBn: 'আমাজনের দাবানল?' },
                { en: 'What happens if temperatures rise by 2°C?', bn: 'ভবিষ্যতে তাপমাত্রা ২ ডিগ্রি বাড়লে কী হবে?', sEn: 'What if temps rise 2°C?', sBn: '২ ডিগ্রি বাড়লে কী হবে?' },
                { en: 'How do Indian ragas connect to NASA satellite data?', bn: 'ভারতীয় রাগের সাথে নাসার তথ্যের সম্পর্ক কী?', sEn: 'Ragas & NASA data?', sBn: 'রাগের সাথে নাসার সম্পর্ক?' },
              ].map((q) => (
                <button key={q.en} type="button" onClick={() => setInputMessage(isBn ? q.bn : q.en)} className="btn text-xs">{isBn ? q.sBn : q.sEn}</button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                aria-label={isBn ? 'আপনার প্রশ্ন' : 'Your question'}
                placeholder={isBn ? 'হারমোনিয়ামের সুর বা জলবায়ু নিয়ে প্রশ্ন করুন...' : 'Ask about harmonium sound, NASA observations, or climate...'}
                className="flex-1 min-h-[44px] bg-[var(--ground)] border border-[var(--hair)] rounded-lg px-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:border-[var(--signal)] outline-none"
              />
              <button type="submit" disabled={!inputMessage.trim() || isChatSending} className="btn btn-brass text-sm disabled:opacity-50">
                <Send className="w-4 h-4" aria-hidden="true" /><span>{isBn ? 'পাঠান' : 'Send'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div></Overlay>
  );
};
