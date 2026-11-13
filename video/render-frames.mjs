#!/usr/bin/env node
/* Deterministic renderer for HTML motion graphics (and graphics that contain video).
 *   node render-frames.mjs card 5.0 [--fps 25] [--q k=v ...]   renders graphics/card.html for 5 s -> out/graphics/card.mp4
 * Steps every CSS animation, the starfield and each <video> to the exact time of each frame, takes a screenshot, and encodes
 * out/graphics/<scene>.mp4. Time 0 is the moment .go is added, so the HTML's own timeline is the film's timeline (no calibration needed).
 * --q title=Hello  passes URL query values to the page (graphics/card.html reads them), --out <name> sets the output name. */
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, existsSync } from 'node:fs'
import { chromePath } from './lib.mjs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2)
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')))
const [name, secs] = pos
if (!name || !secs) { console.error('usage: node render-frames.mjs <scene> <seconds> [--fps 25] [--q key=value ...] [--out name]'); process.exit(1) }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const FPS = Number(opt('--fps', 25)), frames = Math.round(Number(secs) * FPS), outName = opt('--out', name)
const query = new URLSearchParams(args.flatMap((a, i) => a === '--q' ? [args[i + 1].split(/=(.*)/s).slice(0, 2)] : []))
const html = join(here, 'graphics', name + '.html')
if (!existsSync(html)) { console.error('no graphics/' + name + '.html'); process.exit(1) }

const tmp = join(here, 'out', 'tmp-frames-' + outName); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true }); mkdirSync(join(here, 'out', 'graphics'), { recursive: true })
const browser = await chromium.launch({ executablePath: chromePath(), headless: false, args: ['--allow-file-access-from-files', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] })
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage()
page.on('pageerror', (e) => console.log('  page error:', e.message.slice(0, 160)))
await page.goto(pathToFileURL(html).href + (query.size ? '?' + query : ''))
await page.evaluate(() => document.fonts.ready)
await page.waitForFunction(() => [...document.querySelectorAll('video')].every((v) => v.readyState >= 2) && [...document.images].every((i) => i.complete), null, { timeout: 30000 })
await page.evaluate(() => { window.__t = 0; document.body.classList.add('go') })
for (let i = 0; i < frames; i++) {
  const t = i / FPS
  await page.evaluate(async (t) => {
    window.__t = t
    document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t * 1000 })
    await Promise.all([...document.querySelectorAll('video')].map((v) => new Promise((res) => {
      const lt = Math.min(Math.max(0, t - Number(v.dataset.start || 0)), Math.max(0, (v.duration || 1e9) - 0.05))   // data-start: the film time at which this clip begins
      v.pause(); if (Math.abs(v.currentTime - lt) < 0.002) return res()
      v.addEventListener('seeked', () => res(), { once: true }); v.currentTime = lt })))
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  }, t)
  await page.screenshot({ path: join(tmp, `f${String(i).padStart(5, '0')}.png`) })
}
await browser.close()
const out = join(here, 'out', 'graphics', outName + '.mp4')
execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', join(tmp, 'f%05d.png'), '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', out])
rmSync(tmp, { recursive: true, force: true })
console.log(outName, execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim() + 's ->', out.replace(here + '/', ''))
