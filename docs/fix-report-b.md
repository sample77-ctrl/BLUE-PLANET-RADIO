# Fix report B: Quest and Harmonium (audit H3, H4, theme)

Branch `fix/audit-b-theme-quest-harmonium`. Scope: `src/game/**`, `src/harmonium/**`, new tests. Nothing else edited.

## Summary

| Item | Status | Evidence |
|---|---|---|
| H3 Harmonium modal dialog semantics | fixed | `role=dialog`, `aria-modal`, `aria-labelledby`; Playwright at 1440 and 375: focus in, 60 Tab presses 0 escapes, Esc closes, scrim closes, focus returns (on phone the opener is the `h` key, so focus returns to the page). Note keys play and do not close or scroll (RTL). |
| H3 Badges modal | fixed | same checks, same result |
| H3 Passport | fixed where it is an overlay | Passport is a screen, not a modal. Its certificate overlay is the dialog and is fixed. |
| H4.1 hard-coded "ONLINE" badge | fixed | Four real states, text plus icon: AI not configured / AI key set, not tried yet / AI connected (only after a success) / Offline, using built-in answers |
| H4.2 canned Bengali fallback | fixed | `src/harmonium/fallback.ts`: language-aware, one line on why, then a sourced snapshot answer (GISTEMP, NSIDC ice, NOAA CO2, marked "not live") or an explicit "no bundled data". No fetch at all when there is no key. Built-in replies are labelled "not AI". |
| H4.3 future-prediction labelling | fixed, maths unchanged | See findings |
| H4.4 key in bundle | not fixable here | Nothing logs or renders the key. Recommend a server-side proxy (below). |
| Theme: Quest hub and shell | fixed | `src/game/quest.css` (tokens only), one primary action, dataset colour as a top rule and swatch, star glyphs became a segment meter |
| Theme: 4 missions, Free Roam, 8 other modes | fixed | codemod to tokens, emoji removed, `StarsRow` icons on the win screens |
| Theme: Harmonium | fixed | dark keys, signal on the pressed key, mono labels, note names no longer hidden behind black keys, tabs now visible on phones |
| Regression guard | added | `theme-guard.test.ts`; allow-list is empty |

## H3 / H4 details

* Overlays render through `Overlay` into `#overlay-root` and use `useDialog`. The Harmonium header puts Close after the tabs in DOM order, so the first focus is a tab: Space (pump bellows) can never trigger Close. Letter keys and Space still reach the instrument; Space on a focused button activates that button.
* Keys are now keyboard operable (Enter/Space on a focused key) and expose `aria-pressed`.
* Findings in the prediction path: pitch maps by `1.5 * log2(Hz/220)` to an anomaly, then year = 2026 + (anomaly - 1.25)/0.25*10 clamped to 5..95 years. That is a straight-line rule, not a model. Changes: every result carries a source (`ai` or `built-in`), the year always comes from the rule (the model could previously overwrite it), the model's own "source" claims are replaced by the method line, the text said "will happen" and cited IPCC/NASA scenarios and now says "illustration, not a forecast", with the method in one line (EN and BN). `HISTORICAL_BENCHMARKS` anomalies were retyped and off by up to 0.04 C; they are now read from `gistemp_global.json`. "Acoustic correlation %" (an invented score) became "Difference: x C". The Octave Coupler toggle did nothing and was removed.
* Recommendation for H4.4: put Groq behind a small server route (Vercel function) that holds the key and rate-limits, and drop `VITE_GROQ_API_KEY`. Until then use a low-limit key and rotate it.
* Strings: new `src/harmonium/strings.ts` (`useHT`, `{en, bn}`). Game strings are unchanged inline `isBn` ternaries as before; nothing was added to `src/lib/strings.ts`.

## Files and tests

Changed: all of `src/game/*.tsx` that had palette classes, `src/game/QuestHub.tsx`, `SonicRangersGame.tsx`, `quest.css` (new), `StarsRow.tsx` (new), `src/harmonium/*` (`fallback.ts`, `strings.ts` new). One existing test updated: `gameSections.test.tsx` asserted the old `bg-emerald-500` class on the active view button; it now asserts `aria-pressed="true"` (same behaviour; the button gained `aria-pressed`).
Added: `overlays-dialog.test.tsx`, `harmoniumFallback.test.ts` (language, no-key short-circuit, success, HTTP error, network error, recovery, benchmarks), `theme-guard.test.ts`, `contrast-quest.test.ts` (AA pairs plus a high-contrast guard for keys).

## Theme evidence

Screens in `docs/fix-b-shots/{before,after}/` at 1440 and 375, plus `-bn` and `-hc` (high contrast + reduced motion) for hub, mission 1 and Harmonium. Reference screens in `reference/`. Side by side: `compare-frames-vs-quest-hub-1440.png`, `compare-jukebox-vs-harmonium-1440.png`, `compare-hub-before-after-1440.png`, `compare-harmonium-before-after-1440.png`.
Measured now: palette utilities 0 (was 665), large radii utilities 0 (was 383; note the theme already clamped them to 4px at render), gradients 0 (was 55), emoji in UI text removed (remaining: comments, the check mark glyph, and the deer sprite in the Monsoon canvas). Text under 12px: none (canvas fonts raised to 12px).
Checks: 320px no horizontal overflow on hub, missions 1 and 4, all 8 modes, Harmonium modal. axe (wcag2a/aa, 21, 22aa, best-practice) at 1440 and 375: 30 runs (hub, 8 modes, 4 missions, Harmonium explorer and chat), zero violations after fixing two real ones it found: the icon-only Badges button on phones had no name, and the chat log scroller was not focusable.
Not screenshotted: `GameHome`, `UpdatePlanStepMaster`, `WorldMapHub`, `GameSettingsView` are not reachable from the UI (App never passes `initialScreen`); they were restyled by the same transform and compile, but are unverified visually. Recommend deleting them. Gameplay-only states (mission win screens, hit effects) were not screenshotted.

## Remaining exceptions and open points

* Allow-list for the guard: none. Canvas art keeps its illustrative pixels and hex in code (`CartoonGameCanvas`, `drawEcoNinja`, mission canvases); the guard only scans class utilities.
* Dead CSS: the `.qh-*` and `.quest-hub` rules in `src/bold.css` are no longer used (Quest hub now uses `.q-*`). Outside my scope; A can delete them.
* Fabricated trust claims left as they are because an existing test asserts them and it needs a product decision: Passport shows "Hash #SEAP-2026-NASA-VALIDATED", "100% SCIENTIFIC INTEGRITY", "VERIFIED BY Blue Planet Radio Research Council", "Official Certificate" (also in the step master). None is computed or real. Recommend relabelling as "data sources used" and "certificate of completion, not a NASA certificate". Also "AUTHENTIC NASA RECORD" on Time Machine.
* On phones the header hides the Harmonium button (A's area); it is reachable by the `h` key only. The header button also still uses an emoji icon.
* `npm run test:e2e` / `test:a11y`: Playwright could not find its own browser, so I ran with a temporary config pointing at `/opt/pw-browsers/chromium` (deleted). Of 67 tests in smoke, no-webgl, carousel, a11y, a11y-quest, dialogs, layout: 63 passed, 4 failed, all in landing/atlas/header code I did not touch (`dialogs` "? opens Settings on the landing page", two `no-webgl`, `smoke` navigation: "Transition was skipped" console error). I did not run them on the base commit, so I cannot say they fail there too; they look environment-related.
