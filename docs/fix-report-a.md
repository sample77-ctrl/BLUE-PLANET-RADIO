# Fix report A: views and accessibility

Branch `fix/audit-a-views-a11y`, from `docs/ui-audit-2026-11.md`. Measured with headless Chromium (SwiftShader) against the dev server (:5173) and the production build (`vite preview`, :4173). Outbound NASA calls are blocked here, so the app showed its offline states. I did not touch `src/game/**`, `src/harmonium/**` or `docs/roadmap-v3.md`.

| Item | Status | Before → after |
|---|---|---|
| H1 List view under the rail | fixed | 9–10 controls under the rail at 1024/1280/1440 → 0 at 1024/1280/1440/1920, both rail states |
| H2 nested interactive | fixed | axe `nested-interactive` ×80 at 1440 and 375 → 0 violations at both |
| M1 silent CSV failure | fixed | invalid file wiped the data and said nothing → data kept, named `role="alert"` |
| M2 wrong destination | fixed | opened the Frame player → opens the Data Jukebox on `story=gistemp`, 0 AudioContexts created |
| M3 truncated mapping line | fixed | "fire power, M…" (clipped, 1 line) → full line, wraps to 2 lines (3 in বাংলা) |
| M4 disabled Mute/Solo | fixed | title repeated "Mute Rain" → reason in title and `aria-describedby`; Solo has `aria-pressed` |
| M5 text under 12/13px | fixed for HTML; partly for SVG (see below) | landing 10.8/11.7px, chip 11.2px, np bar 12.0–12.8px (bn) → none under 12px (EN) / 13px (bn) on all 7 views at 1440 and 375 |
| M6 touch targets | fixed | logo 26×26, language 55×36, dots 12×12, link 19px → 44×44, 55×44, 44×44 (24×24 on mouse), 44px |
| M7 weight | fixed (data loads); docs note below | see the table |
| Low: "1 countries found" | fixed | → "1 country found" (EN + বাংলা) |

## H1. Right rail covers the List view
- **Cause:** `App.tsx` padded the List container for the left rail only, and the banner (`md:flex-row`, no wrap) overflowed into the rail at 1024.
- **Fix:** padding for each rail only while it is open (`lg:pl-[372px]` / `lg:pr-[372px]`, which also clears the 340px rail plus the toggle button), and the banner and its buttons now wrap.
- **Check** (`getBoundingClientRect` of every button/input/link in the List region against both rails, visible ones only): before 9 / 9 / 10 / 0 at 1024 / 1440 / 1280 / 1920, after 0 at all four widths, rails open and both collapsed. At 1024 with both rails open the list is about 280px wide; it is usable but narrow.
- **Files:** `src/App.tsx`, `src/accessibility/AudioFirstMode.tsx`. **Test:** `e2e/a11y.pw.ts` (new List test at 1024, 1440 and 375: axe plus nothing under the rails).

## H2. Nested interactive rows
- **Fix:** the row is now `role="group"` with the same accessible name, and it is not focusable. The play button (`Play audio for X`) is the single focusable control. Clicking the row still plays it. Enter/Space on the button fires a native click, which bubbles to the row handler once. The old `onKeyDown` is gone. I did not add `aria-pressed` to the button (a play action is not a toggle).
- **Check:** axe-core injected from `node_modules`, List view: 1440 `nested-interactive ×80` → zero violations; 375 the same.
- **Files:** `src/accessibility/AudioFirstMode.tsx`. **Tests:** `src/__tests__/audioFirstRows.test.tsx` (2), the e2e test above.

## M1. CSV upload
- **Fix:** `parseCsv` moved to `src/tracks/csv.ts` and returns `{ points, error? }` with `columns` (no line has two numbers), `rows` (fewer than 2 usable rows, including empty) or `unreadable` (NUL or U+FFFD, or `file.text()` throws). A bad file keeps the old data and shows a `role="alert"` naming the file and the reason, mentions the file still loaded, and has a "Choose another file" button. The next good load clears it. The input value is reset so choosing the same file again still fires. All copy is in `strings.ts` (EN + বাংলা), including the "N rows" line.
- **Tests:** `src/__tests__/parseCsv.test.ts` (good, non-numeric, single column, empty/blank, one row, binary ×2) and `src/__tests__/vitalCsvUpload.test.tsx` (good → bad keeps data and alerts → good clears; one-row reason).

