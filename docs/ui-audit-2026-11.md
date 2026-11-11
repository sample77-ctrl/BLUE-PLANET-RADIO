# UI/UX audit, function by function (live server)

**Date:** 2026-11-11 · **Branch:** `claude/loving-hopper-j9gx92` (at `ad03412`) · **Method:** `vite` dev server on :5173 and the production build on :4173 (`vite preview`), driven with headless Chromium (Playwright, SwiftShader GL) at 1440×900, 820×1100, 375×760 and 320×640, English and বাংলা. Every claim below was observed, and each finding says how.

**Baseline:** `npm run lint` clean · `npm test` 377/377 · `npm run build` passes. No uncaught page errors and no React warnings on any view in dev or prod; the only console errors were `Failed to load resource` for outbound NASA/Groq calls that the sandbox blocks. No 4xx responses on the production build.

**Not reachable from here:** the production site (`sonic-earth-atlas.vercel.app` is blocked by the sandbox network policy, 403) and every live NASA API (POWER, GIBS). The POWER failure state was exercised instead, and it behaves well (message + "Try again").

---

## What works (verified)

| Area | Evidence |
|---|---|
| Navigation | All 5 header sections, the Jukebox collections row, logo → landing, and the mobile menu set `aria-current` correctly |
| Landing carousel | L1→L2→L3 by buttons, Esc, arrow keys and dots; focus moves to the new level's heading; hidden levels are `inert`; all four worlds route to the right track |
| Settings / Data dialogs | Focus enters, Tab is trapped, Esc and scrim close, focus returns to the opener; all 8 toggles flip `aria-checked` |
| Shortcuts | `Ctrl+K`, `/`, `Shift+?`, `,`, `S`, `M/L/G`, `←/→`, `Space`, `T`, `N/P` all work |
| Country picker | Type-ahead, ↓ + Enter, "n countries found" live region, camera fly-to, outline, `c=BGD` in the hash, honest "no cell or point inside the border" text |
| Jukebox | Story cards, chart click (15% → 1894, 50% → 1949, 80% → 1996), roving-tabindex timeline (Home/End/arrows), filters drawer (Esc closes, focus to Close), playback, collections |
| Share links | Reload restores state; `#v1&track=nope`, `#garbage`, `#v9`, unknown story or country all degrade to a valid view |
| Frames, Monsoon, Vital Signs, Quest | Play/Stop, slider keys, division select, click-to-listen readout; all 4 missions and 9 modes open, each with a Back button |
| Accessibility | axe-core: no violations on 8 of 9 views at 1440 and 375. Visible focus ring on all 40 tab stops per view tested. No horizontal overflow at 320, 375, 820, 1440 |
| বাংলা | Landing, Atlas, Frames, Monsoon, Pulse, About, Quest are fully translated and render correctly on phone |

---

## Findings

Severity: **High** blocks a user or breaks a stated guarantee · **Medium** degrades the experience or contradicts the docs · **Low** polish.

### High

**H1. Atlas List view: the right rail covers the page's controls.** `src/App.tsx:333` pads the list for the left rail only (`lg:pl-[340px]`); the 340 px "What you are hearing" rail (`data-ctl="hearing"`) is absolutely positioned over the right side. Measured with bounding boxes: at **1440, 1280 and 1024 px** the Voice Narration toggle, "Switch to Visual 3D", the country search and the per-observation "Play audio" buttons sit under the rail (fine at 1920, rail hidden at 900). This is the accessibility-first mode. Workaround: collapse the right rail. Fix: reserve `lg:pr-[360px]` while the rail is open.

**H2. Atlas List view: nested interactive controls.** `src/accessibility/AudioFirstMode.tsx:166` makes each of the 80 rows `role="button"` while it contains focusable children. axe: `nested-interactive`, **serious**, ×80 at both desktop and phone. This is the only axe failure in the app. Screen-reader users get a flattened or unreachable inner control.

**H3. Three overlays have no dialog semantics.** `HarmoniumChatModal.tsx:266`, `game/QuestBadgeModal.tsx:17` and `game/MyEarthPassport.tsx:307` are `fixed inset-0` modals that don't use the app's own `useDialog` hook. Observed on Harmonium: no `role="dialog"`, no `aria-modal`, **Esc does not close it**, focus is not trapped (60 Tab presses walk out to the header and the page behind). The Badges modal also ignored Esc. The five other overlays all use `useDialog` and are tested; these three were added outside that pattern.

**H4. Harmonium chat presents things that aren't true.**
- `HarmoniumChatModal.tsx:281` hard-codes the badge **"GROQ GPT-OSS ONLINE"**, shown with no key and no network. This is the "never show a live badge unless it is live" rule.
- `groqPredictor.ts` (the `catch` in `sendHarmoniumChatMessage`) returns one canned Bengali sentence for *any* failure (no key, offline, HTTP error). Observed: with the UI in English (`html lang="en"`), asking "Why is the Arctic warming?" returns an unrelated Bengali answer tagged "(Offline fallback)".
- `VITE_GROQ_API_KEY` is bundled into the public JS (`.env.example` already warns). A server proxy is the real fix; until then, the key must be low-limit and rotated. The earlier roadmap reminder to revoke the previously committed key still stands.
- Not tested: the future-climate prediction path, which turns a note into a projected anomaly. It needs the same "illustrative, not a forecast" labelling check as the rest of the app.

