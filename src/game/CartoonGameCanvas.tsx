import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, Award, Sparkles, ArrowLeft, ArrowRight, ArrowUp, Compass } from 'lucide-react';
import { GameAudioEngine } from './gameAudio';
import { SoundRadar } from './SoundRadar';
import { usePrefs } from '../lib/prefs';
import { drawEcoNinja } from './drawEcoNinja';

interface Props {
  onComplete: () => void;
  onExploreGlobe: () => void;
  audioReady: boolean;
  onSoundOn: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface StarPickup {
  x: number;
  y: number;
  noteFreq: number;
  collected: boolean;
  animOffset: number;
}

const TOTAL_STARS = 10;
const WORLD_WIDTH = 2600;
const GROUND_Y = 410;

export const CartoonGameCanvas: React.FC<Props> = ({ onComplete, onExploreGlobe, audioReady, onSoundOn }) => {
  const { lang } = usePrefs();
  const isBn = lang === 'bn';
  const audio = GameAudioEngine.getInstance();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game & Audio state
  const [starsCollected, setStarsCollected] = useState(0);
  const [currentZone, setCurrentZone] = useState<'forest' | 'meadow' | 'ocean' | 'mountain'>('forest');
  const [speechText, setSpeechText] = useState<string>('');
  const [gameWon, setGameWon] = useState(false);
  const [activeSound, setActiveSound] = useState<'fire' | 'rain' | 'ocean' | 'none'>('none');
  const [soundIntensity, setSoundIntensity] = useState<number>(0);
  const [stereoPan, setStereoPan] = useState<number>(0);

  // Key controls ref
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean; action: boolean }>({
    left: false,
    right: false,
    jump: false,
    action: false,
  });

  // Player state
  const playerRef = useRef({
    x: 120,
    y: 350,
    vx: 0,
    vy: 0,
    width: 40,
    height: 56,
    grounded: true,
    facing: 1, // 1 = right, -1 = left
    walkCycle: 0,
    isJumping: false,
  });

  const cameraXRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<StarPickup[]>([
    { x: 260, y: 340, noteFreq: 261.6, collected: false, animOffset: 0 },
    { x: 480, y: 310, noteFreq: 293.7, collected: false, animOffset: 1 },
    { x: 740, y: 260, noteFreq: 329.6, collected: false, animOffset: 2 },
    { x: 920, y: 330, noteFreq: 392.0, collected: false, animOffset: 3 },
    { x: 1150, y: 240, noteFreq: 440.0, collected: false, animOffset: 4 },
    { x: 1420, y: 340, noteFreq: 523.3, collected: false, animOffset: 5 },
    { x: 1650, y: 310, noteFreq: 587.3, collected: false, animOffset: 6 },
    { x: 1880, y: 270, noteFreq: 659.3, collected: false, animOffset: 7 },
    { x: 2150, y: 290, noteFreq: 784.0, collected: false, animOffset: 8 },
    { x: 2380, y: 220, noteFreq: 1046.5, collected: false, animOffset: 9 },
  ]);

  const fireRef = useRef({ x: 380, y: 375, scanned: false });
  const cloudRef = useRef({ x: 1000, y: 90 });
  const whaleRef = useRef({ x: 1680, y: 400, greeted: false });
  const beaconRef = useRef({ x: 2400, y: 320 });

  const lastSoundTickRef = useRef({ fire: 0, rain: 0, ocean: 0 });

