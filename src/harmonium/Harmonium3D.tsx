import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HARMONIUM_KEYS, harmoniumAudio, type HarmoniumNote } from './harmoniumAudio';
import { Volume2, VolumeX, Wind, Sparkles } from 'lucide-react';

interface Props {
  onNotePlayed?: (note: HarmoniumNote) => void;
  isBn?: boolean;
}

export const Harmonium3D: React.FC<Props> = ({ onNotePlayed, isBn = false }) => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [droneOn, setDroneOn] = useState(false);
  const [bellowsPumping, setBellowsPumping] = useState(false);
  const [bellowsLevel, setBellowsLevel] = useState(85);
  const [couplerOn, setCouplerOn] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Play a note
  const handleNoteStart = useCallback(
    (key: string) => {
      harmoniumAudio.noteOn(key);
      setActiveKeys((prev) => new Set(prev).add(key));
      setBellowsPumping(true);
      setBellowsLevel(Math.min(100, Math.round(harmoniumAudio.getBellowsPressure() * 100)));

      const noteDef = HARMONIUM_KEYS.find((n) => n.key === key);
      if (noteDef && onNotePlayed) {
        onNotePlayed(noteDef);
      }
    },
    [onNotePlayed]
  );

  const handleNoteEnd = useCallback((key: string) => {
    harmoniumAudio.noteOff(key);
    setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      if (next.size === 0) {
        setTimeout(() => setBellowsPumping(false), 200);
      }
      return next;
    });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const keyMap = new Map<string, string>();
    HARMONIUM_KEYS.forEach((n) => {
      keyMap.set(n.keyboardShortcut.toLowerCase(), n.key);
      keyMap.set(n.keyboardShortcut.toUpperCase(), n.key);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return; // browser / assistive shortcuts are not notes
      const harmoniumKey = keyMap.get(e.key);
      if (harmoniumKey && !activeKeys.has(harmoniumKey)) {
        e.preventDefault();
        handleNoteStart(harmoniumKey);
      }
      if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) { // on a focused button, Space still activates it
        e.preventDefault();
        harmoniumAudio.pumpBellows(0.3);
        setBellowsLevel(Math.min(100, Math.round(harmoniumAudio.getBellowsPressure() * 100)));
        setBellowsPumping(true);
        setTimeout(() => setBellowsPumping(false), 300);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const harmoniumKey = keyMap.get(e.key);
      if (harmoniumKey) {
        e.preventDefault();
        handleNoteEnd(harmoniumKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKeys, handleNoteStart, handleNoteEnd]);

  // Real-time acoustic sound wave canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isSounding = activeKeys.size > 0 || droneOn;

      if (isSounding) {
        phase += 0.08;
        const width = canvas.width;
        const height = canvas.height;
        const centerY = height / 2;

        // Golden acoustic harmonium reed harmonics wave
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#f59e0b'; // Amber-500
        for (let x = 0; x < width; x += 4) {
          const freqFactor = activeKeys.size > 0 ? 0.04 : 0.02;
          const amp = isSounding ? 14 : 2;
          const y = centerY + Math.sin(x * freqFactor + phase) * amp + Math.sin(x * freqFactor * 2 - phase) * (amp * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Shimmering second wave (female reed)
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'; // Amber-400
        for (let x = 0; x < width; x += 4) {
          const y = centerY + Math.cos(x * 0.05 - phase * 1.2) * 10;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeKeys, droneOn]);

  const handleToggleDrone = async () => {
    const res = await harmoniumAudio.toggleDrone('C4');
    setDroneOn(res);
  };

  const handleManualPump = () => {
    harmoniumAudio.pumpBellows(0.35);
    setBellowsLevel(Math.min(100, Math.round(harmoniumAudio.getBellowsPressure() * 100)));
    setBellowsPumping(true);
    setTimeout(() => setBellowsPumping(false), 300);
  };

  // Split keys into white and black keys layout
  const whiteKeys = HARMONIUM_KEYS.filter((k) => !k.isBlack);
  const blackKeys = HARMONIUM_KEYS.filter((k) => k.isBlack);

  return (
    <div className="w-full flex flex-col items-center gap-4 select-none" role="region" aria-label="3D Interactive Harmonium">
      {/* 3D Harmonium Cabinet Housing */}
      <div className="relative w-full max-w-3xl rounded-3xl p-5 sm:p-7 bg-gradient-to-b from-[#451e11] via-[#2d120a] to-[#1a0805] border-4 border-[#8b4513] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col gap-4">
        {/* Brass corner brackets decoration */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400/80 rounded-tl pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400/80 rounded-tr pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400/80 rounded-bl pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400/80 rounded-br pointer-events-none" />

        {/* Top Control Bar: Bellows Pump, Drone Stops, Coupler & Inlay Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-900/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-800 p-0.5 shadow-md flex items-center justify-center border border-amber-400/40">
              <span className="text-xl">🪗</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-amber-200 tracking-wide flex items-center gap-2">
                <span>{isBn ? 'ঐতিহ্যবাহী ক্লাসিক্যাল হারমোনিয়াম' : 'Classical Indian Teakwood Harmonium'}</span>
                <span className="chip border-amber-400/40 bg-amber-950/60 text-amber-300 text-3xs font-mono font-semibold uppercase">
                  FREE REED
                </span>
              </h3>
              <p className="text-2xs text-amber-300/70 font-mono">
                Dual Reeds (Male + Female) · Bellows Air Modulation · A4 = 440 Hz
              </p>
            </div>
          </div>

          {/* Knobs and Drone Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleDrone}
              className={`text-2xs font-semibold py-1.5 px-3 rounded-xl border flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                droneOn
                  ? 'bg-amber-500 text-black border-amber-300 shadow-amber-500/20'
                  : 'bg-black/50 border-amber-800/60 text-amber-300 hover:border-amber-400'
              }`}
              title="Continuous Sa (Root) Drone"
            >
              {droneOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{isBn ? 'সুর/ড্রোন (Sur)' : 'Sa Drone'}</span>
            </button>

            <button
              onClick={() => setCouplerOn(!couplerOn)}
              className={`text-2xs font-semibold py-1.5 px-3 rounded-xl border flex items-center gap-1 transition cursor-pointer ${
                couplerOn
                  ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                  : 'bg-black/50 border-amber-900/40 text-amber-400/50'
              }`}
            >
              <span>{isBn ? 'কাপলার' : 'Octave Coupler'}</span>
            </button>

            {/* Manual Bellows Pump Button */}
            <button
              onClick={handleManualPump}
              className={`text-2xs font-semibold py-1.5 px-3 rounded-xl border flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                bellowsPumping
                  ? 'bg-amber-400 text-black border-white scale-95'
                  : 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 border-amber-500 hover:scale-105'
              }`}
              title="Pump Bellows to charge air (or press Spacebar)"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>{isBn ? 'হাওয়া দিন (Pump)' : 'Pump Bellows (Space)'}</span>
            </button>
          </div>
        </div>

        {/* Animated Bellows Folds Visual (Expanding / Contracting on air pump) */}
        <div className="w-full h-4 rounded-full bg-black/60 border border-amber-900/50 overflow-hidden flex items-center px-1">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              bellowsPumping
                ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400 shadow-[0_0_10px_#f59e0b]'
                : 'bg-amber-600/70'
            }`}
            style={{ width: `${bellowsLevel}%` }}
          />
        </div>

        {/* Sound Grille with Acoustic Wave Visualizer */}
        <div className="relative w-full h-10 rounded-2xl bg-[#1e0a05] border border-amber-900/60 overflow-hidden flex items-center justify-center px-4">
          <canvas ref={canvasRef} width={640} height={40} className="w-full h-full block" />
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none text-3xs font-mono text-amber-400/40">
            <span>◄ BELLOWS AIR PRESSURE: {bellowsLevel}%</span>
            <span>ACOUSTIC RESONANCE CHAMBER ►</span>
          </div>
        </div>

        {/* 3D Realistic Keybed (White and Black Keys) */}
        <div className="relative w-full pt-1 pb-3 px-2 rounded-2xl bg-gradient-to-b from-[#2a1208] to-[#120603] border-2 border-amber-900/80 shadow-inner flex justify-center overflow-x-auto scroll-thin">
          <div className="relative flex min-w-[540px] max-w-full justify-between items-start pt-1 pb-1">
            {/* White Keys */}
            <div className="flex gap-1 w-full justify-between">
              {whiteKeys.map((k) => {
                const isActive = activeKeys.has(k.key);
                return (
                  <button
                    key={k.key}
                    onMouseDown={() => handleNoteStart(k.key)}
                    onMouseUp={() => handleNoteEnd(k.key)}
                    onMouseLeave={() => isActive && handleNoteEnd(k.key)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleNoteStart(k.key);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleNoteEnd(k.key);
                    }}
                    className={`relative flex-1 min-w-[34px] sm:min-w-[48px] h-36 sm:h-44 rounded-b-xl border-x border-b border-stone-400/60 flex flex-col justify-end items-center pb-2 cursor-pointer transition-all duration-75 ${
                      isActive
                        ? 'bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 shadow-[inset_0_6px_12px_rgba(0,0,0,0.6)] translate-y-1'
                        : 'bg-gradient-to-b from-[#faf6ef] via-[#f5ede0] to-[#e8decb] hover:from-white shadow-[0_6px_8px_rgba(0,0,0,0.7)]'
                    }`}
                    aria-label={`${k.swara} (${k.key}) - Shortcut: ${k.keyboardShortcut}`}
                  >
                    <span className="text-3xs font-bold font-display text-amber-950 block">
                      {isBn ? k.swaraBn : k.swara}
                    </span>
                    <span className="text-3xs font-mono text-stone-600 block mt-0.5">
                      {k.keyboardShortcut}
                    </span>
                    <span className="text-4xs font-mono text-stone-500 block">
                      {Math.round(k.freq)}Hz
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Black Keys (Overlay placed on exact swara positions) */}
            <div className="absolute top-1 left-0 right-0 flex pointer-events-none px-1">
              {/* C#4 */}
              <div className="flex w-full">
                <div className="w-[6.5%]" />
                <BlackKey
                  note={blackKeys[0]}
                  isActive={activeKeys.has(blackKeys[0].key)}
                  onStart={() => handleNoteStart(blackKeys[0].key)}
                  onEnd={() => handleNoteEnd(blackKeys[0].key)}
                  isBn={isBn}
                />
                <div className="w-[4%]" />
                {/* D#4 */}
                <BlackKey
                  note={blackKeys[1]}
                  isActive={activeKeys.has(blackKeys[1].key)}
                  onStart={() => handleNoteStart(blackKeys[1].key)}
                  onEnd={() => handleNoteEnd(blackKeys[1].key)}
                  isBn={isBn}
                />
                <div className="w-[14.5%]" />
                {/* F#4 */}
                <BlackKey
                  note={blackKeys[2]}
                  isActive={activeKeys.has(blackKeys[2].key)}
                  onStart={() => handleNoteStart(blackKeys[2].key)}
                  onEnd={() => handleNoteEnd(blackKeys[2].key)}
                  isBn={isBn}
                />
                <div className="w-[4%]" />
                {/* G#4 */}
                <BlackKey
                  note={blackKeys[3]}
                  isActive={activeKeys.has(blackKeys[3].key)}
                  onStart={() => handleNoteStart(blackKeys[3].key)}
                  onEnd={() => handleNoteEnd(blackKeys[3].key)}
                  isBn={isBn}
                />
                <div className="w-[4%]" />
                {/* A#4 */}
                <BlackKey
                  note={blackKeys[4]}
                  isActive={activeKeys.has(blackKeys[4].key)}
                  onStart={() => handleNoteStart(blackKeys[4].key)}
                  onEnd={() => handleNoteEnd(blackKeys[4].key)}
                  isBn={isBn}
                />
                <div className="w-[14.5%]" />
                {/* C#5 */}
                {blackKeys[5] && (
                  <BlackKey
                    note={blackKeys[5]}
                    isActive={activeKeys.has(blackKeys[5].key)}
                    onStart={() => handleNoteStart(blackKeys[5].key)}
                    onEnd={() => handleNoteEnd(blackKeys[5].key)}
                    isBn={isBn}
                  />
                )}
                <div className="w-[4%]" />
                {/* D#5 */}
                {blackKeys[6] && (
                  <BlackKey
                    note={blackKeys[6]}
                    isActive={activeKeys.has(blackKeys[6].key)}
                    onStart={() => handleNoteStart(blackKeys[6].key)}
                    onEnd={() => handleNoteEnd(blackKeys[6].key)}
                    isBn={isBn}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Helper Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-3xs font-mono text-amber-300/70 border-t border-amber-900/40 pt-2 px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isBn
                ? 'কীবোর্ড দিয়ে বাজান: সাদা কি (A, S, D, F, G, H, J, K, L, ;) | কালো কি (W, E, T, Y, U, O, P) | স্পেসবার = হাওয়া দেওয়া'
                : 'Computer Keys: White (A, S, D, F, G, H, J, K, L, ;) | Black (W, E, T, Y, U, O, P) | Spacebar = Bellows Pump'}
            </span>
          </div>
          <span className="text-amber-400 font-semibold">
            {activeKeys.size > 0 ? `♪ Playing: ${Array.from(activeKeys).join(', ')}` : 'Ready to Play'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual black key
const BlackKey: React.FC<{
  note: HarmoniumNote;
  isActive: boolean;
  onStart: () => void;
  onEnd: () => void;
  isBn: boolean;
}> = ({ note, isActive, onStart, onEnd, isBn }) => {
  return (
    <button
      onMouseDown={onStart}
      onMouseUp={onEnd}
      onMouseLeave={() => isActive && onEnd()}
      onTouchStart={(e) => {
        e.preventDefault();
        onStart();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onEnd();
      }}
      className={`pointer-events-auto w-[6.8%] min-w-[22px] sm:min-w-[30px] h-24 sm:h-28 rounded-b-lg border-x border-b border-black flex flex-col justify-end items-center pb-2 cursor-pointer transition-all duration-75 z-10 ${
        isActive
          ? 'bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)] translate-y-1'
          : 'bg-gradient-to-b from-[#2e1a12] via-[#1c0f0a] to-[#0a0503] hover:from-[#3d2319] shadow-[0_5px_8px_rgba(0,0,0,0.9)]'
      }`}
      aria-label={`${note.swara} (${note.key}) - Shortcut: ${note.keyboardShortcut}`}
    >
      <span className="text-4xs font-bold font-display text-amber-300 block">
        {isBn ? note.swaraBn : note.swara}
      </span>
      <span className="text-4xs font-mono text-amber-400/80 block mt-0.5">
        {note.keyboardShortcut}
      </span>
    </button>
  );
};
