#!/usr/bin/env node
/* Screen recordings of the live app, 1920x1080 at 25 fps, WITH the app's own Web Audio sound, driven by shots.json (no code per shot).
 *   node record.mjs --list                 the shots in shots.json
 *   node record.mjs landing jukebox        record those shots -> out/clips/<id>.mp4 (H.264 + AAC; the sound is the app's, not the speakers')
 *   node record.mjs --all
 *   node record.mjs --sync-test            records a flash+beep test page and prints the audio/video offset (do this once per machine)
 *   options: --base http://localhost:4173  --file shots.json  --seconds N  --headless  --audible (hear it while recording)  --no-audio  --keep-raw
 * How the sound is captured: an init script hooks AudioNode.connect, so every node the app connects to its AudioContext's destination is also
 * connected to a MediaStreamDestination that a MediaRecorder records. Wall-clock start times line it up with Playwright's video.
 * Not captured: <audio>/<video> elements not routed through Web Audio, and speechSynthesis (OS speech). Headed by default: WebGL needs the GPU.
 * Each shot gets a fresh browser profile (no stale service worker or saved settings) unless shots.json "init.localStorage" seeds some. */
import { chromium } from 'playwright-core'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromePath } from './lib.mjs'

const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2)
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d }
const FPS = 25, wait = (ms) => new Promise((r) => setTimeout(r, ms))
const syncTest = args.includes('--sync-test'), noAudio = args.includes('--no-audio')
const cfgFile = join(here, opt('--file', 'shots.json'))
if (!syncTest && !existsSync(cfgFile)) { console.error(`No ${cfgFile.replace(here + '/', '')}: copy shots.template.json to shots.json.`); process.exit(1) }
const cfg = syncTest ? { shots: {} } : JSON.parse(readFileSync(cfgFile, 'utf8'))
const [W, H] = cfg.viewport ?? [1920, 1080], base = opt('--base', cfg.base ?? 'http://localhost:4173')

/* ---- the audio tap, injected before any page script ---- */
const TAP = () => {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC || window.__rec) return
  const R = window.__rec = { taps: [], on: false, log: [] }
  const con = AudioNode.prototype.connect, dis = AudioNode.prototype.disconnect
  const start = (t) => { if (t.mr) return; t.mr = new MediaRecorder(t.dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 256000 }); t.chunks = []
    t.mr.ondataavailable = (e) => e.data.size && t.chunks.push(e.data); t.mr.onstart = () => { t.wall = Date.now() }; t.mr.start(250) }
  /* Chrome's MediaRecorder skips stretches where the stream is silent, which breaks timing; one LSB of DC (about -90 dB) keeps it recording */
  const tapFor = (ctx) => { let t = R.taps.find((x) => x.ctx === ctx); if (!t) { t = { ctx, dest: ctx.createMediaStreamDestination() }; R.taps.push(t)
    try { const k = ctx.createConstantSource(); k.offset.value = 1 / 32768; con.call(k, t.dest); k.start() } catch {}
    ctx.addEventListener?.('statechange', () => R.log.push([Date.now(), R.taps.indexOf(t), ctx.state])); if (R.on) start(t) } return t }
  AudioNode.prototype.connect = function (d, o) { const r = con.apply(this, arguments)
    if (typeof AudioDestinationNode !== 'undefined' && d instanceof AudioDestinationNode) try { con.call(this, tapFor(d.context).dest, o ?? 0) } catch {}
    return r }
  AudioNode.prototype.disconnect = function (d) { const r = dis.apply(this, arguments)
    if (typeof AudioDestinationNode !== 'undefined' && d instanceof AudioDestinationNode) try { dis.call(this, tapFor(d.context).dest) } catch {}
    return r }
  /* time zero: a full-screen marker colour for a few frames, removed at t0; the clip is cut at the first frame without it */
  R.begin = async () => { R.on = true; R.taps.forEach(start)
    const m = document.createElement('div'); m.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#ff00ff;pointer-events:none'
    document.documentElement.appendChild(m); const raf = () => new Promise((r) => requestAnimationFrame(r))
    await raf(); await new Promise((r) => setTimeout(r, 240)); m.remove(); await raf(); return Date.now() }
  R.end = async () => Promise.all(R.taps.filter((t) => t.mr).map((t) => new Promise((res) => {
    t.mr.onstop = async () => { const b = new Blob(t.chunks, { type: 'audio/webm' }), buf = new Uint8Array(await b.arrayBuffer()); let s = ''
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000))
      res({ wall: t.wall, state: t.ctx.state, b64: btoa(s) }) }
    t.mr.stop() })))
}

