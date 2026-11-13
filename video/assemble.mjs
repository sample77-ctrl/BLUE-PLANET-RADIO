#!/usr/bin/env node
/* Simple, reliable cut from timeline.json: shots back to back (trim + speed + scale/pad to the film size), voice lines placed at film times,
 * the app's own sound per shot ("sound": dB), optional music ducked under voice + app sound, loudness -16 LUFS, H.264 + AAC.
 *   node assemble.mjs [timeline.json] [--draft] [--plan] [--audio-only]   --draft = 960x540, fast, for timing;  --plan = shot table, no render;
 *   --audio-only = just out/mix.wav (pass 1). Loudness: the mix is measured and set to tl.lufs (default -16) by a fixed gain + limiter.
 * Shots: {file, ss (source in), t (seconds in the film), speed (default 1; source used = t*speed), sound (dB, the clip's own audio; omit = silent)}.
 * Images (.png/.jpg) are held for t. A shot whose source is too short is held on its last frame (and reported), so later shots never slide early.
 * Voice: {file, at, gain (dB, default 0)}. Music: {file, gain, duck}. See timeline.template.json. Everything is 25 fps unless "fps" says otherwise. */
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2)
const tl = JSON.parse(readFileSync(join(here, args.find((a) => a.endsWith('.json')) ?? 'timeline.json'), 'utf8'))
const draft = args.includes('--draft'); let [W, H] = tl.size ?? [1920, 1080]; const FPS = tl.fps ?? 25
if (draft) { W = 960; H = 540 }
const total = tl.shots.reduce((s, x) => s + x.t, 0), isImg = (f) => /\.(png|jpe?g|webp)$/i.test(f)
const probe = (f, a) => { try { return execFileSync('ffprobe', ['-v', 'error', ...a, f]).toString().trim() } catch { return '' } }
for (const s of tl.shots) if (!existsSync(join(here, s.file))) { console.error('missing file', s.file); process.exit(1) }
console.log(`${tl.shots.length} shots, ${total.toFixed(2)} s` + (tl.duration && Math.abs(total - tl.duration) > 0.05 ? `  (target ${tl.duration} s: ${total > tl.duration ? 'cut ' : 'add '}${Math.abs(total - tl.duration).toFixed(2)} s)` : ''))
let at = 0, warnN = 0
for (const [i, s] of tl.shots.entries()) {
  const sp = s.speed ?? 1, f = join(here, s.file), img = isImg(s.file)
  const len = img ? Infinity : parseFloat(probe(f, ['-show_entries', 'format=duration', '-of', 'csv=p=0'])), need = (s.ss ?? 0) + s.t * sp
  s._hasA = !img && s.sound !== undefined && probe(f, ['-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0']) !== ''
  const notes = [need > len + 0.04 ? `SHORT by ${(need - len).toFixed(2)} s (held on last frame)` : '', s.sound !== undefined && !s._hasA && !img ? 'sound set but the file has no audio' : '', s._hasA && sp !== 1 ? 'sound with speed != 1 (tempo-stretched, pitch kept)' : '']
  if (notes.some(Boolean)) warnN++
  if (args.includes('--plan') || notes.some(Boolean)) console.log(`  ${String(i).padStart(2)} ${at.toFixed(2).padStart(7)}-${(at + s.t).toFixed(2).padStart(7)}  ${s.file} @${s.ss ?? 0} x${sp}${s._hasA ? ` sound ${s.sound} dB` : ''}  ${notes.filter(Boolean).join('; ')}`)
  s._at = at; at += s.t
}
if (args.includes('--plan')) process.exit(0)
const inputs = [], fc = [], vfc = [], apps = []   // fc = audio graph, vfc = picture graph
const tempo = (sp) => { const a = []; let r = sp; while (r > 2) { a.push('atempo=2'); r /= 2 } while (r < 0.5) { a.push('atempo=0.5'); r /= 0.5 } a.push(`atempo=${r}`); return a.join(',') }
tl.shots.forEach((s, i) => { const sp = s.speed ?? 1
  if (isImg(s.file)) inputs.push('-loop', '1', '-framerate', String(FPS), '-t', String(s.t + 0.2), '-i', join(here, s.file))
  else inputs.push('-ss', String(s.ss ?? 0), '-t', String(s.t * sp + 0.2), '-i', join(here, s.file))
  vfc.push(`[${i}:v]setpts=(PTS-STARTPTS)/${sp},fps=${FPS},tpad=stop_mode=clone:stop_duration=${s.t},trim=duration=${s.t},setpts=PTS-STARTPTS,scale=${W}:${H}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p[v${i}]`)
  if (s._hasA) { const k = apps.length   // the shot's own sound, cut to the shot, 10 ms fades at the cut so it never clicks
    fc.push(`[${i}:a]aresample=48000,asetpts=PTS-STARTPTS${sp !== 1 ? ',' + tempo(sp) : ''},apad,atrim=duration=${s.t},afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, s.t - 0.01)}:d=0.01,volume=${s.sound}dB,adelay=${Math.round(s._at * 1000)}:all=1[s${k}]`); apps.push(`[s${k}]`) } })
