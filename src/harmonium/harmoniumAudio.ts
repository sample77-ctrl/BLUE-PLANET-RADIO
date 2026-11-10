import { AudioContextManager } from '../audio/audioContext';

export interface HarmoniumNote {
  key: string; // e.g. 'C4'
  note: string; // alias for key
  swara: string; // e.g. 'Sa'
  swaraBn: string; // e.g. 'সা'
  freq: number;
  isBlack: boolean;
  keyboardShortcut: string; // e.g. 'A'
}

export const HARMONIUM_KEYS: HarmoniumNote[] = [
  { key: 'C4', note: 'C4', swara: 'Sa', swaraBn: 'সা', freq: 261.63, isBlack: false, keyboardShortcut: 'A' },
  { key: 'C#4', note: 'C#4', swara: 're', swaraBn: 'ঋ (কোমল রে)', freq: 277.18, isBlack: true, keyboardShortcut: 'W' },
  { key: 'D4', note: 'D4', swara: 'Re', swaraBn: 'রে', freq: 293.66, isBlack: false, keyboardShortcut: 'S' },
  { key: 'D#4', note: 'D#4', swara: 'ga', swaraBn: 'জ্ঞ (কোমল গা)', freq: 311.13, isBlack: true, keyboardShortcut: 'E' },
  { key: 'E4', note: 'E4', swara: 'Ga', swaraBn: 'গা', freq: 329.63, isBlack: false, keyboardShortcut: 'D' },
  { key: 'F4', note: 'F4', swara: 'Ma', swaraBn: 'মা', freq: 349.23, isBlack: false, keyboardShortcut: 'F' },
  { key: 'F#4', note: 'F#4', swara: 'ma\'', swaraBn: 'হ্ম (তীব্র মা)', freq: 369.99, isBlack: true, keyboardShortcut: 'T' },
  { key: 'G4', note: 'G4', swara: 'Pa', swaraBn: 'পা', freq: 392.00, isBlack: false, keyboardShortcut: 'G' },
  { key: 'G#4', note: 'G#4', swara: 'dha', swaraBn: 'দ (কোমল ধা)', freq: 415.30, isBlack: true, keyboardShortcut: 'Y' },
  { key: 'A4', note: 'A4', swara: 'Dha', swaraBn: 'ধা', freq: 440.00, isBlack: false, keyboardShortcut: 'H' },
  { key: 'A#4', note: 'A#4', swara: 'ni', swaraBn: 'ণ (কোমল নি)', freq: 466.16, isBlack: true, keyboardShortcut: 'U' },
  { key: 'B4', note: 'B4', swara: 'Ni', swaraBn: 'নি', freq: 493.88, isBlack: false, keyboardShortcut: 'J' },
  { key: 'C5', note: 'C5', swara: 'Sa\'', swaraBn: 'সা\' (তার সপ্তক)', freq: 523.25, isBlack: false, keyboardShortcut: 'K' },
  { key: 'C#5', note: 'C#5', swara: 're\'', swaraBn: 'ঋ\'', freq: 554.37, isBlack: true, keyboardShortcut: 'O' },
  { key: 'D5', note: 'D5', swara: 'Re\'', swaraBn: 'রে\'', freq: 587.33, isBlack: false, keyboardShortcut: 'L' },
  { key: 'D#5', note: 'D#5', swara: 'ga\'', swaraBn: 'জ্ঞ\'', freq: 622.25, isBlack: true, keyboardShortcut: 'P' },
  { key: 'E5', note: 'E5', swara: 'Ga\'', swaraBn: 'গা\'', freq: 659.25, isBlack: false, keyboardShortcut: ';' },
];

export function swaraForNote(keyOrNote: string): string {
  const item = HARMONIUM_KEYS.find((n) => n.key === keyOrNote || n.note === keyOrNote);
  return item ? `${item.swara} (${item.swaraBn})` : keyOrNote;
}

export interface PlayedNoteEvent {
  key: string;
  note?: string;
  swara: string;
  freq: number;
  timestamp: number;
  durationMs: number;
}

interface ActiveVoice {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  startTime: number;
}

