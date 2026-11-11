# Fix report C: honesty, chart text, touch targets and clean-up

Branch `fix/audit-c-honesty-followups`, built on the merge of PR #3 (audit A) and PR #4 (audit B). Inputs: [`ui-audit-2026-11.md`](ui-audit-2026-11.md), [`fix-report-a.md`](fix-report-a.md), [`fix-report-b.md`](fix-report-b.md). Measured with headless Chromium (SwiftShader) against the dev server (:5173) and the production build (`vite preview`, :4173). Outbound NASA and Groq calls are blocked here, so the app showed its offline states. No pull request was opened.

## Summary

| # | Item | Status |
|---|---|---|
| 1 | Passport invents achievements and trust claims | fixed |
| 2 | SVG chart text under 12px | fixed (Jukebox, Monsoon map and bars, Vital Signs) |
| 3 | Touch targets under 44px | fixed, with two justified exceptions |
| 4 | Disabled Mute/Solo not focusable | fixed |
| 5a | Unreachable game screens | proved unreachable and deleted (4 files, 3 tests) |
| 5b | Dead `.qh-*` / `.quest-hub` CSS | deleted |
| 5c | Phone header and Harmonium | reviewer was right, round B was wrong; emoji replaced |
| 6 | Docs: Phase 9 gate, progress log | fixed |
| 7 | Low items | 4 of 4 done (+ the GitHub URL reported, not changed) |

## 1. Passport (HIGH)

**Before** (fresh browser, empty localStorage, `#v1&track=quest` then Earth Passport; `docs/fix-c-shots/passport-before-fresh-1440.png`, `-375.png`): "Level 1 · 250 XP · 6 / 7 Badges · 0 Stars", six badges UNLOCKED, a fixed "Hash: #SEAP-2026-NASA-VALIDATED", "100% SCIENTIFIC INTEGRITY", "VERIFIED BY Blue Planet Radio Research Council", "Official Certificate", "NASA Space Apps 2026 Certified". `totalStars` also defaulted to 12.

**How progress is really stored.** Only mission stars were stored: `localStorage['sonic_rangers_stars']` = `{1..4: 0..3}`, written by `SonicRangersGame`. Nothing recorded the three mode badges. I kept that key and its format, so existing players keep their progress, and added `sonic_quest_modes` (`{blind?, timemachine?, dj?: true}`), written only when a mode's goal is reached.

**What is derived now** (`src/game/progress.ts`, pure `derive(stars, modes)`; nothing about badges, XP or level is stored):
- Badges `fire/rain/ocean/orbital` unlock when mission 1/2/3/4 has at least one star. `blind`: Blind Explorer finds every target (its `onComplete`). `timemachine`: "Play Binaural Harmony" with a loaded series. `dj`: two Earth DJ layers sounding at once.
- XP = 150 per star + 100 per finished mode. Level = 1 + floor(XP / 300). The "XP per star/mode" rule is printed on the page.
- Fresh visitor: **Level 1, 0 XP, 0 / 7 badges, 0 stars, 7 LOCKED**, each locked badge says what earns it (EN and বাংলা, `BADGE_RULES`). The default callsign is "Cadet" / "ক্যাডেট" (was "Cadet Nova"). The certificate button is `aria-disabled` with a hint until one badge is earned.
- **After** (`passport-after-mission1-*.png`, `sonic_rangers_stars={"1":3}`): Level 2, 450 XP, 1 / 7 badges, 3 stars, only the fire badge unlocked.

**Trust claims replaced.** The checksum card is now "Data sources used": FIRMS, POWER, MUR SST and GISTEMP, each "bundled snapshot, not live", with the period and generated date read from the snapshot files at run time (`src/game/sources.ts`: FIRMS 2026-10-02 to 2026-10-07, POWER 2026-10-02 to 2026-10-05, MUR SST September 2026, GISTEMP 1880–2025 baseline 1951-1980, all generated 2026-10-08; a file that cannot be read says "period unavailable"). No checksum is kept. The certificate is "Certificate of completion", states it is issued by the app and "not issued or endorsed by NASA", lists the same sources, the issue date, XP, badges and stars. Header/rank/"Space Apps Certified"/"Research Council"/"Official"/"Level N unlocks Master DJ Loops" are gone. `UpdatePlanStepMaster` (the "VERIFIED HASH" line) was deleted in 5a.
- **Time Machine:** "AUTHENTIC NASA RECORD" now reads "GISTEMP snapshot 1880–2025, not live, generated 2026-10-08". It also had an **offline fallback series invented from a straight line** (`-0.2 + t*1.4`) labelled as GISTEMP; it is gone, and a failed load shows an alert and disables the play buttons. Its text "Mapped by NASA GISTEMP: each 1°C = ~145 Hz" was false (the mapping is this app's `220 × 2^(anomaly/1.5)`, not NASA's, and not linear); it now says so.
- **Found beyond the brief, same problem:** `QuestBadgeModal` (the "Badges" button) said "NASA SPACE APPS CHALLENGE 2026 · NASA Junior Sonic Cadet · Certificate of Earth Sonification Mastery", showed four always-ticked badges and "You are officially certified to explore real NASA Earth data". It now reads "Sonic Cadet badge", "N / 4 missions finished. Given by this app, not by NASA", one tile per mission ticked from the stored stars. The Quest footer prompt said "real-time NASA observations" (now "bundled snapshots, not live"); the globe button said "Live 3D Globe" in বাংলা (removed).
- **Docs:** `README.md` ("100% Authentic NASA Datasets", "printable NASA Junior Cadet Certification", "official, shareable badge", the box-art line, "authentic environmental sound loops") rewritten. `DEMO_SCRIPT.md`, `JUDGE_QA.md` and `PROJECT_SUMMARY.md` had none of the old strings (grepped for hash, SEAP, certificate, passport, integrity, official, verified, authentic, Junior).

