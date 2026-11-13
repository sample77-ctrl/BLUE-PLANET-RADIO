#!/usr/bin/env node
/* Quality gate for a finished video:  node check.mjs out/video.mp4 [targetSeconds] [--sheet]
 * Prints duration / size / fps / audio, loudness (target -16 LUFS, peak under -1 dB) and, with --sheet, a contact sheet out/sheet.png of 16 evenly spaced frames. */
import { execFileSync, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url)), [file, target] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!file) { console.error('usage: node check.mjs <video> [targetSeconds] [--sheet]'); process.exit(1) }
const pr = (a) => execFileSync('ffprobe', ['-v', 'error', ...a, file]).toString().trim()
const dur = parseFloat(pr(['-show_entries', 'format=duration', '-of', 'csv=p=0'])), v = pr(['-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,codec_name', '-of', 'csv=p=0']), a = pr(['-select_streams', 'a:0', '-show_entries', 'stream=codec_name,channels', '-of', 'csv=p=0'])
const size = (execFileSync('ls', ['-l', file]).toString().split(/\s+/)[4] / 1e6).toFixed(0)
let bad = 0; const line = (ok, m) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + m) }
console.log(file); line(true, `video ${v}  audio ${a || 'NONE'}  ${size} MB`); line(!!a, 'has an audio track')
if (target) line(Math.abs(dur - Number(target)) <= 0.5, `duration ${dur.toFixed(2)} s (target ${target}, hard limits: check the challenge rules)`); else line(true, `duration ${dur.toFixed(2)} s`)
if (a) { const r = spawnSync('ffmpeg', ['-nostats', '-i', file, '-af', 'loudnorm=I=-16:TP=-1.5:print_format=summary', '-f', 'null', '-'], { encoding: 'utf8' }).stderr
  const lu = parseFloat((r.match(/Input Integrated:\s+(-?[\d.]+)/) ?? [])[1]), tp = parseFloat((r.match(/Input True Peak:\s+(-?[\d.]+)/) ?? [])[1])
  line(lu > -20 && lu < -13, `loudness ${lu} LUFS (aim -16, ok -20..-13)`); line(tp < -0.5, `true peak ${tp} dBTP (keep under -1)`) }
if (process.argv.includes('--sheet')) { const ts = Array.from({ length: 16 }, (_, i) => ((i + 0.5) * dur / 16).toFixed(2)); execFileSync('bash', [join(here, 'frames-sheet.sh'), file, join(here, 'out', 'sheet.png'), ...ts]); console.log('  contact sheet: out/sheet.png (look at it: black frames, wrong screens, text cut off?)') }
console.log(bad ? `${bad} problem(s)` : 'passes'); process.exit(bad ? 1 : 0)