export class HarmoniumAudioEngine {
  private static instance: HarmoniumAudioEngine | null = null;
  private activeVoices = new Map<string, ActiveVoice>();
  private droneVoice: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;
  private droneActive = false;
  private droneKey = 'C4'; // Sa drone by default
  private bellowsPressure = 0.85; // 0 to 1
  private recordedNotes: PlayedNoteEvent[] = [];
  private sequenceTimeoutIds: number[] = [];
  private sequencePlaying = false;
  private futureVoiceNodes: { osc: OscillatorNode; gain: GainNode; lfo?: OscillatorNode } | null = null;
  private futureVoicePlaying = false;

  public static getInstance(): HarmoniumAudioEngine {
    if (!this.instance) {
      this.instance = new HarmoniumAudioEngine();
    }
    return this.instance;
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

  /**
   * Pump the bellows to increase air pressure and acoustic fullness
   */
  public pumpBellows(amount = 0.4): void {
    this.bellowsPressure = Math.min(1.0, this.bellowsPressure + amount);
  }

  public getBellowsPressure(): number {
    return this.bellowsPressure;
  }

  /**
   * Start sounding a harmonium reed key
   */
  public async noteOn(key: string): Promise<void> {
    const noteDef = HARMONIUM_KEYS.find((n) => n.key === key || n.note === key);
    if (!noteDef) return;

    const ctx = await this.getCtx();
    if (!ctx) return;

    // Pump air slightly when playing
    this.pumpBellows(0.15);

    // If already playing this key, release it first
    this.noteOff(key);

    const now = ctx.currentTime;
    const dest = AudioContextManager.getMasterNode() ?? ctx.destination;

    // Acoustic chamber wooden body filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1450 + this.bellowsPressure * 600, now);
    filter.Q.setValueAtTime(1.8, now);

    // Master reed gain
    const gain = ctx.createGain();
    const targetVolume = 0.22 * Math.max(0.3, this.bellowsPressure);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(targetVolume, now + 0.04); // Swell like real reed

    // Male Reed (Primary fundamental)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(noteDef.freq, now);

    // Female Reed (Secondary slightly detuned reed for shimmering harmonium buzz)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(noteDef.freq, now);
    osc2.detune.setValueAtTime(4.2, now); // +4.2 cents detune

    // Connect reeds -> filter -> gain -> master
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);

    this.activeVoices.set(key, {
      osc1,
      osc2,
      filter,
      gain,
      startTime: Date.now(),
    });
  }

  /**
   * Play note helper (records note and triggers sound)
   */
  public playNote(key: string, freq?: number): void {
    const noteDef = HARMONIUM_KEYS.find((n) => n.key === key || n.note === key);
    const resolvedFreq = freq ?? (noteDef ? noteDef.freq : 261.63);
    const swara = noteDef ? noteDef.swara : 'Sa';

    this.recordedNotes.push({
      key,
      note: key,
      swara,
      freq: resolvedFreq,
      timestamp: Date.now(),
      durationMs: 300,
    });

    if (this.recordedNotes.length > 40) {
      this.recordedNotes.shift();
    }

    this.noteOn(key).catch(() => {});
  }

  /**
   * Release a harmonium reed key
   */
  public noteOff(key: string): void {
    const voice = this.activeVoices.get(key);
    if (!voice) return;

    const noteDef = HARMONIUM_KEYS.find((n) => n.key === key || n.note === key);
    const durationMs = Date.now() - voice.startTime;

    if (noteDef) {
      this.recordedNotes.push({
        key: noteDef.key,
        note: noteDef.note,
        swara: noteDef.swara,
        freq: noteDef.freq,
        timestamp: Date.now(),
        durationMs,
      });
      // Keep only last 40 notes
      if (this.recordedNotes.length > 40) {
        this.recordedNotes.shift();
      }
    }

    try {
      const now = voice.gain.context.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08); // Quick reed dampening

      voice.osc1.stop(now + 0.1);
      voice.osc2.stop(now + 0.1);
    } catch {}

