/** The bundled snapshot files the Quest uses, described from their own metadata (period, generated date). Nothing here is typed in by hand except the names. */
export interface SnapshotInfo {
  id: 'firms' | 'power' | 'sst' | 'gistemp';
  name: string;
  file: string;
  period: string | null; // null: the file could not be read
  generated: string | null;
}

export const SNAPSHOT_FILES: { id: SnapshotInfo['id']; name: string; file: string }[] = [
  { id: 'firms', name: 'NASA FIRMS (VIIRS active fires)', file: '/data/firms_snapshot.json' },
  { id: 'power', name: 'NASA POWER (daily rain, PRECTOTCORR)', file: '/data/precip_snapshot.json' },
  { id: 'sst', name: 'NASA JPL MUR SST (sea-surface anomaly)', file: '/data/sst_snapshot.json' },
  { id: 'gistemp', name: 'NASA GISS GISTEMP v4 (global annual mean)', file: '/data/gistemp_global.json' },
];

interface Raw { generated?: unknown; monthLabel?: unknown; baseline?: unknown; series?: unknown; slices?: unknown }

/** Pure: the period a parsed snapshot file covers, or null when it has none. */
export function periodOf(id: SnapshotInfo['id'], d: Raw): string | null {
  if (id === 'gistemp' && Array.isArray(d.series) && d.series.length) {
    const ys = d.series.map((r: { year?: number }) => r.year).filter((y: unknown): y is number => typeof y === 'number');
    return ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}${typeof d.baseline === 'string' ? `, baseline ${d.baseline}` : ''}` : null;
  }
  if (id === 'sst' && typeof d.monthLabel === 'string') return d.monthLabel;
  if (Array.isArray(d.slices) && d.slices.length) {
    const ds = d.slices.map((s: { dateLabel?: string }) => s.dateLabel).filter((x: unknown): x is string => typeof x === 'string').sort();
    return ds.length ? (ds[0] === ds[ds.length - 1] ? ds[0] : `${ds[0]} to ${ds[ds.length - 1]}`) : null;
  }
  return null;
}

export async function loadSnapshotInfo(fetcher: typeof fetch = fetch): Promise<SnapshotInfo[]> {
  return Promise.all(SNAPSHOT_FILES.map(async (s) => {
    try {
      const r = await fetcher(s.file);
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as Raw;
      return { ...s, period: periodOf(s.id, d), generated: typeof d.generated === 'string' ? d.generated.slice(0, 10) : null };
    } catch {
      return { ...s, period: null, generated: null };
    }
  }));
}
