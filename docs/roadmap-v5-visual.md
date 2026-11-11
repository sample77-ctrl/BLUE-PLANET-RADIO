# Roadmap v5: "The frame is the hero"

Written 11 Nov 2026 and revised the same day, so it fits the challenge. The hackathon is 14–15 Nov, so there are 3 working days. Use one branch per phase, cut from `redesign/next-gen-player`: `visual/v1-identity`, `visual/v2-frame-stage`, and so on.

## 0. The challenge, and where we stand

**The Earth Information Jukebox** asks teams to *pair NASA Earth Information Center (EIC) visual frames with dynamic sonifications generated in real time*. The team brief puts it the same way ([roadmap-v3-brief.md:56](roadmap-v3-brief.md)): "a generic space-themed website alone is not sufficient."

So the first thing a judge must see and hear is **an EIC frame turning into sound in real time**. Charts, the globe and the polish come after that.

**What we already have**
- `FrameJukebox` with 4 EIC frames (`src/lib/eicFrames.ts`):
  - Greenhouse Gas Index 1979–2021;
  - Ocean heat content since 1957;
  - El Niño crop yields;
  - GEOS Earth Now rain/cloud.
- NASA imagery (GIBS) frames and a before/after mode.
- A needle that sweeps from west to east: height in the picture → pitch, brightness → loudness, colour → timbre.
- On top of that: 17 chart stories, the spatial-audio globe, the Bangladesh monsoon track, the Vital Signs track, বাংলা, and an audio-first list.

**What other 2026 teams are building** (public GitHub repos):
- GISTEMP tone players (Earth Jukebox, EARTH-616);
- an Arctic sea ice sonifier;
- EIC frames scanned west to east into music (TerraSonic, the same idea as our needle);
- GIBS frames as music with an old-vs-new "duet" (Terra Vox);
- blind and low-vision access as the main pitch (NabhoDhwani, Terra Vox).

A frame sweep alone is **not** unique any more.

**What only we have, and so what the plan pushes:**
1. **Frame + data together.** Each EIC frame is linked to the real series behind it (GHG index → NOAA GML CO₂, ocean heat → ocean heat story). You can see the frame, hear the sweep, and also hear the numbers.
2. **Spatial sound on a globe.** Fire, rain and sea heat are placed left/right by longitude.
3. **Then vs now.** A/B compare on series, and before/after on frames.
4. **Local impact.** A Bangladesh monsoon track, the whole app in বাংলা, and the low-vision path built in.
5. **The sonification is legible.** A score view shows exactly which pixel or value made which note (V4).

## 1. Why v4 still looked the same

v4 changed **structure**: the shared player, queue, shortcuts, command palette and persistent audio. It did not change **identity**:

| Layer | Today | Problem |
|---|---|---|
| Colour | Navy `#071019` / `#0d1b27` and brass `#e9c46a` | The generic "space dashboard" look, which the brief warns against |
| Surfaces | 50% glass with a 16 px blur on **every** card | Everything has the same weight, so nothing is the hero |
| Type | Bricolage, Plex and Cormorant, all static | Numbers are small and still |
| Background | A starfield | Decoration with no data in it |
| EIC frames | One small image on a collection page | The heart of the challenge is buried three clicks deep |

**Rule for v5:** a phase is done only when a before/after screenshot of the same URL at the same size is **obviously** different to someone who has never seen the app. Store the pairs in `docs/v5-shots/`.

## 2. Visual direction: "Instrument"

The app is a scientific instrument that plays Earth's pictures and records.
- **Ground:** near-black and neutral `#0a0a0a`, with 1 px hairlines. No navy.
- **Signal colour:** one loud colour taken from **what you are hearing**. On a frame, it is sampled from the pixels under the needle. On a series, it is the dataset colour. It fills large areas, so the colour *is* the data.
- **Type:** very large variable-font numerals that respond to the sound, and mono lab-readout labels.
- **Glass:** only where something floats over the frame or the globe.

Alternatives I rejected:
- **"Wrapped" colour blocks.** They hurt the scientific credibility judges reward.
- **"Liquid Glass".** It is what v4 already did, it is costly over WebGL, and it is hard to keep at 4.5:1.

The jukebox language stays everywhere: tracks, *Side A / Side B* for then vs now, the queue, and Now Playing.

## 3. Phases (in shipping order; each one can ship alone)

### V1 · Identity reset (Day 1 AM, ~4 h). Every page looks new.
- **Tokens** (`src/index.css`):
  - Neutral oklch ramp: `--ground`, `--ink`, `--hair`.
  - Six data colours re-tuned to equal lightness, plus `--signal` and `--on-signal`.
  - The contrast tests are extended to every new pair.
