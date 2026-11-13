# Pitch video kit: Blue Planet Radio

Workspace for the NASA Space Apps project video (240 s or 30 s), copied from the AstroDocX kit (`AstroDocX/tools/pitch-kit/`) and completed here.
**Status (2026-11-12, later): first 240 s draft built (`out/draft.mp4`, 540p); kit tested end to end on this Mac** with two real app recordings, rendered cards, a stand-in voice (macOS `say`) and a test tone as music. ElevenLabs narration is not tested yet (no key in `.env` at the time). Read `GUIDE.md` before writing anything.

## Quick start
```bash
bash setup.sh                         # node + ffmpeg check, packages, Chromium, .env, doctor.mjs
# paste your ElevenLabs key + voice ID into .env (never share or commit it)
cp story.template.json story.json     # write the narration (GUIDE.md section 3-4), then:
node narrate.mjs --dry                # word counts vs time budgets, free
node narrate.mjs                      # voice + word timestamps -> out/audio/
# in the app folder: npm run build && npm run preview   (port 4173)
node record.mjs --sync-test           # once per machine: audio/video offset -> "audioShift" in shots.json
node record.mjs --list && node record.mjs --all       # app recordings WITH the app's sound -> out/clips/
node render-frames.mjs card 5 --out title --q "title=Blue Planet|Radio" --q "sub=Team ..."   # cards -> out/graphics/
cp timeline.template.json timeline.json   # shots back to back + voice start times
node assemble.mjs --plan              # shot table, warns about short sources
node assemble.mjs --draft             # fast 540p check of timing
node assemble.mjs && node check.mjs out/video.mp4 240 --sheet
```

## Files
| File | What it does |
|---|---|
| `GUIDE.md` | how to write and cut a video for the Earth Information Jukebox category (judging, listen moments, honesty, structure) |
| `setup.sh`, `doctor.mjs` | one-time setup and health check (tools, encoders, Chromium, .env keys without showing them, free disk) |
| `narrate.mjs` | ElevenLabs per-beat narration with word timestamps; keeps `<id>.prev.mp3` before overwriting |
| `record.mjs`, `shots.json` | scripted screen recordings of the app, 1920x1080, 25 fps, **with the app's own Web Audio sound**; shots are data (locators + timed steps), see `shots.template.json` for every step kind |
| `render-frames.mjs`, `graphics/card.html` | deterministic HTML motion graphics -> mp4 (25 fps). `card.html` = title / fact / lower-third cards in the app's look, set from the URL query (`--q key=value`), English and বাংলা |
| `assemble.mjs` | cut from `timeline.json`: trim, speed, images, scale/pad, the shots' own sound, voice, music ducked under voice + app sound, two-pass loudness to -16 LUFS |
| `check.mjs` | duration, size, audio, loudness, peak, optional contact sheet |
| `frames-sheet.sh` | contact sheet of chosen timestamps |
| `lib.mjs` | finds the Chromium to launch (any platform) |
| `build-timeline.mjs` | the Blue Planet Radio shot list and voice anchors ("line X starts N s into shot Y") -> `timeline.json`; checks every line sits inside its shots and the film is exactly 240 s |
| `captions.mjs` | burned-in captions from `story.json` + the word timestamps -> `out/captions/*.png`, `captions.json`, `captions.srt`; `assemble.mjs` overlays them (`--no-captions` to skip) |
| `graphics/pics.html` | the four EIC frames crossfading, with source line |

Never committed: `.env`, `out/`, `footage/` (see `.gitignore`). This folder as a whole is not in git yet; ask the owner before committing any of it.

## How the app's sound is recorded
`record.mjs` injects a script before the app loads that hooks `AudioNode.connect`: whatever the app connects to its speakers is also connected to a `MediaStreamDestination` that a `MediaRecorder` records. Chromium runs muted (`--audible` to hear it). Time zero is marked by a magenta full-screen flash before the clip (cut off), so picture and sound are aligned to a frame; `--sync-test` measures what is left. Not captured: `<audio>`/`<video>` elements outside Web Audio and `speechSynthesis` (OS speech). Headed Chromium by default because WebGL needs the GPU.

## Tested (2026-11-12)
- `setup.sh`, `doctor.mjs` (all ok; WARN for drawtext, empty keys, 3.7 GB free disk).
- `record.mjs --sync-test`: raw offset 70-102 ms late; with `audioShift: -0.085` the median is within -45..0 ms over three runs (one frame = 40 ms).
- `record.mjs landing frame-ocean` against `npm run preview`: both clips have the app's sound (landing preview; Frame Stage sweep of the ocean-heat frame).
- `render-frames.mjs card`: title, fact and বাংলা cards.
- `assemble.mjs` with cards, clips with sound, a still image, a short source (held, warned), 2 voice lines, music: every combination (all / no music / app sound only / voice + music) passes `check.mjs` at -16.2 to -17.5 LUFS, true peak -1.9 to -2.0 dBTP. Levels checked second by second (app sound continues after the voice ends; music returns after it).
- Not tested: `narrate.mjs` against ElevenLabs, a full 240 s cut, 4K export, Windows/Linux.

## Lessons (AstroDocX, still binding)
- Footage the team recorded is the picture; change speed, narration or gaps, never swap or re-order their clips without asking.
- Audio follows picture: every spoken line must sit on the clip that shows it (check frames at each line's start).
- Re-generating narration overwrites; keep the old take. Never print or commit `.env`.
- ffmpeg `trim=end_frame` counts source frames; compare output against the original (PSNR) to catch accidental shifts.
- This Mac's ffmpeg has no `drawtext`: do all text as HTML graphics. Keep 8+ GB free before any 4K export.
- Screen recordings and graphics are 25 fps; never convert to 30 (repeated frames read as vibration).
- Credit NASA assets ("NASA images and data", not affiliated/endorsed); say plainly what is synthetic, a sample or a prototype.

## Lessons from building this kit
- Chrome's `MediaRecorder` skips silent stretches of a Web Audio stream, so its timestamps start at the first sound; the tap adds one LSB of DC (about -90 dB) to keep it recording.
- Playwright's video does not start when the page opens; a visible marker frame is the only reliable time zero.
- ffmpeg: `sidechaincompress` ends when its key input ends (pad the key with `apad`); `amix` after `adelay` gives timestamps that make a later `atrim` cut the stream short (reset with `asetpts=N/SR/TB`); one-pass `loudnorm` cannot lift a mostly quiet sonification mix to -16 LUFS (measure, then a fixed gain + limiter).
