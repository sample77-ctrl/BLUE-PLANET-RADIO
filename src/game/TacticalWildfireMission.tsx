import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flame,
  Award,
  ArrowLeft,
  Radio,
  Compass,
  Plane,
  Satellite,
  Users,
} from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { usePrefs } from '../lib/prefs';

interface Props {
  onComplete: (starsEarned: number) => void;
  onExit: () => void;
  audioReady: boolean;
  onSoundOn: () => void;
  onSwitchToPlatformer?: () => void;
}

interface TacticalFire {
  id: number;
  x: number;
  y: number;
  radius: number;
  health: number; // 100 to 0
  frpMw: number;
  active: boolean;
}

interface Civilian {
  id: number;
  x: number;
  y: number;
  evacuated: boolean;
  speed: number;
}

interface AirTanker {
  x: number;
  y: number;
  active: boolean;
  droppingWater: boolean;
  targetX: number;
  targetY: number;
}

export const TacticalWildfireMission: React.FC<Props> = ({
  onComplete,
  onExit,
  audioReady: _audioReady,
  onSoundOn: _onSoundOn,
  onSwitchToPlatformer,
}) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const [viewMode, setViewMode] = useState<'tactical' | 'aerial' | 'satellite'>('tactical');
  const [firesExtinguished, setFiresExtinguished] = useState(0);
  const [civiliansEvacuated, setCiviliansEvacuated] = useState(0);
  const [waterBudget, setWaterBudget] = useState(100);
  const [missionTimer, setMissionTimer] = useState(180); // 3 minutes in seconds
  const [missionComplete, setMissionComplete] = useState(false);
  const [radioLog, setRadioLog] = useState<string[]>([
    isBn
      ? '📻 নাসার FIRMS স্যাটেলাইট আমাজন অববাহিকায় উচ্চ তাপমাত্রার দাবানল (FRP 850 MW) শনাক্ত করেছে।'
      : '📻 NASA FIRMS VIIRS detected intense wildfire hotspots (FRP 850 MW) in the Amazon basin.',
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Tactical entities
  const firesRef = useRef<TacticalFire[]>([
    { id: 1, x: 260, y: 220, radius: 45, health: 100, frpMw: 340, active: true },
    { id: 2, x: 520, y: 180, radius: 60, health: 100, frpMw: 620, active: true },
    { id: 3, x: 420, y: 350, radius: 75, health: 100, frpMw: 850, active: true },
  ]);

  const civiliansRef = useRef<Civilian[]>([
    { id: 1, x: 210, y: 190, evacuated: false, speed: 0.6 },
    { id: 2, x: 240, y: 230, evacuated: false, speed: 0.5 },
    { id: 3, x: 560, y: 210, evacuated: false, speed: 0.7 },
    { id: 4, x: 480, y: 320, evacuated: false, speed: 0.55 },
  ]);

  const airTankerRef = useRef<AirTanker>({
    x: -100,
    y: 150,
    active: false,
    droppingWater: false,
    targetX: 400,
    targetY: 250,
  });

  const waterDropsRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const smokeParticlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; size: number }[]>([]);

  const addRadioMessage = useCallback((msg: string) => {
    setRadioLog((prev) => [msg, ...prev.slice(0, 4)]);
    audio.playRadioBeep();
  }, [audio]);

  // Mission timer countdown
  useEffect(() => {
    if (missionComplete) return;
    const interval = setInterval(() => {
      setMissionTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [missionComplete]);

  // Periodic scientific fire sonification
  useEffect(() => {
    const soundInterval = setInterval(() => {
      const activeFires = firesRef.current.filter((f) => f.active);
      if (activeFires.length > 0) {
        const maxFrp = Math.max(...activeFires.map((f) => f.frpMw));
        const pan = (activeFires[0].x - 400) / 400; // -1 to +1
        audio.playFire(maxFrp / 900, pan, 1200);
      }
    }, 1400);
    return () => clearInterval(soundInterval);
  }, [audio]);

  // Air Tanker Water Drop Trigger
  const deployAirTanker = () => {
    if (waterBudget < 25) {
      addRadioMessage(isBn ? '⚠️ পানি অপর্যাপ্ত! ওয়াটার রিচার্জ হওয়া পর্যন্ত অপেক্ষা করুন।' : '⚠️ Insufficient water payload! Wait for refill.');
      return;
    }
    setWaterBudget((b) => Math.max(0, b - 25));
    airTankerRef.current = {
      x: -80,
      y: 120,
      active: true,
      droppingWater: false,
      targetX: 420,
      targetY: 260,
    };
    audio.playSplash();
    addRadioMessage(
      isBn
        ? '✈️ এয়ার ট্যাংকার কল করা হয়েছে: দাবানলের ওপর পানি ফেলার জন্য এগিয়ে আসছে!'
        : '✈️ Air Tanker deployed: Inbound for aerial water drop over fire perimeter!'
    );
  };

  // Dispatch Ground Response Unit (Click on Fire)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check if clicked near a fire
    firesRef.current.forEach((fire) => {
      if (!fire.active) return;
      const dist = Math.hypot(clickX - fire.x, clickY - fire.y);
      if (dist < fire.radius + 35) {
        // Spray ground water hose
        fire.health = Math.max(0, fire.health - 28);
        audio.playSizzle();

        // Spawn water spray particles
        for (let i = 0; i < 15; i++) {
          waterDropsRef.current.push({
            x: clickX + (Math.random() - 0.5) * 20,
            y: clickY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 1.0,
          });
        }

        if (fire.health <= 0) {
          fire.active = false;
          setFiresExtinguished((prev) => {
            const next = prev + 1;
            addRadioMessage(
              isBn
                ? `🔥 হটস্পট #${fire.id} সফলভাবে নিভিয়ে ফেলা হয়েছে! (FRP: ${fire.frpMw} MW শান্ত)`
                : `🔥 Hotspot #${fire.id} extinguished! (FRP: ${fire.frpMw} MW neutralized)`
            );
            if (next >= 3) {
              setMissionComplete(true);
              audio.playSuccess();
              onComplete(3);
            }
            return next;
          });
        }
      }
    });
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- Background: Tactical Top-Down Terrain (Image 1 style) ---
      // Ground / Forest base
      const groundGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      groundGrad.addColorStop(0, '#5a4d38');
      groundGrad.addColorStop(0.5, '#736043');
      groundGrad.addColorStop(1, '#4e4332');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Roads (Asphalt curves)
      ctx.strokeStyle = '#2d2926';
      ctx.lineWidth = 34;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(80, 50);
      ctx.bezierCurveTo(280, 90, 360, 200, 480, 220);
      ctx.bezierCurveTo(600, 240, 720, 360, 780, 440);
      ctx.stroke();

      // Road center dashed line
      ctx.strokeStyle = '#d69e2e';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Safe Evacuation Point (Top Left)
      ctx.fillStyle = '#22543d';
      ctx.strokeStyle = '#48bb78';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(40, 30, 110, 80, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#9ae6b4';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isBn ? 'নিরাপদ অঞ্চল' : 'EVACUATION ZONE', 95, 68);
      ctx.font = '9px monospace';
      ctx.fillText(isBn ? 'আশ্রয়কেন্দ্র' : 'SHELTER CP', 95, 84);

      // Houses / Staging Area
      ctx.fillStyle = '#eedcbf';
      ctx.strokeStyle = '#8d7b68';
      ctx.lineWidth = 2;
      ctx.fillRect(180, 60, 48, 36);
      ctx.strokeRect(180, 60, 48, 36);
      ctx.fillRect(640, 90, 52, 40);
      ctx.strokeRect(640, 90, 52, 40);

      // Forest Trees (Green & Golden Autumn foliage)
      const trees = [
        { x: 120, y: 160, r: 18, c: '#485834' },
        { x: 160, y: 220, r: 24, c: '#79552b' },
        { x: 340, y: 90, r: 22, c: '#3e4a29' },
        { x: 620, y: 150, r: 26, c: '#b7791f' },
        { x: 720, y: 220, r: 28, c: '#364024' },
        { x: 380, y: 390, r: 22, c: '#744210' },
      ];
      trees.forEach((t) => {
        ctx.fillStyle = t.c;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(t.x - 4, t.y - 4, t.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- Satellite Downlink Beam Overlay (Image 3 style) ---
      if (viewMode === 'satellite') {
        const pulse = (Math.sin(tick * 0.06) + 1) * 0.5;
        ctx.save();
        ctx.strokeStyle = `rgba(72, 187, 120, ${0.4 + pulse * 0.4})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        firesRef.current.forEach((f) => {
          if (!f.active) return;
          // Concentric scanning rings
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius + 15 + pulse * 10, 0, Math.PI * 2);
          ctx.stroke();

          // Satellite telemetry text
          ctx.fillStyle = '#48bb78';
          ctx.font = '10px monospace';
          ctx.fillText(`VIIRS FRP: ${f.frpMw} MW`, f.x - 35, f.y - f.radius - 8);
        });
        ctx.restore();
      }

      // --- Wildfire Flames & Hotspots ---
      firesRef.current.forEach((fire) => {
        if (!fire.active) {
          // Neutralized fire footprint (ash)
          ctx.fillStyle = '#222';
          ctx.beginPath();
          ctx.arc(fire.x, fire.y, fire.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
          return;
        }

        // Fire glow gradient
        const flamePulse = (Math.sin(tick * 0.15 + fire.id) + 1) * 0.5;
        const currentR = fire.radius * (0.85 + flamePulse * 0.25);
        const grad = ctx.createRadialGradient(fire.x, fire.y, 4, fire.x, fire.y, currentR);
        grad.addColorStop(0, '#fff566');
        grad.addColorStop(0.35, '#ff7a18');
        grad.addColorStop(0.7, '#d9381e');
        grad.addColorStop(1, 'rgba(217, 56, 30, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fire.x, fire.y, currentR, 0, Math.PI * 2);
        ctx.fill();

        // Spawn smoke particles
        if (tick % 3 === 0) {
          smokeParticlesRef.current.push({
            x: fire.x + (Math.random() - 0.5) * fire.radius,
            y: fire.y - 5,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -1.2 - Math.random() * 1.5,
            life: 1.0,
            size: 6 + Math.random() * 8,
          });
        }

        // FRP Badge & Health Bar
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(fire.x - 30, fire.y + fire.radius + 6, 60, 6);
        ctx.fillStyle = fire.health > 40 ? '#48bb78' : '#e53e3e';
        ctx.fillRect(fire.x - 30, fire.y + fire.radius + 6, (fire.health / 100) * 60, 6);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🔥 ${fire.frpMw} MW`, fire.x, fire.y + fire.radius + 24);
      });

      // Update & Draw Smoke Particles
      for (let i = smokeParticlesRef.current.length - 1; i >= 0; i--) {
        const sm = smokeParticlesRef.current[i];
        sm.x += sm.vx;
        sm.y += sm.vy;
        sm.life -= 0.015;
        sm.size += 0.25;

        if (sm.life <= 0) {
          smokeParticlesRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(80, 75, 70, ${sm.life * 0.35})`;
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, sm.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Civilians walking toward Evacuation zone
      civiliansRef.current.forEach((civ) => {
        if (!civ.evacuated) {
          // Move towards evacuation center (x=95, y=70)
          const targetX = 95;
          const targetY = 70;
          const dx = targetX - civ.x;
          const dy = targetY - civ.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 15) {
            civ.x += (dx / dist) * civ.speed;
            civ.y += (dy / dist) * civ.speed;
          } else {
            civ.evacuated = true;
            setCiviliansEvacuated((prev) => {
              const next = prev + 1;
              addRadioMessage(isBn ? `🚶 নাগরিক উদ্ধার! (${next}/4 নিরাপদ কেন্দ্রে পৌঁছেছে)` : `🚶 Civilian evacuated! (${next}/4 at Safe Shelter)`);
              return next;
            });
          }

          // Draw civilian icon (blue marker)
          ctx.fillStyle = '#3182ce';
          ctx.beginPath();
          ctx.arc(civ.x, civ.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(civ.x, civ.y - 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Air Tanker Flight Animation & Water Drop (Image 1 style!)
      const tanker = airTankerRef.current;
      if (tanker.active) {
        tanker.x += 4.5;
        tanker.y += 0.8;

        // Draw shadow on ground
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(tanker.x, tanker.y + 70, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Check if overhead fire to drop water
        firesRef.current.forEach((fire) => {
          if (fire.active && Math.abs(tanker.x - fire.x) < 50) {
            fire.health = Math.max(0, fire.health - 0.7);
            if (fire.health <= 0) {
              fire.active = false;
              setFiresExtinguished((prev) => prev + 1);
            }

            // Foam water spray drops from plane
            for (let i = 0; i < 4; i++) {
              waterDropsRef.current.push({
                x: tanker.x + (Math.random() - 0.5) * 20,
                y: tanker.y + 15,
                vx: (Math.random() - 0.5) * 2,
                vy: 3.5 + Math.random() * 2,
                life: 1.0,
              });
            }
          }
        });

        // Draw Air Tanker Airplane
        ctx.fillStyle = '#e53e3e';
        ctx.beginPath();
        ctx.roundRect(tanker.x - 28, tanker.y - 7, 56, 14, 5); // Fuselage
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillRect(tanker.x - 12, tanker.y - 28, 24, 56); // Wings

        ctx.fillStyle = '#ecc94b';
        ctx.fillRect(tanker.x - 26, tanker.y - 12, 8, 24); // Tail wing

        if (tanker.x > canvas.width + 100) {
          tanker.active = false;
        }
      }

      // Draw Water Drop Particles
      for (let i = waterDropsRef.current.length - 1; i >= 0; i--) {
        const drop = waterDropsRef.current[i];
        drop.x += drop.vx;
        drop.y += drop.vy;
        drop.life -= 0.025;

        if (drop.life <= 0) {
          waterDropsRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(99, 179, 237, ${drop.life * 0.9})`;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewMode, isBn, addRadioMessage]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full flex flex-col gap-4 max-w-5xl mx-auto">
      {/* Top Incident Command HUD Bar (Image 1 style!) */}
      <div className="glass panel p-3 sm:p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[var(--panel)] to-red-950/30 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="btn btn-ghost p-2 rounded-xl border border-[var(--line)] cursor-pointer"
            aria-label="Exit Mission"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="chip border-red-500/50 bg-red-950/40 text-red-300 font-mono text-xs font-semibold uppercase tracking-wider">
                {isBn ? 'দাবানল জরুরি নিয়ন্ত্রণ' : 'WILDFIRE INCIDENT COMMAND'}
              </span>
              <span className="font-mono text-xs text-[var(--brass)] font-semibold">
                ⏱️ {formatTimer(missionTimer)}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-display font-bold text-[var(--ink)] mt-0.5">
              {isBn ? 'আমাজন ফায়ার রেসকিউ · নাসা FIRMS স্যাটেলাইট ট্র্যাকিং' : 'Amazon Fire Rescue · NASA FIRMS Satellite Tracking'}
            </h2>
          </div>
        </div>

        {/* View Switcher: Tactical Command, Air Scout, Satellite Downlink */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-[var(--line)]">
          <button
            onClick={() => setViewMode('tactical')}
            className={`text-2xs font-semibold py-1 px-2.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              viewMode === 'tactical' ? 'bg-amber-500 text-black font-semibold' : 'text-[var(--ink-2)] hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isBn ? 'কমান্ড ভিউ' : 'Command Map'}</span>
          </button>
          <button
            onClick={() => setViewMode('satellite')}
            className={`text-2xs font-semibold py-1 px-2.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              viewMode === 'satellite' ? 'bg-emerald-500 text-black font-semibold' : 'text-[var(--ink-2)] hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>{isBn ? 'স্যাটেলাইট বিম' : 'Satellite Downlink'}</span>
          </button>
        </div>

        {/* Air Tanker Water Drop Action Button */}
        <div className="flex items-center gap-2">
          {onSwitchToPlatformer && (
            <button
              onClick={onSwitchToPlatformer}
              className="btn btn-ghost border border-[var(--line)] text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-1 cursor-pointer hover:border-[var(--brass)]"
            >
              <span>{isBn ? 'প্ল্যাটফর্মার মোড' : 'Platformer View'}</span>
            </button>
          )}
          <button
            onClick={deployAirTanker}
            className="btn btn-brass text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg hover:scale-105 cursor-pointer"
          >
            <Plane className="w-4 h-4" />
            <span>{isBn ? 'এয়ার ট্যাংকার ড্রপ' : 'Deploy Air Tanker'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Battlefield Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Status & Objectives Column (Image 1 HUD recreation!) */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          {/* Objectives Card */}
          <div className="p-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] flex flex-col gap-2.5 shadow-md">
            <span className="text-2xs font-mono uppercase tracking-wider text-[var(--brass)] font-semibold">
              {isBn ? 'মিশন অবজেক্টিভস' : 'INCIDENT OBJECTIVES'}
            </span>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  {isBn ? 'দাবানল দমন:' : 'Extinguish Fires:'}
                </span>
                <span className="font-mono font-semibold text-amber-300">{firesExtinguished} / 3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  {isBn ? 'নাগরিক উদ্ধার:' : 'Evacuate Civilians:'}
                </span>
                <span className="font-mono font-semibold text-blue-300">{civiliansEvacuated} / 4</span>
              </div>
            </div>

            {/* Public Safety & Budget Meters */}
            <div className="border-t border-[var(--line)] pt-2 flex flex-col gap-1.5 text-2xs">
              <div className="flex justify-between">
                <span className="text-[var(--ink-3)]">{isBn ? 'পাবলিক সেফটি:' : 'Public Safety:'}</span>
                <span className="text-red-400 font-semibold font-mono">{isBn ? 'উচ্চ ঝুঁকি' : 'SEVERE DANGER'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-3)]">{isBn ? 'পানি সরবরাহ:' : 'Water Payload:'}</span>
                <span className="text-sky-300 font-semibold font-mono">{waterBudget}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${waterBudget}%` }} />
              </div>
            </div>
          </div>

          {/* Radio Telemetry Log Feed */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-[var(--line)] flex flex-col gap-2 flex-1 shadow-inner">
            <span className="text-3xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              {isBn ? 'লাইভ রেডিও ফিড' : 'LIVE RADIO / SATELLITE FEED'}
            </span>
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-48 text-3xs font-mono text-[var(--ink-2)] scroll-thin">
              {radioLog.map((log, i) => (
                <div key={i} className="p-1.5 rounded bg-white/5 border border-white/5">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Canvas Tactical Map Area */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--line)] shadow-2xl bg-black">
            <canvas
              ref={canvasRef}
              width={800}
              height={460}
              onClick={handleCanvasClick}
              className="w-full h-auto cursor-crosshair block"
              aria-label="Tactical Wildfire Canvas"
            />

            {/* Click-to-Spray Ground Hint Overlay */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/75 border border-white/10 text-2xs font-mono text-[var(--ink-2)] backdrop-blur-sm pointer-events-none">
              💡 {isBn ? 'হটস্পটে ক্লিক করে গ্রাউন্ড ওয়াটার স্প্রে করো | বাটন দিয়ে এয়ার ট্যাংকার পাঠাও' : 'Click on fires to deploy ground hose spray | Click button for Air Tanker'}
            </div>

            {/* Educational Simulation Disclaimer */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 border border-amber-500/30 text-3xs font-mono text-amber-300 backdrop-blur-sm pointer-events-none">
              NASA FIRMS VIIRS S-NPP 375m FRP Simulation
            </div>

            {/* Mission Complete Overlay Modal */}
            {missionComplete && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-3">
                  <Award className="w-8 h-8 text-emerald-400 animate-bounce" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white">
                  {isBn ? 'মিশন সম্পন্ন! আমাজন দাবানল শান্ত!' : 'MISSION COMPLETE! AMAZON FIRES EXTINGUISHED!'}
                </h3>
                <p className="text-xs text-[var(--ink-2)] max-w-md mt-1 mb-4 leading-relaxed">
                  {isBn
                    ? 'আপনি সফলভাবে ৩টি দাবানল নিভিয়েছেন এবং নাগরিকদের নিরাপদ আশ্রয়ে পাঠিয়েছেন। আপনি অর্জন করেছেন Fire Guardian Badge এবং ১৫০ XP!'
                    : 'You successfully extinguished all FIRMS active hotspots and protected the forest canopy. You earned the Fire Guardian Badge and 150 XP!'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onExit}
                    className="btn btn-brass px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {isBn ? 'মিশন সেন্টার-এ ফিরে যান' : 'Return to Mission Center'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
