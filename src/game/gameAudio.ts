import { AudioContextManager } from '../audio/audioContext';

export class GameAudioEngine {
  private static instance: GameAudioEngine | null = null;
  private activeTimers: number[] = [];
  private activeNodes: { gain: GainNode; stop?: () => void }[] = [];

  public static getInstance(): GameAudioEngine {
    if (!this.instance) {
      this.instance = new GameAudioEngine();
    }
    return this.instance;
  }

  public async init(): Promise<void> {
    await this.getCtx();
  }

  private async getCtx(): Promise<AudioContext | null> {
    try {
      if (!AudioContextManager.isReady()) {
        await AudioContextManager.init();
      }
      return AudioContextManager.getContext();
    } catch {
      return null;
    }
  }

  private getDestination(ctx: AudioContext): AudioNode {
    return AudioContextManager.getMasterNode() ?? ctx.destination;
  }

  private createPanner(ctx: AudioContext, pan: number): AudioNode {
    const clampedPan = Math.max(-1, Math.min(1, pan));
    if (typeof StereoPannerNode !== 'undefined') {
      try {
        const p = new StereoPannerNode(ctx, { pan: clampedPan });
        return p;
      } catch {
        // Fallback below
      }
    }
    const merger = ctx.createChannelMerger(2);
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.value = Math.cos((clampedPan + 1) * 0.25 * Math.PI);
    rightGain.gain.value = Math.sin((clampedPan + 1) * 0.25 * Math.PI);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    return merger;
  }

  /**
   * Synthesize real NASA fire crackles.
   */
  public async playFire(intensity = 0.5, pan = 0, durationMs = 2800): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;

    this.stopAll();

    const dest = this.getDestination(ctx);
    const panner = this.createPanner(ctx, pan);
    panner.connect(dest);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.7, ctx.currentTime);
    master.connect(panner);

    const intervalMs = Math.max(45, 250 - intensity * 205);
    const endTime = Date.now() + durationMs;

    const triggerCrackle = () => {
      if (Date.now() > endTime || !ctx) return;

      const burstLen = 0.015 + Math.random() * 0.02;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * burstLen), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000 + Math.random() * 1800;
      filter.Q.value = 3.0 + Math.random() * 4.0;

      const gain = ctx.createGain();
      const vol = (0.2 + intensity * 0.5) * (0.8 + Math.random() * 0.4);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + burstLen);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      noise.start();
      noise.stop(ctx.currentTime + burstLen);
    };

    triggerCrackle();
    const timer = window.setInterval(() => {
      if (Date.now() > endTime) {
        window.clearInterval(timer);
        return;
      }
      triggerCrackle();
    }, intervalMs);

    this.activeTimers.push(timer);
  }

  /**
   * Synthesize real NASA rain droplets.
   */
  public async playRain(intensity = 0.5, pan = 0, durationMs = 2800): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;

    this.stopAll();

    const dest = this.getDestination(ctx);
    const panner = this.createPanner(ctx, pan);
    panner.connect(dest);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.7, ctx.currentTime);
    master.connect(panner);

    const intervalMs = Math.max(50, 320 - intensity * 270);
    const endTime = Date.now() + durationMs;

    const triggerDrop = () => {
      if (Date.now() > endTime || !ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startFreq = 420 + Math.random() * 260 + intensity * 80;
      const endFreq = startFreq * 0.65;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.04);

      const vol = 0.25 + intensity * 0.35;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

      osc.connect(gain);
      gain.connect(master);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    };

    triggerDrop();
    const timer = window.setInterval(() => {
      if (Date.now() > endTime) {
        window.clearInterval(timer);
        return;
      }
      triggerDrop();
    }, intervalMs);

    this.activeTimers.push(timer);
  }

  /**
   * Synthesize ocean SST anomaly drone.
   */
  public async playOcean(anomaly = 0, pan = 0, durationMs = 3000): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;

    this.stopAll();

    const dest = this.getDestination(ctx);
    const panner = this.createPanner(ctx, pan);
    panner.connect(dest);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 0.3);
    master.connect(panner);

    const semitones = (anomaly / 3.0) * 4;
    const baseFreq = 110 * Math.pow(2, semitones / 12);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380 + (anomaly > 0 ? anomaly * 120 : 0), ctx.currentTime);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.35, ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.2, ctx.currentTime);

    lfo.connect(lfoGain.gain);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(master);

    const now = ctx.currentTime;
    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    const stopTime = now + durationMs / 1000;
    master.gain.setValueAtTime(0.55, stopTime - 0.4);
    master.gain.exponentialRampToValueAtTime(0.001, stopTime);

    osc1.stop(stopTime);
    osc2.stop(stopTime);
    lfo.stop(stopTime);

    this.activeNodes.push({
      gain: master,
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
          lfo.stop();
        } catch {}
      },
    });
  }

  /**
   * Play a single pentatonic note (G3 to G5).
   */
  public async playPentatonicNote(pitchFreq: number, type: 'triangle' | 'sine' = 'triangle', duration = 0.4): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;

    const dest = this.getDestination(ctx);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(pitchFreq, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  /**
   * Play a spatial test tone with stereo/binaural panning (-1 = left, +1 = right).
   */
  public async playTone(freq = 440, pan = 0, duration = 0.5): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;

    const dest = this.getDestination(ctx);
    const panner = this.createPanner(ctx, pan);
    panner.connect(dest);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(panner);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  /**
   * Cute cartoon footstep sound.
   */
  public async playFootstep(): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;
    const dest = this.getDestination(ctx);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120 + Math.random() * 30, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  }

  /**
   * Water splash sound for jumping in puddles or spraying fire.
   */
  public async playSplash(): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;
    const dest = this.getDestination(ctx);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  }

  /**
   * Submarine Sonar Ping sound.
   */
  public async playSonarPing(): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;
    const dest = this.getDestination(ctx);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1180, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.75);
  }

  /**
   * Fire extinguish sizzle.
   */
  public async playSizzle(): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;
    const dest = this.getDestination(ctx);

    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.4));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start();
    noise.stop(ctx.currentTime + 0.3);
  }

  /**
   * Radio message blip sound (Commander Nova).
   */
  public async playRadioBeep(): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;
    const dest = this.getDestination(ctx);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  /**
   * Joyful celebration chime for mission success.
   */
  public async playSuccess(): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const timer = window.setTimeout(() => {
        this.playPentatonicNote(freq, 'triangle', 0.35);
      }, idx * 110);
      this.activeTimers.push(timer);
    });
  }

  /**
   * Gentle, friendly boop sound for trying again.
   */
  public async playBoop(): Promise<void> {
    const ctx = await this.getCtx();
    if (!ctx) return;

    const dest = this.getDestination(ctx);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  /**
   * Stop all currently playing sounds and timers.
   */
  public stopAll(): void {
    this.activeTimers.forEach((t) => window.clearInterval(t));
    this.activeTimers = [];

    this.activeNodes.forEach((n) => {
      try {
        n.stop?.();
      } catch {}
    });
    this.activeNodes = [];
  }
}

export const gameAudio = GameAudioEngine.getInstance();