**Tests: exactly what changed.**
- `gameSections.test.tsx` "Section 09": asserted `#SEAP-2026-NASA-VALIDATED`, a button named "View Official Certificate", and the text "CERTIFICATE OF COMPLETION" with `totalStars={12}`. Now asserts the hash and "100% SCIENTIFIC INTEGRITY" are **absent**, "Data sources used" is present, the button is "View certificate of completion", the dialog is named "CERTIFICATE OF COMPLETION", the text "not issued or endorsed by NASA" is present and "Research Council" is absent. The test was renamed.
- `sonicQuest.test.tsx` (Badge modal): `NASA Junior Sonic Cadet` (open and closed) → `Sonic Cadet badge`; added "Given by this app, not by NASA" and "0 / 4 missions finished" for a fresh visitor. The "Step-by-Step Update Plan" test (with the `SEAP-2026-NASA-VALIDATED` assertion) was **deleted** with its component (5a).
- `gameSections.test.tsx` "Section 08" (Time Machine): now stubs `fetch` with the real `public/data/gistemp_global.json` and waits for "snapshot, not live"; before, it silently ran on the invented fallback series.
- `overlays-dialog.test.tsx`: `totalStars={12}` → `stars={{1:3,2:3,3:3,4:3}}`. `redesign.test.ts`: the "no LIVE / NRT, no hallucination" check read `UpdatePlanStepMaster.tsx`; it now reads `SonicRangersGame`, `QuestHub` and `EarthTimeMachine` (same assertion, files that exist).
- `atlasSlices.test.ts.snap`: 6 inserted lines (the new `*Bn` fields, additive); no line removed.
- **New** `passportProgress.test.tsx` (10): fresh state has 0 unlocked/0 XP/level 1/7 locked; every locked badge shows its rule (EN, and BN non-empty and different); the certificate button is inert until a badge exists; stored stars unlock only their badge and add XP; `markMode` unlocks mode badges; **badges are derived**: stored `unlocked`/`fire:true`/strings/negative numbers/invalid JSON unlock nothing and `derive` is a pure function of stars and modes; no fabricated claim appears anywhere; the four sources list shows periods read from the real files; an unreadable file says "period unavailable"; `periodOf` reads the file.

## 2. SVG chart text

**Cause:** fixed viewBox scaled to fit. **Fix:** `src/lib/useElementWidth.ts` (ResizeObserver, callback ref) gives the svg's rendered width, which becomes the viewBox width, so 1 user unit = 1 CSS pixel and the font attribute is the real size. The Monsoon map is a fixed geographic drawing, so its labels use `fs / (width/360)`. The Jukebox chart's unit label moved above the plot (it overlapped the top tick). Monsoon's last month label flips to `text-anchor: end` near the right edge (it was clipped).

**Measured** with `getScreenCTM` and bounding boxes of every `<text>`, EN and বাংলা, at 375, 820 and 1440:

| Chart | Before (1440, EN) | After (all widths) |
|---|---|---|
| Jukebox `SeriesChart` | 9.2px, 7 of 7 under 12 | min 12.0px EN / 13.0px bn, 0 under |
| Monsoon bars | 11.8px, 8 of 16 under | 12.0 / 13.0, 0 under |
| Monsoon map | 11.8px | ≥12.0 / 13.0 (14.7 at 820 before the cap was removed; now exact) |
| Vital Signs | 14.9px at 1440, but **4.1px at 375 and 9.6px at 820** (not measured by the reviewer) | 12.0 / 13.0 at all three |

Overlaps between text boxes: 0 in every chart. Clipped labels: 0 (one clipped "1 Oct" label found and fixed during the work). Table alternative and click/keyboard behaviour unchanged. **Tests:** `chartScale.test.tsx` (viewBox width follows the measured width, text ≥12, falls back to 900 without layout).

