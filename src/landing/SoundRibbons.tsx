import React, { useEffect, useRef } from 'react';

/**
 * Decorative sound-wave ribbons that orbit the landing planet (fire, rain and system colours).
 * A static canvas that lives inside the active planet anchor, so it moves and scales with the planet. The far half is erased where the
 * planet's disc is, so the rings pass behind the Earth and in front of it. Purely decorative: aria-hidden, no data, no motion.
 */
const W = 1360, H = 800, PLANET_R = H / 2; // the canvas is 1.7 planet widths wide and one planet tall
const BANDS: [string, number, number][] = [['#3fd1b5', 1, 3], ['#ff7a3d', .9, 7], ['#4cc3ff', 1.1, 11]];

function drawHalf(g: CanvasRenderingContext2D, front: boolean) {
  const rx = PLANET_R * 1.2, ry = PLANET_R * .3, t0 = front ? 0 : Math.PI;
  g.save();
  g.translate(W / 2, H / 2); g.rotate(-16 * Math.PI / 180);
  BANDS.forEach(([col, sc, fq], bi) => {
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      for (let i = 0; i <= 600; i++) {
        const t = t0 + Math.PI * i / 600, env = Math.pow(Math.max(0, Math.sin(i / 600 * Math.PI)), 1.6);
        const a = (10 + k * 5) * env * Math.sin(t * fq * 6 + bi + k) * Math.sin(t * 2.3 + k);
        const x = Math.cos(t) * (rx * sc + a), y = Math.sin(t) * (ry * sc + a * .6);
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.strokeStyle = col; g.globalAlpha = (front ? .8 : .4) - k * .2; g.lineWidth = k ? 1.2 : 2.4; g.shadowColor = col; g.shadowBlur = 16; g.stroke();
    }
  });
  g.restore();
}

export const SoundRibbons: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current, g = c?.getContext('2d');
    if (!c || !g) return;
    g.clearRect(0, 0, W, H);
    drawHalf(g, false);
    // erase the far half where the planet is
    g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(W / 2, H / 2, PLANET_R * .985, 0, Math.PI * 2); g.fill(); g.restore();
    drawHalf(g, true);
  }, []);
  return <canvas ref={ref} width={W} height={H} className="sound-ribbons" aria-hidden="true" />;
};
