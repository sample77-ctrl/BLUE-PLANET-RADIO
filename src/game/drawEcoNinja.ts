// 3D Cartoon Eco-Ninja Cadet Master Animator Engine
// Provides high-definition 3D cartoon sprite animation (idle, run, jump, spray)
// with graceful 60 FPS skeletal fallback for test/offline environments.

export interface NinjaRenderOptions {
  facing: number; // 1 = right, -1 = left
  isGrounded: boolean;
  isMoving: boolean;
  isJumping?: boolean;
  isSpraying?: boolean;
  holdingGauge?: boolean;
  gaugeFill?: number; // 0 to 100 mm
  walkCycle: number;
  tick: number;
  scale?: number;
}

// Global cached image instances
const images: {
  idle: HTMLImageElement | null;
  run: HTMLImageElement[];
  jump: HTMLImageElement | null;
  spray: HTMLImageElement | null;
} = {
  idle: null,
  run: [],
  jump: null,
  spray: null,
};

let imagesLoaded = false;

export function initNinjaSprites(): void {
  if (imagesLoaded || typeof window === 'undefined') return;
  imagesLoaded = true;

  try {
    const idleImg = new Image();
    idleImg.src = '/images/ninja_cadet_game.png';
    images.idle = idleImg;

    const runImgs = [1, 2, 3, 4].map((i) => {
      const img = new Image();
      img.src = `/images/ninja_run_frame_${i}.png`;
      return img;
    });
    images.run = runImgs;

    const jumpImg = new Image();
    jumpImg.src = '/images/ninja_jump_frame.png';
    images.jump = jumpImg;

    const sprayImg = new Image();
    sprayImg.src = '/images/ninja_spray_frame.png';
    images.spray = sprayImg;
  } catch {
    // Non-browser or SSR fallback
  }
}

// Helper to check if an image is completely ready for canvas drawing
function isReady(img: HTMLImageElement | null | undefined): img is HTMLImageElement {
  return !!img && img.complete && img.naturalWidth > 0;
}

/**
 * Draws the 3D Cartoon Eco-Ninja Cadet with fluid animations:
 * - Running: 4-frame dynamic run cycle with forward lean & sash flutter
 * - Jumping: Airborne tucked-knee pose with vertical sash trail
 * - Spraying: Braced water-cannon action stance with recoil vibration
 * - Idle: Gentle breathing heave and blinking eyes
 */