- **Surfaces:**
  - Opaque ground with a 1 px hairline and a 0–4 px radius.
  - Glass only on the Now-Playing bar, floating controls and pop-ups.
  - `corner-shape: squircle` as a progressive enhancement (Chrome only).
- **Type:**
  - One variable family with weight **and** width axes replaces Bricolage and Cormorant. Candidate: Mona Sans (OFL, self-hosted woff2 ≈ 80 kB, a font asset rather than a runtime dependency).
  - Plex Mono stays for readouts.
  - Noto Sans Bengali variable (it has a `wdth` axis), so বাংলা moves too.
  - `text-wrap: balance` and `text-box-trim`.
- **Background:** the starfield goes everywhere except the landing hero. In its place: an SVG grain (~1 kB) plus a soft signal-colour field. CSS only.
- **Header:** ruled, with a wide-cut wordmark and text nav with a signal underline. The first nav item becomes **"Frames"**, not "Explore Earth" (see V2).
- **Done when:** all eight views are re-skinned; HC, RM, forced-colors and বাংলা pass axe; before/after shots are saved.

### V2 · The Frame Stage: the challenge, front and centre (Day 1 PM + Day 2 AM, ~7 h)
The full-screen Now-Playing stage, built around an EIC frame.
- **The frame fills the screen** (object-fit contain on the ground):
  - The needle sweeps it in **real time**, driven by the existing FrameJukebox engine.
  - A thin column glow marks the pixels being heard.
  - The **signal colour is sampled live** from the needle's column, so the whole UI re-tints as the picture changes colour.
- **Readout under the frame:**
  - the giant column position ("1998" on the GHG frame where the frame has a time axis, otherwise a column index);
  - the pitch, loudness and timbre the pixels produced;
  - frame title, EIC source, date and method.

  The numerals' weight and width follow the analyser bands, which P5 already computes.
- **"Hear the data behind it"**: where a frame has a matching series (GHG index → CO₂ story, ocean heat → ocean heat story), one tap plays that series on the same stage. The frame stays as the backdrop and a score line runs under it. *Frame + data together* is our differentiator 1.
- **Side A / Side B:** before/after frames and A/B series compare are shown as a split stage, with left ear = A and right ear = B. This is our differentiator 3, with a jukebox name.
- **Chart stories use the same Stage**, with the chart in place of the frame, so there is one layout for everything.
- **Transitions:** opening morphs from the bar via `startViewTransition`, element-scoped where it exists (Chrome 147+) so the globe keeps rendering, otherwise the root fallback.
- **Accessibility:**
  - the frame's long description (`longEn` / `longBn` already exist) is the image alt and a "Describe" toggle;
  - reduced motion gives a static needle position with step buttons;
  - high contrast gives a black ground, with the signal colour used only as text.
- **App entry:** the landing page's main CTA and the header's first item open **Frames** on the Stage. The Atlas globe becomes "Explore Earth", the second step.

### V3 · Landing as kinetic scrollytelling, one EIC frame per chapter (Day 2 PM, ~3 h)
- **Hero:** "HEAR EARTH CHANGE" set full width in the wide cut. Behind it, the ocean heat EIC frame, slowly swept. The type breathes with that sweep's sound only **after** the user presses play; nothing autoplays.
- **Chapters**, using CSS `animation-timeline: view()` with the existing IntersectionObserver fallback (R7):
  1. **Greenhouse gases**
  2. **Ocean heat**
  3. **Rain** (GEOS Earth Now)
  4. **El Niño and food**

  Each chapter shows its **EIC frame** full-bleed, floods its signal colour, shows one real number from the matching series, and has a one-tap **"Hear this frame"** that opens the Stage.
- The 3D carousel stays after the chapters, re-skinned to V1.

### V4 · Make the sonification legible (Day 3 AM, ~3 h)
- **Score view** (SVG, existing data only):
  - For a frame: one note per needle column, at the pitch and loudness the pixels gave. The thumbnail of the frame is aligned above the notes, so you can see which part of the picture made which note.
  - For a series: a piano roll from `mapSeries`.
  - In both: a playhead follows the sound.

  This is our strongest argument for "Best Use of Science" and "Art & Technology".
- **Share card:** a 1080×1350 PNG drawn on a canvas, holding the frame thumbnail, its score line, the source, and a link back to the Stage. Shared via `navigator.share` with a file; no server. It counts towards "Global Connection".

