#!/usr/bin/env node
/* ElevenLabs narration, one clip per beat of story.json, with word timestamps.
 *   node narrate.mjs --dry            word counts vs time budgets (no API call, no cost)
 *   node narrate.mjs                  generate every beat into out/audio/<id>.mp3 + <id>.json (word start/end seconds)
 *   node narrate.mjs --only 05-demo-a regenerate one beat (the old take is kept as <id>.prev.mp3 first)
 * Reads ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID from .env. The key is never printed. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2)
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null }
const storyFile = arg('--file') ?? 'story.json', only = arg('--only'), dry = args.includes('--dry')
if (!existsSync(join(here, storyFile))) { console.error(`No ${storyFile}: copy story.template.json to story.json and write your script.`); process.exit(1) }
const story = JSON.parse(readFileSync(join(here, storyFile), 'utf8')), wps = story.wordsPerSecond ?? 2.5
const beats = story.beats.filter((b) => !only || b.id === only)
if (!beats.length) { console.error(`No beat "${only}"`); process.exit(1) }
const words = (t) => t.trim().split(/\s+/).length, fmt = (s) => s.toFixed(1).padStart(5) + 's'
if (dry) {
  let tot = 0, budget = 0; console.log('beat'.padEnd(14), 'words  est.    budget')
  for (const b of beats) { const e = words(b.text) / wps; tot += e; budget += b.budget ?? 0; console.log(b.id.padEnd(14), String(words(b.text)).padStart(4), ' ', fmt(e), ' ', fmt(b.budget ?? 0), e > (b.budget ?? 1e9) ? ' OVER' : '') }
  console.log(`total ${fmt(tot)} of budget ${fmt(budget)}  (speech should fill about 80-85 % of the film; the rest is music, pauses and silence)`); process.exit(0)
}
for (const l of readFileSync(join(here, '.env'), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const key = process.env.ELEVENLABS_API_KEY, voice = process.env.ELEVENLABS_VOICE_ID
if (!key || !voice) { console.error('Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env'); process.exit(1) }
const out = join(here, 'out', 'audio'); mkdirSync(out, { recursive: true })
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
for (const b of beats) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: b.text, model_id: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2', voice_settings: { stability: Number(process.env.ELEVENLABS_STABILITY ?? 0.5), similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY ?? 0.75) } }) })
  if (!res.ok) { console.error(`${b.id}: ElevenLabs answered ${res.status} ${(await res.text()).slice(0, 160)}`); process.exit(1) }
  const j = await res.json(), mp3 = join(out, b.id + '.mp3'), js = join(out, b.id + '.json')
  if (existsSync(mp3)) { copyFileSync(mp3, join(out, b.id + '.prev.mp3')); if (existsSync(js)) copyFileSync(js, join(out, b.id + '.prev.json')) }   // never lose a take you liked
  writeFileSync(mp3, Buffer.from(j.audio_base64, 'base64'))
  const a = j.alignment, w = []; let cur = null
  a.characters.forEach((ch, i) => { if (/\s/.test(ch)) { if (cur) { w.push(cur); cur = null } } else { cur ??= { w: '', t0: a.character_start_times_seconds[i], t1: 0 }; cur.w += ch; cur.t1 = a.character_end_times_seconds[i] } })
  if (cur) w.push(cur); writeFileSync(js, JSON.stringify(w))
  const d = dur(mp3); console.log(b.id.padEnd(14), fmt(d), ' budget', fmt(b.budget ?? 99), d > (b.budget ?? 99) ? ' OVER (shorten the text)' : '')
}