/* burned-in captions: transparent PNGs from captions.mjs, each shown between from and to (overlay keeps a single frame, enable gates it) */
const caps = tl.captions && existsSync(join(here, tl.captions)) && !draftNoCaps() ? JSON.parse(readFileSync(join(here, tl.captions), 'utf8')) : []
function draftNoCaps() { return args.includes('--no-captions') }
vfc.push(tl.shots.map((_, i) => `[v${i}]`).join('') + `concat=n=${tl.shots.length}:v=1:a=0[${caps.length ? 'vcat' : 'vout'}]`)
let n = tl.shots.length; const vo = (tl.voice ?? []).filter((v) => existsSync(join(here, v.file)) || (console.log('  voice file missing, skipped:', v.file), false))
vo.forEach((v) => inputs.push('-i', join(here, v.file)))
const voIdx = vo.map((_, k) => n + k); n += vo.length
let music = null; if (tl.music && existsSync(join(here, tl.music.file))) { inputs.push('-stream_loop', '-1', '-i', join(here, tl.music.file)); music = n++ }
const capIdx = caps.map((c, k) => { inputs.push('-i', join(here, c.file)); return n + k }); n += caps.length
const ck = W / 1920   // captions are made for 1920 wide; the draft is smaller
caps.forEach((c, k) => { if (ck !== 1) vfc.push(`[${capIdx[k]}:v]scale=${W}:-1[cs${k}]`)
  vfc.push(`[${k ? 'vc' + (k - 1) : 'vcat'}][${ck !== 1 ? 'cs' + k : capIdx[k] + ':v'}]overlay=0:${Math.round((c.y ?? 850) * ck)}:enable='between(t,${c.from},${c.to})'[${k === caps.length - 1 ? 'vout' : 'vc' + k}]`) })
