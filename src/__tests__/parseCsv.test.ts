import { describe, it, expect } from 'vitest';
import { parseCsv } from '../tracks/csv';

describe('parseCsv', () => {
  it('reads a good file, sorted by x, skipping a header line', () => {
    const r = parseCsv('year,value\n2002,3.5\n2000,1.5\n2001;2\n');
    expect(r.error).toBeUndefined();
    expect(r.points).toEqual([{ year: 2000, value: 1.5 }, { year: 2001, value: 2 }, { year: 2002, value: 3.5 }]);
  });
  it('rejects non-numeric columns as "columns"', () => expect(parseCsv('name,city\nann,paris\nbob,rome').error).toBe('columns'));
  it('rejects a single column as "columns"', () => expect(parseCsv('1\n2\n3').error).toBe('columns'));
  it('rejects an empty file as "rows"', () => { expect(parseCsv('').error).toBe('rows'); expect(parseCsv(' \n\n').error).toBe('rows'); });
  it('rejects a one-row file as "rows"', () => expect(parseCsv('year,value\n2000,1').error).toBe('rows'));
  it('rejects binary input as "unreadable"', () => {
    expect(parseCsv('PK\u0003\u0004\u0000\u0000binary').error).toBe('unreadable');
    expect(parseCsv('��� 1 2').error).toBe('unreadable');
  });
});