export function drawEcoNinja(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: NinjaRenderOptions
): void {
  initNinjaSprites();

  const {
    facing = 1,
    isGrounded = true,
    isMoving = false,
    isSpraying = false,
    holdingGauge = false,
    gaugeFill = 0,
    walkCycle = 0,
    tick = 0,
    scale = 1.0,
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);

  // Soft Ground Shadow
  if (isGrounded) {
    const shadowStretch = isMoving ? 1.2 : 1.0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 36, 18 * shadowStretch, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Determine current active sprite frame
  let drawnWithSprite = false;

  if (isSpraying && isReady(images.spray)) {
    // Action Water Spray Pose
    const recoil = Math.sin(tick * 1.5) * 2;
    const w = 82;
    const h = 82;
    ctx.drawImage(images.spray, -w / 2 + recoil, -h + 34, w, h);
    drawnWithSprite = true;
  } else if (!isGrounded && isReady(images.jump)) {
    // Airborne Jump Pose
    const tilt = facing > 0 ? 0.08 : -0.08;
    ctx.rotate(tilt);
    const w = 68;
    const h = 84;
    ctx.drawImage(images.jump, -w / 2, -h + 32, w, h);
    drawnWithSprite = true;
  } else if (isMoving && images.run.length === 4 && images.run.every(isReady)) {
    // 4-Frame Dynamic Running Animation!
    const frameIdx = Math.floor((Math.abs(walkCycle) * 2.2) % 4);
    const runImg = images.run[frameIdx];
    const runBounce = Math.abs(Math.sin(walkCycle * 2)) * 3.5;
    const forwardLean = 0.09; // Leaning forward into the run
    ctx.rotate(forwardLean);

    const w = 58;
    const h = 82;
    ctx.drawImage(runImg, -w / 2, -h + 35 - runBounce, w, h);
    drawnWithSprite = true;
  } else if (isReady(images.idle)) {
    // Idle Breathing Pose
    const breathBounce = Math.sin(tick * 0.08) * 1.8;
    const w = 52;
    const h = 82;
    ctx.drawImage(images.idle, -w / 2, -h + 35 - breathBounce, w, h);
    drawnWithSprite = true;
  }

  // If sprites are not available (e.g. initial load or jsdom test), render rich procedural 3D Eco-Ninja
  if (!drawnWithSprite) {
    renderProceduralEcoNinja(ctx, opts);
  }

  // Overlay gadget: Rain Gauge if holding
  if (holdingGauge) {
    ctx.save();
    ctx.fillStyle = '#e9c46a';
    ctx.beginPath();
    ctx.roundRect(14, -8, 13, 24, [3]);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Blue water level in gauge
    const fillH = (Math.min(100, gaugeFill) / 100) * 16;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(16, 12 - fillH, 9, fillH);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Procedural fallback that replicates the reference 3D cartoon chibi eco-ninja
 * with articulated running limbs, breathing, flowing sash ribbons, and facial expressions.
 */
function renderProceduralEcoNinja(ctx: CanvasRenderingContext2D, opts: NinjaRenderOptions): void {
  const { isGrounded, isMoving, walkCycle, tick } = opts;

  const legAngle = !isGrounded ? -0.4 : isMoving ? Math.sin(walkCycle) * 0.7 : 0;
  const legOffset = !isGrounded ? -5 : Math.sin(walkCycle) * 9;
  const breath = Math.sin(tick * 0.08) * 1.5;
  const forwardTilt = isMoving ? 0.08 : 0;

  ctx.rotate(forwardTilt);

  // 1. Back Arm (swings opposite front leg)
  if (isMoving) {
    ctx.save();
    ctx.fillStyle = '#1e3a2f';
    ctx.fillRect(-15, -legOffset * 0.4, 5, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-15, 8 - legOffset * 0.4, 5, 6);
    ctx.restore();
  }

  // 2. Legs (Forest green trousers & black tabi boots with red ties)
  // Back leg
  ctx.save();
  ctx.translate(-4, 12);
  ctx.rotate(-legAngle);
  ctx.fillStyle = '#1b4332';
  ctx.fillRect(-3, 0, 6, 14);
  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(-4, 12, 8, 9);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-4, 14, 8, 2.5);
  ctx.restore();

  // Front leg
  ctx.save();
  ctx.translate(4, 12);
  ctx.rotate(legAngle);
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(-3, 0, 6, 14);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4, 12, 8, 9);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-4, 14, 8, 2.5);
  ctx.restore();

  // 3. Green Tunic (Torso)
  const tunicGrad = ctx.createLinearGradient(0, -6, 0, 16);
  tunicGrad.addColorStop(0, '#40916c');
  tunicGrad.addColorStop(1, '#1b4332');
  ctx.fillStyle = tunicGrad;
  ctx.beginPath();
  ctx.roundRect(-13, -6 - breath, 26, 22, [5]);
  ctx.fill();

  // 4. Red Sash Belt with dynamic flowing ribbon tails
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-13, 6 - breath, 26, 6);

  // Dynamic Sash Ribbons (fluttering behind character)
  const sashFlutter1 = Math.sin(tick * 0.35) * 6 - (isMoving ? 14 : 3);
  const sashFlutter2 = Math.cos(tick * 0.35) * 5 - (isMoving ? 18 : 5);
  ctx.beginPath();
  ctx.moveTo(-2, 10 - breath);
  ctx.quadraticCurveTo(-10 + sashFlutter1 * 0.5, 16, sashFlutter1, 26);
  ctx.lineTo(sashFlutter1 + 3, 26);
  ctx.quadraticCurveTo(-6 + sashFlutter1 * 0.5, 16, 2, 10 - breath);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(1, 10 - breath);
  ctx.quadraticCurveTo(-14 + sashFlutter2 * 0.5, 18, sashFlutter2, 28);
  ctx.lineTo(sashFlutter2 + 3, 28);
  ctx.quadraticCurveTo(-9 + sashFlutter2 * 0.5, 18, 4, 10 - breath);
  ctx.fill();

  // 5. Front Arm
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(8, -2 - breath + legOffset * 0.3, 5, 12);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(8, 7 - breath + legOffset * 0.3, 5, 7);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(8, 9 - breath + legOffset * 0.3, 5, 2.5);

  // 6. Chibi Head & Cowl
  ctx.save();
  ctx.translate(0, -16 - breath);

  // Skin Face
  ctx.fillStyle = '#ffdfba';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  // Forest Green Ninja Beanie / Hood (3D shaded)
  const hoodGrad = ctx.createLinearGradient(-10, -16, 10, 8);
  hoodGrad.addColorStop(0, '#52b788');
  hoodGrad.addColorStop(0.5, '#2d6a4f');
  hoodGrad.addColorStop(1, '#1b4332');
  ctx.fillStyle = hoodGrad;
  ctx.beginPath();
  ctx.arc(0, -2, 17, Math.PI * 0.9, Math.PI * 2.1);
  ctx.fill();

  // Top cowl knot / twig emblem
  ctx.fillStyle = '#74c69d';
  ctx.beginPath();
  ctx.arc(2, -18, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 7. Glossy Black Ninja Eye-Mask
  ctx.fillStyle = '#0a0f1d';
  ctx.beginPath();
  ctx.roundRect(-14, -6, 28, 11, [4]);
  ctx.fill();

  // Mask highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 8. Large Sparkling Chibi Eyes
  const isBlinking = tick % 140 < 6;
  if (!isBlinking) {
    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-5, -1, 4, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(5, -1, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark Iris / Pupil
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-4.5, -0.5, 3, 0, Math.PI * 2);
    ctx.arc(5.5, -0.5, 3, 0, Math.PI * 2);
    ctx.fill();

    // White Catchlights (3D sparkle)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5.5, -2, 1.3, 0, Math.PI * 2);
    ctx.arc(4.5, -2, 1.3, 0, Math.PI * 2);
    ctx.arc(-3.5, 1, 0.7, 0, Math.PI * 2);
    ctx.arc(6.5, 1, 0.7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Closed happy blink
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-5, -1, 3.5, 0.2, Math.PI - 0.2);
    ctx.arc(5, -1, 3.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // 9. Friendly Smile
  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 7, 3.5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.restore();
}
