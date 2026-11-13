# Blue Planet Radio: 240 s video plan (DRAFT for the team, nothing built yet)

Team Loser's · NASA Space Apps 2026 · The Earth Information Jukebox. Follows `GUIDE.md`. Every number below was checked against `public/data/` (GISTEMP v4: 1998 = 0.61 °C, 2025 = 1.19 °C vs 1951-1980); anything marked **check** still needs a source.

## The idea in one line
Open on sound, not on a logo: the judge hears an EIC frame before knowing what the app is, then learns how that sound was made, then hears the data behind it, then the whole planet.

## Beat sheet (times are a first guess; the recorded footage sets the final ones)
| # | Time | Picture | Sound | Narration (gist, not final words) |
|---|---|---|---|---|
| 01 hook | 0:00-0:14 | black, small "Headphones on" card; Frame Stage, ocean-heat frame, needle sweeping | **listen** 5 s: the frame's own sound | "This is the heat of the world's oceans since 1957. You are hearing it." |
| 02 who | 0:14-0:26 | title card (Blue Planet Radio, Team Loser's, challenge name) then team photo(s) | music pad under voice | who we are, from Bangladesh, why we care |
| 03 problem | 0:26-0:42 | EIC frames as pictures, still | pad | NASA's Earth Information Center makes striking pictures, but a picture only reaches people who can see it. One fact (**check**: a WHO vision-impairment figure, or drop the number) |
| 04 answer | 0:42-0:52 | landing page, "Hear Earth change" | pad | Blue Planet Radio plays real NASA Earth data as sound, made live in the browser |
| 05 frames | 0:52-1:27 | Frame Stage: play, needle, year numeral climbs, interface takes the colour under the needle, score under the frame | **listen** 5 s after the mapping line | mapping in one sentence: higher in the picture = higher pitch, brighter = louder, colour = timbre. "The colour is from the picture, not a measurement." |
| 06 data behind | 1:27-1:57 | "Hear the data behind it": GISTEMP 1880-2025 in the Jukebox; Side A 1951-1980 (left) vs Side B 1996-2025 (right); pause on 1998 | **listen** 6 s A/B | "Same mapping in both ears. Listen to the last thirty years." Then the decoded note: "1998: 0.61 degrees, so A4." |
| 07 globe | 1:57-2:27 | Explore Earth: fire, rain, ocean layers, pillars pulse; type "Bangladesh"; profile; monsoon, eight divisions | **listen** 5 s globe voices | fire crackles, rain falls, warm ocean hums, each from its NASA dataset; the country profile only shows data that really exists there |
| 08 for everyone | 2:27-2:52 | keyboard only, List view, reduced motion / high contrast, switch to বাংলা, Sonic Quest | short UI sounds | works by keyboard and screen reader, in English and বাংলা; missions for kids |
| 09 science | 2:52-3:12 | dataset card (source · period · unit), About the Science page | pad | every formula, unit and limit written down; snapshots, not live data |
| 10 impact | 3:12-3:30 | landing / globe wide | pad | who it helps, one honest limit, what is next |
| 11 close | 3:30-3:40 | closing card: logo, tagline, link/QR, credits, "not endorsed by NASA" | pad fades | name + tagline |

Listen moments: 01, 05, 06, 07 (about 21 s of app sound with no voice, plus app sound under voice in 05-08: roughly a third of the film).

## How it gets made
1. Footage: either the team records the screen (their clips become the picture, house rule) or `record.mjs` records the production build from `shots.json` with the app's own sound. 1920x1080, 25 fps.
2. Narration: write `story.json` per beat, `narrate.mjs --dry` (target about 75-80 % of 240 s), then ElevenLabs.
3. Cards: `graphics/card.html` (title, headphones, fact/dataset, বাংলা, closing).
4. Cut: `timeline.json` -> `assemble.mjs --draft`, watch with headphones, then final + `check.mjs`.

## Decided (owner, 2026-11-12)
- Footage: **Claude records it** with `record.mjs` from the production build; the owner reviews the clips before the cut.
- Captions: **burned in**, English, rendered as HTML graphics in the app's style. Not in the kit yet: to build (from `narrate.mjs` word timestamps -> caption overlay frames).
- Music: **a quiet pad under narration only**, synthesised in the kit (no licence), out whenever the app plays. To build.
- Opening: **open on sound** (ocean-heat frame on the Frame Stage, title card at 0:14).

## Still open
- Team beat: names, roles, photos?
- Spelling of the team name on screen: "Team Loser's"?
- Deliverable: 1080p only (disk has under 5 GB free) or 4K too?

## Footage recorded (2026-11-12, `node record.mjs <id>`, production build, 1920x1080 25 fps, with the app's sound)
| Clip | s | Beat | What it shows | App sound (loudness at source) |
|---|---|---|---|---|
| `hook-frame` | 16 | 01 hook | Frame Stage, ocean-heat frame, Play from 0.8 s | very quiet, -48 LUFS: give the shot about +20 dB |
| `landing` | 12 | 04 answer | landing hero, "Press play" at 1.5 s | -27 LUFS |
| `frames-sweep` | 30 | 05 frames | same sweep for 19 s, then the Score button (page scrolls to the explainer) | -47 LUFS |
| `jukebox-ab` | 13 | 06 data | compare controls (A 1951-1980 left, B 1996-2025 right), half speed; the page cannot scroll while playing, so it stays on the controls | -32 LUFS, audible part about 10 s |
| `jukebox-1998` | 9 | 06b data | hero readout 1998 / 0.61 °C / A4 440 Hz / 4 of 6 pulses, Play at 1.0 s, half speed | -32 LUFS |
| `globe-sound` | 14 | 07 globe | header "Sound off" pressed at 0.8 s (turns the voices ON), "Spin the globe" at 3 s | loud, -3 LUFS: about -15 dB |
| `globe-bd` | 20 | 07 globe | types "Bangladesh" (human speed), Enter, profile opens, sound on at 5.5 s | loud, -3 LUFS: about -15 dB |
| `access` | 24 | 08 everyone | List view, Settings: High contrast and Reduce motion on/off, switch to বাংলা, Globe | silent |
| `quest` | 12 | 08 everyone | Sonic Quest missions | silent (static page) |
| `about` | 16 | 09 science | About the Science, smooth scroll through how-it-works, mapping tables, sources | silent |

Notes: the header "Sound off" button is the real on/off for the globe voices; Frame Stage and Jukebox start from their own Play buttons. Frame Stage years do not run in order (the year is read from the chart axis under the needle), so do not narrate it as a timeline. Not recorded yet: closing card, title card, headphones card, team card (all `card.html`), captions.

## First timeline draft (2026-11-12): `node build-timeline.mjs && node captions.mjs && node assemble.mjs --draft`
240.00 s, 18 shots, 13 narration lines, 58 captions, music pad under voice only. Draft `out/draft.mp4` (960x540); `check.mjs`: -16.2 LUFS, true peak -1.3 dBTP. Gains used (dB on each clip's own sound): Frame Stage +21, Jukebox +6, landing +2, globe -20. Music: `footage/music.mp3`, synthesised drone, gain -8, ducked.
Order: headphones card 0-5 | hook (ocean-heat frame, 6.6 s listen) 5-21 | title card 21-36 | EIC pictures 36-50 | landing 50-62 | Frame Stage sweep 62-92 | A/B controls 92-106, then A/B listen 106-118 | 1998 hero 118-129, note 129-138 | globe 138-152 | Bangladesh 152-172 | access 172-183 | Quest 183-194 | About 194-210 | limits card 210-226 | closing 226-240.
**Filler to replace if there is time:** Quest hold (10.9 s of a static page after the voice ends), closing card 14 s, limits card 16 s, About after 14.6 s. The narration is only 135 s; 240 s needs about 100 s of picture without voice.
**Not verified:** nobody has listened to the draft end to end; 1080p final not built (`node assemble.mjs`, about 10 min, needs about 1 GB); caption placement covers the app's bottom player bar; pronunciations (GISTEMP, MUR, FIRMS, Team Loser's) unchecked.

## Harmonium added (2026-11-12): `harmonium` clip (22 s), narration `07b-harmonium` + `07c-harmonium`
Clip: opens Harmonium Chat on /explore, holds Sa, Ga, Pa (dominant 392 Hz), "Explore Sound in NASA Data" -> closest NASA year 2024, +1.29 °C (GISTEMP, vs 1951-1980), "Hottest Recorded Year in Human History". This build has no Groq key, so the app itself says "AI not configured" and "the text is built in, not written by AI"; the narration says only "an illustration, not a forecast" and never mentions AI. Sound at source -15 LUFS: gain -10 dB. Placed 159-181 s, after Bangladesh and before the accessibility beat.
To keep 240 s, filler was trimmed: sweep 30 -> 27, A/B listen 12.3 -> 11, 1998 note 8.6 -> 6, Bangladesh listen 20 -> 16, Quest hold 10.9 -> 7.8, About 16 -> 15; title, EIC pictures, limits and closing cards re-rendered 1 to 3 s shorter (fades kept). The final is `out/video.mp4` (1080p, 240.00 s, -16.1 LUFS, -1.3 dBTP). If a Groq key is ever set, re-record this clip: the panel would then read "AI connected" and the text would differ from what is narrated.