    this.activeVoices.delete(key);
  }

  /**
   * Toggle continuous harmonium drone (Sur stop)
   */
  public async toggleDrone(activeOrKey: boolean | string = 'C4', fallbackFreq?: number): Promise<boolean> {
    if (typeof activeOrKey === 'boolean') {
      if (!activeOrKey) {
        if (this.droneVoice) {
          try {
            this.droneVoice.gain.gain.setValueAtTime(0.0001, 0);
            this.droneVoice.osc1.stop();
            this.droneVoice.osc2.stop();
          } catch {}
          this.droneVoice = null;
        }
        this.droneActive = false;
        return false;
      }
      activeOrKey = 'C4';
    }

    const ctx = await this.getCtx();
    if (!ctx) {
      this.droneActive = !this.droneActive;
      this.droneKey = activeOrKey;
      return this.droneActive;
    }

    if (this.droneActive && activeOrKey === this.droneKey) {
      // Turn off
      if (this.droneVoice) {
        try {
          const now = ctx.currentTime;
          this.droneVoice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
          this.droneVoice.osc1.stop(now + 0.2);
          this.droneVoice.osc2.stop(now + 0.2);
        } catch {}
        this.droneVoice = null;
      }
      this.droneActive = false;
      return false;
    } else {
      // Turn on
      const noteDef = HARMONIUM_KEYS.find((n) => n.key === activeOrKey || n.note === activeOrKey) || HARMONIUM_KEYS[0];
      const now = ctx.currentTime;
      const dest = AudioContextManager.getMasterNode() ?? ctx.destination;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.2);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(fallbackFreq ?? noteDef.freq, now);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(fallbackFreq ?? noteDef.freq, now);
      osc2.detune.setValueAtTime(3.5, now);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now);

      this.droneVoice = { osc1, osc2, gain };
      this.droneActive = true;
      this.droneKey = activeOrKey;
      return true;
    }
  }

  public isDroneActive(): boolean {
    return this.droneActive;
  }

  public getDroneKey(): string {
    return this.droneKey;
  }

  /**
   * Get recorded notes summary for analysis & AI prediction
   */
  public getPlayedSummary(): {
    count: number;
    notesCount: number;
    notes: PlayedNoteEvent[];
    dominantFreq: number;
    averageFreq: number;
    highestFreq: number;
    lowestFreq: number;
    swaraSequence: string;
  } {
    if (this.recordedNotes.length === 0) {
      // Default to Sa (C4 - 261.63 Hz) if nothing recorded yet
      return {
        count: 0,
        notesCount: 0,
        notes: [],
        dominantFreq: 261.63,
        averageFreq: 261.63,
        highestFreq: 261.63,
        lowestFreq: 261.63,
        swaraSequence: 'Sa',
      };
    }

    const freqs = this.recordedNotes.map((n) => n.freq);
    const sum = freqs.reduce((a, b) => a + b, 0);
    const avg = sum / freqs.length;
    const highest = Math.max(...freqs);
    const lowest = Math.min(...freqs);

    // Dominant frequency: most frequent note
    const freqCount = new Map<number, number>();
    freqs.forEach((f) => freqCount.set(f, (freqCount.get(f) || 0) + 1));
    let domFreq = freqs[0];
    let maxCount = 0;
    freqCount.forEach((cnt, f) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        domFreq = f;
      }
    });

    const swaraSequence = this.recordedNotes.slice(-8).map((n) => n.swara).join(' - ');

    return {
      count: this.recordedNotes.length,
      notesCount: this.recordedNotes.length,
      notes: [...this.recordedNotes],
      dominantFreq: Math.round(domFreq * 100) / 100,
      averageFreq: Math.round(avg * 100) / 100,
      highestFreq: Math.round(highest * 100) / 100,
      lowestFreq: Math.round(lowest * 100) / 100,
      swaraSequence,
    };
  }

  /**
   * Clear recorded notes
   */
  public clearRecordings(): void {
    this.recordedNotes = [];
  }

  public clearBuffer(): void {
    this.clearRecordings();
  }

  public isSequencePlaying(): boolean {
    return this.sequencePlaying;
  }

  public isFutureVoicePlaying(): boolean {
    return this.futureVoicePlaying;
  }

  /**
   * Stop currently playing saved sequence
   */
  public stopSavedSequence(): void {
    this.sequenceTimeoutIds.forEach((id) => window.clearTimeout(id));
    this.sequenceTimeoutIds = [];
    this.sequencePlaying = false;
    this.activeVoices.forEach((_, key) => this.noteOff(key));
  }

  /**
   * Play back saved notes sequentially as an audible melody
   */
  public async playSavedSequence(
    onStep?: (note: PlayedNoteEvent, index: number) => void,
    onComplete?: () => void
  ): Promise<void> {
    this.stopSavedSequence();
    if (this.recordedNotes.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    const ctx = await this.getCtx();
    if (!ctx) {
      if (onComplete) onComplete();
      return;
    }

    this.sequencePlaying = true;
    const notesToPlay = [...this.recordedNotes];
    const stepDuration = 380; // ms per note

    notesToPlay.forEach((note, idx) => {
      const tid = window.setTimeout(async () => {
        if (!this.sequencePlaying) return;
        if (onStep) onStep(note, idx);
        await this.noteOn(note.key);

        const releaseTid = window.setTimeout(() => {
          this.noteOff(note.key);
        }, stepDuration - 60);
        this.sequenceTimeoutIds.push(releaseTid);

        if (idx === notesToPlay.length - 1) {
          const finalTid = window.setTimeout(() => {
            this.sequencePlaying = false;
            if (onComplete) onComplete();
          }, stepDuration);
          this.sequenceTimeoutIds.push(finalTid);
        }
      }, idx * stepDuration);
      this.sequenceTimeoutIds.push(tid);
    });
  }

  /**
   * Play future climate voice preview based on projected anomaly and frequency
   */
  public async playFutureVoicePreview(freq: number, anomaly: number, durationMs = 2800): Promise<void> {
    this.stopFutureVoicePreview();
    const ctx = await this.getCtx();
    if (!ctx) return;

    this.futureVoicePlaying = true;
    const now = ctx.currentTime;
    const dest = AudioContextManager.getMasterNode() ?? ctx.destination;

    // Carrier oscillator: high thermal pitch
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 1.05, now);

    // LFO to create rapid thermal wind shimmering vibrato
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    const lfoRate = Math.min(14, Math.max(4, 4 + anomaly * 2.5));
    lfo.frequency.setValueAtTime(lfoRate, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(freq * 0.08, now);
    lfo.connect(osc.frequency);

    // Resonant bandpass filter simulating searing atmospheric turbulence
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(Math.min(3200, freq * 2.2), now);
    filter.Q.setValueAtTime(4.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (durationMs / 1000));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    lfo.start(now);
    osc.start(now);

    const stopTime = now + (durationMs / 1000);
    lfo.stop(stopTime + 0.05);
    osc.stop(stopTime + 0.05);

    this.futureVoiceNodes = { osc, lfo, gain };

    window.setTimeout(() => {
      this.futureVoicePlaying = false;
      this.futureVoiceNodes = null;
    }, durationMs);
  }

  /**
   * Stop future voice preview
   */
  public stopFutureVoicePreview(): void {
    if (this.futureVoiceNodes) {
      try {
        this.futureVoiceNodes.gain.gain.setValueAtTime(0.0001, 0);
        this.futureVoiceNodes.osc.stop();
        if (this.futureVoiceNodes.lfo) this.futureVoiceNodes.lfo.stop();
      } catch {}
      this.futureVoiceNodes = null;
    }
    this.futureVoicePlaying = false;
  }

  /**
   * Load curated preset historical or future voices for quick exploration
   */
  public loadPresetVoice(presetType: 'historical-1981' | 'record-2024' | 'future-2055'): void {
    this.clearRecordings();
    if (presetType === 'historical-1981') {
      // Sa - Re - Sa (C4 - D4 - C4) -> ~262Hz / 1981
      this.playNote('C4', 261.63);
      this.playNote('D4', 293.66);
      this.playNote('C4', 261.63);
    } else if (presetType === 'record-2024') {
      // Pa - Dha - Pa (G4 - A4 - G4) -> ~392Hz / 2024
      this.playNote('G4', 392.00);
      this.playNote('A4', 440.00);
      this.playNote('G4', 392.00);
    } else {
      // Sa' - Re' - Sa' (C5 - D5 - C5) -> ~523Hz / Future
      this.playNote('C5', 523.25);
      this.playNote('D5', 587.33);
      this.playNote('C5', 523.25);
    }
  }

  /**
   * Stop all sounding notes and release resources
   */
  public stopAll(): void {
    this.stopSavedSequence();
    this.stopFutureVoicePreview();
    this.activeVoices.forEach((_, key) => {
      this.noteOff(key);
    });
    this.activeVoices.clear();

    if (this.droneVoice) {
      try {
        this.droneVoice.gain.gain.setValueAtTime(0.0001, 0);
        this.droneVoice.osc1.stop();
        this.droneVoice.osc2.stop();
      } catch {}
      this.droneVoice = null;
    }
    this.droneActive = false;
  }
}

export const harmoniumAudio = HarmoniumAudioEngine.getInstance();