### Medium

**M1. Invalid CSV upload fails silently** (`src/tracks/VitalSigns.tsx:220`). A file with non-numeric columns, or random bytes, calls `setOwn(null)` and shows nothing, and it also **discards the previously loaded valid file**. Reproduced with `good.csv` then `bad.csv` then `junk.csv`. These strings are also inline `lang === 'bn' ?` ternaries instead of `strings.ts` (CLAUDE.md rule).

**M2. "Listen to a data story" opens the wrong thing.** The landing link (`ctaStory`, `strings.ts:290`) goes to the **EIC Frame player**, but the Data Jukebox has a section literally called "Data stories (17)". The label promises one product and delivers another.

**M3. Layer mapping line is cut mid-word.** On the Atlas layer cards the line that explains what each sound means renders as "fire power, M…", "daily rain, m…", "SST anomaly…" (`LayersPanel.tsx:47`, `truncate`; 88 px visible of 147 px, no tooltip or `title`).

**M4. Disabled Mute/Solo buttons with no reason.** Rain and Ocean heat Mute/Solo are `disabled` (their layers are off) and the tooltip only repeats "Mute Rain". The Solo buttons expose no `aria-pressed`, so their state isn't announced. Not verified: how a user turns those layers on from the card.

**M5. Text under 12 px, against the Phase 8 gate.** Landing: 10.8 px (×8, e.g. the Space Apps credit, hero stat captions) and 11.7 px (×11, "Chapter 1 of 4"). The **"Snapshot" provenance chip is 11.2 px on every view**, which is the label the project treats as most important. SVG axis labels in Monsoon and Vital Signs are 10 px.

**M6. Touch targets don't meet the documented 44 px.** On a 375 px touch emulation the header controls are 26–36 px (logo 26×26, language 55×36), and 3–17 controls per view are under 44 px. Under the WCAG 2.2 AA floor of 24 px: the four landing carousel dots (12×12, about 19 px apart) and the "See it on earth.gov" link (19 px).

**M7. Weight and docs drift.**
- Every view downloads **at least 1 MB of JS** (landing 1.47 MB, About 1.05 MB). Monsoon and About also fetch `firms_snapshot.json`, `precip_snapshot.json` and `countries-110m` that they never use.
- The landing creates **2 WebGL contexts** (`WorldScene`), while `roadmap-v3.md` Phase 9 says its gate is "no WebGL context on the landing page". Either the gate or the code is out of date.
- `countries-50m` (757 kB) is still built and unused (already noted in the roadmap).

### Low

- "**1 countries found**": `strings.ts:451` has no singular form.
- A few dataset descriptions stay English in বাংলা (SST layer text on the Atlas, "Global surface temperature anomaly" and the NASA GISS source line in the Jukebox).
- Right rail label **"LIVE OUTPUT"** means the synth, but reads like live data next to snapshot values. "Sound playing" would avoid the ambiguity.
- Quest hub: the fourth card's Deploy button sits about 19 px lower than the other three.
- Harmonium: white-key note names are partly hidden behind the black keys; its header `aria-label` and copy aren't in `strings.ts`.
- Atlas: the profile panel is hard-clipped at the bottom of the left column with no scroll cue; in Map view the left column runs under the timeline.
- Landing headline: word gap measures 0.19 em at −0.025 em tracking. Readable, but tight.
- Emoji in button labels ("🎯 Sylhet Only", "🌐 All 8 Divisions") are announced by screen readers.
- To confirm: the footer and About "Source code on GitHub" link points to `morsad01/SONIC-EARTH-ATLAS`; this checkout's remote is `sample77-ctrl/sonic-earth-atlas`.

---

## Not covered

Real audio output (only state, readouts and the audio context were checked), screen readers, real touch gestures and globe drag or pinch, frame rate (SwiftShader makes numbers meaningless), Frames "before/after", story mode and own-image upload, the full Tour walkthrough, Quest gameplay beyond opening each mode, Harmonium AI with a real key, high-contrast and reduced-motion visuals (toggles were confirmed to apply `hc` / `rm`, but not inspected view by view), the deployed site, and live NASA fetches.

## Suggested order

1. H1 + H2 (one view, one file each; the accessibility mode should be the most reliable one).
2. H3 (wire the three overlays to `useDialog`; the pattern and tests exist).
3. H4 (remove the hard-coded badge, make the fallback honest and language-aware, decide on a proxy).
4. M1, M2, M3, M4 (small, local copy and behaviour fixes).
5. M5, M6, M7 (a design-token pass and a lazy-loading pass).