### V5 · Globe 2.0, linked to sound (Day 3 PM, ~3 h). Can be cut.
- Data as **light pillars** that pulse with a ripple when their voice sounds (`getActiveVoiceDetails`), so the ear and the eye are synced on the globe as well. This part stays even if the rest is cut.
- An atmosphere tinted with the signal colour (started in v4).
- Optional: a night side from NASA **Black Marble** city lights, with the terminator computed for the date played and labelled "lighting at 12:00 UTC". Restrained bloom from `three/examples` (no new dependency), off for reduced motion, low memory and high contrast.
- All of it stays in the lazy globe chunk (132 of 150 kB).

### V6 · Polish, proof and submission (Day 3 evening; freeze on 14 Nov at 09:00)
- Spring easing via `linear()` and `@starting-style` on sheets. View changes run through `startViewTransition` with a signal-colour wipe.
- **Checks:**
  - lint, unit tests, build and size;
  - all Playwright tests and axe;
  - manual passes at 375 and 1440 px in EN and বাংলা, with HC and RM.

  New e2e tests: the Stage opens from the landing page, the needle moves while playing, the signal colour changes with the frame, and Side A / B plays.
- **Submission** (the project page is the only thing global judges see). The copy leads with the challenge, in this order:
  1. EIC frames → real-time sound;
  2. the data behind each frame;
  3. the spatial globe;
  4. then vs now;
  5. Bangladesh monsoon and বাংলা;
  6. accessibility.

  Deliverables:
  - a 30-second video that opens on the Frame Stage, not the globe;
  - six screenshots;
  - a dataset table: EIC frames, GIBS, FIRMS, POWER, MUR SST, GISTEMP, NOAA GML, NSIDC, and Black Marble if V5 ships, with how each became sound.
- Check the official Judging & Awards Guide (published **13 Nov**) and adjust the copy.

## 4. Cut list (drop from the bottom if time runs out)
1. Black Marble night side and bloom (V5). Keep the pillars.
2. The share card (V4).
3. Landing chapters 3–4 (V3). Keep the hero and chapters 1–2.
4. The element-scoped transition (V2). Keep the root fallback.

**V1 and V2 cannot be cut.** V1 is the visible change and V2 is the challenge itself.

## 5. Guardrails (unchanged from CLAUDE.md)
- No new runtime dependencies. Fonts and textures are static assets, with the reasons recorded here.
- Main JS ≤ 175 kB gzip (currently 166.5). Stage, score, share and 3D code go in lazy chunks.
- Every string in EN and বাংলা. Source, unit, period and method stay visible on the Stage. No "live" badges. The signal colour sampled from a frame is labelled as coming from the image, not as a measurement.
- HC, RM, forced-colors, the no-WebGL 2D map and the audio-first list keep working. The new palette gets contrast tests before it ships.
- Security: the Groq key in `src/harmonium/groqPredictor.ts` must be revoked at Groq before the public demo.

## 6. Sources (Nov 2026)
- Challenge: [Romania Journal: 2026 challenges](https://www.romaniajournal.ro/society-people/science/nasa-space-apps-challenge-2026-launches-14-global-challenges/), [Nepvents](https://www.nepvents.com/events/cmvp131cy0000qtidqmehjx9h), [Space Apps 2026](https://www.spaceappschallenge.org/2026/), [FAQ](https://www.spaceappschallenge.org/resources/participant-faqs/), [2025 awards](https://www.spaceappschallenge.org/2025/awards/)
- Other teams: [TerraSonic](https://github.com/Nishix03/TerraSonic-NASA-Space-APPS), [Terra Vox](https://github.com/demondarkness010-web/terra-vox), [NabhoDhwani](https://github.com/imtanjilsarkar/nabho-dhwani-earth-jukebox), [Earth FM](https://github.com/Yoriichi-0u0/earth-fm), [Earth Jukebox](https://github.com/jaherunhasanrimon/NasaSpaceApp1stPrototype_Earth-Jukebox-Listen-to-a-Changing-Planet), [Arctic sea ice](https://github.com/joselynrajeev55-ops/earth-information-jukebox), [EARTH-616](https://github.com/ritesh-sarkar/earth-616)
- 2026 UI trends: [Fireart](https://fireart.studio/blog/the-best-web-design-trends/), [Envato web](https://elements.envato.com/learn/web-design-trends), [Envato UX](https://elements.envato.com/learn/ux-ui-design-trends), [Gleam Studio](https://www.gleamstudio.design/blog-post/ui-design-trends-2026), [Bubble](https://bubble.io/blog/web-design-trends/)
- Platform: [Chrome "What's new in web UI", I/O 2026](https://developer.chrome.com/blog/new-in-web-ui-io26), [scroll-triggered animations](https://developer.chrome.com/blog/scroll-triggered-animations), [modern-css.com](https://modern-css.com/whats-new/)
