import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Waves, RotateCcw, Award } from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { SoundRadar } from './SoundRadar';
import { usePrefs } from '../lib/prefs';

interface Props {
  onComplete: (starsEarned: number) => void;
  onExit: () => void;
  audioReady: boolean;
  onSoundOn: () => void;
}

const TOTAL_BUOYS = 3;

export const MissionOcean: React.FC<Props> = ({ onComplete, onExit, audioReady: _audioReady, onSoundOn: _onSoundOn }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [sensorsPlanted, setSensorsPlanted] = useState(0); // 0 to 3
  const [currentDepth, setCurrentDepth] = useState(50); // 0m to 500m
  const [levelWon, setLevelWon] = useState(false);
  const radioMsg = isBn
    ? '📻 কমান্ডার নোভা: "হলুদ সাবমেরিন নিয়ে সাগরে ডুব দাও! সাগরের গভীর তাপমাত্রা মাপতে ৩টি PO.DAAC সেন্সর স্থাপন করো এবং সোনার পিং পাঠাও!"'
    : '📻 Commander Nova: "Dive into the deep ocean in the Yellow Submarine! Fire sonar pings and plant 3 PO.DAAC temperature buoys!"';

  const keysRef = useRef({ left: false, right: false, up: false, down: false, sonar: false });

  const subRef = useRef({
    x: 100,
    y: 120,
    vx: 0,
    vy: 0,
    width: 62,
    height: 38,
    facing: 1,
  });

  const sensorSpotsRef = useRef([
    { id: 1, x: 380, y: 380, planted: false, name: 'Reef A (+1.2°C)' },
    { id: 2, x: 820, y: 400, planted: false, name: 'Trench B (-0.8°C)' },
    { id: 3, x: 1250, y: 360, planted: false, name: 'Thermal C (+2.5°C)' },
  ]);

  const sonarRipplesRef = useRef<{ x: number; y: number; radius: number; life: number }[]>([]);
  const bubblesRef = useRef<{ x: number; y: number; vy: number; size: number }[]>([]);
  const cameraXRef = useRef(0);
  const lastSoundTickRef = useRef(0);

  const resetLevel = useCallback(() => {
    subRef.current = {
      x: 100,
      y: 120,
      vx: 0,
      vy: 0,
      width: 62,
      height: 38,
      facing: 1,
    };
    cameraXRef.current = 0;
    sensorSpotsRef.current.forEach((s) => (s.planted = false));
    setSensorsPlanted(0);
    setLevelWon(false);
    audio.stopAll();
  }, [audio]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.down = true;
      if (['KeyE', 'KeyF', 'Space', 'Enter'].includes(e.code)) {
        keysRef.current.sonar = true;
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.down = false;
      if (['KeyE', 'KeyF', 'Space', 'Enter'].includes(e.code)) keysRef.current.sonar = false;
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;
    const LEVEL_WIDTH = 1500;

    // Bubbles
    for (let i = 0; i < 30; i++) {
      bubblesRef.current.push({
        x: Math.random() * LEVEL_WIDTH,
        y: Math.random() * canvas.height,
        vy: -1 - Math.random() * 2,
        size: 2 + Math.random() * 3,
      });
    }

    const loop = () => {
      tick++;
      const sub = subRef.current;
      const keys = keysRef.current;

      const SPEED = 0.55;
      const FRICTION = 0.92;

      if (keys.left) {
        sub.vx -= SPEED;
        sub.facing = -1;
      }
      if (keys.right) {
        sub.vx += SPEED;
        sub.facing = 1;
      }
      if (keys.up) sub.vy -= SPEED;
      if (keys.down) sub.vy += SPEED;

      sub.vx *= FRICTION;
      sub.vy *= FRICTION;

      sub.x += sub.vx;
      sub.y += sub.vy;

      if (sub.y < 50) sub.y = 50;
      if (sub.y > canvas.height - 70) sub.y = canvas.height - 70;
      if (sub.x < 30) sub.x = 30;
      if (sub.x > LEVEL_WIDTH - 80) sub.x = LEVEL_WIDTH - 80;

      setCurrentDepth(Math.round((sub.y / canvas.height) * 450));

      // Camera
      const targetCamX = sub.x - canvas.width / 2 + sub.width / 2;
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.1;
      if (cameraXRef.current < 0) cameraXRef.current = 0;
      if (cameraXRef.current > LEVEL_WIDTH - canvas.width) cameraXRef.current = LEVEL_WIDTH - canvas.width;

      const camX = cameraXRef.current;

      // Real NASA Ocean Sonification
      const now = Date.now();
      if (now - lastSoundTickRef.current > 2000) {
        lastSoundTickRef.current = now;
        const anomaly = (sub.y / canvas.height) * 3 - 1.5;
        audio.playOcean(anomaly, 0.2, 1900);
      }

      // Sonar Action
      if (keys.sonar) {
        keys.sonar = false;
        audio.playSonarPing();
        sonarRipplesRef.current.push({
          x: sub.x + sub.width / 2,
          y: sub.y + sub.height / 2,
          radius: 10,
          life: 0,
        });

        // Check if near sensor spot
        sensorSpotsRef.current.forEach((spot) => {
          if (!spot.planted && Math.abs(sub.x - spot.x) < 70 && Math.abs(sub.y - spot.y) < 70) {
            spot.planted = true;
            audio.playSuccess();
            setSensorsPlanted((prev) => {
              const next = prev + 1;
              if (next >= sensorSpotsRef.current.length) {
                setLevelWon(true);
                audio.playSuccess();
              }
              return next;
            });
          }
        });
      }

      // Update Sonar Ripples
      sonarRipplesRef.current.forEach((r) => {
        r.radius += 5;
        r.life++;
      });
      sonarRipplesRef.current = sonarRipplesRef.current.filter((r) => r.life < 40);

      // Update Bubbles
      bubblesRef.current.forEach((b) => {
        b.y += b.vy;
        if (b.y < 30) {
          b.y = canvas.height - 20;
          b.x = Math.random() * LEVEL_WIDTH;
        }
      });

      // ================= RENDER =================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep Ocean Gradient
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      oceanGrad.addColorStop(0, '#023e8a');
      oceanGrad.addColorStop(0.5, '#001d3d');
      oceanGrad.addColorStop(1, '#000814');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-camX, 0);

      // Seabed and Corals
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-100, canvas.height - 50, LEVEL_WIDTH + 200, 50);

      // Corals
      for (let cx = 80; cx < LEVEL_WIDTH; cx += 140) {
        ctx.fillStyle = cx % 280 === 0 ? '#f43f5e' : '#a855f7';
        ctx.beginPath();
        ctx.arc(cx, canvas.height - 40, 22, 0, Math.PI, true);
        ctx.fill();
      }

      // Sensor Placement Spots
      sensorSpotsRef.current.forEach((s) => {
        if (!s.planted) {
          ctx.strokeStyle = '#e9c46a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffd166';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('PLANT BUOY HERE', s.x, s.y - 30);
        } else {
          ctx.fillStyle = '#3fd1b5';
          ctx.beginPath();
          ctx.arc(s.x, s.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e8f0f2';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`✓ ${s.name}`, s.x, s.y - 20);
        }
      });

      // Friendly Whale swimming in the background
      const wx = 800 + Math.sin(tick * 0.02) * 200;
      const wy = 200 + Math.cos(tick * 0.03) * 30;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(wx, wy, 70, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(wx + 35, wy - 6, 4, 0, Math.PI * 2);
      ctx.fill();

      // Sonar Ripples
      sonarRipplesRef.current.forEach((r) => {
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 1 - r.life / 40)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Floating Bubbles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      bubblesRef.current.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Yellow NASA Submarine
      ctx.save();
      ctx.translate(sub.x + sub.width / 2, sub.y + sub.height / 2);
      ctx.scale(sub.facing, 1);

      // Submarine Hull
      ctx.fillStyle = '#e9c46a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Tower / Conning
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-8, -24, 16, 12);

      // Periscope
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(0, -32);
      ctx.lineTo(8, -32);
      ctx.stroke();

      // Porthole Glass with Eco-Ninja Cadet inside!
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(8, -2, 8, 0, Math.PI * 2);
      ctx.fill();
      // Green Cowl & Black Mask
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.arc(8, -3, 6, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, -4, 8, 3);
      // Sparkling Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -3, 1, 0, Math.PI * 2);
      ctx.arc(10, -3, 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(8, -2, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Propeller Spinning
      const propAngle = tick * 0.5;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-28, -8 * Math.sin(propAngle));
      ctx.lineTo(-28, 8 * Math.sin(propAngle));
      ctx.stroke();

      ctx.restore();
      ctx.restore(); // camera

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [audio]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-3">
      {/* Header HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass border border-[var(--line)]">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="btn btn-ghost text-xs px-2.5 py-1">
            ← {isBn ? 'ম্যাপে ফেরত' : 'Exit Mission'}
          </button>
          <div className="chip border-[var(--teal)] text-[var(--teal)] font-semibold text-xs py-1 px-3">
            🌊 {isBn ? 'সেন্সর স্থাপন:' : 'Buoys Planted:'} {sensorsPlanted} / {TOTAL_BUOYS}
          </div>
          <div className="chip border-sky-400 text-sky-300 font-semibold text-xs py-1 px-3 font-mono">
            ⚓ {isBn ? 'গভীরতা:' : 'Depth:'} {currentDepth} m
          </div>
        </div>

        <SoundRadar pan={0.2} activeSound="ocean" intensity={0.7} />

        <button onClick={resetLevel} className="btn btn-ghost btn-icon border border-[var(--line)]" title="Restart">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Canvas */}
      <div ref={containerRef} className="w-full rounded-3xl overflow-hidden border-2 border-[var(--teal)]/40 relative bg-[var(--abyss)] shadow-2xl" style={{ minHeight: '460px' }}>
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
              {isBn ? 'সাগরের সাবমেরিন মিশন সম্পন্ন! ⭐⭐⭐' : 'Ocean Submarine Mission Complete! ⭐⭐⭐'}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-md">
              {isBn
                ? 'নাসার PO.DAAC ডেটা দিয়ে তুমি গভীর সাগরের তাপমাত্রা রেকর্ড করেছ এবং তিমি পরিবারকে নিরাপদে সাহায্য করেছ!'
                : 'Using NASA JPL PO.DAAC ocean temperature telemetry, you planted all buoys and mapped the deep sea acoustic channel!'}
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

      {/* Touch Gamepad for Submarine (4-way D-Pad + Sonar) */}
      <div className="p-3.5 rounded-2xl glass border border-[var(--line)] flex flex-wrap items-center justify-between gap-4 select-none">
        <div className="text-xs text-[var(--ink-3)] font-mono hidden md:block">
          {isBn
            ? '💡 কীবোর্ড: অ্যারো কী / WASD (সাবমেরিন চালনা), Space বা E (সোনার পিং ও সেন্সর স্থাপন)'
            : '💡 Controls: Arrow Keys / WASD to Steer Submarine, Space / E to fire Sonar & Plant Buoy!'}
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="grid grid-cols-3 gap-1.5 w-36">
            <div />
            <button
              onTouchStart={() => (keysRef.current.up = true)}
              onTouchEnd={() => (keysRef.current.up = false)}
              onMouseDown={() => (keysRef.current.up = true)}
              onMouseUp={() => (keysRef.current.up = false)}
              className="w-11 h-11 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] flex items-center justify-center cursor-pointer shadow-md active:bg-[var(--brass)]"
              aria-label="Sub Up"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div />
            <button
              onTouchStart={() => (keysRef.current.left = true)}
              onTouchEnd={() => (keysRef.current.left = false)}
              onMouseDown={() => (keysRef.current.left = true)}
              onMouseUp={() => (keysRef.current.left = false)}
              className="w-11 h-11 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] flex items-center justify-center cursor-pointer shadow-md active:bg-[var(--brass)]"
              aria-label="Sub Left"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onTouchStart={() => (keysRef.current.down = true)}
              onTouchEnd={() => (keysRef.current.down = false)}
              onMouseDown={() => (keysRef.current.down = true)}
              onMouseUp={() => (keysRef.current.down = false)}
              className="w-11 h-11 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] flex items-center justify-center cursor-pointer shadow-md active:bg-[var(--brass)]"
              aria-label="Sub Down"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onTouchStart={() => (keysRef.current.right = true)}
              onTouchEnd={() => (keysRef.current.right = false)}
              onMouseDown={() => (keysRef.current.right = true)}
              onMouseUp={() => (keysRef.current.right = false)}
              className="w-11 h-11 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] flex items-center justify-center cursor-pointer shadow-md active:bg-[var(--brass)]"
              aria-label="Sub Right"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onTouchStart={() => (keysRef.current.sonar = true)}
            onMouseDown={() => (keysRef.current.sonar = true)}
            className="h-14 px-6 rounded-2xl bg-teal-600 active:bg-teal-400 text-white flex items-center gap-2 text-xs font-semibold shadow-md cursor-pointer"
            aria-label="Sonar Ping"
          >
            <Waves className="w-5 h-5" />
            <span>{isBn ? 'সোনার পিং ও সেন্সর' : 'Sonar / Buoy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
