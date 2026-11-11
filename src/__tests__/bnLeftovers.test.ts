import { describe, it, expect } from 'vitest';
import { localizeSeries } from '../datasets/seriesBn';
import type { DataSeries } from '../datasets/series';

const base: DataSeries = { id: 'gistemp', variable: 'Global surface temperature anomaly', unit: '°C', source: 'NASA GISS Surface Temperature Analysis (GISTEMP v4), Land-Ocean global annual mean (J-D)', sourceUrl: '', attribution: '', coverage: 'global-context', spatialResolution: '', temporalResolution: '', period: '1880 to 2025', points: [], isLive: false, isSample: false, method: '', limitations: '' };

describe('Bangla names for series that were English', () => {
  it('translates the GISTEMP variable and its GISS source line in Bangla only', () => {
    const bn = localizeSeries(base, 'bn');
    expect(bn.variable).toMatch(/[ঀ-৿]/);
    expect(bn.source).toMatch(/[ঀ-৿]/);
    expect(bn.source).toContain('GISTEMP v4');
    expect(localizeSeries(base, 'en')).toBe(base);
  });
  it('passes an unknown string through instead of guessing', () => {
    const s = { ...base, variable: 'Something new', source: 'Some other source' };
    expect(localizeSeries(s, 'bn')).toBe(s);
  });
});
