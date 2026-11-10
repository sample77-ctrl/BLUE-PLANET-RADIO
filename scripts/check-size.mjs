// Size budget for the production build (gzip). Run after `npm run build`. Fails when a chunk grows past its budget, so a heavy dependency cannot slip in unnoticed.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dir = 'dist/assets';
const BUDGET_KB = [
  [/^index-.*\.js$/, 175, 'main bundle (loaded on every page)'],
  [/^framing-.*\.js$/, 150, 'three.js and globe code (loaded with the first 3D Earth)'],
  [/^countries-50m-.*\.js$/, 260, 'detailed borders (loaded only when a country is picked)'],
  [/^countries-110m-.*\.js$/, 45, 'coarse borders'],
  [/^SonicQuest-.*\.js$/, 75, 'Sonic Quest (lazy)'],
  [/^index-.*\.css$/, 32, 'stylesheet'],
];
let bad = 0;
for (const f of readdirSync(dir)) {
  for (const [re, kb, what] of BUDGET_KB) {
    if (!re.test(f)) continue;
    const gz = gzipSync(readFileSync(join(dir, f))).length / 1024;
    const ok = gz <= kb;
    console.log(`${ok ? 'ok  ' : 'OVER'} ${f.padEnd(40)} ${gz.toFixed(1).padStart(6)} kB gzip  (budget ${kb})  ${what}`);
    if (!ok) bad++;
  }
}
if (bad) { console.error(`${bad} chunk(s) over budget`); process.exit(1); }