const MARK = async () => { if (window.__rec) return window.__rec.begin()
  const m = document.createElement('div'); m.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#ff00ff;pointer-events:none'
  document.documentElement.appendChild(m); const raf = () => new Promise((r) => requestAnimationFrame(r))
  await raf(); await new Promise((r) => setTimeout(r, 240)); m.remove(); await raf(); return Date.now() }
/* the first frame after the marker: magenta has both chroma planes high */
function markerEnd(webm) {
  const o = spawnSync('ffmpeg', ['-v', 'error', '-i', webm, '-vf', 'scale=64:36,signalstats,metadata=print:file=-', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout
  const fr = o.split(/frame:\d+\s+/).slice(1).map((b) => ({ t: Number((b.match(/pts_time:([\d.]+)/) ?? [])[1]), u: Number((b.match(/UAVG=([\d.]+)/) ?? [])[1]), v: Number((b.match(/VAVG=([\d.]+)/) ?? [])[1]) }))
  const mag = (f) => f.u > 180 && f.v > 180; let last = -1; fr.forEach((f, i) => { if (mag(f)) last = i })
  return last >= 0 && fr[last + 1] ? fr[last + 1].t : null
}
/* ---- locators and steps (all data, see shots.template.json) ---- */
const rx = (s) => { const m = typeof s === 'string' && s.match(/^\/(.*)\/([a-z]*)$/s); return m ? new RegExp(m[1], m[2]) : s }
function loc(page, s) {
  let l = s.role ? page.getByRole(s.role, s.name !== undefined ? { name: rx(s.name), exact: s.exact } : {})
    : s.label ? page.getByLabel(rx(s.label), { exact: s.exact }) : s.text ? page.getByText(rx(s.text), { exact: s.exact })
    : s.placeholder ? page.getByPlaceholder(rx(s.placeholder)) : s.selector ? page.locator(s.selector) : null
  if (!l) throw new Error('step needs role/name, label, text, placeholder or selector')
  return s.nth !== undefined ? l.nth(s.nth) : l.first()
}
const glide = (page, y, ms) => page.evaluate(([y, ms]) => new Promise((r) => { const y0 = scrollY, t0 = performance.now(); const f = (n) => { const k = Math.min(1, (n - t0) / ms); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; scrollTo(0, y0 + (y - y0) * e); if (k < 1) requestAnimationFrame(f); else r() }; requestAnimationFrame(f) }), [y, ms])
async function step(page, s) {
  const to = { timeout: s.timeout ?? 5000 }
  switch (s.do) {
    case 'click': return loc(page, s).click(to)
    case 'hover': return loc(page, s).hover(to)
    case 'fill': return loc(page, s).fill(s.value ?? '', to)
    case 'type': { if (s.role || s.label || s.text || s.selector || s.placeholder) await loc(page, s).click(to); return page.keyboard.type(s.value ?? '', { delay: s.delay ?? 70 }) }   // human-speed typing reads on camera
    case 'select': return loc(page, s).selectOption(/^\d+$/.test(String(s.value)) ? String(s.value) : { label: String(s.value) }, to)   // <select>: value or visible label
    case 'check': return loc(page, s).setChecked(s.on !== false, to)
    case 'hold': { await page.keyboard.down(s.key); await wait(s.ms ?? 800); return page.keyboard.up(s.key) }   // a key held down (a note that sounds for ms)
    case 'press': return page.keyboard.press(s.key)
    case 'move': return page.mouse.move(s.x, s.y, { steps: s.steps ?? 25 })
    case 'wheel': return page.mouse.wheel(0, s.dy ?? 100)
    case 'scroll': return s.y !== undefined ? glide(page, s.y, s.ms ?? 1500) : loc(page, s).scrollIntoViewIfNeeded(to)
    case 'waitFor': return loc(page, s).waitFor({ state: s.state ?? 'visible', timeout: s.timeout ?? 15000 })
    case 'goto': return page.goto(base + s.url, { waitUntil: 'load' })
    case 'css': return page.addStyleTag({ content: s.value })   // e.g. enlarge a small control so it reads at 1080p
    case 'js': return page.evaluate(s.value)
    default: throw new Error('unknown step "do": ' + s.do)
  }
}

const probeDur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
const clips = join(here, 'out', 'clips'); mkdirSync(clips, { recursive: true })

async function record(browser, id, shot) {
  const seconds = Number(opt('--seconds', shot.seconds ?? 10)), tmp = join(here, 'out', 'tmp-rec-' + id)
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true })
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: cfg.colorScheme ?? 'dark', reducedMotion: shot.reducedMotion ? 'reduce' : 'no-preference', recordVideo: { dir: tmp, size: { width: W, height: H } } })
  const ls = { ...(cfg.init?.localStorage ?? {}), ...(shot.localStorage ?? {}) }
  await ctx.addInitScript((ls) => { try { for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v) } catch {} }, ls)
  if (!noAudio) await ctx.addInitScript(TAP)
  const tCtx = Date.now(), page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(`  [${id}] page error:`, e.message.slice(0, 160)))
  if (shot.html) await page.setContent(shot.html); else await page.goto(base + (shot.url ?? '/'), { waitUntil: 'load' })
  /* wait until the page is really ready, then cut the loading off the front of the clip */
  const rd = shot.ready ?? {}
  try {
    if (rd.selector || rd.role || rd.text || rd.label) await loc(page, rd).waitFor({ state: 'visible', timeout: (rd.timeout ?? 60) * 1000 })
    if (rd.gone) await page.waitForFunction((re) => !new RegExp(re, 'i').test(document.body.innerText), rd.gone, { timeout: (rd.timeout ?? 60) * 1000 })
    await page.evaluate(() => document.fonts.ready)
  } catch { console.log(`  [${id}] not ready after ${rd.timeout ?? 60} s, recording anyway`) }
  await wait((rd.settle ?? 1.0) * 1000)
  for (const s of shot.setup ?? []) try { await step(page, s) } catch (e) { console.log(`  [${id}] setup ${s.do}:`, e.message.split('\n')[0].slice(0, 120)) }
  const t0 = await page.evaluate(MARK)
  for (const s of shot.steps ?? []) {
    await wait(Math.max(0, (s.at ?? 0) * 1000 - (Date.now() - t0)))
    const late = (Date.now() - t0) / 1000 - (s.at ?? 0); if (late > 0.25) console.log(`  [${id}] step at ${s.at}s ran ${late.toFixed(2)} s late`)
    try { await step(page, s) } catch (e) { console.log(`  [${id}] step ${s.at}s ${s.do}:`, e.message.split('\n')[0].slice(0, 120)) }
  }
  await wait(Math.max(0, seconds * 1000 - (Date.now() - t0)) + 300)
  const tracks = noAudio ? [] : await page.evaluate(() => window.__rec?.end() ?? []).catch(() => [])
  const stLog = noAudio ? [] : await page.evaluate(() => window.__rec?.log ?? []).catch(() => [])
  await ctx.close()   // flushes the video
  const webm = join(tmp, readdirSync(tmp).find((f) => f.endsWith('.webm')))
  let trim = markerEnd(webm); if (trim === null) { trim = Math.max(0, (t0 - tCtx) / 1000); console.log(`  [${id}] time-zero marker not found in the video: cut estimated, check sync`) }
  /* audio: each context's recording placed at its wall-clock start relative to the trimmed video start */
  const shift = Number(shot.audioShift ?? cfg.audioShift ?? 0), aIn = [], aF = []
  tracks.forEach((tr, k) => { if (!tr.b64) return; const f = join(tmp, `a${k}.webm`); writeFileSync(f, Buffer.from(tr.b64, 'base64'))
    const off = (tr.wall - t0) / 1000 + shift; aIn.push('-i', f); aF.push(`[${aIn.length / 2}:a]aresample=48000:async=1:first_pts=0,${off >= 0 ? `adelay=${Math.round(off * 1000)}:all=1` : `atrim=start=${-off},asetpts=PTS-STARTPTS`}[t${k}]`) })
  const out = join(clips, id + '.mp4'), vf = `fps=${FPS},scale=${W}:${H},setsar=1`
  const fc = [`[0:v]trim=start=${trim},setpts=PTS-STARTPTS,${vf}[v]`, ...aF]
  const nA = aF.length; if (nA) fc.push(aF.map((x) => x.match(/\[t\d+\]$/)[0]).join('') + `amix=inputs=${nA}:normalize=0:dropout_transition=0,asetpts=N/SR/TB,apad,atrim=duration=${seconds}[a]`)
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', webm, ...aIn, '-filter_complex', fc.join(';'), '-map', '[v]', ...(nA ? ['-map', '[a]', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000'] : []), '-t', String(seconds), '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out])
  if (args.includes('--keep-raw')) { const raw = join(here, 'out', 'raw', id); rmSync(raw, { recursive: true, force: true }); mkdirSync(dirname(raw), { recursive: true }); renameSync(tmp, raw) } else rmSync(tmp, { recursive: true, force: true })
  const sus = stLog.filter((x) => x[2] !== 'running').length
  console.log(`${id.padEnd(12)} ${probeDur(out).toFixed(1)}s  ${nA ? `${nA} audio context(s)` : noAudio ? 'silent (--no-audio)' : 'NO app sound captured (did anything play?)'}${sus ? `  [context suspended ${sus}x: check sync around those moments]` : ''}  ${out.replace(here + '/', '')}`)
  return out
}

