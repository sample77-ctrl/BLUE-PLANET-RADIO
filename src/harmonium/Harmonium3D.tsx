import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HARMONIUM_KEYS, harmoniumAudio, type HarmoniumNote } from './harmoniumAudio';
import { Volume2, VolumeX, Wind, Keyboard } from 'lucide-react';
import '../game/quest.css';

interface Props {
  onNotePlayed?: (note: HarmoniumNote) => void;
  isBn?: boolean;
}

export const Harmonium3D: React.FC<Props> = ({ onNotePlayed, isBn = false }) => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [droneOn, setDroneOn] = useState(false);
  const [bellowsPumping, setBellowsPumping] = useState(false);
  const [bellowsLevel, setBellowsLevel] = useState(85);

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
    const tok = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#baed3f';

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isSounding = activeKeys.size > 0 || droneOn;

      // idle: a flat line, so the strip never looks broken
      ctx.beginPath(); ctx.lineWidth = 1; ctx.strokeStyle = tok('--hair'); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
      if (isSounding) {
        phase += 0.08;
        const width = canvas.width;
        const height = canvas.height;
        const centerY = height / 2;

        // Reed harmonics wave: the signal colour, read live from the theme
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = tok('--signal');
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
        ctx.strokeStyle = tok('--ink-3');
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
  // a black key sits on the seam after the white key it follows (the chromatic order of HARMONIUM_KEYS)
  const blackLeft = (k: HarmoniumNote) => {
    const i = HARMONIUM_KEYS.indexOf(k);
    const whitesBefore = HARMONIUM_KEYS.slice(0, i).filter((n) => !n.isBlack).length;
    return `calc(${(whitesBefore / whiteKeys.length) * 100}% - 3.1%)`;
  };
  const keyProps = (k: HarmoniumNote, on: boolean) => ({
    type: 'button' as const,
    'aria-pressed': on,
    'aria-label': `${isBn ? k.swaraBn : k.swara}, ${Math.round(k.freq)} Hz, ${isBn ? 'কীবোর্ড' : 'keyboard'} ${k.keyboardShortcut}`,
    'data-on': on,
    onMouseDown: () => handleNoteStart(k.key),
    onMouseUp: () => handleNoteEnd(k.key),
    onMouseLeave: () => on && handleNoteEnd(k.key),
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); handleNoteStart(k.key); },
    onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); handleNoteEnd(k.key); },
    // Enter / Space on a focused key plays it too (the letter keys already do)
    onKeyDown: (e: React.KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); e.stopPropagation(); if (!on) handleNoteStart(k.key); } },
    onKeyUp: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleNoteEnd(k.key); } },
  });

  return (
    <div className="w-full flex flex-col gap-3 select-none" role="region" aria-label={isBn ? 'ইন্টার‍্যাক্টিভ হারমোনিয়াম' : 'Interactive harmonium'}>
      <div className="hm-case p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base text-[var(--ink)] flex flex-wrap items-center gap-2">
              <span>{isBn ? 'হারমোনিয়াম' : 'Harmonium'}</span>
              <span className="chip">{isBn ? 'ফ্রি রিড' : 'FREE REED'}</span>
            </h3>
            <p className="q-label mt-1">{isBn ? 'দুই রিড · হাওয়ার চাপ · A4 = 440 Hz' : 'Two reeds · bellows pressure · A4 = 440 Hz'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleToggleDrone} aria-pressed={droneOn} className="btn text-sm" title={isBn ? 'অবিরাম সা (মূল সুর) ড্রোন' : 'Continuous Sa (root) drone'}>
              {droneOn ? <Volume2 className="w-4 h-4" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
              <span>{isBn ? 'সা ড্রোন' : 'Sa drone'}</span>
            </button>
            <button type="button" onClick={handleManualPump} aria-pressed={bellowsPumping} className="btn text-sm" title={isBn ? 'হাওয়া দিন (বা স্পেসবার চাপুন)' : 'Pump the bellows (or press Space)'}>
              <Wind className="w-4 h-4" aria-hidden="true" />
              <span>{isBn ? 'হাওয়া দিন' : 'Pump bellows'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between q-label"><span id="bellows-label">{isBn ? 'বেলোজ চাপ' : 'Bellows pressure'}</span><span className="tnum">{bellowsLevel}%</span></div>
          <div className="q-bar" role="meter" aria-labelledby="bellows-label" aria-valuemin={0} aria-valuemax={100} aria-valuenow={bellowsLevel}><i style={{ width: `${bellowsLevel}%` }} /></div>
        </div>

        <div className="h-10 bg-[var(--ground)] border border-[var(--hair)] rounded-lg overflow-hidden">
          <canvas ref={canvasRef} width={640} height={40} className="w-full h-full block" aria-hidden="true" />
        </div>

        <div className="hm-keybed">
          <div className="hm-keys" role="group" aria-label={isBn ? 'হারমোনিয়ামের চাবি' : 'Harmonium keys'}>
            {whiteKeys.map((k) => (
              <button key={k.key} {...keyProps(k, activeKeys.has(k.key))} className="hm-white">
                <span className="hm-note">{isBn ? k.swaraBn.split(' ')[0] : k.swara}</span>
                <span className="hm-sub">{k.keyboardShortcut}</span>
                <span className="hm-sub">{Math.round(k.freq)}</span>
              </button>
            ))}
            {blackKeys.map((k) => (
              <button key={k.key} {...keyProps(k, activeKeys.has(k.key))} className="hm-black" style={{ left: blackLeft(k) }}>
                <span className="hm-note">{isBn ? k.swaraBn.split(' ')[0] : k.swara}</span>
                <span className="hm-sub">{k.keyboardShortcut}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[var(--ink-2)] border-t border-[var(--hair)] pt-3 text-xs">
          <p className="flex items-start gap-2 min-w-0">
            <Keyboard className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {isBn
                ? 'কীবোর্ড: সাদা চাবি A S D F G H J K L ; · কালো চাবি W E T Y U O P · স্পেসবার = হাওয়া দেওয়া'
                : 'Keyboard: white A S D F G H J K L ; · black W E T Y U O P · Space = pump bellows'}
            </span>
          </p>
          <span className="font-mono text-[var(--ink)]" role="status">
            {activeKeys.size > 0 ? `${isBn ? 'বাজছে' : 'Playing'}: ${Array.from(activeKeys).join(', ')}` : (isBn ? 'বাজাতে প্রস্তুত' : 'Ready to play')}
          </span>
        </div>
      </div>
    </div>
  );
};
