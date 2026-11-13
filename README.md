# Blue Planet Radio

**Hear NASA's Earth Information Center pictures, and the data behind them, as sound made live in your browser.**

NASA Space Apps Challenge 2026 · challenge: **The Earth Information Jukebox** · team: Team Loser's

**Live site:** https://blue-planet-radio.vercel.app · **Source:** https://github.com/sample77-ctrl/BLUE-PLANET-RADIO

> Independent team submission. Not an official product of NASA, NOAA or any agency, and not endorsed by them. Details of how AI was used to build and run it are in [AIUse.md](AIUse.md).

---

## What it does

The challenge asks for NASA Earth Information Center (EIC) visual frames paired with sound generated from the data. That pairing is the first screen of the app.

1. **Frames.** An EIC frame fills the screen. Press play and a needle sweeps it west to east. Height in the picture is pitch (a pentatonic scale, top row highest), brightness is loudness, and colour is timbre. The whole interface takes its accent colour from the pixels under the needle, and says that colour comes from the picture, not from a measurement. A score under the frame draws every note on the same columns as the picture. You can also open the real data behind a frame (for example the NOAA Mauna Loa CO₂ record behind the greenhouse-gas frame), compare two frames or two NASA imagery days with one in each ear, and make a share card.
2. **Explore Earth.** A 3D globe of three NASA layers: fires (crackle), rain (droplets) and ocean heat (a low drone). Every point stands on a light pillar that pulses with its voice, and its position on Earth sets left or right in the stereo field. Pick any country, by clicking or by typing, and its profile lists only the data that really exists inside its border. Globe, flat map and text list views are all available.
3. **Data Jukebox.** Long data stories on one timeline: global temperature since 1880, CO₂, Arctic sea ice, ocean heat, fires, the Bangladesh monsoon by division, and each EIC frame. Chart, caption and a "What you hear" legend move together with the sound. You can compare two periods (period A in the left ear, B in the right), queue stories, and keep playing from a Now-Playing bar.
4. **Sonic Quest.** Missions and play modes for kids and beginners, built on the same bundled NASA snapshots. Its certificate and badges are issued by this app, not by NASA.
5. **About the science.** Every formula, unit, source, period and limit is written down, with a small tool to try the mapping yourself.