## M2. "Listen to a data story"
- **Fix:** Landing `onListen` now calls `openJukebox()` (the first story, `gistemp`), no autoplay. The hero CTA "Hear an EIC frame" and the header "Listen now" still use `listenNow` and are unchanged.
- **Check:** from `/`, the link lands on `#jukebox?story=gistemp&t=2025`, "Data Jukebox" is the active section, and an `AudioContext` constructor hook counted 0 contexts.
- **Docs:** `DEMO_SCRIPT.md`, `README.md`, `JUDGE_QA.md`, `PROJECT_SUMMARY.md` and the existing e2e specs had no reference to this link's old behaviour, so nothing needed changing. `docs/roadmap-v3.md:149` already calls it "Listen to a data story"; I left it alone.
- **Test:** `e2e/landing.pw.ts` (new test).

## M3. Mapping line
- **Fix:** `truncate` → normal wrapping with `leading-snug`. The card grows by one line (EN cards 118/137/153px → 135/155/171px, +17px; বাংলা up to +34px, 3 lines for the fire and SST lines). Nothing is clipped at the 340px rail (card width 314px).

## M4. Mute / Solo
- **How a layer is turned on:** the checkbox inside the card's label (click the layer's icon or name) or keys 1/2/3. Rain and Ocean heat start **off** (`enabled = { fire: true, precipitation: false, sst: false }`), so the buttons start disabled. They are disabled only by `!on` (a layer being unavailable disables the checkbox, not these).
- **Fix:** the disabled buttons get a title and an `aria-describedby` text: "Rain is off. Switch it on from its card first." (বাংলা too). `aria-pressed` on Solo is true when this layer is on and unmuted and every other layer that is on is muted (the state in which pressing Solo again clears the mutes).
- **Not done:** I kept native `disabled`, so those buttons are not keyboard-focusable and the reason is reachable only by browsing/hover. Using `aria-disabled` would fix that but changes the existing test and styling; I left it as a follow-up.
- **Test:** `src/__tests__/layerSolo.test.tsx` (new case).

## M5. Small text
- **Root causes:** `html.landing-open { font-size: 90% }` shrank every rem token on the landing (12px → 10.8, 13px → 11.7); `.np-badge` (.7rem, the "Snapshot" chip), `.np-sub` (.75rem) and `.np-read` (.8rem) were hard-coded; SVG text used 10/11 user units.
- **Fix:** on the landing the small tokens are rescaled so they still land on 12px/13px (and 13px for বাংলা `--fs-2xs`/`--fs-sm`); the np bar uses `--fs-2xs`/`--fs-xs`; SVG axis text in `BangladeshMonsoon`, `VitalSigns` and `SeriesChart` is 12 (EN) / 13 (bn) user units.
- **Check** (script walking all visible text nodes, EN and bn, landing/atlas/jukebox/frames/monsoon/pulse/about; font-size attributes for SVG): before 55 element groups under the floor across EN and bn; after none at 1440 and none at 375.
- **Caveat (partly):** a scaled SVG renders smaller than its attribute. With the scale applied, Monsoon labels render at about 11.8px and Jukebox chart labels at about 9.2px (EN) / 9.9px (bn) at 1440, because the charts are drawn in a viewBox and shrunk to fit. I judged the attribute as the task said. Fixing the rendered size means resizing the chart text with the viewBox scale, which risks overlapping labels; I did not do it.

## M6. Touch targets (375px, touch emulation)
- **Fix** with `pointer-coarse:` and `@media (pointer: coarse)`: logo, language and the playing chip ≥ 44px; `.nav-link` `min-height: 44px` (Jukebox collections row, header nav); `.world-dot` is now a 24×24 hit area (44×44 on coarse) with the 12px visual dot drawn by `::before`, and the 8px gap between dots is gone; the "See it on earth.gov" link is `min-h-[24px]` (44px on coarse, 119×44 measured).
- **Check:** header buttons on one row at 320 and 375, EN and বাংলা, landing/jukebox/atlas; no horizontal overflow on any of the seven views at 320 and 375. The language button is 51×44 at 320 / 55×44 at 375 (বাংলা label 44×44).
- **Not done:** the audit's other "3–17 controls per view under 44px" (Atlas option buttons, Jukebox filter tabs, About sub-nav, Monsoon toggles, the landing hero links at 32px) are outside the items named in M6, so I left them. The remaining under-44px count per view at 375 is 2–29, with every header control now ≥44.
- **Tests:** `e2e/layout.pw.ts` (2 new at 375 with touch).

