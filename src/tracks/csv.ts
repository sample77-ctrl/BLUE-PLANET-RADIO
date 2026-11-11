export interface Pt { year: number; value: number }
export type CsvError = 'columns' | 'rows' | 'unreadable';

/** Two numeric columns (year, value) per line; anything else is skipped. `error` is set when fewer than 2 rows are usable. */
export function parseCsv(text: string): { points: Pt[]; error?: CsvError } {
  if (text.includes('\0') || text.includes('\uFFFD')) return { points: [], error: 'unreadable' }; // binary, or not valid text
  const pts: Pt[] = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split(/[,;\t ]+/).map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const x = Number(cells[0]), y = Number(cells[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ year: x, value: y });
  }
  const points = pts.sort((a, b) => a.year - b.year).slice(0, 2000);
  if (points.length >= 2) return { points };
  return { points, error: points.length === 0 && text.trim() ? 'columns' : 'rows' };
}
