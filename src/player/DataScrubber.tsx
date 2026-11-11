import { useMemo } from 'react';

/** A native range slider laid over a sparkline of the series, so the scrubber shows the data it moves through. */
export function DataScrubber({ spark, index, count, label, valueText, ariaLabel, onSeek }:
  { spark: number[]; index: number; count: number; label: string; valueText: string; ariaLabel: string; onSeek: (i: number) => void }) {
  const W = 200, H = 28;
  const path = useMemo(() => {
    const v = spark.filter((x) => Number.isFinite(x));
    if (v.length < 2) return '';
    const lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1;
    const step = Math.max(1, Math.ceil(spark.length / 120)); // cap the points drawn
    let d = '', n = 0;
    for (let i = 0; i < spark.length; i += step) {
      const y = spark[i]; if (!Number.isFinite(y)) continue;
      d += `${n++ ? 'L' : 'M'}${((i / (spark.length - 1)) * W).toFixed(1)} ${(H - 2 - ((y - lo) / r) * (H - 4)).toFixed(1)}`;
    }
    return d;
  }, [spark]);
  const pct = count > 1 && index >= 0 ? (index / (count - 1)) * 100 : 0;
  return (
    <div className="np-scrub" style={{ ['--np-pct' as string]: `${pct}%` }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={path} className="np-spark-bg" /><path d={path} className="np-spark-fg" />
      </svg>
      <input type="range" min={0} max={Math.max(0, count - 1)} step={1} value={Math.max(0, index)} disabled={count < 2}
        aria-label={ariaLabel} aria-valuetext={[label, valueText].filter(Boolean).join(', ')} onChange={(e) => onSeek(+e.target.value)} />
    </div>
  );
}
