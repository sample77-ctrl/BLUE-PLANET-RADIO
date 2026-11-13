#!/usr/bin/env node
/* Burned-in captions from the narration. Reads timeline.json (voice lines + where they start), story.json (the text) and out/audio/<id>.json (word times),
 * cuts each line into caption segments (one sentence, split further above 11 words), renders each as a transparent 1920x180 PNG and writes
 *   out/captions/captions.json   [{file, from, to}]  (film seconds; assemble.mjs overlays them when timeline.json has "captions": "out/captions/captions.json")
 *   out/captions/captions.srt    the same as a subtitle file (for upload where the platform takes one)
 *   node captions.mjs [timeline.json]            text comes from story.json (the file narrate.mjs used; override with --story <file>) */
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromePath } from './lib.mjs'
const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const tl = JSON.parse(readFileSync(join(here, args.find((a) => a.endsWith('.json') && a !== opt('--story')) ?? 'timeline.json'), 'utf8'))
const story = JSON.parse(readFileSync(join(here, opt('--story', 'story.json')), 'utf8')), text = Object.fromEntries(story.beats.map((b) => [b.id, b.text]))
const segs = []
for (const v of tl.voice ?? []) {
  const id = basename(v.file).replace(/\.mp3$/, ''), jf = join(here, v.file.replace(/\.mp3$/, '.json'))
  if (!text[id] || !existsSync(jf)) { console.log('  no text or word times for', v.file, '(no captions for it)'); continue }
  const tok = text[id].trim().split(/\s+/), W = JSON.parse(readFileSync(jf, 'utf8'))
  if (tok.length !== W.length) console.log(`  ${id}: ${tok.length} words in the text but ${W.length} timestamps: timing may drift`)
  let a = 0; const parts = []
  tok.forEach((t, i) => { if (/[.?!]["”']?$/.test(t) || i === tok.length - 1) { parts.push([a, i]); a = i + 1 } })
  for (const [s, e] of parts.flatMap(([s, e]) => { if (e - s + 1 <= 11) return [[s, e]]
    let m = s + Math.floor((e - s + 1) / 2); for (let k = m - 3; k <= m + 3; k++) if (k > s && k < e && /,$/.test(tok[k])) { m = k + 1; break } return [[s, m - 1], [m, e]] }))
    segs.push({ text: tok.slice(s, e + 1).join(' '), from: v.at + (W[Math.min(s, W.length - 1)]?.t0 ?? 0) - 0.05, to: v.at + (W[Math.min(e, W.length - 1)]?.t1 ?? 0) + 0.25 })
}
segs.sort((x, y) => x.from - y.from); segs.forEach((s, i) => { if (segs[i + 1] && s.to > segs[i + 1].from - 0.04) s.to = segs[i + 1].from - 0.04 })
const dir = join(here, 'out', 'captions'); mkdirSync(dir, { recursive: true })
const browser = await chromium.launch({ executablePath: chromePath(), headless: true })
const page = await (await browser.newContext({ viewport: { width: 1920, height: 180 }, deviceScaleFactor: 1 })).newPage()
await page.setContent(`<style>@font-face{font-family:'Mona Sans';font-weight:200 900;font-stretch:75% 125%;src:url('file://${join(here, 'graphics/fonts/mona-sans-vf.woff2')}') format('woff2')}
html,body{margin:0;width:1920px;height:180px;background:transparent}body{display:flex;align-items:flex-end;justify-content:center;padding-bottom:0;box-sizing:border-box}
p{margin:0 0 10px;max-width:1500px;padding:14px 30px 16px;background:rgba(10,10,10,.78);border-left:6px solid #baed3f;color:#f3f2ec;font:600 44px/1.22 'Mona Sans',Arial,sans-serif;font-stretch:100%;text-align:center;-webkit-font-smoothing:antialiased}</style><p id=t></p>`)
await page.evaluate(() => document.fonts.ready)
const out = []; let n = 0
for (const s of segs) {
  await page.evaluate((t) => { document.getElementById('t').textContent = t }, s.text); await page.evaluate(() => document.fonts.ready)
  const f = `out/captions/c${String(n++).padStart(3, '0')}.png`; await page.screenshot({ path: join(here, f), omitBackground: true }); out.push({ file: f, from: +s.from.toFixed(2), to: +s.to.toFixed(2), text: s.text })
}
await browser.close()
const ts = (t) => { const ms = Math.round(Math.max(0, t) * 1000), p = (x, l = 2) => String(x).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}` }
writeFileSync(join(dir, 'captions.json'), JSON.stringify(out.map(({ text: _t, ...r }) => ({ ...r, y: 850 })), null, 1))
writeFileSync(join(dir, 'captions.srt'), out.map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)}\n${c.text}\n`).join('\n'))
console.log(`${out.length} captions -> out/captions/captions.json + captions.srt`)
