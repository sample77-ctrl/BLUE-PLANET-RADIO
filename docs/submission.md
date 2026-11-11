# Submission pack — Sonic Earth Atlas (NASA Space Apps 2026, Earth Information Jukebox)

Draft for the project page (the only thing global judges see). It leads with the challenge, in the order the roadmap sets (§V6). Everything below is true of the build on `visual/v6-polish`; anything the team still has to do is in "Before you submit" at the end. Numbers and dates come from the bundled files, not from memory.

## One line
Hear NASA's Earth Information Center pictures: a needle sweeps each frame and the pixels under it become sound in real time, with the real data behind each frame playing under it.

## Description (paste into the project page)

**The challenge asks for NASA Earth Information Center (EIC) visual frames paired with sound generated in real time. That is the first screen of our app.** Open *Frames* and an EIC frame fills the screen. Press play and a needle sweeps it west to east. Height in the picture is pitch (12 pentatonic bands, top highest), brightness is loudness, and colour is timbre. Warm colours open the filter and sound buzzier, greens sound airier, cool colours stay soft. The sound is synthesised live in the browser (Web Audio); there are no recordings. The whole interface takes its accent colour from the pixels under the needle, labelled as *a colour from the image, not a measurement*. A score under the frame draws every note on the same columns as the picture, so you can see which part of the image made which note.

**Then the data behind each frame.** The greenhouse-gas frame opens the NOAA Mauna Loa CO₂ record (1959–2025) under the picture; the ocean-heat frame opens NASA MUR sea-surface anomaly and says it is *related data, not the numbers printed in the frame*. Each plays as a series on a fixed G-major pentatonic range, with a piano roll, Side A (first third, left ear) against Side B (last third, right ear). A bigger change from the previous value gives more pulses; a gap in the data is silence.

**Then the globe.** *Explore Earth* is a 3D globe of three NASA layers: fires (NASA FIRMS, crackle), rain (NASA POWER, droplets) and ocean heat (NASA MUR SST, drone). Every point stands on a light pillar that pulses with its voice, so what you see and what you hear share a beat. Pick a country to hear its profile.

**Then vs now.** Side A / Side B everywhere: two EIC frames, two ears; two NASA imagery days from a year apart; or the first and last third of a series.

**Bangladesh and বাংলা.** The monsoon track plays eight divisions of Bangladesh against the 2001–2020 climatology (NASA POWER). The whole interface, every pop-up and the score and share card are available in বাংলা, with Bengali numerals.

**Made to be used by anyone.** Keyboard control throughout; a List view that reads every observation as text; reduced motion; high contrast; stereo or 3D audio; a flat map when WebGL is missing. Sound never replaces the numbers: they are always shown as text too.

**Honest about the data.** Atlas layers are snapshots of a few days (2–7 Oct 2026 for fires, 2–5 Oct for rain, September 2026 for ocean heat), the rain points are a sample of the wettest grid cells, and POWER values are model estimates, not station readings. Snapshots are never labelled live. Picture sonification is only as accurate as the picture. NASA GIBS imagery is requested at view time and is labelled with its date.

## What we built on (data table)

| Source | What we use | Period / date | Unit | How it became sound |
|---|---|---|---|---|
| NASA Earth Information Center frames (earth.gov) | 4 bundled frames: greenhouse-gas index, ocean heat content, El Niño crop-yield forecast, GEOS Earth Now rain | frames as published; chart axes 1979–2021 (GHG), 1957–2021 (ocean heat) | picture pixels | needle sweep: row → pentatonic pitch, brightness → loudness, colour → timbre and filter; year read from the printed chart axis |
| NASA GIBS (Worldview imagery) | live imagery layers (true colour, thermal anomalies, IMERG rain rate, MUR SST anomaly, OMI NO₂, MODIS AOD and NDVI, VIIRS night) as extra frames and as the globe surface | day shown with each image | picture pixels | same needle sweep as the EIC frames |
| NASA FIRMS (VIIRS S-NPP NRT) | max fire radiative power per 2° cell per day, 80 cells per day | 2–7 Oct 2026 snapshot | MW | *crackle* voice per cell; stereo position from longitude; the pitch and pulse rate of each point are shown in the Now-hearing list |
| NASA POWER (MERRA-2 based) | daily rain, 48 wettest points of a 396-point 10° sample grid; Bangladesh daily rain and 2001–2020 monthly climatology | 2–5 Oct 2026 snapshot; monsoon 2025 and 2026 | mm/day | *droplets* voice; denser and louder with more rain |
| NASA JPL MUR SST via NOAA CoastWatch ERDDAP | monthly SST anomaly, 40 most anomalous open-ocean cells at least 12° apart | September 2026 | °C | *drone* voice; the marker is pink for a warm anomaly and blue for a cool one |
| NASA GISS GISTEMP v4 | global land-ocean annual mean anomaly vs 1951–1980 | 1880–2025 | °C | one note per year on the fixed pentatonic range; timbre by sign |
| NOAA GML Mauna Loa (on NASA Vital Signs) | annual mean CO₂ | 1959–2025 | ppm | one note per year; the record behind the greenhouse-gas frame |
| NSIDC Sea Ice Index v4.0 (on NASA Vital Signs) | Arctic September extent | 1979–2026 (2025–2026 near-real-time, may be revised) | million km² | one note per year; higher pitch is more ice |
| NASA Black Marble night lights | not used | | | cut: not shipped in this build |

Globe textures from the three.js examples; country shapes from Natural Earth via world-atlas; fonts Mona Sans, IBM Plex Mono and Noto Sans Bengali (SIL OFL). Sources, periods and limits are also on the in-app *About the science* page.

## Deliverables

### 30-second video (storyboard; opens on the Frame Stage, not the globe)
1. 0–4 s: landing hero "Hear Earth change" over the ocean-heat frame; press **Hear an EIC frame**.
2. 4–12 s: the Stage on the ocean-heat frame; press play; the needle sweeps, the year numeral climbs from the chart axis, the whole interface re-tints with the colour under the needle.
3. 12–18 s: **Hear the data behind it**; the series plays under the frame with its piano roll; switch to Side A / Side B.
4. 18–23 s: **Make a share card**; show the 1080 × 1350 card.
5. 23–28 s: **Explore Earth**; sound on; pillars pulse with the voices.
6. 28–30 s: switch to বাংলা; end on the title card with the project link.

Record with sound on in a normal (GPU) Chrome, not headless. No voice-over is needed; captions in English and বাংলা.

### Six screenshots (retake from the final deployed build; candidates already in `docs/v5-shots/`)
1. The Stage, ocean-heat frame, playing — `v2/after-ghg-playing-1440.png` style, retake.
2. The score under a frame — `v4/score-eic-ghg-1440.png`.
3. The share card — `v4/card-eic-ghg.png`.
4. The data behind a frame with Side A / Side B — `v4/roll-ab-eic-ghg-1440.png`.
5. The globe with pulsing pillars — `v5/globe-sounding-1440.png`.
6. The landing chapters or the বাংলা Stage — `v3/after-ch2-1440.png`, `v2/after-ghg-bn-1440.png`.

## Before you submit (not done by this build)
- Deploy `main` to Vercel and paste the live URL and the repository URL into the project page (they are not recorded in the repository).
- **Revoke the Groq API key in `src/harmonium/groqPredictor.ts` at Groq** before the demo goes public. The key is still in the source.
- Record the video and take the final six screenshots on a real GPU.
- Read the official Judging & Awards Guide (published 13 Nov) and adjust the wording above to it.
- Freeze is 14 Nov 09:00.
