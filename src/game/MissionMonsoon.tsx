import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, ArrowLeft, ArrowRight, ArrowUp, CloudRain, RotateCcw, Award } from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { SoundRadar } from './SoundRadar';
import { usePrefs } from '../lib/prefs';
import { drawEcoNinja } from './drawEcoNinja';

interface Props {
  onComplete: (starsEarned: number) => void;
  onExit: () => void;
  audioReady: boolean;
  onSoundOn: () => void;
}

export const MissionMonsoon: React.FC<Props> = ({ onComplete, onExit, audioReady: _audioReady, onSoundOn: _onSoundOn }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [rainGathered, setRainGathered] = useState(0); // 0 to 100 mm
  const [animalsRescued, setAnimalsRescued] = useState(0); // 0 to 2
  const [levelWon, setLevelWon] = useState(false);
  const radioMsg = isBn
    ? '📻 কমান্ডার নোভা: "সিলেটে ভারী বর্ষা হচ্ছে! রেইন গেজ তুলে ১০০ মিমি বৃষ্টি রেকর্ড করো এবং ভাসমান হরিণ দুটিকে উদ্ধার করো!"'
    : '📻 Commander Nova: "Heavy monsoon in Sylhet! Hold your Rain Gauge to collect 100 mm of NASA rain data and rescue the stranded animals!"';

  const keysRef = useRef({ left: false, right: false, jump: false, catchRain: false });

  const playerRef = useRef({
    x: 80,
    y: 350,
    vx: 0,
    vy: 0,
    width: 42,
    height: 56,
    grounded: true,
    facing: 1,
    walkCycle: 0,
    holdingGauge: false,
  });

  const animalsRef = useRef([
    { id: 1, x: 550, y: 355, rescued: false, emoji: '🦌' },
    { id: 2, x: 1100, y: 355, rescued: false, emoji: '🦌' },
  ]);

  const cameraXRef = useRef(0);
  const rainDropsRef = useRef<{ x: number; y: number; vy: number }[]>([]);
  const lastSoundTickRef = useRef(0);

  const resetLevel = useCallback(() => {
    playerRef.current = {
      x: 80,
      y: 350,
      vx: 0,
      vy: 0,
      width: 42,
      height: 56,
      grounded: true,
      facing: 1,
      walkCycle: 0,
      holdingGauge: false,
    };
    cameraXRef.current = 0;
    animalsRef.current.forEach((a) => (a.rescued = false));
    setRainGathered(0);
    setAnimalsRescued(0);
    setLevelWon(false);
    audio.stopAll();
  }, [audio]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        keysRef.current.jump = true;
        e.preventDefault();
      }
      if (['KeyE', 'KeyF'].includes(e.code)) {
        keysRef.current.catchRain = true;
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) keysRef.current.jump = false;
      if (['KeyE', 'KeyF'].includes(e.code)) keysRef.current.catchRain = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    audio.playRadioBeep();
  }, [audio]);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      if (!canvas || !container) return;
      canvas.width = container.clientWidth || 900;
      canvas.height = 460;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let animId: number;
    let tick = 0;
    const LEVEL_WIDTH = 1500;
    const GROUND_Y = 410;

    // Initialize raindrops
    for (let i = 0; i < 40; i++) {
      rainDropsRef.current.push({
        x: Math.random() * LEVEL_WIDTH,
        y: Math.random() * canvas.height,
        vy: 6 + Math.random() * 4,
      });
    }

    const loop = () => {
      tick++;
      const p = playerRef.current;
      const keys = keysRef.current;

      const ACCEL = 0.85;
      const MAX_SPEED = 4.8;
      const FRICTION = 0.82;
      const GRAVITY = 0.6;
      const JUMP = -12.2;

      if (keys.left) {
        p.vx -= ACCEL;
        p.facing = -1;
      }
      if (keys.right) {
        p.vx += ACCEL;
        p.facing = 1;
      }

      p.vx *= FRICTION;
      if (Math.abs(p.vx) > MAX_SPEED) p.vx = Math.sign(p.vx) * MAX_SPEED;

      if (keys.jump && p.grounded) {
        p.vy = JUMP;
        p.grounded = false;
        audio.playPentatonicNote(440.0, 'triangle', 0.12);
      }

      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      if (p.y + p.height >= GROUND_Y) {
        p.y = GROUND_Y - p.height;
        p.vy = 0;
        p.grounded = true;
      }

      if (p.x < 30) p.x = 30;
      if (p.x > LEVEL_WIDTH - 60) p.x = LEVEL_WIDTH - 60;

      if (Math.abs(p.vx) > 0.4 && p.grounded) p.walkCycle += 0.28;
      else p.walkCycle = 0;

      // Camera
      const targetCamX = p.x - canvas.width / 2 + p.width / 2;
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.1;
      if (cameraXRef.current < 0) cameraXRef.current = 0;
      if (cameraXRef.current > LEVEL_WIDTH - canvas.width) cameraXRef.current = LEVEL_WIDTH - canvas.width;

      const camX = cameraXRef.current;

      // Real NASA Rain Sonification
      const now = Date.now();
      if (now - lastSoundTickRef.current > 1000) {
        lastSoundTickRef.current = now;
        audio.playRain(0.75, 0.5, 950);
      }

      // Rain Gauge Collecting
      p.holdingGauge = keys.catchRain;
      if (p.holdingGauge && rainGathered < 100) {
        setRainGathered((prev) => {
          const next = Math.min(100, prev + 0.35);
          if (next >= 100 && animalsRef.current.every((a) => a.rescued)) {
            setLevelWon(true);
            audio.playSuccess();
          }
          return next;
        });
      }

      // Animal Rescue Collision
      animalsRef.current.forEach((animal) => {
        if (!animal.rescued && Math.abs(p.x - animal.x) < 45) {
          animal.rescued = true;
          audio.playSuccess();
          setAnimalsRescued((prev) => {
            const next = prev + 1;
            if (next >= 2 && rainGathered >= 100) {
              setLevelWon(true);
              audio.playSuccess();
            }
            return next;
          });
        }
      });

      // Update Raindrops
      rainDropsRef.current.forEach((d) => {
        d.y += d.vy;
        d.x -= 1.2; // wind tilt
        if (d.y > GROUND_Y) {
          d.y = 0;
          d.x = Math.random() * LEVEL_WIDTH;
        }
      });

      // ================= RENDER =================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Monsoon Dark Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#020b14');
      skyGrad.addColorStop(0.5, '#0b1f33');
      skyGrad.addColorStop(1, '#13354d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-camX, 0);

      // Rain Clouds overhead
      ctx.fillStyle = '#1e384d';
      for (let cx = 80; cx < LEVEL_WIDTH; cx += 220) {
        ctx.beginPath();
        ctx.arc(cx, 60, 45, 0, Math.PI * 2);
        ctx.arc(cx + 40, 50, 55, 0, Math.PI * 2);
        ctx.arc(cx + 80, 60, 45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Delta River & Floating Rafts
      const riverGrad = ctx.createLinearGradient(0, GROUND_Y - 20, 0, canvas.height);
      riverGrad.addColorStop(0, '#035388');
      riverGrad.addColorStop(1, '#012a4a');
      ctx.fillStyle = riverGrad;
      ctx.fillRect(-100, GROUND_Y, LEVEL_WIDTH + 200, canvas.height - GROUND_Y);

      // Wooden Bridges & Platforms
      for (let bx = 60; bx < LEVEL_WIDTH; bx += 180) {
        ctx.fillStyle = '#5c3d28';
        ctx.fillRect(bx, GROUND_Y - 8, 120, 14);
        ctx.fillStyle = '#8b5e3c';
        ctx.fillRect(bx + 4, GROUND_Y - 6, 112, 10);
      }

      // Animals
      animalsRef.current.forEach((a) => {
        if (!a.rescued) {
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(a.emoji, a.x, a.y);
          ctx.fillStyle = '#ffd166';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('HELP ME!', a.x, a.y - 32);
        } else {
          ctx.fillStyle = '#3fd1b5';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('RESCUED ✓', a.x, a.y - 10);
        }
      });

      // Falling Raindrops
      ctx.fillStyle = '#4cc3ff';
      rainDropsRef.current.forEach((d) => {
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 2, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // ================= DRAW 3D ANIMATED ECO-NINJA HERO =================
      drawEcoNinja(ctx, p.x + p.width / 2, p.y + p.height / 2, {
        facing: p.facing,
        isGrounded: p.grounded,
        isMoving: Math.abs(p.vx) > 0.4,
        isJumping: !p.grounded,
        holdingGauge: p.holdingGauge,
        gaugeFill: rainGathered,
        walkCycle: p.walkCycle,
        tick: tick,
        scale: 1.25,
      });

      ctx.restore(); // camera

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [audio, rainGathered]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-3">
      {/* Header HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass border border-[var(--line)]">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="btn btn-ghost text-xs px-2.5 py-1">
            ← {isBn ? 'ম্যাপে ফেরত' : 'Exit Mission'}
          </button>
          <div className="chip border-[var(--rain)] text-[var(--rain)] font-semibold text-xs py-1 px-3">
            🌧️ {isBn ? 'বৃষ্টি রেকর্ড:' : 'Rain Data:'} {Math.round(rainGathered)} / 100 mm
          </div>
          <div className="chip border-[var(--brass)] text-[var(--brass)] font-semibold text-xs py-1 px-3">
            🦌 {isBn ? 'প্রাণী উদ্ধার:' : 'Rescued:'} {animalsRescued} / 2
          </div>
        </div>

        <SoundRadar pan={0.5} activeSound="rain" intensity={0.8} />

        <button onClick={resetLevel} className="btn btn-ghost btn-icon border border-[var(--line)]" title="Restart">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Canvas */}
      <div ref={containerRef} className="w-full rounded-3xl overflow-hidden border-2 border-[var(--rain)]/40 relative bg-[var(--abyss)] shadow-2xl" style={{ minHeight: '460px' }}>
        <canvas ref={canvasRef} width={900} height={460} className="block w-full h-[460px]" />

        {/* Radio Dialogue with Eco-Ninja Cadet Portrait */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 max-w-xl w-11/12 p-2.5 rounded-2xl glass-pop border border-[var(--brass)] flex items-center gap-3 text-xs sm:text-sm font-semibold pointer-events-none text-[var(--ink)] shadow-xl">
          <img src="/images/ninja_cadet_avatar.png" alt="Cadet" className="w-9 h-9 rounded-xl border border-[var(--brass)] shrink-0 object-cover shadow-sm" />
          <span className="leading-snug">{radioMsg}</span>
        </div>

        {/* Level Complete Win Overlay */}
        {levelWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[var(--brass)] shadow-2xl">
                <img src="/images/ninja_cadet_avatar.png" alt="Cadet" className="w-full h-full object-cover" />
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center text-slate-950 shadow-2xl animate-bounce">
                <Award className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[var(--brass)]">
              {isBn ? 'বর্ষার প্লাবন উদ্ধার সম্পন্ন! ⭐⭐⭐' : 'Monsoon Rescue Complete! ⭐⭐⭐'}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-md">
              {isBn
                ? 'নাসার POWER ডেটা দিয়ে তুমি ১০০ মিমি বৃষ্টি রেকর্ড করেছ এবং বন্যপ্রাণীদের নিরাপদে পৌঁছে দিয়েছ!'
                : 'Using NASA POWER precipitation metrics, you recorded 100 mm of monsoon rain and saved all wildlife!'}
            </p>
            <button
              onClick={() => onComplete(3)}
              className="btn btn-brass font-semibold px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105"
            >
              <span>{isBn ? 'মিশন সম্পন্ন ও পরবর্তী মিশন' : 'Complete & Return to Map'}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Touch Gamepad */}
      <div className="p-3.5 rounded-2xl glass border border-[var(--line)] flex flex-wrap items-center justify-between gap-4 select-none">
        <div className="text-xs text-[var(--ink-3)] font-mono hidden md:block">
          {isBn
            ? '💡 কীবোর্ড: ← / → (হাঁটা), Space (লাফানো), E বা F চেপে ধরে বৃষ্টি সংগ্রহ'
            : '💡 Controls: Arrow Keys / WASD to Walk, Space to Jump, Hold E or F to collect rain!'}
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2">
            <button
              onTouchStart={() => (keysRef.current.left = true)}
              onTouchEnd={() => (keysRef.current.left = false)}
              onMouseDown={() => (keysRef.current.left = true)}
              onMouseUp={() => (keysRef.current.left = false)}
              className="w-14 h-14 rounded-2xl bg-[var(--panel-2)] border border-[var(--line)] active:bg-[var(--brass)] active:text-slate-950 flex items-center justify-center shadow-md cursor-pointer"
              aria-label="Walk Left"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onTouchStart={() => (keysRef.current.right = true)}
              onTouchEnd={() => (keysRef.current.right = false)}
              onMouseDown={() => (keysRef.current.right = true)}
              onMouseUp={() => (keysRef.current.right = false)}
              className="w-14 h-14 rounded-2xl bg-[var(--panel-2)] border border-[var(--line)] active:bg-[var(--brass)] active:text-slate-950 flex items-center justify-center shadow-md cursor-pointer"
              aria-label="Walk Right"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onTouchStart={() => (keysRef.current.catchRain = true)}
              onTouchEnd={() => (keysRef.current.catchRain = false)}
              onMouseDown={() => (keysRef.current.catchRain = true)}
              onMouseUp={() => (keysRef.current.catchRain = false)}
              className="h-14 px-5 rounded-2xl bg-sky-600 active:bg-sky-400 text-white flex items-center gap-2 text-xs font-semibold shadow-md cursor-pointer"
              aria-label="Catch Rain"
            >
              <CloudRain className="w-5 h-5" />
              <span>{isBn ? 'বৃষ্টি সংগ্রহ' : 'Catch Rain'}</span>
            </button>

            <button
              onTouchStart={() => {
                keysRef.current.jump = true;
                setTimeout(() => (keysRef.current.jump = false), 150);
              }}
              onMouseDown={() => {
                keysRef.current.jump = true;
                setTimeout(() => (keysRef.current.jump = false), 150);
              }}
              className="w-14 h-14 rounded-2xl bg-[var(--brass)] text-[var(--brass-ink)] font-semibold flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
              aria-label="Jump"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
