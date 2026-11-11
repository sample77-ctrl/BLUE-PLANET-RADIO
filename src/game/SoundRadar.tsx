import React from 'react';

interface Props {
  pan: number; // -1 (left) to 1 (right)
  activeSound: 'fire' | 'rain' | 'ocean' | 'none';
  intensity: number; // 0 to 1
}

export const SoundRadar: React.FC<Props> = ({ pan, activeSound, intensity }) => {
  const isLeft = pan < -0.15;
  const isRight = pan > 0.15;
  const isCenter = !isLeft && !isRight;

  const colorMap = {
    fire: 'text-[var(--fire)] border-[var(--fire)]/40 bg-[var(--fire)]/10',
    rain: 'text-[var(--rain)] border-[var(--rain)]/40 bg-[var(--rain)]/10',
    ocean: 'text-[var(--teal)] border-[var(--teal)]/40 bg-[var(--teal)]/10',
    none: 'text-[var(--ink-3)] border-[var(--line)] bg-[var(--panel)]',
  };

  const soundNameMap = {
    fire: 'Wildfire Crackle',
    rain: 'Monsoon Droplets',
    ocean: 'Ocean Bass Drone',
    none: 'Silence',
  };

  const activeColor = colorMap[activeSound];

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg glass border border-[var(--line)] select-none">
      {/* Left Ear Wave */}
      <div className="flex items-center gap-1">
        <span className="text-2xs font-mono font-semibold text-[var(--ink-3)]">L</span>
        <div className="flex items-end gap-0.5 h-4 w-7 justify-end">
          <span
            className={`w-1 rounded-full transition-all duration-150 ${isLeft || isCenter ? 'bg-[var(--signal)]' : 'bg-[var(--line)]'}`}
            style={{ height: isLeft ? `${Math.max(30, intensity * 90)}%` : isCenter ? '40%' : '20%' }}
          />
          <span
            className={`w-1 rounded-full transition-all duration-150 ${isLeft || isCenter ? 'bg-[var(--signal)]' : 'bg-[var(--line)]'}`}
            style={{ height: isLeft ? `${Math.max(40, intensity * 100)}%` : isCenter ? '55%' : '20%' }}
          />
          <span
            className={`w-1 rounded-full transition-all duration-150 ${isLeft ? 'bg-[var(--signal)]' : 'bg-[var(--line)]'}`}
            style={{ height: isLeft ? `${Math.max(20, intensity * 75)}%` : '20%' }}
          />
        </div>
      </div>

      {/* Center Sound Badge */}
      <div className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all ${activeColor}`}>
        <span className="relative flex h-2 w-2">
          {activeSound !== 'none' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
        <span className="whitespace-nowrap font-mono text-2xs">{soundNameMap[activeSound]}</span>
      </div>

      {/* Right Ear Wave */}
      <div className="flex items-center gap-1">
        <div className="flex items-end gap-0.5 h-4 w-7">
          <span
            className={`w-1 rounded-full transition-all duration-150 ${isRight ? 'bg-[var(--signal)]' : 'bg-[var(--line)]'}`}
            style={{ height: isRight ? `${Math.max(20, intensity * 75)}%` : '20%' }}
          />
          <span
            className={`w-1 rounded-full transition-all duration-150 ${isRight || isCenter ? 'bg-[var(--signal)]' : 'bg-[var(--line)]'}`}
            style={{ height: isRight ? `${Math.max(40, intensity * 100)}%` : isCenter ? '55%' : '20%' }}
          />
          <span
            className={`w-1 rounded-full transition-all duration-150 ${isRight || isCenter ? 'bg-[var(--signal)]' : 'bg-[var(--line)]'}`}
            style={{ height: isRight ? `${Math.max(30, intensity * 90)}%` : isCenter ? '40%' : '20%' }}
          />
        </div>
        <span className="text-2xs font-mono font-semibold text-[var(--ink-3)]">R</span>
      </div>
    </div>
  );
};

