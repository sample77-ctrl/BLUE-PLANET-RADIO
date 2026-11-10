import React, { useEffect, useRef } from 'react';
import { AudioContextManager } from '../audio/audioContext';
import { usePrefs } from '../lib/prefs';

/**
 * The real output of the page, drawn: a waveform ribbon and a spectrum, both read from the master AnalyserNode.
 * Nothing here is simulated: with sound off the lines are flat. With reduced motion it redraws a few times a second instead of every frame.
 */
export const LiveWaveform: React.FC<{ active: boolean; color?: string; height?: number }> = ({ active, color = '#3fd1b5', height = 72 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reduceMotion } = usePrefs();
  useEffect(() => {
    const c = ref.current, g = c?.getContext('2d');
    if (!c || !g) return;
    let raf = 0, timer = 0, live = true;
    const wave = new Uint8Array(512), spec = new Uint8Array(512);
    const draw = () => {
      if (!live) return;
      const w = c.width, h = c.height, an = active ? AudioContextManager.getAnalyser() : null;
      g.clearRect(0, 0, w, h);
      if (an) { an.getByteTimeDomainData(wave); an.getByteFrequencyData(spec); } else { wave.fill(128); spec.fill(0); }
      // spectrum: 40 bars up to ~4 kHz (the bins are 43 Hz wide at 44.1 kHz)
      const bars = 40, bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const v = spec[Math.min(95, 1 + Math.round(i * 2.2))] / 255, bh = Math.max(2, v * h * .85);
        g.fillStyle = i < bars * .25 ? '#4cc3ff' : i < bars * .7 ? '#ff7a3d' : '#f25c8a'; g.globalAlpha = .28 + v * .5;
        g.fillRect(i * bw + 1, h - bh, bw - 2, bh);
      }
      g.globalAlpha = 1; g.lineWidth = 2; g.strokeStyle = color; g.shadowColor = color; g.shadowBlur = 10;
      g.beginPath();
      for (let i = 0; i < wave.length; i++) { const x = i / (wave.length - 1) * w, y = h / 2 + ((wave[i] - 128) / 128) * h * .45; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke(); g.shadowBlur = 0;
      if (reduceMotion) timer = window.setTimeout(draw, 250); else raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { live = false; cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [active, color, reduceMotion]);
  return <canvas ref={ref} width={320} height={height} className="live-wave" style={{ height }} aria-hidden="true" />;
};
