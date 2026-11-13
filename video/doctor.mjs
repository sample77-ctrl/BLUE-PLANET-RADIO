#!/usr/bin/env node
/* Health check for the video workspace: node, ffmpeg + encoders, Chromium, .env keys (never printed), free disk, fonts. */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statfsSync } from 'node:fs'
import { chromePath } from './lib.mjs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
let bad = 0
const ok = (m) => console.log('  ok   ' + m), warn = (m) => console.log('  WARN ' + m), fail = (m) => { bad++; console.log('  FAIL ' + m) }
const check = (c, good, bad, badFn = fail, goodFn = ok) => (c ? goodFn(good) : badFn(bad))
const run = (c, a) => { try { return execFileSync(c, a, { stdio: ['ignore', 'pipe', 'pipe'] }).toString() } catch { return null } }
console.log('Video workspace health check')
const nv = Number(process.versions.node.split('.')[0]); check(nv >= 18, 'node ' + process.versions.node, 'node 18+ needed')
const ff = run('ffmpeg', ['-version']); check(ff, ff?.split('\n')[0].slice(0, 40), 'ffmpeg not found (brew install ffmpeg)')
if (ff) {
  const enc = run('ffmpeg', ['-hide_banner', '-encoders']) ?? ''
  check(enc.includes('libx264'), 'libx264 encoder (1080p deliverable)', 'libx264 missing')
  check(enc.includes('videotoolbox'), 'hevc/h264 VideoToolbox (fast 4K on Mac)', 'no hardware encoder: 4K export will be slow but works', warn)
  const flt = run('ffmpeg', ['-hide_banner', '-filters']) ?? ''
  ;['loudnorm', 'sidechaincompress', 'xstack', 'overlay'].forEach((f) => check(flt.includes(f), 'filter ' + f, 'ffmpeg filter missing: ' + f))
  check(flt.includes('drawtext'), 'drawtext (text burn-in)', 'no drawtext in this ffmpeg: do all text in HTML graphics (the kit does)', warn)
}
const chrome = chromePath()
check(chrome, 'Chromium for graphics and recording (' + chrome?.split('/ms-playwright/')[1]?.split('/')[0] + ')', 'Chromium missing: run  npx playwright-core install chromium')
const envf = join(here, '.env')
if (!existsSync(envf)) fail('.env missing: copy .env.example to .env')
else {
  const e = Object.fromEntries(readFileSync(envf, 'utf8').split('\n').map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]))
  check(e.ELEVENLABS_API_KEY, 'ELEVENLABS_API_KEY set (' + e.ELEVENLABS_API_KEY?.length + ' chars, not shown)', 'ELEVENLABS_API_KEY empty (needed only for narration)', warn)
  check(e.ELEVENLABS_VOICE_ID, 'ELEVENLABS_VOICE_ID set', 'ELEVENLABS_VOICE_ID empty (needed only for narration)', warn)
}
try { const s = statfsSync(here), gb = (s.bavail * s.bsize) / 1e9; if (gb >= 15) ok('free disk ' + gb.toFixed(0) + ' GB'); else check(gb >= 3, 'free disk ' + gb.toFixed(1) + ' GB: fine for 1080p; 4K intermediates need 10-15 GB, delete old out/ folders first', 'free disk ' + gb.toFixed(1) + ' GB: too low even for 1080p work', fail, warn) } catch {}
console.log(bad ? `\n${bad} problem(s) above.` : '\nAll good.'); process.exit(bad ? 1 : 0)