## M7. Weight
- **Fix:** `App.tsx` loads the three NASA snapshots only once the landing, Atlas or Jukebox has been shown (Jukebox country profiles use them), and the 110m country borders only once the Atlas, Jukebox or the command palette has been shown. Both latch, so leaving a view does not reload or drop anything. No output change; the adapter and snapshot tests are untouched and green.
- **Transferred bytes** (production build, first load, 1440px, response bodies as sent by `vite preview`, including fonts/images; "JS" = `.js` only):

| View | Total before → after | JS before → after | Requests before → after | Unused data fetched before → after |
|---|---|---|---|---|
| landing | 1624k → 1104k | 316k → 313k | 34 → 25 | precip 3k + firms 12k (precip twice) → firms + precip (used) |
| atlas | 2301k → 2301k | 369k → 369k | 25 → 25 | all used |
| jukebox | 989k → 989k | 253k → 253k | 31 → 31 | uses the data |
| frames | 849k → 778k | 253k → 200k | 24 → 18 | firms, precip, countries-110m (52k) → none |
| monsoon | 811k → 741k | 238k → 185k | 22 → 16 | → none |
| pulse | 787k → 717k | 236k → 183k | 20 → 14 | → none |
| about | 800k → 730k | 237k → 184k | 21 → 15 | → none |
| quest | 1044k → 974k | 293k → 240k | 25 → 19 | → none |

The landing's JS did not change (316k → 313k); I cannot fully explain the other ~500k of its total drop (the only data change on the landing is one fewer `precip_snapshot.json` request), so treat that figure as run-to-run variance in images/fonts, not as a result of this change. The 53–70k drops on the other views are the removed data requests and chunks. I did not measure uncompressed JS: the audit's "≥1MB JS per view" is a decoded figure, mine is bytes on the wire, so the two are not directly comparable. The big remaining items are the JS chunks, three.js on the landing carousel, and the 757kB `countries-50m` chunk that is built and unused (already in the roadmap); I did not remove it.
- **Test:** `e2e/weight.pw.ts` (6: frames/monsoon/pulse/about fetch none of the three; landing fetches the snapshots only; Atlas fetches all).
- **Docs drift (reported, not edited):** `docs/roadmap-v3.md` Phase 9's gate says "no WebGL context on the landing page", but the landing creates **2** (`getContext('webgl…')` called twice at `/`, from `src/landing/WorldScene.tsx`). Either the gate or the code is out of date.

## Low
- `countryResults` gets a singular `countryResultsOne` (EN "1 country found", বাংলা "১টি দেশ পাওয়া গেছে"), with a test in `CountryPicker.test.tsx`.

## Not done / unsure
- Harmonium and Game items (H3, H4 and the Low items for those folders) belong to session B.
- H1: nothing was needed in B's folders. For B: `HarmoniumChatModal`, `QuestBadgeModal` and `MyEarthPassport` still lack `useDialog`.
- The other Low audit items (bn strings for SST, "LIVE OUTPUT" label, Quest deploy button offset, etc.) were not in this task.
- I could not confirm the GitHub link in the footer (the audit's "to confirm").

## Checks
See the last chat message for the final lint / test / build output, and `npm run test:e2e` / `test:a11y` below.

- Playwright's own browser path is wrong for this sandbox (it looks for `chromium_headless_shell-1194`, only `chromium-1243` is installed). I ran the same specs with a temporary config that sets `executablePath: '/opt/pw-browsers/chromium'`. Result for `smoke no-webgl carousel a11y landing layout weight`: **69 passed, 7 failed**. The 7 failures (4× landing "Hear this frame … through a view transition", 2× no-webgl, 1× smoke "navigation reaches every section") also **fail identically on the untouched baseline commit** `3cbfa58` (built and served separately), so they are not caused by this branch. The smoke and landing ones report "Transition was skipped. New ViewTransition started" or a zero view-transition counter in this Chromium build.