Also: a **Harmonium** (play notes, and the pitch is matched to a year in NASA's temperature record; labelled "Not a forecast. Not NASA data."), a **Tour**, share links that restore a view, and the whole interface in **English and বাংলা**.

---

## How data becomes sound

Everything you hear is computed by deterministic code from the data on screen. There are no recorded sounds and no machine-learning model involved. Every mapping is shown in the app.

| Layer | Normalisation | Sound |
|---|---|---|
| Fires (NASA FIRMS) | `norm = clamp((log10(FRP) - log10(5)) / (log10(800) - log10(5)), 0, 1)` | 4 to 20 crackles per second through a 800 to 3000 Hz band-pass filter; hotter fires crackle faster and brighter |
| Rain (NASA POWER) | `norm = clamp(sqrt(rain / 100), 0, 1)` | 3 to 18 droplets per second at 340 to 700 Hz; more rain is denser and higher |
| Ocean heat (NASA MUR SST) | anomaly in °C | A drone at `110 Hz × 2^(shift/12)`; warm anomalies rise (up to about 4 semitones), cool ones fall (about 3) |
| Place | `pan = longitude / 180` | Stereo balance; latitude tilts the voice in 3D audio mode |
| Series (Data Jukebox) | each value on a fixed range per dataset | One note per value on a G-major pentatonic scale, G3 (196 Hz) to G5 (784 Hz); above the baseline is a warm triangle wave, below is a soft sine; a bigger jump from the previous value gives more pulses (1 to 6); missing data is silence, never interpolated |
| Pictures (EIC and GIBS frames) | pixel row, brightness, colour | Pentatonic pitch from C3 upwards (top row highest), loudness from brightness, filter and timbre from colour |

A worked example the app shows for itself: *1998: 0.61 °C → A4 (440 Hz), 4 pulses, warm triangle, because it is above the 1951–1980 average and jumped from the year before.*

---

## Data

Atlas layers are **snapshots** of a few days, bundled with the app in [`public/data/`](public/data/) and always labelled as snapshots, never as live. Some views request NASA POWER or NASA GIBS live at view time, and say so next to the result.

| Source | What the app uses | Period | How it is used |
|---|---|---|---|
| NASA Earth Information Center ([earth.gov](https://earth.gov/)) | 4 frames: greenhouse-gas warming index, ocean heat content, El Niño crop-yield forecast, GEOS Earth Now rain | frames as published | pictures swept into sound |
| NASA GIBS / Worldview | imagery layers (true colour, thermal anomalies, rain rate, sea-surface anomaly, NO₂, aerosol, vegetation, night lights) | the day shown with each image | pictures swept into sound; requested when viewed |
| NASA FIRMS (VIIRS S-NPP NRT) | strongest fire radiative power per 2° cell per day, 80 cells per day | 2–7 Oct 2026 snapshot | crackle voices |
| NASA POWER (MERRA-2 based) | daily rain at the 48 wettest points of a 396-point sample grid; Bangladesh daily rain and 2001–2020 climatology; monthly series at a labelled point per country | 2–5 Oct 2026 snapshot; monsoon 2025 and 2026 | droplet voices, country profiles |
| NASA JPL MUR SST via NOAA CoastWatch | monthly sea-surface anomaly, 40 open-ocean cells at least 12° apart | September 2026 | ocean drone |
| NASA GISS GISTEMP v4 | global annual mean anomaly vs 1951–1980 | 1880–2025 | temperature story |
| NOAA GML Mauna Loa (shown on NASA Vital Signs) | annual mean CO₂ | 1959–2025 | CO₂ story |
| NSIDC Sea Ice Index v4.0 (shown on NASA Vital Signs) | Arctic September extent | 1979 onward; the newest values are near-real-time and may be revised | sea-ice story |

Limits, stated plainly: the rain points are a sample of the wettest cells, not every cell; POWER values are model estimates, not station readings; country borders are coarse (Natural Earth 1:110m, with a 1:50m set loaded only when a country is picked); picture sonification is only as accurate as the picture. The picker has 174 countries at the standard resolution and more than 200 in the detailed set.

---

## Accessibility

- Keyboard control throughout, with single-key shortcuts that can be turned off (WCAG 2.1.4). Press `?` for the list.
- A text **List view** reads every observation as a table row, so sound is never the only way to get a number; every number is also shown as text.
- Reduced motion, high contrast, and a switch that pauses background motion. Spoken narration (Web Speech API) and stereo or 3D audio are in Settings.
- The 3D globe has a flat-map fallback when WebGL is missing, tested.
- English and বাংলা throughout, with Bengali numerals; a unit test fails when any UI string lacks its Bangla version.

What has **not** been done: no screen-reader pass (NVDA with Firefox, VoiceOver with Safari) and no tests with blind or low-vision users yet; `docs/user-testing.md` is an empty template. The automated axe scans below are not a full WCAG conformance audit, and this project does not claim AA or AAA conformance.

---

## Tech stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · three.js for the globe · d3-geo and TopoJSON for maps · the Web Audio API for every sound · Vitest, Testing Library, Playwright and axe-core for tests · Oxlint. Hosted on Vercel.

Runtime dependencies are only `react`, `react-dom`, `three` and `lucide-react`. Fonts (Mona Sans, IBM Plex Mono, Noto Sans Bengali) are self-hosted, so the app makes no third-party font request and works offline apart from the NASA live requests above.

---

## Run it

Node 22 is what CI and development use.

```bash
npm ci
npm run dev        # http://localhost:5173
```

```bash
npm run lint       # Oxlint
npm test           # unit tests (Vitest)
npm run build      # type-check and production build
npm run preview    # serve the build at http://localhost:4173
npm run check:size # gzip budget per chunk
npx playwright install chromium
npm run test:e2e   # browser smoke tests (offline: requests outside localhost are blocked)
npm run test:a11y  # axe scans
```

### Optional settings

Copy [`.env.example`](.env.example) to `.env.local`.

- `VITE_GROQ_API_KEY`: turns on the AI answers in the Harmonium chat. **Anything named `VITE_` is bundled into the public site**, so use a key with a low limit or put a small server proxy in front. Without a key the chat says so and answers from the bundled snapshots (and says it is not AI).
- `FIRMS_MAP_KEY`: a free NASA FIRMS key, only needed to refresh the fire snapshot.

### Refreshing the NASA snapshots

```bash
FIRMS_MAP_KEY=<key> npm run fetch:firms   # fire detections
npm run fetch:precip                       # NASA POWER rain grid
npm run fetch:sst                          # MUR sea-surface anomalies
npm run build:data                         # normalise into public/data/
```

---

## Quality checks

Measured on 13 Nov 2026 on this branch:

| Check | Result |
|---|---|
| `npm run lint` | no warnings |
| `npm test` | 50 files, 436 tests pass |
| `npm run build` | succeeds |
| `npm run check:size` | within budget (main bundle 137.5 kB gzip of 175; stylesheet 24.5 kB of 32) |
| `npm run test:e2e` | 24 browser smoke tests pass |
| `npm run test:a11y` | 20 axe scans pass (no violations) |

The repository holds 151 browser tests in 16 spec files in [`e2e/`](e2e/); the two scripts above run a subset, which is what CI runs. CI runs lint, unit tests, build and the size check, then the browser job, which is currently allowed to fail.

---

## Deployment

The site is hosted on Vercel; the production branch is set in the Vercel project. [`vercel.json`](vercel.json) rewrites every path to `index.html`, so direct links and refreshes on `/frames`, `/explore`, `/jukebox`, `/monsoon`, `/pulse`, `/quest` and `/about` work, and it sets long cache headers for built assets, textures, fonts and images. Share links such as `/jukebox?story=gistemp&t=1998` and `/frames?frame=eic-ocean-heat` restore a view.

---

## Repository guide

| Path | What is in it |
|---|---|
| `src/landing`, `src/globe`, `src/map`, `src/atlas` | landing chapters, the 3D globe, the flat map, the Explore layers panel |
| `src/jukebox`, `src/player`, `src/stories` | Data Jukebox, the Now-Playing bar and queue, story definitions |
| `src/sonification`, `src/audio` | the mappings and the Web Audio synthesisers |
| `src/countries`, `src/datasets`, `src/lib` | country picker and profiles, data series, shared helpers (`strings.ts` holds every UI string in English and বাংলা) |
| `src/game`, `src/harmonium` | Sonic Quest and the Harmonium |
| `public/data`, `public/eic`, `public/textures` | bundled snapshots, the four EIC frames, globe textures |
| `scripts/` | snapshot fetchers and the size check |
| `e2e/`, `src/__tests__/` | browser tests and unit tests |
| `docs/` | the submission text ([`docs/submission.md`](docs/submission.md)), the user-testing kit and results template, and the screenshots in `docs/v5-shots` |

Working rules for contributors and AI assistants are in [`CLAUDE.md`](CLAUDE.md). Other documents: [`JUDGE_QA.md`](JUDGE_QA.md), [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md), [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md).

---

## Known limits and open items

- Atlas layers are short snapshots, rain points are a sample, borders are coarse (see Data).
- The Harmonium's pitch-to-year rule is an illustration, not a forecast. Its AI chat is off unless a key is configured.
- Not done yet: a screen-reader pass, tests with blind or low-vision users, and a licence file. Lock-screen media controls (Media Session) have not been tested on real iOS or Android devices.
- Landing and 3D views need a GPU for smooth animation; a flat fallback is used when WebGL is unavailable.

---

## Credits and licences

- **Data and imagery:** NASA FIRMS and LANCE; NASA Langley Research Center POWER project; NASA JPL PO.DAAC (MUR SST) via NOAA CoastWatch; NASA Goddard Institute for Space Studies (GISTEMP); NOAA Global Monitoring Laboratory; NSIDC; NASA Earth Information Center (earth.gov); NASA GIBS and Worldview. "NASA images and data" are used as published by those services; credit goes to them.
- **Borders:** Natural Earth through `world-atlas` and `topojson-client`.
- **Globe textures:** Earth texture maps taken from the three.js examples; the project docs describe them as Blue Marble imagery.
- **Fonts:** Mona Sans, IBM Plex Mono and Noto Sans Bengali, all under the SIL Open Font Licence.
- **Licence:** no open-source licence has been chosen yet, so by default all rights are reserved by the authors. Add a `LICENSE` file before reuse is expected.

Built by Team Loser's for NASA Space Apps 2026. Sound gives another way into Earth data; it supports the visuals and does not replace them.
