#!/usr/bin/env node
/* Builds timeline.json for the Blue Planet Radio cut from the shot list below: shot lengths -> start times, narration lines anchored to a shot
 * ("at: shot + offset"), so re-generated voice lines or a changed shot length move everything consistently. Prints the table and checks:
 * every voice line must start and end inside the shots it is anchored to, and the film must be exactly the target length.
 *   node build-timeline.mjs [--dry]      writes timeline.json (and stills in out/stills/) unless --dry */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url)), dry = process.argv.includes('--dry'), TARGET = 240, FPS = 25
const fr = (s) => Math.round(s * FPS) / FPS
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(here, f)]).toString())
const still = (id, from, t) => { const f = `out/stills/${id}.png`; if (!dry) { mkdirSync(join(here, 'out/stills'), { recursive: true }); execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(t), '-i', join(here, from), '-frames:v', '1', join(here, f)]) } return f }

/* sound = dB applied to the clip's own sound (the app's sound is far from level: Frame Stage -48 LUFS, Jukebox -32, landing -27, globe -3 at the source) */
const S = [
  { id: 'headphones', file: 'out/graphics/c-headphones.mp4', t: 5 },
  { id: 'hook', file: 'out/clips/hook-frame.mp4', t: 16, sound: 21 },
  { id: 'title', file: 'out/graphics/c-title.mp4', t: 14 },
  { id: 'pics', file: 'out/graphics/c-pics.mp4', t: 13 },
  { id: 'landing', file: 'out/clips/landing.mp4', t: 12, sound: 2 },
  { id: 'frames', file: 'out/clips/frames-sweep.mp4', t: 27, sound: 21 },
  { id: 'abStill', file: still('ab-still', 'out/clips/jukebox-ab.mp4', 0.3), t: 14 },
  { id: 'ab', file: 'out/clips/jukebox-ab.mp4', ss: 0.7, t: 11, sound: 6 },
  { id: 's98', file: still('s98-still', 'out/clips/jukebox-1998.mp4', 0.5), t: 11 },
  { id: 'n98', file: 'out/clips/jukebox-1998.mp4', ss: 0.4, t: 6, sound: 6 },
  { id: 'globe', file: 'out/clips/globe-sound.mp4', t: 14, sound: -20 },
  { id: 'bd', file: 'out/clips/globe-bd.mp4', t: 16, sound: -20 },
  { id: 'harmonium', file: 'out/clips/harmonium.mp4', t: 22, sound: -10 },
  { id: 'accessA', file: 'out/clips/access.mp4', ss: 0, t: 8.6 },
  { id: 'accessB', file: 'out/clips/access.mp4', ss: 16.5, t: 2.6 },
  { id: 'quest', file: 'out/clips/quest.mp4', t: 12, flex: true },
  { id: 'about', file: 'out/clips/about.mp4', t: 15 },
  { id: 'limits', file: 'out/graphics/c-limits.mp4', t: 13 },
  { id: 'close', file: 'out/graphics/c-close.mp4', t: 12 },
]
/* narration: [line id, shot, offset in that shot (s), the last shot it may run into] */
const V = [
  ['01-hook', 'hook', 1.5], ['02-who', 'title', 1.0], ['03-problem', 'pics', 0.8], ['04-answer', 'landing', 0.6],
  ['05-frames', 'frames', 1.5], ['05b-frames', 'frames', 16.5], ['06-data', 'abStill', 0.4], ['06b-data', 's98', 0.4],
  ['07-globe', 'globe', 2.0, 'bd'], ['07b-harmonium', 'harmonium', 0.4], ['07c-harmonium', 'harmonium', 8.3], ['08-everyone', 'accessA', 0.5, 'quest'], ['09-science', 'about', 0.8], ['10-impact', 'limits', 0.8], ['11-close', 'close', 1.0],
]
S.forEach((s) => { s.t = fr(s.t); s.len = /\.png$/.test(s.file) ? Infinity : dur(s.file) })
const fixed = S.filter((s) => !s.flex).reduce((a, s) => a + s.t, 0), fl = S.find((s) => s.flex); fl.t = fr(TARGET - fixed)
let at = 0; S.forEach((s) => { s.at = at; at += s.t })
const by = Object.fromEntries(S.map((s) => [s.id, s])), shotAt = (t) => S.find((s) => t >= s.at - 1e-6 && t < s.at + s.t - 1e-6)
console.log('shot'.padEnd(11), 'start    len   source'); let bad = 0
for (const s of S) { const need = (s.ss ?? 0) + s.t, short = need > s.len + 0.05
  if (short) bad++; console.log(s.id.padEnd(11), s.at.toFixed(2).padStart(6), s.t.toFixed(2).padStart(6), ' ', s.file.split('/').pop(), short ? `  SHORT: source is ${s.len.toFixed(2)} s, needs ${need.toFixed(2)}` : '') }
console.log(`total ${at.toFixed(2)} s (target ${TARGET})  [${fl.id} stretched to ${fl.t.toFixed(2)} s: filler, source ${fl.len.toFixed(2)} s]`)
const voice = []; console.log('\nvoice'.padEnd(12), 'start     end   shot(s)')
for (const [id, shot, off, last] of V) { const f = `out/audio/${id}.mp3`; if (!existsSync(join(here, f))) { console.log(id, 'MISSING'); bad++; continue }
  const a = by[shot].at + off, d = dur(f), e = a + d, s0 = shotAt(a), s1 = shotAt(e - 0.02), ok = s1 && (s1.id === shot || s1.id === last)
  if (!ok) bad++; voice.push({ file: f, at: +a.toFixed(2) })
  console.log(id.padEnd(12), a.toFixed(2).padStart(6), e.toFixed(2).padStart(7), ' ', s0?.id, '->', s1?.id ?? 'PAST THE END', ok ? '' : '  NOT INSIDE ITS SHOT') }
const tl = { size: [1920, 1080], fps: FPS, duration: TARGET, out: 'out/video.mp4', lufs: -16,
  shots: S.map(({ file, ss, t, sound }) => ({ file, ...(ss ? { ss } : {}), t, ...(sound !== undefined ? { sound } : {}) })),
  voice, music: { file: 'footage/music.mp3', gain: -8, duck: true }, captions: 'out/captions/captions.json',
  _notes: 'generated by build-timeline.mjs: edit the shot list and anchors there, not here' }
if (!dry) { writeFileSync(join(here, 'timeline.json'), JSON.stringify(tl, null, 1)); console.log('\nwrote timeline.json') }
console.log(bad ? `\n${bad} PROBLEM(S) above` : '\nno problems'); process.exit(bad ? 1 : 0)
