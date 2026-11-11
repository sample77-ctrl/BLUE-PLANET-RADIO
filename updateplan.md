# Blue Planet Radio — Master Update Plan
## Sonic Earth Adventure, Universal Accessibility & Scientific Sonification Blueprint

> **Challenge:** NASA Space Apps Challenge 2026 — *The Earth Information Jukebox*  
> **Repository:** [github.com/morsad01/SONIC-EARTH-ATLAS](https://github.com/morsad01/SONIC-EARTH-ATLAS)  
> **Production URL:** [blue-planet-radio.vercel.app](https://blue-planet-radio.vercel.app)  
> **Tagline:** *Hear the Earth. Explore the Planet. Protect Our Future.*  
> **Version:** 2.0.0 (Master Expansion Roadmap)

---

## 1. Executive Vision & Strategic Objectives

**Blue Planet Radio** transforms authentic NASA Earth science observations and satellite imagery into an interactive, real-time spatial sonification platform and educational gaming ecosystem. 

Visual interfaces developed by space agencies often exclude individuals with visual impairments and can fail to convey multi-variable temporal anomalies in an intuitive way. Blue Planet Radio eliminates this barrier by translating planetary data into mathematical sound, responsive 3D environments, and accessible storytelling.

### Core Strategic Goals:
1. **Uncompromised Scientific Integrity:** Strict mathematical sonification without arbitrary synthetic music; distinct labeling for Live (near-real-time), Climatological, and Historical datasets; verified satellite instrument attribution (FIRMS, POWER, MUR SST, GISTEMP, NOAA GML, NSIDC).
2. **True Blind-First Universal Accessibility:** A dedicated **Blind Explorer Mode** delivering independent navigation, 3D binaural spatial audio, screen reader semantics (NVDA, VoiceOver, JAWS), and spoken data descriptions with zero sight dependency.
3. **Sonic Earth Adventure (Inclusive 3D Gaming):** An educational 3D adventure featuring the *Eco-Ninja Cadet*, 4 authentic NASA scientific missions, a *Kids Learning Zone*, an *Earth DJ Studio*, and an *Inclusive Cooperative Mode* ("Two Players, One Earth").
4. **Signature Innovation Suite:**
   - **Earth Has a Heartbeat:** Planetary vital sign telemetry synthesized into rhythmic Earth acoustic cycles.
   - **Time Travel: Hear Earth in 1981 vs 2025:** Side-by-side comparative audio analysis across four decades of climate data.
   - **Sound Detective (Sonic Quiz):** Ear-training scientific puzzle challenging players to recognize Earth phenomena purely by ear.
   - **Earth Sound Passport:** Verifiable, exportable digital learning certificates containing exact NASA scientific parameters and sonification metadata.

---

## 2. Updated System Architecture Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                BLUE PLANET RADIO 2.0                                   │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┼──────────────────────────────────┐
         │                                 │                                  │
┌────────▼───────────────┐     ┌───────────▼────────────┐        ┌────────────▼──────────────┐
│ 1. VISUAL & 3D ENGINE  │     │ 2. SCIENTIFIC AUDIO    │        │ 3. SONIC EARTH ADVENTURE  │
│ • Three.js 3D Globe    │     │ • Web Audio API Engine │        │ • 3D Eco-Ninja Cadet      │
│ • 2D Accessible Map    │     │ • Deterministic Pitch  │        │ • 4 NASA Data Missions    │
│ • GIBS Imagery Tiles   │     │ • Spatial Panner (HRTF)│        │ • Free Roam Biome World   │
│ • Spectrum Sonogram    │     │ • Audio Legend Matrix  │        │ • Sonic Quiz & Kids Zone  │
│ • High Contrast Mode   │     │ • Multi-track Mixer    │        │ • Inclusive Co-op Mode    │
└────────┬───────────────┘     └───────────┬────────────┘        └────────────┬──────────────┘
         │                                 │                                  │
         └─────────────────────────────────┼──────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┴──────────────────────────────────┐
         │                                                                    │
┌────────▼────────────────────────────────────────┐     ┌─────────────────────▼──────────────┐
│ 4. BLIND EXPLORER & UNIVERSAL ACCESSIBILITY     │     │ 5. NASA DATA REGISTRY & ANALYTICS  │
│ • Dedicated Blind Explorer Interface Toggle     │     │ • FIRMS VIIRS Active Fire Hotspots │
│ • Web Speech API Natural Language Narration     │     │ • NASA POWER 45-yr Historical Rain │
│ • Complete ARIA Live Regions & Semantic Tree   │     │ • JPL MUR SST Anomaly Engine       │
│ • Keyboard Control Scheme (Tab, Space, H, M)   │     │ • GISS GISTEMP v4 & Vital Signs    │
│ • Visual Audio Equivalent (Deaf Accessibility)  │     │ • Live vs Historical Badge Matrix  │
└─────────────────────────────────────────────────┘     └────────────────────────────────────┘
```

---

## 3. Scientific Validation & Audio Legend Matrix

### 3.1 Transparent Acoustic Mappings
Every sound produced by the engine corresponds to a documented mathematical formula. No frequency is arbitrary.

| Environmental Metric | NASA Source & Instrument | Range / Unit | Acoustic Property | Mathematical Sonification Function | Auditory Meaning |
|---|---|---|---|---|---|
| **Fire Radiative Power (FRP)** | NASA FIRMS VIIRS (375m) | $5 - 800\text{ MW}$ | Filtered Crackle Density & Pitch | $f = 800 + 2200 \times \log_{10}(1 + \frac{\text{FRP}}{800})\text{ Hz}$ | Higher pitch & faster crackles = intense fire |
| **Precipitation Rate** | NASA POWER (Daily/Climo) | $0 - 100\text{ mm/day}$ | Droplet Cluster Cadence & Pitch | $N_{\text{drops}} = \lfloor 2 + 18 \times \sqrt{\frac{P}{100}} \rfloor;\ f \in [340, 700]\text{ Hz}$ | Faster rhythmic drops = heavier rainfall |
| **Sea Surface Temp Anomaly** | NASA JPL MUR SST | $-3.0^\circ\text{C} \text{ to } +3.0^\circ\text{C}$ | Sub-bass Drone & Detune Ratio | $f = 110 \times 2^{\Delta T / 3.0}\text{ Hz}$; LFO rate: $0.2 + 0.8 \times \max(0, \Delta T)$ | Deeper vibration = warming ocean heat anomaly |
| **Surface Temp Anomaly** | NASA GISS GISTEMP v4 | $-1.5^\circ\text{C} \text{ to } +2.5^\circ\text{C}$ | G-Pentatonic Harmonic Scale | Pitch Index: $k = \text{round}((\Delta T - \min) / \text{step})$; $G_3 (196\text{Hz}) \to G_5 (784\text{Hz})$ | Higher notes = warmer than 1951–1980 baseline |
| **Arctic Sea Ice Extent** | NSIDC / NASA Vital Signs | $3.5 - 8.5\text{ M km}^2$ | Resonant Chime Resonance & Bell | Harmonic Bell Frequency: $f = 1200 - 80 \times (\text{Extent - 3.5})\text{ Hz}$ | Thinner, higher resonant chime = diminishing sea ice |

### 3.2 Live vs. Historical Data Labeling Standard
To maintain strict scientific credibility, all UI views, modal dialogs, and audio announcements must include:
- **`Temporal Classification`:** `[LIVE NEAR-REAL-TIME]`, `[HISTORICAL RECORD]`, or `[CLIMATOLOGY MODEL]`.
- **`Observation Date / Window`:** e.g., `2026-10-07` or `1981-2025 Climatological Baseline`.
- **`Spatial Resolution`:** e.g., `375m pixel`, `0.5° × 0.5° grid`, or `1km global grid`.
- **`Processing Methodology`:** Brief text explanation of how raw satellite granules were filtered and aggregated.

### 3.3 Simulation vs. Scientific Fact Separation
All game scenarios (e.g. fire extinguishing, flood rescue boat navigation) must explicitly render the following disclaimer:
> **Educational Simulation Notice:** *The rescue navigation, water spraying, and mission tasks are educational game simulations designed to teach satellite data interpretation. They do not simulate real-world firefighting tactics or disaster management protocol.*

---

## 4. Deep Dive: Blind Explorer Mode (Full Audio-First Platform)

The **Blind Explorer Mode** provides a non-visual, screen-reader-optimized, audio-guided experience that enables visually impaired and blind users to navigate the entire globe, select any country, inspect NASA climate indicators, and complete missions without sight.

### 4.1 Architecture & Control Flow
1. **Dedicated Global Mode Switch:**
   - Quick toggle via keyboard shortcut `Alt + B` or persistent high-contrast header toggle.
   - When engaged, the interface presents a streamlined, high-contrast, linear accessibility view while the Three.js viewport pauses background rendering to save CPU/battery.
2. **Spoken Natural Language Audio Guidance (Web Speech API):**
   - Bilingual voice synthesis (English and বাংলা).
   - Natural phrasing of measurements without synthetic hallucination:
     - *EN:* "You are exploring Bangladesh. Selected period: October 2026. Daily precipitation is 14.2 mm, which is 2.3 mm above the 45-year climatological baseline. Sound panning: 48% to the right."
     - *BN:* "আপনি বাংলাদেশের তথ্য শুনছেন। সময়কাল: অক্টোবর ২০২৬। দৈনিক গড় বৃষ্টিপাত ১৪.২ মিলিমিটার, যা ৪৫ বছরের ঐতিহাসিক গড়ের চেয়ে ২.৩ মিলিমিটার বেশি। শব্দ ডান পাশে শুনছেন।"
3. **Binaural 3D Spatial Audio (Web Audio API `PannerNode`):**
   - Uses HRTF (Head-Related Transfer Function) spatial panning:
     - Longitude (`-180° to +180°`) maps directly to Azimuth angle (`-90° to +90°`).
     - Latitude (`-90° to +90°`) maps to Elevation tilt (`-45° to +45°`).
4. **Keyboard-Only Control Standard:**
   - `Tab` / `Shift + Tab`: Step through accessible controls in logical DOM sequence.
   - `Enter`: Activate selected item or confirm mission action.
   - `Space`: Play / Pause sonification loop.
   - `Arrow Keys (Up/Down/Left/Right)`: Navigate data points, slider scrubbers, or spatial coordinates.
   - `H`: Speak audio help and contextual keyboard guide.
   - `M`: Announce current mission status, active dataset, and selected location coordinates.
   - `Escape`: Close active overlay, dialog, or return to top menu.
5. **Screen Reader Semantics & ARIA Landmarks:**
   - Use `role="main"`, `role="region"`, `role="status"`, `aria-live="polite"` for non-disruptive feedback, and `aria-live="assertive"` for critical warnings.
   - Complete `<table summary="...">` text alternatives for all temporal charts.
6. **Visual Alternatives for Deaf & Hard-of-Hearing Users:**
   - Dynamic real-time Audio Spectrum Sonogram and animated frequency wave visualizer.
   - Real-time text closed-captions for all sound effects and narrations.
   - Haptic feedback pulse on mobile devices via `navigator.vibrate([40, 60, 40])` for alarms and impact triggers.

---

## 5. Deep Dive: Sonic Earth Adventure (3D Educational Adventure Game)

### 5.1 Game Center Modes
| Mode | Target Audience | Primary Interaction | Educational & Accessibility Focus |
|---|---|---|---|
| **Adventure Mode** | General, Students, Kids | 3D *Eco-Ninja Cadet* third-person navigation across 4 distinct NASA mission biomes. | Learn environmental cause-and-effect through interactive simulation challenges. |
| **Free Roam Biome Mode** | Casual Explorers | Open 3D exploration of forests, oceans, river deltas, and polar caps. | Freely click and scan any coordinate to hear local NASA POWER and satellite data. |
| **Sonic Adventure** | Blind & Visually Impaired | Audio-first navigation using binaural audio beacons, spoken clues, and keyboard controls. | 100% playable with screen reader or closed eyes; directional sound guides player to anomalies. |
| **Earth DJ Studio** | Creative Music & Science Enthusiasts | Multi-track audio mixing desk combining rainfall, fire crackles, ocean sub-bass, and melodic scales. | Understand how layered Earth observation systems function simultaneously. |
| **Sonic Quiz (Sound Detective)** | Educational & Classroom Use | Auditory classification challenges where players identify data categories purely by listening. | Develop critical listening skills and scientific acoustics intuition. |
| **Kids Learning Zone** | Ages 8–14 | Simplified vocabulary, friendly cartoon visuals, short 3-minute mini-games, zero penalties. | Positive encouragement, environmental awareness, and foundational Earth science concepts. |
| **Inclusive Co-op Mode ("Two Players, One Earth")** | Sighted + Blind Pairs, Classmates | Asymmetric gameplay: Player A acts as Visual Satellite Navigator; Player B acts as Acoustic Sensor Analyst. | Demonstrates that non-visual perception is equal in value to visual data analysis. |

---

### 5.2 The 4 Authentic NASA Missions

#### Mission 1: Amazon Wildfire Investigation & Rescue
- **NASA Dataset:** NASA FIRMS VIIRS 375m Active Fire Hotspots & Fire Radiative Power (MW).
- **Location:** Amazon Basin, Brazil (`-3.4653° S, -62.2159° W`).
- **Narrative:** High thermal anomalies detected by satellite. The explorer must locate the highest intensity hotspots using acoustic crackle density and operate a simulated containment drone.
- **Audio Feedback:** Bandpass-filtered crackle pulses accelerate as the player approaches higher FRP coordinates.
- **Accessible Audio Cue:** Left/Right binaural headphone panning indicates fire direction; distance is signaled by audio pulse frequency.
- **Reward:** *Fire Guardian Badge* + 150 XP.

#### Mission 2: Bengal Monsoon Rescue & Flood Resilience
- **NASA Dataset:** NASA POWER Daily Precipitation & 45-Year Historical Baseline (mm/day).
- **Location:** Sylhet & Chattogram Divisions, Bangladesh (`24.8949° N, 91.8687° E`).
- **Narrative:** Intense monsoon precipitation exceeds local drainage thresholds. Explorer charts safe navigation corridors for emergency boats based on precipitation sonification.
- **Audio Feedback:** Raindrop cluster cadence increases from light gentle patter to dense, high-frequency downpour.
- **Accessible Audio Cue:** Low resonant horn warning triggers if the boat approaches flooded shallow grid cells.
- **Reward:** *Rain Explorer Badge* + 150 XP.

#### Mission 3: Pacific Ocean Submarine Explorer
- **NASA Dataset:** NASA JPL MUR SST Sea Surface Temperature Anomalies (°C).
- **Location:** Central Pacific Equatorial Belt (`0.0° N, -140.0° W`).
- **Narrative:** Pilot an oceanographic submarine to map marine heatwaves and coral bleaching vulnerability zones.
- **Audio Feedback:** Sub-bass drone sweeps up in frequency as positive temperature anomalies rise; sonar pings indicate thermal boundaries.
- **Accessible Audio Cue:** Sonar echo interval decreases as the submarine approaches thermal anomaly centers.
- **Reward:** *Ocean Guardian Badge* + 150 XP.

#### Mission 4: NASA Orbital Harmonizer
- **NASA Dataset:** Integrated Earth Observation Datasets (GHG, SST, Fires, Precipitation, Sea Ice).
- **Location:** Low Earth Orbit (LEO Satellite Track, 400 km altitude).
- **Narrative:** Calibrate multi-spectral orbital sensors by matching received telemetry sounds to their correct environmental data streams.
- **Audio Feedback:** Complex polyphonic multi-stream soundscape where players isolate and balance distinct frequencies using bandpass sliders.
- **Accessible Audio Cue:** Spoken telemetry channel identification with distinct acoustic harmonic cues for each instrument.
- **Reward:** *Earth Master Certification & Official Badge* + 250 XP.

---

## 6. Seven Signature Innovations

### 01. Earth Has a Heartbeat (Continuous Planetary Sonification)
- Real-time synthesis of Earth’s continuous physiological state: combining atmospheric CO₂ (baseline fundamental frequency), global temperature anomalies (harmonic intervals), and fire/precipitation events (rhythmic percussion).
- Provides an immediate emotional and scientific connection upon entering the platform.

### 02. Time Travel Studio: Hear Earth in 1981 vs 2025
- Interactive side-by-side comparative audio player:
  - Select any coordinate or country.
  - Toggle or scrub between 1981 (historical baseline) and 2025/2026 (current observation).
  - Listen to the **Acoustic Delta ($\Delta f$)**: hear the tangible pitch increase in temperature and the heightened volatility of precipitation rhythms.

### 03. Blind First: Play Without Seeing
- A standalone challenge mode where sighted players are invited to close their eyes or blindfold themselves to experience the game exactly as a blind explorer does.
- Enhances empathy, validates the spatial audio engine, and proves the efficacy of non-visual scientific computing.

### 04. Earth DJ Studio (Authentic Data Remix Desk)
- 4-channel audio console allowing users to mix:
  1. *Rainfall Track* (NASA POWER precipitation clusters).
  2. *Ocean Heat Track* (MUR SST sub-bass hum).
  3. *Wildfire Track* (FIRMS crackle rhythms).
  4. *Atmospheric Chimes* (GISS temperature pentatonic chimes).
- Features master tempo, pitch transpose, reverb, and real-time audio export (`.wav` recording via `MediaRecorder`).

### 05. Two Players, One Earth (Inclusive Cooperative Gaming)
- Local split-input or turn-based co-op:
  - *Player A (Visual Navigator):* Observes the 3D globe and identifies geographic landmarks.
  - *Player B (Sonic Specialist):* Wears headphones, listens to spatial acoustic beacons, and instructs Player A which direction to steer.
  - Fosters communication and demonstrates that sight and hearing provide complementary scientific perspectives.

### 06. Sound Detective (Sonic Quiz Game)
- Gamified ear-training with 3 difficulty tiers:
  - *Beginner:* Identify whether a sound represents Rain, Fire, or Ocean.
  - *Intermediate:* Compare two sound clips and identify which represents higher temperature or stronger fire radiative power.
  - *Expert:* Detect whether a regional climate soundclip is from an El Niño or La Niña year based on rainfall and sea surface temperature acoustic signatures.

### 07. Earth Sound Passport (Verifiable Learning Record)
- Dynamic digital passport generated as missions and country deep-dives are completed.
- Displays:
  - Regions explored with coordinates.
  - Exact NASA datasets consulted with publication dates.
  - Acoustic parameters mastered.
  - Unique verification cryptographic hash and shareable certificate.

---

## 7. Comprehensive Phased Implementation Roadmap

### ✅ Already Completed Phases (0 – 11)
- **Phase 0:** Vite + React 19 + TypeScript + Tailwind CSS tooling.
- **Phase 1:** Ingestion of FIRMS, POWER, MUR SST, GISS, and Vital Signs datasets.
- **Phase 2:** Real-time Web Audio API scientific sonification engine.
- **Phase 3:** Interactive Three.js 3D Globe + D3-geo accessible 2D fallback map.
- **Phase 4:** Synchronized Data Jukebox with multi-decade timelines.
- **Phase 5:** Bangladesh Monsoon 8-division track and localized country profiles.
- **Phase 6:** Universal keyboard shortcuts, high contrast, and bilingual support (EN/BN).
- **Phase 7:** Vitest (220 tests) + Playwright E2E + Axe-core zero-violation test suite.
- **Phase 8:** React 19 portals, custom fonts, and performance throttling.
- **Phase 9:** 3-Level planetary carousel landing experience.
- **Phase 10:** Initial Sonic Quest 3D canvas and basic mission prototypes.
- **Phase 11:** CI/CD stabilization, Playwright SwiftShader fixes, and Vercel SPA routing.

---

### 🚀 New Phased Roadmap (Phases 12 – 18)

### 📌 Phase 12: Scientific Transparency, Audio Legend & Data Verification Matrix
- **Scope:**
  - Build interactive **Audio Legend Drawer / Floating Panel**: shows exact mathematical formulas, current frequency ($Hz$), decibel levels, and parameter meanings.
  - Add `[LIVE NEAR-REAL-TIME]`, `[HISTORICAL]`, and `[CLIMATOLOGY]` badges to all data displays with timestamps and satellite sensor metadata.
  - Insert educational simulation disclaimers into all mission dialogs.
- **Verification:** Unit tests for formula calculation accuracy; visual check of badges.

### 📌 Phase 13: Full Blind Explorer Mode & Universal Screen Reader Engine
- **Scope:**
  - Implement dedicated `BlindExplorerMode.tsx` toggle with persistent state.
  - Integrate Web Speech API speech synthesis with complete bilingual support (English and বাংলা).
  - Add live spoken feedback for all country selections, data inspections, and menu actions.
  - Full keyboard control mapping (`Tab`, `Space`, `Enter`, `H`, `M`, `Arrows`, `Escape`).
  - Introduce Deaf/Hard-of-Hearing visual sonogram component with real-time waveform visualization and haptic vibration triggers.
- **Verification:** 100% keyboard navigation pass without mouse; screen reader announcement audit.

### 📌 Phase 14: Earth Sound Comparison Studio (Time Travel: 1981 vs 2025)
- **Scope:**
  - Create `TimeTravelStudio.tsx` component allowing side-by-side selection of two years (e.g., 1981 vs 2025) for any location.
  - Implement dual-track sonification with seamless crossfade and delta comparison ($\Delta \text{Temp}$, $\Delta \text{Precipitation}$).
  - Display acoustic shift meters (Hz shift and cadence variation).
- **Verification:** Vitest unit tests verifying correct acoustic pitch computation for delta values.

### 📌 Phase 15: Sonic Earth Adventure Expansion (Missions, Sonic Quiz & Kids Zone)
- **Scope:**
  - Upgrade the 4 NASA missions with enriched 3D animations, objective checklists, and verified NASA datasets.
  - Implement `SonicQuiz.tsx` (Sound Detective) with 3 difficulty tiers, score tracking, and instant audio-visual feedback.
  - Build `KidsLearningZone.tsx` featuring simplified vocabulary, cheerful cartoon character dialogues, and short mini-challenges.
- **Verification:** Test mission completion states, XP accumulation, and quiz scoring logic.

### 📌 Phase 16: Sonic Adventure (Audio-First Blind Gaming) & Inclusive Co-op
- **Scope:**
  - Develop `SonicAdventureAudioMode.tsx` providing 100% non-visual gameplay utilizing binaural directional audio beacons.
  - Implement `InclusiveCoopMode.tsx` supporting dual roles: Visual Satellite Navigator and Blind Acoustic Sensor Analyst.
  - Audio tutorials and voice cues for obstacle avoidance, beacon tracking, and mission completion.
- **Verification:** Complete an entire mission with the screen display powered off / hidden.

### 📌 Phase 17: Earth DJ Studio & Verifiable Earth Sound Passport
- **Scope:**
  - Enhance `EarthDJStudio.tsx` with 4-channel independent volume, pitch, filter sliders, and WAV recording capability.
  - Build `EarthSoundPassport.tsx` modal: generates digital passport cards with verified NASA metadata, coordinates explored, mission badges, and shareable QR/URL.
- **Verification:** Verify audio recording export integrity and passport link serialization.

### 📌 Phase 18: End-to-End Verification, Axe-core WCAG AAA Testing & 3-Minute Demo Polish
- **Scope:**
  - Run full Vitest regression suite and update test snapshots.
  - Execute Playwright E2E tests for Blind Explorer Mode, Time Travel Studio, and Sonic Quiz.
  - Run automated Axe-core checks across all new views to guarantee 0 accessibility violations.
  - Polish 3-minute presentation flow for NASA Space Apps judges.
- **Verification:** Green CI pipeline across all GitHub Actions workflows.

---

## 8. Turn-Key Developer Implementation Prompt
*(Use this exact prompt with Claude Code, Cursor, Codex, or Antigravity to implement any feature phase incrementally)*

```markdown
### SYSTEM DIRECTIVE: Blue Planet Radio 2.0 Feature Implementation

You are working on the Blue Planet Radio codebase (Vite + React 19 + TypeScript + Tailwind CSS 4 + Three.js + Web Audio API).
Strictly adhere to the following rules:
1. ARCHITECTURAL INTEGRITY: Do not rewrite the application from scratch or delete existing features. Incrementally enhance existing components.
2. SCIENTIFIC HONESTY: Never fabricate climate data or sonification values. All sound frequencies must derive from the documented mathematical sonification engine using authentic NASA datasets (FIRMS, POWER, MUR SST, GISS).
3. UNIVERSAL ACCESSIBILITY: Every new component must be 100% accessible via keyboard (`Tab`, `Enter`, `Space`, `Arrows`, `Escape`), include proper ARIA landmarks/labels, support screen readers (NVDA, VoiceOver), and provide bilingual text (English & বাংলা).
4. AUDIO-FIRST CAPABILITY: Ensure all audio features include visual alternatives (waveforms, captions) for deaf users and complete spoken natural-language descriptions for blind users.
5. CODE QUALITY: Run TypeScript compiler (`tsc -b`), Oxlint (`npm run lint`), and Vitest (`npm run test`) to maintain 100% passing tests with 0 errors.

YOUR TASK:
Implement [Insert Feature: e.g., Phase 12 Audio Legend Drawer & Live Badges / Phase 13 Blind Explorer Mode / Phase 14 Time Travel Studio].
Follow the specifications in updateplan.md precisely.
```

---

## 9. NASA Space Apps Challenge 2026 Judging Alignment Matrix

| Judging Dimension | NASA Space Apps Criteria | How Blue Planet Radio 2.0 Excels |
|---|---|---|
| **Impact (প্রভাব)** | How much does this solution improve lives and accessibility? | Bridges the sensory divide by enabling blind and visually impaired users to independently explore real NASA Earth data via voice navigation, 3D spatial audio, and screen reader compliance. |
| **Creativity (সৃজনশীলতা)** | How innovative and unique is the approach? | Combines real-time mathematical sonification, a 3D cartoon adventure game (*Eco-Ninja Cadet*), an Earth DJ remix desk, and the first-ever "Two Players, One Earth" inclusive cooperative mode. |
| **Validity (বৈজ্ঞানিক নির্ভুলতা)** | Is the scientific data and mathematical foundation authentic? | 100% authentic NASA satellite data (FIRMS, POWER, MUR SST, GISS). Zero hallucinated metrics. Transparent audio legends showing the exact mathematical formula for every sound. |
| **Relevance (প্রাসঙ্গিকতা)** | Does it fulfill the "Earth Information Jukebox" challenge? | Direct synergy with the Earth Information Center (EIC). Sweeps visual frames into synchronized soundscapes across multiple decades of global climate change. |
| **Presentation (উপস্থাপন)** | Is the UI intuitive, bilingual, and memorable for judges? | Bilingual in English and বাংলা, responsive across mobile and desktop, instant 60 FPS Three.js rendering, and accompanied by a concise, high-impact 3-minute live demonstration script. |

---

## 10. High-Impact 3-Minute Live Judging Demo Flow

```
[0:00 - 0:30] PART 1: The Visual Planet & The Sound of Earth
• Action: Open 3D Earth Globe. Rotate to Amazon rainforest.
• Spoken: "Judges, this is what NASA sees: active wildfires detected by FIRMS VIIRS satellites. But here is what the Earth sounds like when translated through mathematical sonification."
• Audio: Play active fire crackle sonification. Point out the live Audio Legend showing the exact formula.

[0:30 - 1:15] PART 2: Blind Explorer Mode (Hear Without Seeing)
• Action: Press `Alt + B` to activate Blind Explorer Mode. Turn monitor off or close eyes.
• Spoken: "Blue Planet Radio is built blind-first. A visually impaired explorer can navigate by keyboard and spatial audio."
• Audio: Voice synthesizer announces: "Selected: Bangladesh. Rainfall 14.2 mm, 2.3 mm above baseline. Panned 48% right." Press Space to hear rainfall droplet cadence.

[1:15 - 2:00] PART 3: Time Travel Studio (1981 vs 2025)
• Action: Open Earth Sound Comparison Studio. Compare 1981 vs 2025 global temperature anomalies.
• Spoken: "Instead of just reading a graph, hear climate change over 44 years. In 1981, the tone is a stable G3 at 196 Hz. In 2025, listen to the acoustic pitch shift to G5 at 784 Hz."

[2:00 - 3:00] PART 4: Sonic Adventure & Inclusive Co-op
• Action: Launch Mission 1 (Amazon Fire Rescue). Show Eco-Ninja Cadet locating hotspots via spatial audio beacons.
• Spoken: "Children, students, and blind explorers can play together in our Inclusive Co-op mode: one navigates visually, while the other guides using directional sound."
• Conclusion: Display the verifiable Earth Sound Passport with authentic NASA metadata.
• Final Tagline: "Hear the Earth. Explore the Planet. Protect Our Future."
```

