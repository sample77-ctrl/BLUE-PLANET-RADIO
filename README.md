<div align="center">

# 🌍 Blue Planet Radio: an Earth Information Jukebox

**A NASA Space Apps Challenge 2026 Project · The Earth Information Jukebox**  
*Turning authentic NASA satellite observations and Earth imagery into live spatial sound.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-sonic--earth--atlas.vercel.app-06b6d4?style=for-the-badge&logo=vercel)](https://blue-planet-radio.vercel.app)
[![NASA Space Apps](https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Challenge-blue?style=for-the-badge&logo=nasa)](https://www.spaceappschallenge.org/)
[![Vitest](https://img.shields.io/badge/Unit%20Tests-220%20Passed-emerald?style=for-the-badge&logo=vitest)](package.json)
[![Playwright](https://img.shields.io/badge/E2E%20Tests-19%20Passed-blueviolet?style=for-the-badge&logo=playwright)](playwright.config.ts)
[![Accessibility](https://img.shields.io/badge/A11y%20Audit-WCAG%20AAA%20(Axe)-green?style=for-the-badge)](e2e/a11y.pw.ts)
[![Language](https://img.shields.io/badge/Bilingual-English%20%7C%20বাংলা-amber?style=for-the-badge)](src/lib/strings.ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

<p align="center">
  <b>Explore Earth by ear, by touch, and by eye.</b><br/>
  NASA’s Earth Information Center makes striking pictures of a changing planet, but pictures only reach people who can see them.<br/>
  <b>Blue Planet Radio</b> plays real NASA Earth observations and imagery as live spatial sound generated in the browser,<br/>
  allowing scientists, students, visually impaired explorers, and kids to experience planetary science together.
</p>

</div>

---

## 🌟 Highlights & Key Innovations

* 🎧 **Zero-Dependency Live Sonification:** Generates all audio procedurally in real-time via the browser's native **Web Audio API**—no static MP3 loops or artificial sound files.
* 🛰️ **Real NASA data, labelled honestly:** Snapshots bundled with the app and labelled as such (some views can also request NASA POWER or GIBS live and say so) of NASA FIRMS active fires, NASA POWER 45-year climate history, JPL MUR Sea Surface Temperature, GISS GISTEMP v4, and NOAA/NSIDC Vital Signs.
* 🎮 **Sonic Quest Adventure Game:** A fun cartoon learning adventure featuring a 3D animated **Eco-Ninja Cadet**, 4 audio missions built on those snapshots, an Earth DJ Studio, and a printable certificate of completion that the app issues itself (not issued or endorsed by NASA).
* 🌐 **Interactive 3D & 2D Cartography:** Seamless Three.js 3D globe with Blue Marble textures and atmospheric scattering, plus an accessible 2D vector fallback with complete country climate profiles.
* ♿ **Universal Accessibility (WCAG 2.1 AAA):** Screen-reader optimized semantics, full keyboard navigation with hotkeys (`?`), high-contrast themes, reduced motion options, and spoken voice synthesis.
* 🌐 **Fully Bilingual (English & বাংলা):** Native bilingual interface, complete dataset explanations, and audio narration in both English and Bangla.

---

## 🗺️ Platform Overview: Four Core Experiences

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BLUE PLANET RADIO SUITE                                      │
├───────────────────────────────┬────────────────────────────────┬────────────────────────────────┤
│ 🌐 EXPLORE EARTH              │ 🎵 DATA JUKEBOX                │ 🎮 SONIC QUEST                 │
│ • Interactive 3D Three.js Globe│ • Multi-decade synchronized UI │ • 3D Animated Eco-Ninja Cadet  │
│ • 2D Accessible Vector Map    │ • Harmonic pentatonic scales   │ • 4 NASA audio rescue missions │
│ • 200+ Country Climate Records│ • Mauna Loa CO₂ & Sea Ice Extent│ • Earth DJ Studio loop remixer │
│ • Localized NASA POWER feeds  │ • EIC West-to-East audio sweep │ • Certificate of completion    │
└───────────────────────────────┴────────────────────────────────┴────────────────────────────────┘
```

### 1. 🌐 Explore Earth (3D Globe & 2D Accessible Map)
* Explore global wildfires, daily rainfall, and ocean heat anomalies on an interactive 3D WebGL globe or a 2D accessible vector map.
* **Country Deep Dives:** Select any nation or type in the ARIA 1.2 compliant search combobox to view only data that truly exists within its borders, accompanied by sensor sources, metric units, observation dates, and calculation methodologies.
* **Hear Any Place:** Click anywhere on Earth to dynamically query 45 years of localized NASA POWER temperature and precipitation models.

### 2. 🎵 Data Jukebox (Synchronized Audio-Visual Timelines)
* Synchronizes long-term climate indicators on an interactive timeline:
  * **Global Warming:** NASA GISS GISTEMP v4 temperature anomaly (1880–2025).
  * **Atmospheric Carbon:** NOAA GML Mauna Loa CO₂ concentration (1959–2025).
  * **Cryosphere Health:** NSIDC Arctic September sea ice extent (1979–2026).
  * **Regional Monsoons:** 8-divisional Bangladesh monsoon rainfall compared against the 20-year climatological normal.
* **Interactive Player:** Pressing "Play" animates the timeline cursor, live chart, contextual caption, and audio legend in exact unison.

### 3. 🎮 Sonic Quest (Gamified Adventure for Kids & Beginners)
* Designed to inspire school children and young explorers through tactile, cartoon gamification.
* **The Character:** Features an animated 3D **Eco-Ninja Cadet** with smooth running, jumping, water-blasting, and idling animations.
* **Four Real NASA Missions:**
  1. 🌲 **Amazon Wildfire Extinguisher:** Use thermal radar sound and the water blaster to locate and extinguish FIRMS-detected forest fires.
  2. 🌧️ **Bengal Monsoon Flood Rescue:** Navigate emergency drones through heavy rainfall audio gradients to rescue stranded wildlife.
  3. 🌊 **Pacific Ocean Submarine Dive:** Sonar-track marine heatwaves and identify positive thermal anomalies.
  4. 🛰️ **NASA Orbital Harmonizer:** Tune satellite sensor frequencies to harmonize Earth's vital signs.
* **Earth DJ Studio:** Allows kids to remix environmental sound loops (Rain, Fire, Ocean, Melodies) into ambient tracks.
* **Passport badges and certificate of completion:** Badges unlock from your saved progress (mission stars and finished modes; a fresh browser starts with none). The certificate is issued by this app, lists the bundled snapshot sources and their periods, and is not issued or endorsed by NASA.

### 4. 🔬 About the Science (Methodology & Transparency)
* Comprehensive documentation explaining the exact mathematical formulas, scaling algorithms, sensor limits, and accessibility standards powering the platform.

---

## 🔊 The Science of the Sound (Sonification Logic)

Every audible sound in Blue Planet Radio is calculated deterministically from real scientific measurements:

| Environmental Layer | Scientific Normalization Formula | Acoustic Sonification Mapping |
|:---|:---|:---|
| **🔥 Wildfires (FIRMS)** | $\text{norm} = \text{clamp}\left(\frac{\log_{10}(\text{FRP}) - \log_{10}(5)}{\log_{10}(800) - \log_{10}(5)}, 0, 1\right)$ | **4 to 20 crackles/second**, bandpass-filtered noise between $800\text{ Hz}$ and $3000\text{ Hz}$. Intensity scales with Fire Radiative Power (MW). |
| **🌧️ Rainfall (POWER)** | $\text{norm} = \text{clamp}\left(\sqrt{\frac{\text{rain}}{100}}, 0, 1\right)$ | **3 to 18 droplet impacts/second**, resonant frequencies between $340\text{ Hz}$ and $700\text{ Hz}$. Density scales with mm/day. |
| **🌊 Ocean Heat (MUR SST)** | $\text{norm} = \text{clamp}\left(\frac{\text{anomaly} + 5}{10}, 0, 1\right)$ | **Sub-bass resonant drone** at $110\text{ Hz} \times 2^{(\frac{\text{anomaly}}{3} \times \frac{4}{12})}$. Warm anomalies rise in pitch; cool anomalies drop. |
| **🎧 Spatial 3D Audio** | $\text{Pan} = \frac{\text{Longitude}}{180}$ | Real-time stereo balance panning ($[-1, 1]$). Latitude dynamically tilts vertical elevation in 3D HRTF mode. |

### Data Jukebox Harmonic Mapping
Time-series datasets map each value to a note on a **G-major pentatonic scale** ($G_3$ at $196\text{ Hz}$ to $G_5$ at $784\text{ Hz}$):
* **Positive Anomalies:** Rich triangle waves (warm timbre).
* **Negative Anomalies:** Pure sine waves (gentle, cool timbre).
* **Rate of Change:** Rate of change from previous timestamps dictates rhythmic pulses (1 to 6 pulses).
* **Missing Data:** Rendered as clean silence, preserving absolute scientific integrity without speculative interpolation.

---

## 🛰️ NASA & NOAA Datasets Utilized

| Dataset | Provider / Mission | Temporal Span | Spatial Resolution | Purpose in App |
|:---|:---|:---|:---|:---|
| **VIIRS 375m Active Fire** | NASA FIRMS / LANCE | Current Year (Oct 2026) | 375 m / 2° cell aggregates | Wildfire tracking, audio crackle synthesis, Mission 1 |
| **POWER Agroclimatology** | NASA Langley Research Center | 1981–2025 (45 Years) | 0.5° × 0.5° Grid | Historical temperature, daily rainfall, country climate profiles |
| **MUR Sea Surface Temp** | NASA JPL PO.DAAC / ERDDAP | Sep 2026 / Climatology | 1 km / 1° anomaly grid | Global ocean thermal anomalies, Marine Submarine mission |
| **GISTEMP v4** | NASA Goddard Institute for Space Studies | 1880–2025 | Global Mean Anomaly | Long-term global warming timeline sonification |
| **Mauna Loa CO₂** | NOAA Global Monitoring Laboratory | 1959–2025 | In-situ Atmospheric | Greenhouse gas atmospheric concentration track |
| **Sea Ice Index** | National Snow and Ice Data Center (NSIDC) | 1979–2026 | Arctic Polar Extent | Arctic September sea ice decline time series |
| **EIC Story Frames** | NASA Earth Information Center (earth.gov) | Multi-year | High-resolution frames | Visual-to-audio sonification sweeps (GHG, Ocean Heat, El Niño) |
| **GIBS Imagery** | NASA EOSDIS GIBS / Worldview | Live Satellite Feeds | Multi-spectral | True Color reflectance, thermal anomalies, night lights |

---

## ♿ Universal Accessibility & Inclusive Design (WCAG 2.1 AAA)

* **Keyboard Navigation:** Every feature, dialog, timeline slider, and game control is 100% accessible via keyboard. Press `?` anytime to open the keyboard shortcuts modal.
* **Screen Reader Semantics:** Built with semantic ARIA live regions (`polite` and `assertive`), roving tabindex lists, and descriptive `aria-valuetext` sliders.
* **Audio-First Mode:** An alternate interface mode tailored for individuals with visual impairments, converting 3D visual feeds into intuitive audio-guided lists.
* **High Contrast & Calm Background:** High-contrast color palette exceeding 7:1 contrast ratios. Includes a motion-reduction toggle that calms background particle drift and planet spins.
* **Bilingual Voice Narration:** Web Speech API delivers spoken audio descriptions of charts and educational copy in English and Bangla.

---

## 💻 Tech Stack & Engineering Architecture

```
Frontend Architecture
├── React 19 (Hooks, Suspense, Lazy-loaded Viewports)
├── TypeScript (Strict Type Safety, 0 Any Policy)
├── Vite 8 (Ultra-fast build and dev server)
├── Tailwind CSS 4 (Custom Design Tokens, Responsive Grids)
├── Three.js (3D WebGL Spheres, Shaders, Celestial Skybox)
├── D3-geo & TopoJSON (Vector Cartography, Natural Earth 1:110m & 1:50m)
└── Web Audio API (Live procedural acoustic synthesis nodes)

Testing & Quality Infrastructure
├── Vitest 5 (22 test suites, 220 automated unit tests)
├── Playwright 1.56 (Chromium headless E2E smoke tests)
├── Axe-core / Playwright (14 automated WCAG accessibility audits)
├── Oxlint (Zero-warning static linting)
└── GitHub Actions (Automated CI test, lint, and build verification)
```

---

## 🚀 Quickstart & Development Guide

### Prerequisites
* **Node.js:** `v20.x` or `v22.x`
* **npm:** `v10.x` or higher

### Installation & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/sample77-ctrl/BLUE-PLANET-RADIO.git
cd BLUE-PLANET-RADIO

# 2. Install dependencies cleanly
npm ci

# 3. Start the local development server
npm run dev
# Opens at http://localhost:5173
```

### Running Test Suites & Code Quality Checks

```bash
# Run all 220 automated unit & regression tests
npm test

# Run static linter (Oxlint, 0 warnings enforced)
npm run lint

# Compile TypeScript and build production bundle
npm run build

# Run Playwright end-to-end browser smoke tests (requires Playwright Chromium)
npx playwright install chromium
npm run test:e2e

# Run Axe-core automated accessibility audits
npm run test:a11y
```

### Refreshing NASA Datasets

```bash
# Provide free NASA FIRMS API key (optional for updating raw fire tables)
# Linux/macOS:
export FIRMS_MAP_KEY="<your-firms-key>"
# Windows PowerShell:
$env:FIRMS_MAP_KEY="<your-firms-key>"

npm run fetch:firms   # Fetches latest active wildfire detections
npm run fetch:precip  # Fetches NASA POWER precipitation grid
npm run fetch:sst     # Fetches NOAA CoastWatch MUR SST anomalies
npm run build:data    # Bundles normalized json snapshots into public/data/
```

---

## 🌐 Deployment & SPA Routing

Blue Planet Radio is continuously deployed to **Vercel** with GitHub Actions CI integration.

Single Page Application (SPA) deep linking is supported via [`vercel.json`](vercel.json):
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
*Direct links and page refreshes on `/explore`, `/jukebox`, `/quest`, `/about`, `/frames`, `/monsoon`, and `/pulse` resolve seamlessly.*

---

## 🏆 Project Verification Matrix

| Verification Check | Target Standard | Status |
|:---|:---|:---:|
| **Unit & Logic Tests** | 22 test files (220 tests) | 🟢 **100% Passed** |
| **Playwright E2E Smoke** | 19 offline browser tests | 🟢 **100% Passed** |
| **Accessibility Scans** | 14 Axe-core Playwright scans | 🟢 **0 Violations (WCAG AAA)** |
| **Static Code Linter** | Oxlint rules across 165 files | 🟢 **0 Errors, 0 Warnings** |
| **TypeScript Typecheck** | Strict mode `tsc -b` | 🟢 **0 Errors** |
| **Production Build** | Rolldown / Vite compilation | 🟢 **Built in 1.39s** |

---

## 👥 Credits & Acknowledgments

* **Data & Imagery:** NASA FIRMS / LANCE, NASA Langley Research Center POWER Project, NASA JPL PO.DAAC, NASA Goddard Institute for Space Studies (GISS), NOAA Global Monitoring Laboratory, National Snow and Ice Data Center (NSIDC), NASA Earth Information Center (earth.gov), NASA GIBS / Worldview.
* **Cartography:** Natural Earth Topography via `world-atlas` and `topojson-client`.
* **Textures:** NASA Visible Earth & Blue Marble collection.

---

<div align="center">
  <b>Blue Planet Radio · NASA Space Apps Challenge 2026</b><br/>
  <i>Independent team submission. Not an official product of NASA or NOAA.</i><br/>
  Made with ❤️ for science, accessibility, and universal climate education.
</div>
