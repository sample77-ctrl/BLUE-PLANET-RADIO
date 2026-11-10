import React, { useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import type { EarthObservation, PhenomenonType } from '../types/dataset';
import { NORMALIZATION_SPECS, normalizeValue } from '../sonification/normalizer';
import { describeVoice } from '../audio/voiceParams';
import { AudioContextManager } from '../audio/audioContext';
import { SonificationEngine } from '../audio/sonificationEngine';
import { LAYER_META } from '../atlas/layerMeta';

const LAYERS: PhenomenonType[] = ['fire', 'precipitation', 'sst'];
const RANGE: Record<PhenomenonType, { lo: number; hi: number; step: number; start: number }> = {
  fire: { lo: 5, hi: 800, step: 1, start: 450 },
  precipitation: { lo: 0, hi: 100, step: 0.5, start: 28.5 },
  sst: { lo: -5, hi: 5, step: 0.1, start: 2.3 },
};
const COLOR: Record<PhenomenonType, string> = { fire: 'var(--fire)', precipitation: 'var(--rain)', sst: 'var(--warm)' };

/** "Try the mapping": move a value and see the real scaling formula and the real sound parameters, then play that sound. Uses the same normalizer, voice formulas and synthesizers as the Atlas. */
export const MappingLab: React.FC = () => {
  const { t } = usePrefs();
  const [layer, setLayer] = useState<PhenomenonType>('fire');
  const [value, setValue] = useState(RANGE.fire.start);
  const [lon, setLon] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(0), wasOn = useRef(false);
  const r = RANGE[layer], spec = NORMALIZATION_SPECS[layer];
  const norm = normalizeValue(layer, value);
  const obs: EarthObservation = { id: 'lab', phenomenon: layer, latitude: 0, longitude: lon, timestamp: '', variable: spec.unit, value, unit: spec.unit, normalizedValue: norm, source: 'Reference sound (not an observation)' };
  const v = describeVoice(obs);
  const pick = (l: PhenomenonType) => { stop(); setLayer(l); setValue(RANGE[l].start); };

  function stop() {
    window.clearTimeout(timer.current);
    SonificationEngine.getInstance().stopAllVoices();
    if (!wasOn.current && playing) SonificationEngine.getInstance().setAudioUnlocked(false);
    setPlaying(false);
  }
  useEffect(() => () => { window.clearTimeout(timer.current); SonificationEngine.getInstance().stopAllVoices(); }, []);
  const play = async () => {
    if (playing) { stop(); return; }
    wasOn.current = AudioContextManager.isReady();
    await AudioContextManager.init();
    const eng = SonificationEngine.getInstance();
    eng.setAudioUnlocked(true);
    eng.stopAllVoices();
    eng.playObservation(obs);
    setPlaying(true);
    timer.current = window.setTimeout(() => { eng.stopAllVoices(); if (!wasOn.current) eng.setAudioUnlocked(false); setPlaying(false); }, 3000);
  };

  const pan = Math.round(Math.abs(v.pan) * 100);
  return (
    <div className="lab glass-flat">
      <div role="radiogroup" aria-label={t('labLayer')} className="lab-tabs">
        {LAYERS.map((l) => {
          const m = LAYER_META[l];
          return <button key={l} type="button" role="radio" aria-checked={layer === l} onClick={() => pick(l)} style={{ '--c': COLOR[l] } as React.CSSProperties}><m.Icon className="w-4 h-4" aria-hidden="true" />{t(m.name)}</button>;
        })}
      </div>
      <div className="lab-grid">
        <div className="lab-in">
          <label htmlFor="lab-v">{t('labValue')}: <b className="tnum" style={{ color: COLOR[layer] }}>{value} {spec.unit}</b></label>
          <input id="lab-v" type="range" min={r.lo} max={r.hi} step={r.step} value={value} onChange={(e) => { if (playing) stop(); setValue(Number(e.target.value)); }} aria-valuetext={`${value} ${spec.unit}`} />
          <label htmlFor="lab-lon" className="mt-3">{t('labLongitude')}: <b className="tnum">{lon > 0 ? `${lon}° E` : lon < 0 ? `${-lon}° W` : '0°'}</b></label>
          <input id="lab-lon" type="range" min={-180} max={180} step={5} value={lon} onChange={(e) => { if (playing) stop(); setLon(Number(e.target.value)); }} aria-valuetext={lon > 0 ? `${lon} degrees east` : lon < 0 ? `${-lon} degrees west` : '0 degrees'} />
          <button type="button" className="btn btn-brass mt-4" onClick={play} aria-pressed={playing}>{playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}{playing ? t('labStop') : t('labPlay')}</button>
          <p className="lab-note">{t('labNote')}</p>
        </div>
        <ol className="lab-flow">
          <li><span className="k">{t('labStepValue')}</span><span className="v tnum">{value} {spec.unit}</span></li>
          <li><span className="k">{t('labStepScale')}</span><code>{spec.formulaString}</code><span className="v tnum">norm = {norm.toFixed(2)}</span><span className="bar"><i style={{ width: `${norm * 100}%`, background: COLOR[layer] }} /></span></li>
          <li><span className="k">{t('labStepSound')}</span>
            <span className="v tnum">{Math.round(v.pitchHz)} Hz{v.ratePerSec ? ` · ${v.ratePerSec.toFixed(1)} ${t('rate')}` : ` · ${t('labDrone')}`}</span>
            <span className="v tnum">{pan < 8 ? t('centre') : `${pan}% ${v.pan < 0 ? t('left') : t('right')}`}</span></li>
        </ol>
      </div>
    </div>
  );
};