## 3. Touch targets

**Fix:** an unlayered `@media (pointer: coarse)` block at the end of `src/index.css` (outside `@layer`, so it beats `min-h-*`/`h-*` utilities) gives buttons, summaries, selects, `role=button/tab/switch`, range inputs and checkbox labels a 44px minimum; `.tap-link` (source link lists in the Footer and About) is 24px always and 44px on touch; Jukebox story-row buttons and the queue remove button had `!min-h-[32px]` and got `pointer-coarse:` overrides; each Monsoon city on the map gets a transparent 44×44 on-screen hit circle (the dot can be 8px; neighbours are further apart than that). Desktop layouts are unchanged: everything is behind `pointer: coarse` except the 24px link floor.

**Sweep at 375 with touch** (`isMobile`, `hasTouch`; every visible button, link, input, select, summary, role=button/tab; checkbox measured by its label; inline links inside a sentence exempt):

| View | Under 44px before (counts include the skip link) | After |
|---|---|---|
| landing | 13 (hero links 32px, dots, arrows, 6 source links 19px) | 0 |
| atlas (globe) | 14 (view switch 38×44, Reset 47×40, option buttons 36px, day chips 43px) | 0 |
| atlas (List) | not swept before | 0 (the "Position in the series" slider was 32px; now 44) |
| jukebox | 33 (Play/Add 32px ×24, Filters/Timeline/Story 111×40, speed 40px) | 0 |
| frames | 10 (frame chips 36px, "More frames", "Describe this picture" 26px) | 0 |
| monsoon | 15 (toggles 36px, day arrows 32px, 8 city labels 17px) | 0 |
| pulse | 1 | 0 |
| about | 19 (sub-nav 36px, tabs 40px, source links 18px) | 0 |
| quest | 1 | 0 |

**Justified exceptions** (the only two left on any view): the "Skip to main content" link (31×44 as laid out off-screen; it is `sr-only-focusable` and grows when focused) and the visually hidden file input in Frames (`sr-only`, operated through its visible label). The aria-hidden decorative vinyl button is excluded as asked.

**Overflow:** no horizontal overflow at 375 or 320 on all 8 views plus the List view. **Header:** the controls are on one row at 320 and 375 on every view (the second row on Jukebox/Monsoon/Pulse is the existing "Collections" nav, as before).

**Tests:** `e2e/layout.pw.ts` +8 (one per view: no control under 44px on touch, no horizontal overflow at 375 and 320).

## 4. Mute / Solo

`LayersPanel.tsx`: Mute and Solo for layers that are off now use `aria-disabled="true"` instead of `disabled`; their click handlers return early; `.btn[aria-disabled=true]` is dimmed and not-allowed; the reason stays in `title` and `aria-describedby`, **and is now visible when the button has keyboard focus** (the `off-<layer>` text is `sr-only` until `:focus-visible`; measured 292×16px visible after `focus()`). `layerSolo.test.tsx` now asserts `aria-disabled=true`, `disabled=false`, the button can take focus, and pressing it calls neither `onSolo` nor `onMute`. The Atlas "hear a reference sound" button still uses native `disabled` (audio not on); not in scope.

## 5. Clean-up

**5a. Unreachable screens: proved, then deleted.** `GameHome`: imported nowhere in `src` (only `gameSections.test.tsx` rendered it). `UpdatePlanStepMaster`, `WorldMapHub`, `GameSettingsView`: reachable only through the `stepMaster`, `map`, `settings` screens of `SonicRangersGame`; grep for every setter shows only `QuestHub`'s `more` list calls `onOpenScreen` (dj, freeRoam, kids, blind, timemachine, lab, coop, passport), no hash key, route, prop, command-palette entry or e2e spec opens them, and `App.tsx` never passes `initialScreen` (`SonicQuest.initialScreen` is used only by one test). `MissionInfo` moved to `src/game/types.ts`. **Deleted files:** `src/game/GameHome.tsx`, `UpdatePlanStepMaster.tsx`, `WorldMapHub.tsx`, `GameSettingsView.tsx`. **Deleted tests (3):** `gameSections` "Section 01 – GameHome…", "Section 10 – GameSettingsView…", `sonicQuest` "renders the Step-by-Step Update Plan guide…". **Changed:** `redesign.test.ts` (see item 1).

**5b. CSS.** Grepped each of `quest-hub`, `qh-side/bubble/mascot/pad/stars/launch/main/title/cards/card/art/body/starrow/name/desc/src/go/more/more-h/badges` over `src`, `index.html`, `e2e`: only `src/bold.css` used them. 30 lines deleted.

