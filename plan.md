# Blue Planet Radio — Master Project Plan & Execution Roadmap

> **NASA Space Apps Challenge 2026** · *The Earth Information Jukebox*  
> **Repository:** [github.com/morsad01/SONIC-EARTH-ATLAS](https://github.com/morsad01/SONIC-EARTH-ATLAS)  
> **Live Production:** [blue-planet-radio.vercel.app](https://blue-planet-radio.vercel.app)

---

## 1. Executive Summary & Vision

**Blue Planet Radio** is a pioneering, web-native scientific sonification and exploration platform that translates authentic NASA Earth science observations and satellite imagery into live spatial sound. 

While NASA's Earth Information Center produces stunning visual representations of our planet, visual-only interfaces inherently exclude the visually impaired and often fail to convey the dynamic, multifaceted nature of climate data to younger generations and the general public. Blue Planet Radio bridges this divide by allowing users to **hear the pulse of the Earth** through deterministic mathematical sonification, interactive 3D globes, educational storytelling, and gamified adventures.

---

## 2. System Architecture Blueprint

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Blue Planet Radio Core                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼──────────────────────────────┐
    │                               │                              │
┌───▼────────────────┐    ┌─────────▼──────────┐    ┌──────────────▼─────┐
│ 1. Visualization   │    │ 2. Audio Engine    │    │ 3. Gamification    │
│ • Three.js 3D Globe│    │ • Web Audio API    │    │ • Sonic Quest Game │
│ • 2D Accessible Map│    │ • Spatial Panning  │    │ • 3D Eco-Ninja     │
│ • Carousel Planets │    │ • Harmonic Scales  │    │ • 4 NASA Missions  │
│ • GIBS Imagery     │    │ • Dynamic Filters  │    │ • Earth DJ Studio  │
└───┬────────────────┘    └─────────┬──────────┘    └──────────────┬─────┘
    │                               │                              │
    └───────────────────────────────┼──────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    4. Universal Accessibility & i18n                   │
│ • WCAG 2.1 AAA Compliant      • Complete Bilingual Support (EN / বাংলা) │
│ • Screen Reader Semantics     • Full Keyboard Navigation & Shortcuts    │
│ • High Contrast & Calm Motion • Voice Synthesis (Web Speech API)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Comprehensive Phase-by-Phase Roadmap

### ✅ Phase 0: Project Inception & Baseline Tooling
- **Goals:** Establish modern frontend stack with fast compilation, rigorous type safety, and automated linting.
- **Deliverables:**
  - Vite + React 19 + TypeScript configuration.
  - Tailwind CSS 4 design token integration.
  - Oxlint static analysis setup with zero-warning threshold.
- **Status:** Completed.

### ✅ Phase 1: NASA Datasets Ingestion & Normalization
- **Goals:** Ingest, clean, validate, and bundle authentic NASA Earth observation datasets without synthetic interpolations.
- **Datasets Integrated:**
  - **NASA FIRMS VIIRS 375m:** Active wildfire hotspots and Fire Radiative Power (MW).
  - **NASA POWER:** 45-year (1981–2025) historical and climatological precipitation and surface temperature models.
  - **NASA JPL MUR SST:** High-resolution sea surface temperature anomalies.
  - **NASA GISS GISTEMP v4:** Long-term instrumental global surface temperature anomalies (1880–present).
  - **NOAA GML & NSIDC:** Mauna Loa atmospheric carbon dioxide and Arctic sea ice extent.
- **Status:** Completed.

### ✅ Phase 2: Scientific Sonification Engine
- **Goals:** Build a zero-dependency, real-time mathematical sonification engine using the browser's native Web Audio API.
- **Core Acoustic Mappings:**
  - **Wildfires:** Logarithmic Fire Radiative Power mapping (`5–800 MW`) driving bandpass-filtered noise crackles (`800–3000 Hz`).
  - **Rainfall:** Square-root precipitation intensity scaling (`0–100 mm/day`) generating natural droplet impact clusters (`340–700 Hz`).
  - **Ocean Heat:** Continuous sub-bass resonant drones (`110 Hz` base) modulating frequency dynamically with thermal anomalies.
  - **Spatial Stereo & 3D HRTF:** Real-time stereo panning by geographic longitude (`-180° to +180°`) with elevation tilt by latitude in HRTF mode.
- **Status:** Completed.

### ✅ Phase 3: Spatial 3D Globe & Accessible 2D Vector Map
- **Goals:** Deliver smooth, interactive geographic navigation for both high-end and accessibility-first hardware.
- **Deliverables:**
  - Three.js interactive 3D Globe featuring NASA Blue Marble textures, topography relief, specular ocean reflection, and animated cloud layers.
  - Fallback 2D Accessible Vector Map with D3-geo and Natural Earth boundary topographies.
  - Detailed Country Profiles showing exclusively genuine local data with source badges and calculation methodologies.
- **Status:** Completed.

### ✅ Phase 4: Data Jukebox & Synchronized Timeline Stories
- **Goals:** Unify global climate time-series into synchronized audio-visual narratives.
- **Deliverables:**
  - Jukebox multi-decade timeline player with scrubbable year/month cursors.
  - Simultaneous visual chart updates, captions, and acoustic pitch legends.
  - G-major pentatonic harmonic scale mapping (`G3 (196 Hz) to G5 (784 Hz)`) with baseline delta pulses.
- **Status:** Completed.

### ✅ Phase 5: Localized Stories (Bangladesh Monsoon & Country Deep Dives)
- **Goals:** Highlight vulnerable regional climates and provide personalized localized data worldwide.
- **Deliverables:**
  - 8-divisional Bangladesh Monsoon track comparing 2026 rainfall against historical climatology.
  - "Hear Any Place" feature: Click anywhere on Earth or search 200+ countries to fetch 45 years of localized NASA POWER climate data.
- **Status:** Completed.

### ✅ Phase 6: Universal Accessibility & Native Bilingual Engine
- **Goals:** Ensure universal accessibility for individuals with visual, auditory, or motor impairments.
- **Deliverables:**
  - Full keyboard shortcuts (`?`, `Space`, `M`, `L`, `S`, `ArrowKeys`).
  - Live ARIA region alerts and semantic screen-reader text.
  - Native bilingual interface in **English** and **বাংলা (Bangla)**.
  - Spoken narration utilizing Web Speech API.
  - High Contrast mode and Reduced Motion toggle.
- **Status:** Completed.

### ✅ Phase 7: Automated Verification & Testing Infrastructure
- **Goals:** Establish enterprise-grade regression test suites for data integrity and UX consistency.
- **Deliverables:**
  - Vitest suite with 22 test files and 220 automated unit tests.
  - Playwright E2E browser tests covering navigation, share links, offline resilience, and WebGL fallbacks.
  - Automated Axe-core accessibility scans with 0 violations across all views.
- **Status:** Completed.

### ✅ Phase 8: UI / Performance Hardening & Overlay Portals
- **Goals:** Refine visual polish, solve modal clipping, and optimize software GL rendering.
- **Deliverables:**
  - React 19 Portals (`#overlay-root`) for Settings, Diagnostics, and Location inspection dialogs.
  - Self-hosted typographic tokens (`Bricolage Grotesque`, `IBM Plex Sans`, `IBM Plex Mono`).
  - Performance throttling for smooth 60 FPS transitions and memory-conscious audio node cleanup.
- **Status:** Completed.

### ✅ Phase 9: Three.js World Carousel Landing Experience
- **Goals:** Redesign the landing page with an engaging, interactive 3-level progressive disclosure system.
- **Deliverables:**
  - Level 1 Overview: Centered 3D Earth sphere with neighboring planets peeking at edges.
  - Level 2 Detail: Planet translates right, reveals real-time metrics and preview sonification.
  - Level 3 Immersive Dive: Camera zooms into the planetary surface with NASA high-res imagery and educational deep dives.
- **Status:** Completed.

### ✅ Phase 10: Sonic Quest Cartoon Adventure & 3D Eco-Ninja Game
- **Goals:** Gamify climate exploration for children and new explorers.
- **Deliverables:**
  - **Character & Visuals:** 3D animated `Eco-Ninja Cadet` cartoon character with walking, jumping, water-spraying, and idle states.
  - **4 NASA Audio Missions:**
    1. *Amazon Wildfire Extinguisher* (FIRMS satellite tracking + water blaster).
    2. *Bengal Monsoon Flood Rescue* (Rainfall audio radar navigation).
    3. *Pacific Ocean Submarine Dive* (Thermal anomaly sonar detection).
    4. *NASA Orbital Harmonizer* (Global satellite frequency calibration).
  - **Free Roam Mode:** Explore Earth biomes freely with interactive controls (Keyboard / On-screen buttons).
  - **Earth DJ Studio:** Interactive audio mixer allowing users to remix nature loops (Rain, Ocean, Fire, Melodies).
  - **Certification:** Official NASA Junior Sonic Cadet Badge with shareable certificate.
- **Status:** Completed.

### ✅ Phase 11: Production Hardening, E2E Optimization & Vercel SPA Routing
- **Goals:** Guarantee rock-solid CI/CD runs and seamless production web hosting.
- **Deliverables:**
  - Resolved Chromium SwiftShader ANGLE launch options (`--use-gl=angle`, `--use-angle=swiftshader`) in Playwright.
  - Implemented `encodeLegacyShare` to preserve backward-compatible URL hashes (`#v1&...`).
  - Added `vercel.json` SPA routing rewrite (`/(.*) -> /index.html`) to eliminate 404 errors on deep-link page refreshes.
  - Verified 100% green status across all GitHub Actions workflows.
- **Status:** Completed.

---

## 4. Current Quality & Verification Matrix

| Verification Vector | Metric / Tool | Standard / Target | Current Result | Status |
|---|---|---|---|:---:|
| **Unit & Logic Tests** | Vitest (22 files) | 100% Passing | **220 / 220 Passed** | 🟢 |
| **E2E Smoke Tests** | Playwright (Chromium) | 100% Passing | **19 / 19 Passed** | 🟢 |
| **Accessibility Audit** | Axe-core Playwright | 0 Violations (WCAG AAA) | **14 / 14 Passed (0 errors)** | 🟢 |
| **Static Code Quality** | Oxlint | 0 Errors, 0 Warnings | **0 Errors, 0 Warnings** | 🟢 |
| **TypeScript Compilation** | `tsc -b` | Zero Type Errors | **Clean compilation** | 🟢 |
| **Production Build** | Vite Production | Sub-2s Build Time | **1.39s (Clean dist/)** | 🟢 |
| **Vercel Deployment** | SPA Routing Rewrite | No 404 on Refresh | **Active & Verified** | 🟢 |

---

## 5. Post-Submission & Future Horizon Roadmap

1. **Extended Satellite Feeds:** Integrate NASA PACE (Plankton, Aerosol, Cloud, ocean Ecosystem) hyperspectral ocean data.
2. **Multiplayer Cadet Co-op:** Collaborative educational quests where students work together in virtual classrooms to balance Earth's climate parameters.
3. **Physical Haptic Feedback:** Web Bluetooth integration for haptic vests and braille displays, further expanding sensory perception for visually impaired explorers.
4. **Mobile Native Wrappers:** Package as offline progressive web applications (PWA) and native mobile apps for school tablet programs in low-bandwidth regions.