/* ---- sync test: white flash + 1 kHz beep at 1, 2, 3, 4 s; measure both onsets in the recording ---- */
const SYNC_HTML = `<body style="margin:0;background:#000"><script>
const ac=new AudioContext();window.__flash=()=>{const t0=performance.now();[1,2,3,4].forEach(s=>setTimeout(()=>{document.body.style.background='#fff';setTimeout(()=>document.body.style.background='#000',200);
const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=1000;g.gain.value=0.5;o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+0.2)},s*1000))}</script></body>`
async function runSync(browser) {
  const out = await record(browser, 'sync-test', { html: SYNC_HTML, seconds: 5.5, ready: { settle: 0.5 }, setup: [{ do: 'js', value: 'ac.resume()' }], steps: [{ at: 0, do: 'js', value: '__flash()' }] })
  const vs = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'], { encoding: 'utf8' }).stdout
  const lum = [...vs.matchAll(/pts_time:([\d.]+)[\s\S]*?YAVG=([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])])
  const flashes = lum.filter(([, y], i) => y > 128 && (lum[i - 1]?.[1] ?? 0) <= 128).map(([t]) => t)
  const as = spawnSync('ffmpeg', ['-nostats', '-i', out, '-af', 'silencedetect=n=-30dB:d=0.1', '-f', 'null', '-'], { encoding: 'utf8' }).stderr
  const beeps = [...as.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1])).filter((t) => t < 5.4)
  console.log('flashes (video)', flashes.map((t) => t.toFixed(3)).join(' '), '\nbeeps   (audio)', beeps.map((t) => t.toFixed(3)).join(' '))
  if (flashes.length < 3 || beeps.length < 3) { console.log('Could not find 3 flashes and 3 beeps: sync not measured.'); return }
  const d = beeps.slice(0, Math.min(flashes.length, beeps.length)).map((b, i) => b - flashes[i]), so = [...d].sort((a, b) => a - b)
  const m = so.length % 2 ? so[so.length >> 1] : (so[so.length / 2 - 1] + so[so.length / 2]) / 2   // median: one misread beep does not move it
  console.log(`audio is ${Math.abs(m * 1000).toFixed(0)} ms ${m > 0 ? 'LATE' : 'EARLY'} (median; per beep: ${d.map((x) => (x * 1000).toFixed(0)).join(', ')} ms; one frame = 40 ms)`)
  const cur = Number(cfg.audioShift ?? 0)
  console.log(Math.abs(m) <= 0.045 ? 'ok: within about one frame (runs vary by about 40 ms).' : `set  "audioShift": ${(cur - m).toFixed(3)}  in shots.json (now ${cur.toFixed(3)}), then run  --sync-test --file shots.json  again.`)
}

if (args.includes('--list')) { for (const [k, s] of Object.entries(cfg.shots)) console.log(k.padEnd(12), String(s.seconds ?? 10).padStart(4) + 's', (s.url ?? '').padEnd(28), s.note ?? ''); process.exit(0) }
const names = syncTest ? [] : args.includes('--all') ? Object.keys(cfg.shots) : args.filter((a) => cfg.shots[a])
if (!syncTest && !names.length) { console.error('Name a shot (see --list), pass --all, or --sync-test.'); process.exit(1) }
const browser = await chromium.launch({ executablePath: chromePath(), headless: args.includes('--headless'),
  args: ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', ...(args.includes('--audible') ? [] : ['--mute-audio'])] })
try { if (syncTest) { if (args.includes('--file')) cfg.audioShift = JSON.parse(readFileSync(cfgFile, 'utf8')).audioShift; await runSync(browser) } else for (const n of names) await record(browser, n, cfg.shots[n]) }
finally { await browser.close() }
