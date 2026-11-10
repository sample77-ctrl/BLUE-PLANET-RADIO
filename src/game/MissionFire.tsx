import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, ArrowLeft, ArrowRight, ArrowUp, Droplets, RotateCcw, Award } from 'lucide-react';
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

interface FireHotspot {
  id: number;
  x: number;
  y: number;
  health: number; // 100 to 0
  frpMw: number;
  extinguished: boolean;
}

const TOTAL_FIRES = 3;

export const MissionFire: React.FC<Props> = ({ onComplete, onExit, audioReady: _audioReady, onSoundOn: _onSoundOn }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [firesExtinguished, setFiresExtinguished] = useState(0);
  const [waterAmmo, setWaterAmmo] = useState(100);
  const [levelWon, setLevelWon] = useState(false);
  const radioMsg = isBn
    ? '📻 কমান্ডার নোভা: "ক্যাডেট! নাসার FIRMS স্যাটেলাইট বনে ৩টি বড় দাবানল শনাক্ত করেছে! শব্দ শুনে আগুন খুঁজে ওয়াটার ব্লাস্টার দিয়ে নিভিয়ে দাও!"'
    : '📻 Commander Nova: "Cadet! NASA FIRMS satellites detected 3 blazing wildfires! Listen to the crackles, locate them, and extinguish with your water blaster!"';
  const [pan, setPan] = useState(0);
  const [intensity, setIntensity] = useState(0);

  const keysRef = useRef({ left: false, right: false, jump: false, spray: false });

  const playerRef = useRef({
    x: 80,
    y: 312,
    vx: 0,
    vy: 0,
    width: 46,
    height: 68,
    grounded: true,
    facing: 1,
    walkCycle: 0,
    isSpraying: false,
  });

  const firesRef = useRef<FireHotspot[]>([
    { id: 1, x: 420, y: 380, health: 100, frpMw: 320, extinguished: false },
    { id: 2, x: 880, y: 380, health: 100, frpMw: 650, extinguished: false },
    { id: 3, x: 1350, y: 380, health: 100, frpMw: 920, extinguished: false },
  ]);

  const cameraXRef = useRef(0);
  const waterDropsRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const smokeParticlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string }[]>([]);
  const lastSoundTickRef = useRef(0);

  const resetLevel = useCallback(() => {
    playerRef.current = {
      x: 80,
      y: 312,
      vx: 0,
      vy: 0,
      width: 46,
      height: 68,
      grounded: true,
      facing: 1,
      walkCycle: 0,
      isSpraying: false,
    };
    cameraXRef.current = 0;
    firesRef.current.forEach((f) => {
      f.health = 100;
      f.extinguished = false;
    });
    setFiresExtinguished(0);
    setWaterAmmo(100);
    setLevelWon(false);
    audio.stopAll();
  }, [audio]);

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        keysRef.current.jump = true;
        e.preventDefault();
      }
      if (['KeyE', 'KeyF'].includes(e.code)) {
        keysRef.current.spray = true;
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) keysRef.current.jump = false;
      if (['KeyE', 'KeyF'].includes(e.code)) keysRef.current.spray = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Radio Briefing
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
    const LEVEL_WIDTH = 1600;
    const GROUND_Y = 380;

    const loop = () => {
      tick++;
      const p = playerRef.current;
      const keys = keysRef.current;

      // Physics
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
        audio.playPentatonicNote(523.3, 'triangle', 0.12);
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

      if (Math.abs(p.vx) > 0.4 && p.grounded) {
        p.walkCycle += 0.28;
      } else {
        p.walkCycle = 0;
      }

      // Camera
      const targetCamX = p.x - canvas.width / 2 + p.width / 2;
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.1;
      if (cameraXRef.current < 0) cameraXRef.current = 0;
      if (cameraXRef.current > LEVEL_WIDTH - canvas.width) cameraXRef.current = LEVEL_WIDTH - canvas.width;

      const camX = cameraXRef.current;

      // Nearest Fire Proximity Audio
      const activeFires = firesRef.current.filter((f) => !f.extinguished);
      if (activeFires.length > 0) {
        let closestDist = 9999;
        let closestFire = activeFires[0];
        activeFires.forEach((f) => {
          const d = Math.abs(p.x - f.x);
          if (d < closestDist) {
            closestDist = d;
            closestFire = f;
          }
        });

        const curPan = Math.max(-1, Math.min(1, (closestFire.x / LEVEL_WIDTH) * 2 - 1));
        const curIntensity = Math.max(0.1, 1 - closestDist / 420);
        setPan(curPan);
        setIntensity(curIntensity);

        const now = Date.now();
        if (closestDist < 420 && now - lastSoundTickRef.current > 1000) {
          lastSoundTickRef.current = now;
          audio.playFire(curIntensity, curPan, 950);
        }
      } else {
        setIntensity(0);
      }

      // Water Spraying
      p.isSpraying = keys.spray && waterAmmo > 0;
      if (p.isSpraying) {
        setWaterAmmo((w) => Math.max(0, w - 0.25));
        for (let i = 0; i < 3; i++) {
          waterDropsRef.current.push({
            x: p.x + (p.facing === 1 ? p.width + 14 : -14),
            y: p.y + 24,
            vx: p.facing * (8 + Math.random() * 4),
            vy: (Math.random() - 0.4) * 2.8,
            life: 0,
          });
        }
        if (tick % 8 === 0) audio.playSplash();
      }

      // Water drops collision with fire
      waterDropsRef.current.forEach((drop) => {
        drop.x += drop.vx;
        drop.y += drop.vy;
        drop.vy += 0.2; // gravity
        drop.life++;

        firesRef.current.forEach((fire) => {
          if (!fire.extinguished && Math.abs(drop.x - fire.x) < 45 && Math.abs(drop.y - fire.y) < 50) {
            fire.health -= 1.4;
            // Smoke particle
            smokeParticlesRef.current.push({
              x: fire.x + (Math.random() - 0.5) * 20,
              y: fire.y - 20,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -2 - Math.random() * 1.5,
              life: 0,
              color: '#94a3b8',
            });

            if (tick % 6 === 0) audio.playSizzle();

            if (fire.health <= 0) {
              fire.health = 0;
              fire.extinguished = true;
              audio.playSuccess();
              setFiresExtinguished((prev) => {
                const next = prev + 1;
                if (next >= firesRef.current.length) {
                  setLevelWon(true);
                  audio.playSuccess();
                }
                return next;
              });
            }
          }
        });
      });

      waterDropsRef.current = waterDropsRef.current.filter((d) => d.life < 36 && d.y < GROUND_Y);
      smokeParticlesRef.current.forEach((sm) => {
        sm.x += sm.vx;
        sm.y += sm.vy;
        sm.life++;
      });
      smokeParticlesRef.current = smokeParticlesRef.current.filter((sm) => sm.life < 30);

      // ================= RENDER =================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Lush Amazon Twilight Atmosphere & Glowing Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#09151e'); // Deep tropical dusk
      skyGrad.addColorStop(0.4, '#1a2328');
      skyGrad.addColorStop(0.75, '#3d1c10'); // Warm sunset smoke haze
      skyGrad.addColorStop(1, '#6b2609'); // Fiery horizon glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Twinkling stars in clear upper sky
      for (let s = 0; s < 25; s++) {
        const sx = (s * 73 + tick * 0.1) % canvas.width;
        const sy = (s * 37) % (canvas.height * 0.45);
        const sAlpha = 0.3 + Math.sin(tick * 0.05 + s) * 0.25;
        ctx.fillStyle = `rgba(255, 255, 255, ${sAlpha})`;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Parallax Layer 1: Distant Misty Jungle Mountains (factor 0.2)
      ctx.save();
      ctx.translate(-camX * 0.2, 0);
      ctx.fillStyle = '#0f2924';
      ctx.beginPath();
      ctx.moveTo(-100, GROUND_Y);
      for (let mx = -100; mx < LEVEL_WIDTH + 200; mx += 140) {
        ctx.quadraticCurveTo(mx + 70, GROUND_Y - 140 - Math.sin(mx) * 30, mx + 140, GROUND_Y);
      }
      ctx.fill();
      ctx.restore();

      // Parallax Layer 2: Ancient Amazon Canopy Crowns & Liana Vines (factor 0.5)
      ctx.save();
      ctx.translate(-camX * 0.5, 0);
      for (let k = -50; k < LEVEL_WIDTH + 200; k += 180) {
        // Grand tree trunk
        ctx.fillStyle = '#1c130d';
        ctx.fillRect(k + 40, GROUND_Y - 210, 22, 210);
        // Foliage Crown
        const crownGrad = ctx.createRadialGradient(k + 50, GROUND_Y - 220, 20, k + 50, GROUND_Y - 220, 85);
        crownGrad.addColorStop(0, '#2d6a4f');
        crownGrad.addColorStop(0.7, '#1b4332');
        crownGrad.addColorStop(1, '#081c15');
        ctx.fillStyle = crownGrad;
        ctx.beginPath();
        ctx.arc(k + 50, GROUND_Y - 220, 80, 0, Math.PI * 2);
        ctx.fill();
        // Hanging Vines
        ctx.strokeStyle = '#2d6a4f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(k + 35, GROUND_Y - 150);
        ctx.quadraticCurveTo(k + 20 + Math.sin(tick * 0.04 + k) * 8, GROUND_Y - 70, k + 30, GROUND_Y - 20);
        ctx.stroke();
      }
      ctx.restore();

      // ================= MAIN WORLD CAMERA (factor 1.0) =================
      ctx.save();
      ctx.translate(-camX, 0);

      // Midground Jungle Trees with 3D shaded leaf clusters
      for (let tx = 30; tx < LEVEL_WIDTH; tx += 110) {
        const treeH = 120 + ((tx * 13) % 40);
        // Trunk with bark highlight
        ctx.fillStyle = '#2b1810';
        ctx.fillRect(tx - 7, GROUND_Y - treeH, 14, treeH);
        ctx.fillStyle = '#422417';
        ctx.fillRect(tx - 7, GROUND_Y - treeH, 4, treeH);

        // Volumetric Foliage Clusters
        const fGrad1 = ctx.createRadialGradient(tx - 10, GROUND_Y - treeH - 25, 10, tx - 10, GROUND_Y - treeH - 25, 45);
        fGrad1.addColorStop(0, '#52b788');
        fGrad1.addColorStop(0.7, '#2d6a4f');
        fGrad1.addColorStop(1, '#1b4332');
        ctx.fillStyle = fGrad1;
        ctx.beginPath();
        ctx.arc(tx - 15, GROUND_Y - treeH - 20, 32, 0, Math.PI * 2);
        ctx.arc(tx + 15, GROUND_Y - treeH - 20, 32, 0, Math.PI * 2);
        ctx.arc(tx, GROUND_Y - treeH - 45, 36, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rolling Jungle Ground with Rich Soil and Grass
      const groundGrad = ctx.createLinearGradient(0, GROUND_Y - 10, 0, canvas.height);
      groundGrad.addColorStop(0, '#2d6a4f'); // Lush top grass
      groundGrad.addColorStop(0.08, '#1b4332');
      groundGrad.addColorStop(0.2, '#3e2417'); // Rich Amazonian loam
      groundGrad.addColorStop(1, '#1a0e08');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-100, GROUND_Y, LEVEL_WIDTH + 200, canvas.height - GROUND_Y);

      // Foreground Grass Blades and Tropical Jungle Ferns
      ctx.fillStyle = '#40916c';
      for (let gx = -50; gx < LEVEL_WIDTH + 100; gx += 16) {
        const sway = Math.sin(tick * 0.08 + gx * 0.1) * 4;
        ctx.beginPath();
        ctx.moveTo(gx, GROUND_Y);
        ctx.quadraticCurveTo(gx - 3 + sway, GROUND_Y - 10, gx + sway, GROUND_Y - 14);
        ctx.quadraticCurveTo(gx + 3, GROUND_Y - 6, gx + 6, GROUND_Y);
        ctx.fill();
      }

      // Wildfire Clusters with Multi-Layered Roaring Cartoon Flames
      firesRef.current.forEach((fire) => {
        if (!fire.extinguished) {
          const fx = fire.x;
          const fy = fire.y;
          const sz = (fire.health / 100) * 42;
          const wiggle1 = Math.sin(tick * 0.35 + fire.id) * 8;
          const wiggle2 = Math.cos(tick * 0.45 + fire.id * 2) * 6;

          // 1. Pulsing Heat Radiation Glow
          const heatPulse = 18 + Math.sin(tick * 0.2 + fire.id) * 6;
          const fGrad = ctx.createRadialGradient(fx, fy - 18, 10, fx, fy - 18, sz + heatPulse);
          fGrad.addColorStop(0, 'rgba(255, 230, 0, 0.85)');
          fGrad.addColorStop(0.4, 'rgba(255, 100, 20, 0.6)');
          fGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.arc(fx, fy - 18, sz + heatPulse, 0, Math.PI * 2);
          ctx.fill();

          // 2. Base Dark Red Flame Tongue
          ctx.fillStyle = '#b91c1c';
          ctx.beginPath();
          ctx.moveTo(fx - sz * 0.8, fy);
          ctx.quadraticCurveTo(fx - sz * 1.1, fy - sz * 1.1, fx + wiggle1, fy - sz * 1.8);
          ctx.quadraticCurveTo(fx + sz * 1.1, fy - sz * 1.1, fx + sz * 0.8, fy);
          ctx.fill();

          // 3. Bright Orange Mid Flame
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(fx - sz * 0.6, fy);
          ctx.quadraticCurveTo(fx - sz * 0.8, fy - sz * 0.9, fx + wiggle2, fy - sz * 1.5);
          ctx.quadraticCurveTo(fx + sz * 0.8, fy - sz * 0.9, fx + sz * 0.6, fy);
          ctx.fill();

          // 4. White-Hot Yellow Inner Core
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(fx - sz * 0.35, fy);
          ctx.quadraticCurveTo(fx - sz * 0.4, fy - sz * 0.5, fx - wiggle1 * 0.5, fy - sz * 0.9);
          ctx.quadraticCurveTo(fx + sz * 0.4, fy - sz * 0.5, fx + sz * 0.35, fy);
          ctx.fill();

          // Floating Ember Sparks
          for (let em = 0; em < 4; em++) {
            const emX = fx + Math.sin(tick * 0.15 + em * 23) * (sz * 0.7);
            const emY = fy - ((tick * 3 + em * 45) % (sz * 2.2 + 30));
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(emX, emY, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Modern Glassmorphism Health & FRP MW HUD Card
          const cardW = 68;
          const cardH = 22;
          const cardX = fx - cardW / 2;
          const cardY = fy - sz * 1.8 - 26;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, [6]);
          ctx.fill();
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Health progress bar inside badge
          ctx.fillStyle = '#334155';
          ctx.fillRect(cardX + 6, cardY + 14, cardW - 12, 4);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(cardX + 6, cardY + 14, ((cardW - 12) * fire.health) / 100, 4);

          // FRP Label
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`🔥 ${fire.frpMw} MW`, fx, cardY + 10);
        } else {
          // Extinguished Sanctuary: Blooming Ferns, Flowers & Clean Air!
          ctx.fillStyle = '#2dd4bf';
          ctx.beginPath();
          ctx.arc(fire.x, fire.y - 10, 10, 0, Math.PI * 2);
          ctx.fill();
          // Sprouted leaves
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.ellipse(fire.x - 12, fire.y - 6, 8, 4, -0.4, 0, Math.PI * 2);
          ctx.ellipse(fire.x + 12, fire.y - 6, 8, 4, 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Saved Badge
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.roundRect(fire.x - 36, fire.y - 38, 72, 18, [5]);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SAVED ✓', fire.x, fire.y - 25);
        }
      });

      // Pressurized Water Spray Stream
      ctx.fillStyle = '#38bdf8';
      waterDropsRef.current.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Inner foam core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(d.x - 0.5, d.y - 0.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
      });

      // Steam & Smoke Particles
      smokeParticlesRef.current.forEach((sm) => {
        ctx.fillStyle = sm.color;
        ctx.globalAlpha = Math.max(0, 1 - sm.life / 30);
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, 6 + sm.life * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // ================= DRAW 3D ANIMATED ECO-NINJA HERO =================
      drawEcoNinja(ctx, p.x + p.width / 2, p.y + p.height / 2, {
        facing: p.facing,
        isGrounded: p.grounded,
        isMoving: Math.abs(p.vx) > 0.4,
        isSpraying: p.isSpraying,
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
  }, [audio, waterAmmo]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-3">
      {/* Mission HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass border border-[var(--line)]">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="btn btn-ghost text-xs px-2.5 py-1">
            ← {isBn ? 'ম্যাপে ফেরত' : 'Exit Mission'}
          </button>
          <div className="chip border-[var(--fire)] text-[var(--fire)] font-semibold text-xs py-1 px-3">
            🔥 {isBn ? 'দাবানল নিভানো:' : 'Extinguished:'} {firesExtinguished} / {TOTAL_FIRES}
          </div>
        </div>

        <SoundRadar pan={pan} activeSound={intensity > 0.05 ? 'fire' : 'none'} intensity={intensity} />

        <div className="flex items-center gap-2">
          {/* Water Ammo Meter */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--abyss)] border border-[var(--line)] text-xs">
            <Droplets className="w-4 h-4 text-sky-400" />
            <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-sky-400 transition-all" style={{ width: `${waterAmmo}%` }} />
            </div>
          </div>

          <button onClick={resetLevel} className="btn btn-ghost btn-icon border border-[var(--line)]" title="Restart">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div ref={containerRef} className="w-full rounded-3xl overflow-hidden border-2 border-[var(--fire)]/40 relative bg-[var(--abyss)] shadow-2xl" style={{ minHeight: '460px' }}>
        <canvas ref={canvasRef} width={900} height={460} className="block w-full h-[460px]" />

        {/* Radio Dialogue Bubble with Eco-Ninja Cadet Portrait */}
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
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[var(--brass)]">
              {isBn ? 'দাবানল সফলভাবে নিভানো হয়েছে! ⭐⭐⭐' : 'Wildfires Neutralized! ⭐⭐⭐'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-md">
              {isBn
                ? 'নাসার FIRMS স্যাটেলাইট ডেটা দিয়ে তুমি ৩টি দাবানল শনাক্ত করে নিভিয়ে দিয়েছ এবং বন রক্ষা করেছ!'
                : 'Using NASA FIRMS fire power detection, you successfully extinguished all 3 wildfire clusters!'}
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
            ? '💡 কীবোর্ড: ← / → (হাঁটা), Space (লাফানো), E বা F (ওয়াটার স্প্রে)'
            : '💡 Controls: Arrow Keys / WASD to Walk, Space to Jump, Hold E or F to Spray Water!'}
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
              onTouchStart={() => (keysRef.current.spray = true)}
              onTouchEnd={() => (keysRef.current.spray = false)}
              onMouseDown={() => (keysRef.current.spray = true)}
              onMouseUp={() => (keysRef.current.spray = false)}
              className="h-14 px-5 rounded-2xl bg-sky-700 active:bg-sky-500 text-white flex items-center gap-2 text-xs font-semibold shadow-md cursor-pointer"
              aria-label="Spray Water"
            >
              <Droplets className="w-5 h-5" />
              <span>{isBn ? 'পানি স্প্রে' : 'Spray Water'}</span>
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