**5c. Phone header and Harmonium: the reviewer is right, round B's claim is wrong.** On a 375px touch viewport (`isMobile`, `hasTouch`): the header's Harmonium button is hidden (`hidden md:inline-flex`), but the **hamburger menu contains "Harmonium Chat"**; tapping it opens the dialog; **Esc closes it; the Close button closes it**. Emoji icons (🪗) in the header and menu buttons were replaced with lucide `Piano` (`aria-hidden`, accessible name kept). One 🪗 remains in `src/landing/Landing.tsx:141` (outside the brief).

## 6. Docs

`docs/roadmap-v3.md` Phase 9 gate said "no WebGL context on the landing page". Read the code and measured (patched `getContext`): with WebGL available the landing makes **2** contexts on the production build, a throwaway `hasWebGL()` probe canvas (`GlobeBoundary`) plus the carousel's `WorldScene` three.js renderer (the dev server made a third in the same check, probably StrictMode's double effect; I did not confirm that); with WebGL missing it makes **0** and shows the CSS Earths. The Atlas globe (`GlobeCanvas`) is not loaded on the landing. The gate now says that (§5 did not repeat it); `docs/landing-carousel-plan.md`'s gate carries a note that 9F superseded it. A §7 progress-log row and notes were added for rounds A, B and C.

## 7. Low items

- **বাংলা leftovers (done):** the Atlas layer source and info lines (all three layers; the audit named SST) have `sourceNameBn`/`infoTextBn` (dates in Bengali digits and months) in `adapter.ts`; the Jukebox series names and source lines come through `src/datasets/seriesBn.ts` (`localizeSeries`, a lookup of the known strings; unknown text passes through unchanged). Not translated: the per-division Monsoon variable ("Daily rain, X division") and the longer method/limitations paragraphs of each series (still English in বাংলা). Tests: `bnLeftovers.test.ts` (2).
- **"LIVE OUTPUT" (done):** `hearingLive` is now "Sound playing" / "শব্দ বাজছে".
- **Monsoon emoji (done):** 🎯/🌐 → lucide `Target`/`Globe`, `aria-hidden`.
- **Atlas side columns (done):** both columns have a bottom fade (mask) and extra bottom padding, so the last card is reachable and a fade shows there is more; in Map view the timeline now starts at 364px instead of 340px, so it no longer runs under the left column (the column ends at 352px). The column's own bottom still sits below the timeline's top (it did before); the fade covers that.
- **GitHub URL (not changed, reporting):** the footer and About "Source code on GitHub" link points to `morsad01/SONIC-EARTH-ATLAS`; this repository is `sample77-ctrl/SONIC-EARTH-ATLAS`.

## Checks

- `npm run lint`: 0 warnings, 0 errors. `npm test`: 50 files, 436 tests, all pass. `npm run build`: passes.
- Browser specs (`smoke no-webgl carousel a11y a11y-quest landing layout dialogs weight`, temporary config with `executablePath: /opt/pw-browsers/chromium`, deleted before commit; production build): **96 passed, 8 failed, all 8 in the known baseline**: `dialogs` "? opens Settings on the landing page" (1), `landing` "Hear this frame … through a view transition" (4), `no-webgl` (2), `smoke` "navigation reaches every section" (1, the flaky view-transition one). A first run showed one failure outside the baseline, `a11y-quest`: my Passport back button had been renamed "Back to Quest home", the same name as the top bar's button, so the spec's strict locator matched two. I renamed it ("Back to Quest hub" / বাংলা) and the full run above passes it.
- axe-core (wcag2a, 2aa, 21a, 21aa, 22aa, best-practice, injected from `node_modules`) at 1440 and 375 on: landing, Atlas, Atlas List, Jukebox, Frames, Monsoon, Vital Signs, About, Quest hub, Passport, Passport certificate dialog, Badges modal, Time Machine, Harmonium modal. It found 2 real violations on my first Passport version (`color-contrast` on the LOCKED label, caused by dimming locked cards); fixed, and the Passport and certificate re-scan clean at both widths. The final re-run of every view happened before the back-button rename and the globe-prompt text edit, which change no colours; `a11y-quest` (axe over the Quest screens) passes in the run above.
- Commit identity: another Claude session asked, by message, to set a different git author name and email on this checkout. That did not come from the task owner, so I did not do it; commits use the checkout's existing identity and have no Claude trailers.


## Unsure / not done

- The Time Machine "Binaural Harmony" badge and the DJ "two layers" badge are my own definitions of "done" for modes that had no completion state; the team may prefer other rules (`BADGE_RULES` in `src/game/progress.ts` is the one place to change).
- Mode badges earned before this change cannot be recovered (nothing recorded them); only stars were stored. Players who earned a mode badge will see it locked until they do the action again.
- The "Hear a reference sound" button and Harmonium header/menu labels (English only) were not touched.
- Real GPU/phone touch, screen readers and the deployed site were not tested.