const buses = []
if (vo.length) { fc.push(vo.map((v, k) => `[${voIdx[k]}:a]aresample=48000,adelay=${Math.round(v.at * 1000)}:all=1,volume=${(v.gain ?? 0) + 1.6}dB[a${k}]`).join(';')); fc.push(vo.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${vo.length}:normalize=0:dropout_transition=0,asetpts=N/SR/TB,apad=whole_dur=${total}[voice]`); buses.push('voice') }   // padded: sidechaincompress stops when its key input ends
if (apps.length) { fc.push(apps.join('') + `amix=inputs=${apps.length}:normalize=0:dropout_transition=0,asetpts=N/SR/TB,apad=whole_dur=${total}[app]`); buses.push('app') }
/* ducking: music dips under voice and app sound; app sound dips gently (about 6 dB) under the voice so the data stays audible */
const side = [], uses = {}, musF = `aresample=48000,volume=${(tl.music?.gain ?? -18)}dB,atrim=duration=${total},afade=t=in:d=1.5,afade=t=out:st=${Math.max(0, total - 3)}:d=3`
const tap = (b) => { uses[b] = (uses[b] ?? 0) + 1; return `[${b}${uses[b] - 1}]` }   // one split output per consumer, no unused outputs
const hasV = buses.includes('voice'), hasApp = buses.includes('app'), duckMus = music !== null && tl.music.duck !== false && (hasV || hasApp)
if (hasV) side.push(tap('voice'))
if (hasApp) { if (hasV && tl.duckApp !== false) { fc.push(`${tap('app')}${tap('voice')}sidechaincompress=threshold=0.03:ratio=3:attack=30:release=600[appd]`); side.push('[appd]') } else side.push(tap('app')) }
if (music !== null) { fc.push(`[${music}:a]${musF}[mus]`)
  if (duckMus) { const keys = [hasV && tap('voice'), hasApp && tap('app')].filter(Boolean)
    fc.push(keys.length > 1 ? `${keys.join('')}amix=inputs=2:normalize=0:dropout_transition=0,asetpts=N/SR/TB[key]` : `${keys[0]}anull[key]`); fc.push('[mus][key]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=450[duck]'); side.push('[duck]') }
  else side.push('[mus]') }
for (const [b, k] of Object.entries(uses)) fc.push(k > 1 ? `[${b}]asplit=${k}` + Array.from({ length: k }, (_, j) => `[${b}${j}]`).join('') : `[${b}]anull[${b}0]`)
const hasA = side.length > 0, out = join(here, draft ? 'out/draft.mp4' : (tl.out ?? 'out/video.mp4')), mix = join(here, 'out', draft ? 'mix-draft.wav' : 'mix.wav')
mkdirSync(dirname(out), { recursive: true })
/* pass 1: the audio mix alone (32-bit float, no clipping) -> out/mix.wav; then measure it and set the loudness with a fixed gain + a peak limiter.
   A fixed gain keeps the mix's own balance (one-pass loudnorm pumps and cannot lift a film that is mostly quiet sonification). */
let gain = 0
if (hasA) {
  fc.push(`${side.join('')}amix=inputs=${side.length}:normalize=0:dropout_transition=0,asetpts=N/SR/TB,atrim=duration=${total},afade=t=out:st=${Math.max(0, total - 1)}:d=1[mix]`)
  if (process.env.DEBUG_FC) console.log(fc.join(';\n'))
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', fc.join(';'), '-map', '[mix]', '-c:a', 'pcm_f32le', '-ar', '48000', mix], { stdio: 'inherit' })
  const r = spawnSync('ffmpeg', ['-nostats', '-i', mix, '-af', 'loudnorm=I=-16:TP=-1.5:print_format=summary', '-f', 'null', '-'], { encoding: 'utf8' }).stderr
  const I = parseFloat((r.match(/Input Integrated:\s+(-?[\d.]+)/) ?? [])[1])
  gain = Number.isFinite(I) ? Math.max(-30, Math.min(30, (tl.lufs ?? -16) - I)) : 0
  console.log(`audio mix ${Number.isFinite(I) ? I.toFixed(1) : '?'} LUFS -> gain ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB, limiter at -3 dBFS  (${mix.replace(here + '/', '')})`)
  if (args.includes('--audio-only')) process.exit(0)
}
const aIdx = inputs.filter((x) => x === '-i').length
execFileSync('ffmpeg', ['-y', '-v', 'error', '-stats', ...inputs, ...(hasA ? ['-i', mix] : []), '-filter_complex', [...vfc, ...(hasA ? [`[${aIdx}:a]volume=${gain.toFixed(2)}dB,alimiter=limit=0.708:attack=2:release=60:level=false,atrim=duration=${total}[aout]`] : [])].join(';'),
  '-map', '[vout]', ...(hasA ? ['-map', '[aout]'] : []), '-r', String(FPS),
  '-c:v', 'libx264', '-crf', draft ? '28' : '18', '-preset', draft ? 'veryfast' : 'slow', '-pix_fmt', 'yuv420p', ...(hasA ? ['-c:a', 'aac', '-b:a', '256k', '-ar', '48000'] : []), '-t', String(total), '-movflags', '+faststart', out], { stdio: 'inherit' })
console.log(`\nwrote ${out.replace(here + '/', '')}${warnN ? `  (${warnN} shot warning(s) above)` : ''} - now run: node check.mjs ${out.replace(here + '/', '')} ${tl.duration ?? ''}`)