  // Add particles
  const addParticles = (x: number, y: number, color: string, count = 6, speed = 2, size = 4) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.5 + Math.random() * 0.8) * speed;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1,
        life: 0,
        maxLife: 20 + Math.random() * 20,
        color,
        size: size * (0.6 + Math.random() * 0.6),
      });
    }
  };

  // Teleport checkpoint
  const jumpToZone = (xTarget: number) => {
    playerRef.current.x = xTarget;
    playerRef.current.y = 300;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    addParticles(xTarget, 320, '#e9c46a', 20, 3, 5);
    audio.playPentatonicNote(659.3, 'triangle', 0.2);
  };

  // Reset Game
  const handleReset = useCallback(() => {
    playerRef.current = {
      x: 120,
      y: 350,
      vx: 0,
      vy: 0,
      width: 40,
      height: 56,
      grounded: true,
      facing: 1,
      walkCycle: 0,
      isJumping: false,
    };
    cameraXRef.current = 0;
    particlesRef.current = [];
    starsRef.current.forEach((s) => (s.collected = false));
    fireRef.current.scanned = false;
    whaleRef.current.greeted = false;
    setStarsCollected(0);
    setGameWon(false);
    audio.stopAll();
  }, [audio]);

  // Keyboard Event Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        keysRef.current.jump = true;
        e.preventDefault();
      }
      if (['KeyE', 'KeyF', 'Enter'].includes(e.code)) {
        keysRef.current.action = true;
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) keysRef.current.jump = false;
      if (['KeyE', 'KeyF', 'Enter'].includes(e.code)) keysRef.current.action = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Main 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const gameLoop = () => {
      tick++;
      const p = playerRef.current;
      const keys = keysRef.current;

      // 1. Movement Physics
      const ACCEL = 0.85;
      const MAX_SPEED = 5.0;
      const FRICTION = 0.82;
      const GRAVITY = 0.6;
      const JUMP_STRENGTH = -12.5;

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

      // Jump
      if (keys.jump && p.grounded) {
        p.vy = JUMP_STRENGTH;
        p.grounded = false;
        p.isJumping = true;
        addParticles(p.x + p.width / 2, p.y + p.height, '#e8f0f2', 10, 2.5, 3.5);
        audio.playPentatonicNote(587.3, 'triangle', 0.15);
      }

      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      // Ground Collision (rolling hills formula)
      const groundAtX = GROUND_Y - Math.sin((p.x / WORLD_WIDTH) * Math.PI * 4) * 22;
      if (p.y + p.height >= groundAtX) {
        p.y = groundAtX - p.height;
        p.vy = 0;
        p.grounded = true;
        p.isJumping = false;
      }

      // World boundaries
      if (p.x < 30) p.x = 30;
      if (p.x > WORLD_WIDTH - 90) p.x = WORLD_WIDTH - 90;

      // Walk cycle
      if (Math.abs(p.vx) > 0.4 && p.grounded) {
        p.walkCycle += 0.3;
        if (tick % 6 === 0) {
          addParticles(p.x + (p.facing === 1 ? 4 : p.width - 4), p.y + p.height - 2, '#7f96a3', 2, 1, 2);
        }
      } else {
        p.walkCycle = 0;
      }

      // Smooth Camera Follow
      const targetCamX = p.x - canvas.width / 2 + p.width / 2;
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.085;
      if (cameraXRef.current < 0) cameraXRef.current = 0;
      if (cameraXRef.current > WORLD_WIDTH - canvas.width) cameraXRef.current = WORLD_WIDTH - canvas.width;

      const camX = cameraXRef.current;

      // 2. Proximity Sound Triggering & Radar Metrics
      const pan = Math.max(-1, Math.min(1, (p.x / WORLD_WIDTH) * 2 - 1));
      setStereoPan(pan);
      const now = Date.now();

      const distToFire = Math.abs(p.x - fireRef.current.x);
      const distToRain = Math.abs(p.x - cloudRef.current.x);
      const distToWhale = Math.abs(p.x - whaleRef.current.x);

      if (distToFire < 340) {
        setActiveSound('fire');
        const intensity = Math.max(0.1, 1 - distToFire / 340);
        setSoundIntensity(intensity);
        if (now - lastSoundTickRef.current.fire > 1100) {
          lastSoundTickRef.current.fire = now;
          audio.playFire(intensity, pan, 1000);
        }
      } else if (distToRain < 380) {
        setActiveSound('rain');
        const intensity = Math.max(0.1, 1 - distToRain / 380);
        setSoundIntensity(intensity);
        if (now - lastSoundTickRef.current.rain > 1100) {
          lastSoundTickRef.current.rain = now;
          audio.playRain(intensity, pan, 1000);
        }
      } else if (distToWhale < 400) {
        setActiveSound('ocean');
        const intensity = Math.max(0.1, 1 - distToWhale / 400);
        setSoundIntensity(intensity);
        if (now - lastSoundTickRef.current.ocean > 2200) {
          lastSoundTickRef.current.ocean = now;
          audio.playOcean(intensity * 2.5, pan, 2000);
        }
      } else {
        setActiveSound('none');
        setSoundIntensity(0);
      }

      // Zone identification and speech
      if (p.x < 650) {
        setCurrentZone('forest');
        setSpeechText(isBn ? 'বনের মাঝে দাবানল! কাছে গেলে পটপট শব্দ তীব্র হয়!' : 'Wildfire ahead! Notice how crackles intensify as you step closer!');
      } else if (p.x < 1400) {
        setCurrentZone('meadow');
        setSpeechText(isBn ? 'বর্ষার মেঘ! ফোঁটাগুলো টুপটুপ করে ঘন হচ্ছে!' : 'Monsoon Storm! Droplets drip faster under the cloud!');
      } else if (p.x < 2050) {
        setCurrentZone('ocean');
        setSpeechText(isBn ? 'গভীর সাগরের সুর! তিমি বন্ধু গম্ভীর সুরে গান গাইছে!' : 'Deep Ocean! Hear the whale’s calming low bass drone!');
      } else {
        setCurrentZone('mountain');
        setSpeechText(isBn ? 'ক্লাইমেট স্যাটেলাইট পিক! সুর ক্রমেই উঁচুতে চড়ছে!' : 'NASA Climate Peak! Listen to the melody climb high!');
      }

      // Star Pickups Collision
      starsRef.current.forEach((star) => {
        if (!star.collected) {
          const dx = p.x + p.width / 2 - star.x;
          const dy = p.y + p.height / 2 - star.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 34) {
            star.collected = true;
            setStarsCollected((prev) => {
              const next = prev + 1;
              if (next >= starsRef.current.length) {
                setGameWon(true);
                audio.playSuccess();
              }
              return next;
            });
            audio.playPentatonicNote(star.noteFreq, 'triangle', 0.4);
            addParticles(star.x, star.y, '#e9c46a', 16, 3.5, 5);
          }
        }
      });

      // Interactive Action
      if (keys.action) {
        if (distToFire < 80 && !fireRef.current.scanned) {
          fireRef.current.scanned = true;
          audio.playSuccess();
          addParticles(fireRef.current.x, fireRef.current.y, '#3fd1b5', 24, 4.5, 6);
        }
        if (distToWhale < 130 && !whaleRef.current.greeted) {
          whaleRef.current.greeted = true;
          audio.playOcean(2.5, pan, 2800);
          addParticles(whaleRef.current.x, whaleRef.current.y - 30, '#4cc3ff', 24, 4.5, 6);
        }
      }

      // ==================== 3. RENDER STAGE ====================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Parallax Sky & Cosmic Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#03080e');
      skyGrad.addColorStop(0.5, '#091824');
      skyGrad.addColorStop(1, '#11293a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Twinkling stars (Parallax Layer 1)
      for (let i = 0; i < 50; i++) {
        const starX = (i * 80 - camX * 0.15 + WORLD_WIDTH) % WORLD_WIDTH;
        const starY = (i * 39) % (canvas.height - 180);
        const radius = (Math.sin(tick * 0.04 + i) + 1.2) * 1.5;
        ctx.fillStyle = i % 4 === 0 ? '#e9c46a' : '#4cc3ff';
        ctx.beginPath();
        ctx.arc(starX, starY, Math.max(1, radius), 0, Math.PI * 2);
        ctx.fill();
      }

      // Parallax Distant Mountains (Layer 2)
      ctx.save();
      ctx.translate(-camX * 0.4, 0);
      ctx.fillStyle = '#0a1d2d';
      ctx.beginPath();
      ctx.moveTo(-100, canvas.height);
      for (let x = -100; x < WORLD_WIDTH + 400; x += 180) {
        const h = Math.sin(x * 0.004) * 90 + 240;
        ctx.lineTo(x, h);
      }
      ctx.lineTo(WORLD_WIDTH + 400, canvas.height);
      ctx.fill();
      ctx.restore();

      // Main Game Camera Context
      ctx.save();
      ctx.translate(-camX, 0);

      // Ground Landscape (Lush green to ocean coast to snowy peak)
      const groundGrad = ctx.createLinearGradient(0, GROUND_Y - 40, 0, canvas.height);
      groundGrad.addColorStop(0, '#1d4332'); // Cartoon Emerald Grass
      groundGrad.addColorStop(0.4, '#142f23');
      groundGrad.addColorStop(1, '#091510');
      ctx.fillStyle = groundGrad;
      ctx.beginPath();
      ctx.moveTo(-100, canvas.height);
      for (let x = -100; x <= WORLD_WIDTH + 100; x += 20) {
        const gy = GROUND_Y - Math.sin((x / WORLD_WIDTH) * Math.PI * 4) * 22;
        ctx.lineTo(x, gy);
      }
      ctx.lineTo(WORLD_WIDTH + 100, canvas.height);
      ctx.fill();

      // Grass fringe details
      ctx.strokeStyle = '#2d6a4f';
      ctx.lineWidth = 3;
      for (let x = 60; x <= WORLD_WIDTH - 60; x += 35) {
        const gy = GROUND_Y - Math.sin((x / WORLD_WIDTH) * Math.PI * 4) * 22;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x - 4, gy - 6);
        ctx.moveTo(x, gy);
        ctx.lineTo(x + 5, gy - 7);
        ctx.stroke();
      }

      // ==================== BIOME 1: FOREST & CAMPFIRE 🔥 ====================
      // Trees
      for (let tx = 80; tx < 620; tx += 110) {
        const ty = GROUND_Y - Math.sin((tx / WORLD_WIDTH) * Math.PI * 4) * 22;
        // Trunk
        ctx.fillStyle = '#4a2e18';
        ctx.fillRect(tx - 7, ty - 48, 14, 48);
        // Foliage puffs with depth
        ctx.fillStyle = '#1e4d38';
        ctx.beginPath();
        ctx.arc(tx, ty - 64, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.arc(tx - 10, ty - 72, 22, 0, Math.PI * 2);
        ctx.arc(tx + 10, ty - 72, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // Campfire with Soundwave Ripples
      const fx = fireRef.current.x;
      const fy = fireRef.current.y;

      // Pulsing Soundwaves (Visualizing Sound!)
      for (let ring = 1; ring <= 3; ring++) {
        const rRadius = ((tick * 1.5 + ring * 50) % 150) + 20;
        const alpha = Math.max(0, 1 - rRadius / 170) * 0.35;
        ctx.strokeStyle = fireRef.current.scanned ? `rgba(63, 209, 181, ${alpha})` : `rgba(255, 122, 61, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(fx, fy - 10, rRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Fire logs
      ctx.fillStyle = '#3e2312';
      ctx.fillRect(fx - 20, fy + 4, 40, 9);

      // Animated Flame
      const flameWiggle = Math.sin(tick * 0.3) * 5;
      const flameGrad = ctx.createRadialGradient(fx, fy - 14, 4, fx, fy - 14, 32);
      flameGrad.addColorStop(0, fireRef.current.scanned ? '#a7f3d0' : '#ffea00');
      flameGrad.addColorStop(0.5, fireRef.current.scanned ? '#3fd1b5' : '#ff7a3d');
      flameGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(fx - 16, fy + 4);
      ctx.quadraticCurveTo(fx - 20, fy - 24, fx + flameWiggle, fy - 40);
      ctx.quadraticCurveTo(fx + 20, fy - 24, fx + 16, fy + 4);
      ctx.fill();

      // Cute Eyes on the Flame
      ctx.fillStyle = '#071019';
      ctx.beginPath();
      ctx.arc(fx - 6 + flameWiggle * 0.3, fy - 12, 3, 0, Math.PI * 2);
      ctx.arc(fx + 6 + flameWiggle * 0.3, fy - 12, 3, 0, Math.PI * 2);
      ctx.fill();

      // ==================== BIOME 2: MONSOON MEADOW 🌧️ ====================
      const clX = cloudRef.current.x;
      const clY = cloudRef.current.y + Math.sin(tick * 0.04) * 6;

      // Soundwaves from cloud
      for (let ring = 1; ring <= 3; ring++) {
        const rRadius = ((tick * 1.6 + ring * 55) % 170) + 30;
        const alpha = Math.max(0, 1 - rRadius / 190) * 0.3;
        ctx.strokeStyle = `rgba(76, 195, 255, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(clX, clY + 20, rRadius * 1.3, rRadius * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Stylized Fluffy Raincloud
      ctx.fillStyle = '#22384a';
      ctx.beginPath();
      ctx.arc(clX - 55, clY, 36, 0, Math.PI * 2);
      ctx.arc(clX, clY - 22, 50, 0, Math.PI * 2);
      ctx.arc(clX + 55, clY, 36, 0, Math.PI * 2);
      ctx.arc(clX + 22, clY + 12, 36, 0, Math.PI * 2);
      ctx.arc(clX - 22, clY + 12, 36, 0, Math.PI * 2);
      ctx.fill();

      // Cloud smile
      ctx.strokeStyle = '#e8f0f2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(clX - 18, clY - 4, 6, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(clX + 18, clY - 4, 6, 0, Math.PI);
      ctx.stroke();

      // Falling raindrops with trail
      ctx.fillStyle = '#4cc3ff';
      for (let r = 0; r < 26; r++) {
        const rx = clX - 85 + (r * 13 + ((tick * 4 + r * 21) % 170));
        const ry = clY + 40 + ((tick * 9 + r * 39) % 270);
        ctx.beginPath();
        ctx.ellipse(rx, ry, 2.5, 7, 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // ==================== BIOME 3: WHISPERING OCEAN 🐳 ====================
      const ox = 1530;
      // Ocean gradient
      const oceanGrad = ctx.createLinearGradient(ox, GROUND_Y - 20, ox + 500, canvas.height);
      oceanGrad.addColorStop(0, '#0096c7');
      oceanGrad.addColorStop(0.5, '#023e8a');
      oceanGrad.addColorStop(1, '#03045e');
      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.moveTo(ox, GROUND_Y);
      for (let w = ox; w <= ox + 480; w += 20) {
        const waveY = GROUND_Y + Math.sin(w * 0.04 + tick * 0.08) * 8;
        ctx.lineTo(w, waveY);
      }
      ctx.lineTo(ox + 480, canvas.height);
      ctx.lineTo(ox, canvas.height);
      ctx.fill();

      // Whale and soundwaves
      const wx = whaleRef.current.x;
      const wy = whaleRef.current.y + Math.sin(tick * 0.06) * 9;

      // Whale Soundwaves
      for (let ring = 1; ring <= 3; ring++) {
        const rRadius = ((tick * 1.2 + ring * 60) % 160) + 25;
        const alpha = Math.max(0, 1 - rRadius / 180) * 0.35;
        ctx.strokeStyle = `rgba(63, 209, 181, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(wx, wy, rRadius * 1.2, rRadius * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Cute Blue Whale
      ctx.fillStyle = '#48cae4';
      ctx.beginPath();
      ctx.ellipse(wx, wy, 55, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(wx - 50, wy);
      ctx.lineTo(wx - 80, wy - 18);
      ctx.lineTo(wx - 70, wy);
      ctx.lineTo(wx - 80, wy + 18);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#071019';
      ctx.beginPath();
      ctx.arc(wx + 28, wy - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      // Water Spout
      if (tick % 50 < 30) {
        ctx.strokeStyle = '#caf0f8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(wx + 8, wy - 28);
        ctx.quadraticCurveTo(wx - 8, wy - 65, wx - 20, wy - 55);
        ctx.moveTo(wx + 8, wy - 28);
        ctx.quadraticCurveTo(wx + 20, wy - 65, wx + 32, wy - 55);
        ctx.stroke();
      }

      // ==================== BIOME 4: NASA SATELLITE BEACON 📡 ====================
      const bx = beaconRef.current.x;
      const by = beaconRef.current.y;

      // Mountain Snow Peak
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(bx - 90, GROUND_Y + 20);
      ctx.lineTo(bx, by + 50);
      ctx.lineTo(bx + 90, GROUND_Y + 20);
      ctx.fill();

      // Satellite Tower
      ctx.strokeStyle = '#e9c46a';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(bx, by + 50);
      ctx.lineTo(bx, by - 10);
      ctx.stroke();

      // Dish
      ctx.fillStyle = '#e9c46a';
      ctx.beginPath();
      ctx.arc(bx, by - 12, 26, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx, by - 20, 7, 0, Math.PI * 2);
      ctx.fill();

      // Beaming transmission wave
      const pulseRadius = 15 + (tick * 1.8) % 55;
      ctx.strokeStyle = `rgba(233, 196, 106, ${1 - pulseRadius / 55})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(bx, by - 20, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // ==================== COLLECTIBLE SOUND STARS ⭐ ====================
      starsRef.current.forEach((star) => {
        if (!star.collected) {
          const sy = star.y + Math.sin(tick * 0.08 + star.animOffset) * 7;
          ctx.save();
          ctx.translate(star.x, sy);
          ctx.rotate(tick * 0.025 + star.animOffset);

          // Glowing Outer Star
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            const a1 = (s * Math.PI * 2) / 5 - Math.PI / 2;
            const a2 = a1 + Math.PI / 5;
            ctx.lineTo(Math.cos(a1) * 16, Math.sin(a1) * 16);
            ctx.lineTo(Math.cos(a2) * 7, Math.sin(a2) * 7);
          }
          ctx.closePath();
          ctx.fill();

          // Star Face
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(-3.5, -2, 1.8, 0, Math.PI * 2);
          ctx.arc(3.5, -2, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // ==================== CARTOON ASTRO-PIP (PLAYER) 🧑‍🚀 ====================
      const px = p.x;
      const py = p.y;
      const bob = Math.sin(p.walkCycle) * 3.5;

      ctx.save();
      ctx.translate(px + p.width / 2, py + p.height / 2 + bob);
      ctx.scale(p.facing, 1);

      // Sonic Antenna with Dynamic Glowing Sound Orb
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, -22);
      ctx.lineTo(-4, -34);
      ctx.stroke();

      // Antenna Glowing Orb
      const orbColor =
        activeSound === 'fire' ? '#ff7a3d' : activeSound === 'rain' ? '#4cc3ff' : activeSound === 'ocean' ? '#3fd1b5' : '#e9c46a';
      ctx.fillStyle = orbColor;
      ctx.beginPath();
      ctx.arc(-4, -35, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // ==================== 3D ANIMATED ECO-NINJA HERO ====================
      drawEcoNinja(ctx, p.x + p.width / 2, p.y + p.height / 2, {
        facing: p.facing,
        isGrounded: p.grounded,
        isMoving: Math.abs(p.vx) > 0.4,
        isJumping: !p.grounded,
        walkCycle: p.walkCycle,
        tick: tick,
        scale: 1.25,
      });

      // Particles render
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        if (pt.life >= pt.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        const alpha = 1 - pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.restore(); // Restore camera translation

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [audio, isBn, activeSound]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = 480;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-3">
      {/* Top Organization Header: Mission Pill + Sound Radar + Stars */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg glass border border-[var(--line)]">
        {/* Checkpoint Jump Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 pr-2 border-r border-[var(--line)]">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[var(--signal)] shrink-0">
              <img src="/images/ninja_cadet_avatar.png" alt="Cadet" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-semibold font-display text-[var(--ink)] hidden lg:inline">
              {isBn ? 'ইকো-নিনজা' : 'Eco-Ninja'}
            </span>
          </div>

          <span className="text-2xs font-mono text-[var(--ink-3)] uppercase tracking-wider mr-1 hidden sm:inline">
            {isBn ? 'স্থান:' : 'Zone:'}
          </span>
          <button
            onClick={() => jumpToZone(150)}
            className={`chip cursor-pointer py-1 px-2.5 transition text-xs font-semibold ${
              currentZone === 'forest' ? 'border-[var(--fire)] text-[var(--fire)] bg-[var(--fire)]/10' : 'border-[var(--line)] hover:border-[var(--fire)]'
            }`}
          >
            {isBn ? 'দাবানল বন' : 'Sparks Forest'}
          </button>
          <button
            onClick={() => jumpToZone(950)}
            className={`chip cursor-pointer py-1 px-2.5 transition text-xs font-semibold ${
              currentZone === 'meadow' ? 'border-[var(--rain)] text-[var(--rain)] bg-[var(--rain)]/10' : 'border-[var(--line)] hover:border-[var(--rain)]'
            }`}
          >
            {isBn ? 'বর্ষার মেঘ' : 'Rain Meadow'}
          </button>
          <button
            onClick={() => jumpToZone(1600)}
            className={`chip cursor-pointer py-1 px-2.5 transition text-xs font-semibold ${
              currentZone === 'ocean' ? 'border-[var(--teal)] text-[var(--teal)] bg-[var(--teal)]/10' : 'border-[var(--line)] hover:border-[var(--teal)]'
            }`}
          >
            {isBn ? 'সাগরের তিমি' : 'Singing Ocean'}
          </button>
          <button
            onClick={() => jumpToZone(2320)}
            className={`chip cursor-pointer py-1 px-2.5 transition text-xs font-semibold ${
              currentZone === 'mountain' ? 'border-[var(--signal)] text-[var(--signal)] bg-[var(--signal)]/10' : 'border-[var(--line)] hover:border-[var(--signal)]'
            }`}
          >
            {isBn ? 'নাসা চূড়া' : 'NASA Peak'}
          </button>
        </div>

        {/* Live Sound Radar Visualizer */}
        <SoundRadar pan={stereoPan} activeSound={activeSound} intensity={soundIntensity} />

        {/* Star Counter & Sound Toggle */}
        <div className="flex items-center gap-2">
          <div className="chip border-[var(--signal)] text-[var(--signal)] font-semibold flex items-center gap-1.5 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 text-[var(--signal)] animate-spin" />
            <span>{starsCollected} / {TOTAL_STARS}</span>
          </div>

          {!audioReady ? (
            <button
              onClick={onSoundOn}
              className="btn btn-brass text-xs font-semibold flex items-center gap-1.5 py-1 px-3 min-h-[32px]"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>{isBn ? 'শব্দ অন' : 'Sound On'}</span>
            </button>
          ) : (
            <div className="chip border-[var(--hair)] text-[var(--signal)] text-xs flex items-center gap-1 py-1 px-2">
              <Volume2 className="w-3.5 h-3.5 text-[var(--signal)]" />
            </div>
          )}

          <button
            onClick={handleReset}
            className="btn btn-ghost btn-icon border border-[var(--line)]"
            title={isBn ? 'রিসেট' : 'Restart'}
            aria-label={isBn ? 'রিসেট' : 'Restart'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden border-2 border-[var(--line)] relative bg-[var(--abyss)]"
        style={{ minHeight: '480px' }}
      >
        <canvas ref={canvasRef} className="block w-full h-[480px]" />

        {/* Dynamic Cartoon Speech Bubble */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-md w-11/12 p-3 rounded-lg glass-pop border border-[var(--signal)]/60 text-center animate-fade-in pointer-events-none">
          <p className="text-xs sm:text-sm font-semibold text-[var(--ink)]">
            {speechText}
          </p>
        </div>

        {/* Victory Celebration Overlay */}
        {gameWon && (
          <div className="absolute inset-0 bg-[var(--ground)]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-[var(--signal)]">
                <img src="/images/ninja_cadet_avatar.png" alt="Cadet" className="w-full h-full object-cover" />
              </div>
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-[var(--on-signal)] animate-bounce bg-[var(--signal)]">
                <Award className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[var(--signal)]">
              {isBn ? 'অভিনন্দন! তুমি পৃথিবীর সব সুর চিনে ফেলেছ!' : 'Hooray! You Mastered All Earth Sounds!'}
            </h2>
            <p className="text-sm text-[var(--ink-2)] max-w-md">
              {isBn
                ? 'তুমি হাঁটতে হাঁটতেই শিখে ফেলেছ কীভাবে নাসার স্যাটেলাইটগুলো শব্দ দিয়ে আগুন, বৃষ্টি ও সাগরের তাপমাত্রা প্রকাশ করে!'
                : 'While walking, you discovered how NASA satellites turn fires, rain and ocean heat into real-time sound!'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                onClick={onComplete}
                className="btn btn-brass text-sm font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>{isBn ? 'ক্যাডেট সার্টিফিকেট গ্রহণ করো' : 'Claim Cadet Certificate'}</span>
              </button>
              <button
                onClick={onExploreGlobe}
                className="btn btn-ghost border border-[var(--line)] text-sm py-3 px-5 rounded-lg flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-[var(--rain)]" />
                <span>{isBn ? 'লাইভ ৩ডি গ্লোব চালাও' : 'Launch 3D Globe'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tactile Gamepad Controls */}
      <div className="p-3.5 rounded-lg glass border border-[var(--line)] flex flex-wrap items-center justify-between gap-4 select-none">
        <div className="text-xs text-[var(--ink-3)] font-mono hidden md:block">
          {isBn
            ? 'কীবোর্ড কন্ট্রোল: ← / → (হাঁটা), Space / ↑ (লাফানো), E / F (স্ক্যান ও ইন্টার‍্যাকশন)'
            : 'Controls: Arrow Keys / WASD to Walk, Space to Jump, E or F to Scan!'}
        </div>

        {/* Touch Gamepad Buttons */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2">
            <button
              onTouchStart={() => (keysRef.current.left = true)}
              onTouchEnd={() => (keysRef.current.left = false)}
              onMouseDown={() => (keysRef.current.left = true)}
              onMouseUp={() => (keysRef.current.left = false)}
              className="w-14 h-14 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] active:bg-[var(--signal)] active:text-[var(--on-signal)] flex items-center justify-center cursor-pointer"
              aria-label="Walk Left"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onTouchStart={() => (keysRef.current.right = true)}
              onTouchEnd={() => (keysRef.current.right = false)}
              onMouseDown={() => (keysRef.current.right = true)}
              onMouseUp={() => (keysRef.current.right = false)}
              className="w-14 h-14 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] active:bg-[var(--signal)] active:text-[var(--on-signal)] flex items-center justify-center cursor-pointer"
              aria-label="Walk Right"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onTouchStart={() => {
                keysRef.current.action = true;
                setTimeout(() => (keysRef.current.action = false), 200);
              }}
              onMouseDown={() => {
                keysRef.current.action = true;
                setTimeout(() => (keysRef.current.action = false), 200);
              }}
              className="h-14 px-5 rounded-lg bg-[var(--panel-2)] border border-[var(--signal)]/50 active:bg-[var(--signal)] active:text-[var(--on-signal)] flex items-center gap-2 text-xs font-semibold cursor-pointer text-[var(--signal)]"
              aria-label="Scan or Interact"
            >
              <Sparkles className="w-5 h-5" />
              <span>{isBn ? 'স্ক্যান' : 'Action'}</span>
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
              className="w-14 h-14 rounded-lg bg-[var(--signal)] text-[var(--on-signal)] font-semibold flex items-center justify-center active:scale-95 cursor-pointer"
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
