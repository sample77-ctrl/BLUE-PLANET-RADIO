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

### Static assets added in v5 (no runtime npm dependency; recorded as the guardrail asks)
| File | What | Source | Licence | Size |
|---|---|---|---|---|
| `public/fonts/mona-sans-vf.woff2` | Mona Sans variable: weight 200–900, width 75–125, optical size. One family for display (the wide cut) and body | [github/mona-sans](https://github.com/github/mona-sans), `fonts/webfonts/variable/MonaSansVF[wdth,opsz,wght].woff2` | SIL OFL 1.1 | 307,976 B |
| `public/fonts/noto-sans-bengali-vf.woff2` | Noto Sans Bengali variable, Bengali subset: weight 100–900, width 62.5–100 | Google Fonts (`fonts.gstatic.com/s/notosansbengali/v33/…`, from the `css2?family=Noto+Sans+Bengali:wdth,wght@62.5..100,100..900` stylesheet) | SIL OFL 1.1 | 190,000 B |

Removed: Bricolage Grotesque, Cormorant Garamond, IBM Plex Sans (two files) and the old static-range Noto Sans Bengali (about 300 kB). IBM Plex Mono (two files, 29 kB) stays for readouts. Net font payload goes from about 312 kB to 528 kB, and the budget in `typography.test.ts` was raised from 350 kB to 560 kB on purpose. The Mona Sans file is the full upright variable font; subsetting it to Latin needs a font tool we did not add (it would take it to about 80 kB). Next safe action if size matters: subset it offline.

## 6. Sources (Nov 2026)
- Challenge: [Romania Journal: 2026 challenges](https://www.romaniajournal.ro/society-people/science/nasa-space-apps-challenge-2026-launches-14-global-challenges/), [Nepvents](https://www.nepvents.com/events/cmvp131cy0000qtidqmehjx9h), [Space Apps 2026](https://www.spaceappschallenge.org/2026/), [FAQ](https://www.spaceappschallenge.org/resources/participant-faqs/), [2025 awards](https://www.spaceappschallenge.org/2025/awards/)
- Other teams: [TerraSonic](https://github.com/Nishix03/TerraSonic-NASA-Space-APPS), [Terra Vox](https://github.com/demondarkness010-web/terra-vox), [NabhoDhwani](https://github.com/imtanjilsarkar/nabho-dhwani-earth-jukebox), [Earth FM](https://github.com/Yoriichi-0u0/earth-fm), [Earth Jukebox](https://github.com/jaherunhasanrimon/NasaSpaceApp1stPrototype_Earth-Jukebox-Listen-to-a-Changing-Planet), [Arctic sea ice](https://github.com/joselynrajeev55-ops/earth-information-jukebox), [EARTH-616](https://github.com/ritesh-sarkar/earth-616)
- 2026 UI trends: [Fireart](https://fireart.studio/blog/the-best-web-design-trends/), [Envato web](https://elements.envato.com/learn/web-design-trends), [Envato UX](https://elements.envato.com/learn/ux-ui-design-trends), [Gleam Studio](https://www.gleamstudio.design/blog-post/ui-design-trends-2026), [Bubble](https://bubble.io/blog/web-design-trends/)
- Platform: [Chrome "What's new in web UI", I/O 2026](https://developer.chrome.com/blog/new-in-web-ui-io26), [scroll-triggered animations](https://developer.chrome.com/blog/scroll-triggered-animations), [modern-css.com](https://modern-css.com/whats-new/)

## 7. Progress log

### V1 · Identity reset: done (branch `visual/v1-identity`, cut from `redesign/next-gen-player` at 4f6c863)
**What changed**
- Tokens (`src/index.css`): ground `#0a0a0a`, neutral ramp `--panel` / `--panel-2` / `--hair` / `--ink*` (chroma < .012), six data colours at equal oklch lightness (L .77, within 0.03; checked by a test), `--signal` / `--on-signal` (default `#baed3f`; the dataset colour while a dataset plays; `--signal-live` / `--on-signal-live` for a colour sampled from a frame, V2). Old names (`--abyss`, `--line`) are aliases. `--brass` is now only the greenhouse data colour. Every UI use of `var(--brass)` became `var(--signal)` (45 files; `--brass-ink` became `--on-signal`). Radii 1–4 px, `corner-shape: squircle` under `@supports`.
- `src/lib/signal.ts` (pure, tested): sRGB↔oklch, `signalFromRgb` clamps lightness to .72–.90 and picks black or white text, `applySignal` writes the two CSS variables. Nothing samples a frame yet; that is V2.
- Surfaces: `.panel` / `.panel-solid` / `.glass-flat` are opaque cards with a hairline. Glass stays only on `.glass` / `.glass-strong` (Now-Playing bar, the Atlas floating controls, the globe reset button, the 2D-map zoom), and `.glass-pop` (pop-ups). Footer is a plain panel.
- Type: Mona Sans (weight + width + optical size) replaces Bricolage, Cormorant and Plex Sans; Noto Sans Bengali variable with the width axis; Plex Mono stays. Wide cut (`font-stretch` 112–125%) on the wordmark, headlines and the big numerals. `text-wrap: balance`, and `text-box: trim-both cap alphabetic` on the hero headline and the big numeral. `.readout` mono label class.
- Background: the starfield canvas is `display:none` except behind the landing hero (`html.landing-open`) and no longer draws elsewhere; the Atlas globe lost its three.js starfield. In its place: a ~0.5 kB SVG grain and a soft `--signal` corner field (`space-background.css`).
- Header: ruled (full width, opaque, one hairline), wide-cut wordmark, text nav with a signal underline, new first item **Frames** (EN "Frames", বাংলা "ফ্রেম"). `sectionOf('frames')` is now `'frames'`: Frames left the Jukebox collections row (it is still reachable from the header, the ⌘K palette, share links and the landing). In V1 "Frames" opens the existing frame player; V2 turns it into the Stage.
- Re-skinned (`src/bold.css` rewritten, no neon or glow): landing hero, Jukebox (the record sits on a full field of the story's data colour, with a huge `1998`-style numeral), Atlas, Frames, Monsoon, Pulse, Quest hub, About.
- High contrast: black ground, the signal colour only as text and lines (primary button becomes an outlined button; the Jukebox field becomes black with signal numerals).

**Found and fixed on the way**
- **Pre-existing bug:** in the production build the glass blur never applied in Chromium. Both `backdrop-filter` and `-webkit-backdrop-filter` were written, unprefixed first, and the CSS minifier kept only the prefixed one, which Chromium ignores. Writing the prefixed one first keeps both. (`.glass-pop` and the old `.glass`/`.panel` had it too; dev mode was fine, so it was not seen.)
- Atlas at 1440 px: the "Spin" button was covered by the right-panel toggle. The labels of the Surprise / Tune / NASA imagery / Spin buttons now go visually hidden (still the accessible name) between 1024 and 1535 px.

**Tests changed on purpose (the UI changed):** `layout.pw.ts` header height (`--header-h` = header height, no 10 px floating gap); `fonts.pw.ts` (new families, plus a check that the width axis is real); `typography.test.ts` (font files ≥ 4, payload budget 350 → 560 kB, see §5); `designFoundation.test.ts` (Frames is its own section); `datasetTheme.test.ts` (default focus ring is `--signal`); `contrast.test.ts` (`--brass-ink` pair replaced by `--on-signal-default`; the glass test's "deep space" backdrop is now `#0a0a0a`). Nothing was loosened to pass, apart from the font-payload budget, which is a decision about assets you approved.
**New tests:** `src/__tests__/signal.test.ts` (216-colour sRGB grid: signal ≥ 4.5:1 on the ground, `--on-signal` ≥ 4.5:1 on the field, lightness in the window, greys give a loud default); `contrast.test.ts` (default signal as text on all surfaces, `--on-signal` on all six data fields, equal lightness, neutral neutrals, HC signal at 7:1, glass over a white frame pixel); `e2e/identity.pw.ts` (ground and starfield, opaque cards vs glass bar, Frames first and opens, each story floods the hero with its data colour, high contrast, no horizontal scroll at 375 and 1440).

**Checks run (real numbers)**
- `npm run lint`: clean. `npm test`: 326 passed, 35 files (299 before). `npm run build`: ok.
- Size: index JS **166.6 kB** gzip (budget 175; was 166.5), CSS **27.0 kB** (budget 32; was 27.2), globe chunk **131.8 kB** (budget 150).
- `npx playwright test` (Chromium, full suite, 6.0 min): 87 passed, 1 failed on the first run (`layout` header height, which asserted the old 10 px gap). After the intended fix, `layout` + `identity` re-run: 12 passed. The full suite was not re-run after that one-line test edit. This includes the axe scans (landing, Atlas, Jukebox, About, Frames, Monsoon, Pulse, Quest; 1400 px and 360 px in বাংলা + high contrast + reduced motion): 0 violations.

**Seen (screenshots in `docs/v5-shots/v1/`, `before-*` and `after-*`, 375 and 1440 px):** all eight views in English; landing, Jukebox, Frames, About in বাংলা; landing, Jukebox, Frames, Quest in high contrast; landing and Jukebox with reduced motion; Jukebox under `forcedColors: active` (file saved, not opened by me).
**Not verified:** Atlas, Monsoon, Pulse and Quest in বাংলা; Atlas, Monsoon, Pulse and About in high contrast; the games inside Quest (Tailwind colour classes such as `from-amber-950/30` in `src/game/*` still use their own colours; only tokens, radii and fonts changed); Safari/Firefox (squircle, `text-box`, `@property` are progressive); a real GPU; reduced-transparency (not emulated). Audio was not touched.
**Not done / for later phases:** nothing samples a frame colour yet (V2); the globe markers still use their own hex colours (V5 retunes them); the nav item "Frames" opens the old frame player until V2; the Mona Sans file is unsubsetted (308 kB).
**Reminder:** the Groq key in `src/harmonium/groqPredictor.ts` is untouched and must still be revoked at Groq.
**Next safe action:** branch `visual/v2-frame-stage` from this branch and build the Frame Stage (V2).

### V2 · The Frame Stage: done in part (branch `visual/v2-frame-stage`, cut from `visual/v1-identity`)
**Built**
- The `frames` view (`src/tracks/FrameJukebox.tsx`, same needle engine) is now the Stage. The EIC frame sits on the ground at its own aspect, sized to the screen height; a needle sweeps it in real time and a column glow marks the pixels being heard. Desktop: frame left, readout column right. Phones: stacked.
- Readout = a full field of the signal colour. The big numeral is the **year read from the chart axis** on the two frames that have one (greenhouse index: 1979–2021; ocean heat: 1957–2021; the tick positions were measured on the bundled pictures and are in `eicFrames.ts` `axis`, tested at the printed ticks and the first and last bar), otherwise the longitude (map frames) or "across the picture" in %. Beside it: pitch (note and Hz), loudness meter, timbre. Its weight (560–900) and width (112–125%) follow the analyser bands from `reactive.ts` (CSS variables on one element, no re-render).
- **Signal colour sampled live** (`columnColor` in `src/lib/frameStage.ts`, then `applySignal` from V1): the column's pixels weighted by loudness and by how vivid they are, smoothed, clamped for 4.5:1. The whole interface re-tints (buttons, underline, chips, the bar). It is released when you leave the view. Labelled in the UI as "a colour from the image, not a measurement".
- Source, credit link, what the picture shows, the method text (now translated; it was English-only), and a **Describe** toggle with `longEn` / `longBn`. The canvas's alt text is that long description.
- **Side A / Side B**: before/after is two frames side by side, "Side A · left ear" and "Side B · right ear", one needle in each, one scrub. The 4 preset pairs are chips; custom pair and the GIBS imagery are under "More frames and imagery".
- **Hear the data behind it**: the greenhouse frame opens the CO₂ story in the Data Jukebox. The ocean-heat frame opens the MUR SST story and says it is related, not identical (the frame is ocean heat content since 1957, the story is last month's surface anomaly).
- Entry: the landing's main (only brass) button is now "Hear an EIC frame"; the globe is the second button, the old "Press play · hear Fire" preview is the third. Header: Frames first, Explore Earth second (V1).
- Transition: `withViewTransition` in `player/ui.ts`: element-scoped (`main.startViewTransition`, Chrome 147+) when it exists, else the root transition, else none; skipped under reduced motion. Used for the landing → view jump and for the full player. The Chromium here only has the root version, so the element-scoped branch is written but not exercised.
- Reduced motion: the sound runs at full rate, but the needle, numerals and colour update about once a second, the numerals never animate, and there are step buttons (◀ ▶, 4 columns each; they play a short probe). High contrast: black ground, signal colour as text and lines only.
- Small: the periodic "Needle at …" screen-reader announcement is gone (it spoke every 2.5 s while playing; only user seeks announce now).

**Not done (V2 items still open)**
- "Hear the data behind it" **opens the Jukebox** instead of playing the series under the frame on the same Stage, with a score line. Doing it properly needs the series player hosted in the Stage.
- **Chart stories do not use the Stage yet** (the Jukebox keeps its own layout, restyled in V1).
- Side A/B for *series* (A/B compare in the Jukebox) is not on the Stage.
- Element-scoped view transition not seen working (no browser here supports it).
- Nothing was listened to: audio was checked as state and cursor only, in headless Chromium.

**Tests**
- New: `src/__tests__/frameStage.test.ts` (10: axis years at ticks and ends, no year outside the chart, loudness+vividness colour, silent column holds colour, related stories exist and the ocean-heat one is labelled related); `e2e/stage.pw.ts` (9: opens from the landing CTA through a view transition and nothing autoplays; Frames first and the globe second; the needle advances while playing and the year reads from the axis; the signal colour changes along a frame and the field stays ≥ 4.5:1 and is released on leaving; Side A/B both play; Describe and the alt text; the related-data button and its "related" wording; reduced motion; 375 px in বাংলা).
- Changed on purpose: `redesign.pw.ts` is untouched but the landing keeps exactly one brass button on the first screen (still passes); `signal.test.ts` is unchanged; `signal.ts` now treats chroma below .012 (was .03) as grey, because a downsampled colourful column averages to low chroma and was being sent to the default colour (found by the "colour follows the picture" test failing).
- A race in my own V1 test (`identity.pw.ts` high contrast read `.vinyl-hero` before the lazy chunk rendered) failed once in the full run; it now waits for the element.

**Checks (real numbers)**: lint clean; `npm test` 336 passed (36 files); build ok; size: index JS **167.6 kB** (limit 175; was 166.6), CSS **27.8 kB** (limit 32; was 27.0), globe chunk 131.8 kB (150). `npx playwright test`: **96 passed, 1 failed** (the race above), then `identity` + `stage` re-run: 15 passed. The full suite was not re-run after that one-line fix. axe (all views, 1400 px and 360 px in বাংলা + high contrast + reduced motion) was in the 96 and is clean.
**Seen (docs/v5-shots/v2/)**: the Stage at 375 and 1440 px in English (ocean heat, greenhouse and El Niño frames, the greenhouse one playing), Side A/B at 1440 (playing) and 375, বাংলা at 375 and 1440, high contrast and reduced motion at 1440, landing at both sizes. Not seen: Side A/B in বাংলা or high contrast; the Stage on the GEOS rain frame and the GIBS imagery; forced-colors.
**Reminder:** `src/harmonium/groqPredictor.ts` untouched; its Groq key still needs revoking.
**Next safe action:** V3 (landing as kinetic scrollytelling, one EIC frame per chapter) on `visual/v3-landing`; or first finish the two open V2 items (series on the Stage, chart stories on the Stage) if you want V2 fully closed.

### V2 (completion) · series on the Stage (same branch, second commit)
**Built:** `src/tracks/SeriesUnderFrame.tsx`. "Hear the data behind it" no longer leaves the Stage. It opens a panel under the frame: the picture stays on screen as the backdrop, and the real series (`loadStorySeries`, the same player `SeriesPlayer`, the same mapping and spec as the Jukebox) plays under it. The panel has a score line (the series as a line with a signal-coloured cursor, gaps never bridged), a signal-coloured readout (moment, value with unit, note and Hz), Play / Pause / Stop, and the series' own source, period, unit, snapshot/sample badge and method. The ocean-heat frame's panel says the data is related, not the numbers in the picture. "Open in the Data Jukebox" is still there. **Side A / Side B on the series:** the first third of the series in the left ear against the last third in the right ear, same mapping (so the later period sits higher), with both periods labelled and shaded on the score line. One sound at a time: starting the series stops the picture's sweep, and starting the sweep pauses the series.
**Tests:** `stage.pw.ts` test rewritten for the new behaviour (picture still on screen, score line, source and Snapshot badge, cursor moves while playing, sweep and series never together, Side A/B labels, Jukebox link, related wording). New strings in EN and বাংলা.
**Checks:** lint clean; `npm test` 336 passed; build ok; index JS **166.5 kB** (limit 175), CSS **28.0 kB** (limit 32), globe 131.8 kB; the panel code is in the lazy `FrameJukebox` chunk. `npx playwright test`: **97 passed, 0 failed** (5.7 min), axe included. Seen: `docs/v5-shots/v2/after-series-under-frame-1440.png` (greenhouse frame, CO₂ series, Side A/B, playing). Not seen: the panel in বাংলা, high contrast, or at 375 px.
**Still not done (decided, not forgotten):**
- **Chart stories on the Stage.** The Jukebox keeps its own layout (restyled in V1: the signal-field hero, the chart, the timeline). The Stage's chart-in-the-frame-slot layout exists only under a frame. Moving the Jukebox's story view onto the Stage would mean re-hosting its persistent player (§3.1 D9) and its reducer, an architecture change the roadmap does not list, so I left it for you to decide.
- The element-scoped view transition is written but never ran (no browser here has it).
- The series panel's sound is not published to the Now-Playing bar (the bar shows the frame record); pause/stop are in the panel. Listening was not done (state and cursor only).

### V3 · Landing as scrollytelling: done (branch `visual/v3-landing`, cut from `visual/v2-frame-stage` at 81f5648; commit eacd576)
**Built**
- **Hero** (`LandingHero` in `src/landing/Chapters.tsx`): "Hear Earth change" in the wide cut over the ocean-heat EIC frame, with a slow visual-only needle sweep. Nothing plays by itself; after "Press play" the headline's weight follows the analyser (`--np-*`, no re-render) and returns when stopped. One primary button (Hear an EIC frame → the Stage on the ocean-heat frame), globe second, preview third.
- **Four chapters** (greenhouse gases, ocean heat, rain, El Niño and food): each shows its EIC frame full width (alt text = the frame's long description), a field flooded with its data colour, one real number, and a "Hear this frame" button that opens the Stage on that frame through a view transition. Definitions in `src/lib/chapters.ts` (pure, tested); the numbers are read at runtime from the bundled files in a lazy chunk (`chapterData.ts`): CO₂ last value, MUR SST area-weighted anomaly, the heaviest day in the global rain sample, last GISTEMP anomaly. Each shows period and source link; all carry "Bundled snapshot, not live data"; the three that are not the numbers printed in the picture carry "Related data"; the rain number carries "A sample". A failed file gives that chapter a note, not a fake number.
- **Motion:** CSS `animation-timeline: view()` where supported (colour band wipes in, needle follows scroll); otherwise an IntersectionObserver sets `data-in` at 25 % and the same CSS transitions run. Reduced motion: static, nothing clipped, no sweep. High contrast: black ground, data colour only as text and lines, no picture behind the headline.
- The 3D carousel stays after the chapters, re-skinned (`WorldCarousel.tsx`, `bold.css`). All new strings in English and বাংলা.

**Tests**
- New: `src/__tests__/chapters.test.ts` (12); `e2e/landing.pw.ts` (hero wide cut and no overflow, one primary action, nothing sounds before a click, numbers match the bundled JSON, Hear this frame ×4, scroll-driven timeline, IntersectionObserver fallback, reduced motion, high contrast, 4.5:1 on the four fields, headline at 320–1400 px in EN and বাংলা, 375 px no sideways scroll, axe on desktop and on phone + বাংলা + HC + RM).
- Changed on purpose: one line in `e2e/redesign.pw.ts` (landing hero selectors changed with the new hero).

**Checks (real numbers)**: `npm run lint` clean; `npm test` 348 passed (37 files; 336 before); `npm run build` ok; `npm run check:size`: main JS **136.3 kB** gzip (budget 175), CSS **29.4 kB** (budget 32, was 28.0), globe 131.8 kB (150); chapter numbers load in their own 0.6 kB chunk. Playwright: `landing` + `redesign` + `identity` + `stage` = **46 passed, 0 failed** (4.3 min). The full suite was **not** re-run on this branch.
**Screenshots saved** (`docs/v5-shots/v3/`, made by `scripts/v5-chapters.mjs`): before and after at 375 and 1440 px, English plus `-bn` (বাংলা) and `-x` (extra prefs) variants, for the hero, the four chapters and the carousel. They were not opened again when this log was written; the checks above are the e2e tests.
**Not verified:** a real GPU, Safari/Firefox (scroll timelines need the fallback there), listening to the hero sound (state and analyser only), the carousel in high contrast, forced-colors, the saved screenshots (not reviewed by eye).
**Next safe action:** open a PR for `visual/v3-landing`, then V4 (score view and share card) on `visual/v4-score` cut from it. Push is still pending: `origin` is set to `sample77-ctrl` but no token is stored on this Mac.

### V4 · Make the sonification legible: done (branch `visual/v4-score`, cut from `visual/v3-landing` at e7a3720)
**Built**
- **Score for a frame** (`src/lib/score.ts` pure, `FrameScore` in `src/tracks/ScoreView.tsx`): under the controls, "The score" shows the picture's thumbnail and, on the same columns directly below it, one note for every sounding cell of the 128 x 12 grid that drives the sound. x = where in the picture, y = pitch (top band highest), brightness = loudness (brightness^1.5, the sound's own curve), colour = the pixel's colour. Cells below the audible floor are left out, so silent margins stay empty (tested on the greenhouse frame: no note right of 67 % of its width). A playhead follows the needle (and the scrub, and the seek). Side A / Side B shows two scores. A **Score** button hides and shows it. The figure's text alternative gives the note count, columns, pitch range and the loudest position. Band pitch moved to `bandHz` in `frameSweep.ts` (same formula as before) so the score and the sound cannot drift apart.
- **Piano roll for a series** (`SeriesRoll`, in the "data behind it" panel): one bar per real value at the note `mapSeries` gave it (degree on the fixed range, gain as brightness, warm / cool / plain timbre as colour). A gap in the data is a gap in the roll. Side A / Side B shows the first-third and last-third rolls, both with the same mapping. A playhead follows the series cursor.
- **Share card** (`src/lib/shareCard.ts`): "Make a share card" (one EIC frame at a time; not for Side A/B pairs or your own images, which have no source) draws a 1080 x 1350 PNG on a canvas on this device: the frame with the needle where it is, the frame's score line, the signal-colour readout (year / longitude / % across, and the note and Hz under the needle), the source, a one-line method statement ("the colour comes from the image, not a measurement") and the link back to the Stage at that column. A preview, **Share** (`navigator.share` with the PNG file, title, text and link, only when the browser can share files) and **Save PNG** (`sonic-earth-<frame>.png`) follow. Nothing is uploaded; there is no server.
- All new strings in English and বাংলা; high contrast uses one colour for the roll and playhead; reduced motion keeps the existing once-a-second needle updates.

**Tests**
- New: `src/__tests__/score.test.ts` (16: band pitch, the score lists exactly the lit cells with the sound's loudness and the pixel colour, silent cells left out, dominant band and summary, the roll equals the series mapping, card layout maths, the card stays inside 1080 x 1350 with the longest text); `e2e/score.pw.ts` (11 tests, 14 with the axe pair: thumbnail and notes aligned, no note in silent regions, playhead = needle, playhead moves while playing, Score toggle, every EIC frame has a score, Side A/B shows two, the roll has one bar per real CO₂ value and a rising series rises, the card is 1080 x 1350 with signal colour and the link, Save gives a real PNG, Share passes the file and link to a stubbed `navigator.share`, বাংলা, high contrast + reduced motion, 375 px, axe on desktop and on phone + বাংলা + HC + RM).
- Changed on purpose: nothing existing was changed or loosened.

**Checks (real numbers)**: `npm run lint` clean; `npm test` 364 passed (38 files; 348 before); `npm run build` ok; `npm run check:size`: main JS **136.4 kB** gzip (budget 175), CSS **29.7 kB** (32; was 29.4), globe 131.8 kB (150); the score and card code are in the lazy `FrameJukebox` chunk (14.8 kB gzip). `npx playwright test` full suite: **125 passed, 0 failed** (7.4 min), axe included.
**Seen** (`docs/v5-shots/v4/`): the card itself for the greenhouse and ocean-heat frames (opened: layout, colours, source and link correct), the Stage with the score and the card at 1440 and 375 px, and the Side A / Side B roll at 1440. Not seen by eye: the card in বাংলা, the score in high contrast, the card on a real phone share sheet.
**Not verified:** `navigator.share` in a real browser (tested with a stub; headless Chromium has none), card fonts on Safari/Firefox (the card uses the page's own font stack), listening (state and cursor only).
**Not done / for later:** a share card for a series or for Side A/B pairs; the score for the Jukebox's own story view (it keeps its own chart); the card shows the link of the page it was made on (a localhost link in dev).
**Next safe action:** V5 (Globe 2.0, light pillars that pulse with the voices) on `visual/v5-globe` cut from this branch, or V6 first if time is short (V5 can be cut).
