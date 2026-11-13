# How AI was used in Blue Planet Radio

Written 13 Nov 2026 for the NASA Space Apps Challenge 2026 submission (The Earth Information Jukebox). It says where AI helped build the project, where AI runs inside the product, and where we do not know or have not recorded the answer. Every statement here can be checked in the repository or by the command shown beside it.

## At a glance

| Area | AI used? | Which tool | Detail |
|---|---|---|---|
| Writing the app's code, tests and docs | **Yes, substantially** | Claude (Anthropic) through Claude Code, including Claude Sonnet 5.5 and Claude Opus 5.5 | See "Building the software" |
| Planning, audits and fix reports | **Yes** | Claude | The roadmap, UI audit and fix reports in `docs/` were written by AI agents |
| The data and the sound | **No** | none | Deterministic code on bundled NASA data; no machine-learning model |
| Harmonium chat and "AI Future Predict" | **Only if a key is set** | Groq, model `openai/gpt-oss-120b` | Off on the deployed site (see "Inside the product") |
| The 240 s submission video | **Yes** | Claude (script, tooling); ElevenLabs (voice) | See "The submission video" |
| Images in `public/images` | **Not recorded** | unknown | See "Images and other assets": the team must fill this in |

## Building the software

- Most of the code, unit tests and documentation in this repository was written with Claude Code (Anthropic), working from briefs the team wrote (for example [`docs/roadmap-v3-brief.md`](docs/roadmap-v3-brief.md)). The working rules the AI follows are in [`CLAUDE.md`](CLAUDE.md): one phase per branch, run lint, tests and build before every commit, no fabricated data, every UI string in English and বাংলা.
- The planning and review documents `docs/roadmap-v3.md`, `docs/ui-audit-2026-11.md` and `docs/fix-report-a.md`, `-b.md`, `-c.md` are first-person records written by AI agents (the audit names the `claude/…` branch it ran on). They say what was checked, what was measured and what was not done. Who wrote the other files in `docs/` is not recorded.
- **The commit history understates this.** The project rule in `CLAUDE.md` removes "Co-Authored-By" lines naming the AI, so commits do not show which ones were AI-assisted. Treat this file as the disclosure, not the git log.
- What the team did: set the goal and the challenge brief, chose the product direction, decided what to cut or keep, ran the app, reviewed the output, and answered the questions the AI raised. The AI was never given authority to publish or deploy on its own: changes reach `main` through pull requests.
- Checks that guard AI-written code: `npm run lint` (no warnings), `npm test` (50 files, 436 tests) and `npm run build`, plus 24 browser smoke tests and 20 axe scans. All were run on 13 Nov 2026 and passed. The AI-written audits found real faults (they are listed in the fix reports), so the code was not accepted unreviewed.
- Known limit of this process: AI-written code can be wrong in ways tests do not cover. No independent human code review of the whole codebase has been recorded.

## What the AI did not do

- **It did not produce the data.** Every number shown comes from the bundled NASA and NOAA files in [`public/data/`](public/data/), fetched by the scripts in [`scripts/`](scripts/) and labelled with source, unit, period and method.
- **It does not make the sound.** The mappings in [`src/sonification`](src/sonification) and [`src/audio`](src/audio) are fixed formulas (written down in the README and on the About page). The same data always gives the same sound.
- **No AI-generated text is presented as NASA's.** Where text can come from an AI, the interface says so (below).

## Inside the product

- **No AI runs in the main experience** (Frames, Explore Earth, Data Jukebox, Sonic Quest, About).
- **Harmonium chat and "AI Future Predict"** call Groq's `openai/gpt-oss-120b` (see [`src/harmonium/groqPredictor.ts`](src/harmonium/groqPredictor.ts)), but only when `VITE_GROQ_API_KEY` is set at build time.
  - **On the deployed site there is no key.** On 13 Nov 2026 we fetched all 24 JavaScript files of https://blue-planet-radio.vercel.app (the main script and the 23 it loads) and found no Groq key in any of them. So the deployed Harmonium shows "AI not configured" and answers from the bundled NASA snapshots with a plain line saying that no AI wrote the text.
  - When a key is set, what is sent is the conversation so far, the notes the visitor played (their names and pitch) and a fixed instruction. The app has no sign-in and collects no personal data of its own.
  - AI text is labelled "Illustration, text by AI", the result carries "Not a forecast. Not NASA data.", and the year it gives comes from an illustrative rule shown in the app, not from a model.
- **Key handling:** an earlier Groq key was once written into the source. It was removed from the source and from the history, and the code now reads `VITE_GROQ_API_KEY`. Because any `VITE_` variable is public in the built site, [`docs/submission.md`](docs/submission.md) tells the team to revoke the old key and to use a low-limit key or a proxy for any new one. Whether the old key has been revoked at Groq is **not recorded here**.

## The submission video

The 240 s video (tooling in `video/`, added in a separate pull request) was made with AI help:

- **Script:** the narration was drafted by Claude and approved by the team. It states only facts that can be read from the app (for example the 1998 value of 0.61 °C is read from the bundled GISTEMP file).
- **Voice:** the narration is **synthetic speech from ElevenLabs** text-to-speech, using a voice the team chose. It is not a recording of a person.
- **Picture:** screen recordings of the real app, captured by a script from the production build, with the app's own sound. No generated footage.
- **Captions and cut:** generated by scripts from the narration timestamps. Music is a synthesised drone made with ffmpeg.

## Images and other assets

The repository does not record where these came from. **The team needs to confirm each row before submitting.** We have not guessed.

| File | Used in the app | Origin recorded? | Confirm |
|---|---|---|---|
| `public/images/ninja_cadet_*.png`, `ninja_*_frame*.png`, `ninja_run_sheet_clean.png` | Sonic Quest characters | No | [ ] tool / author: |
| `public/images/game/nasa_satellite_drone_mesh*.jpg`, `wildfire_tactical_command*.jpg` | Sonic Quest hub | No | [ ] tool / author: |
| `public/images/game/amazon_aerial_scout.jpg`, `public/images/harmonium.png` | **Not referenced by the app** | No | [ ] delete, or say what they are |
| `public/images/sonic_earth_hero.jpg` | **Not used.** The roadmap notes it shows a NASA logo, a "LIVE" label and charts with invented numbers, so it breaks the no-fabricated-data rule | No | [ ] delete it, or say what it is |
| `public/images/space-apps-logo.png` | Landing | Space Apps programme logo | [ ] confirm usage terms |

Not AI, for the record: the four EIC frames (NASA Earth Information Center, earth.gov), GIBS imagery (NASA), country shapes (Natural Earth), fonts (Mona Sans, IBM Plex Mono, Noto Sans Bengali, SIL OFL) and the globe texture maps (taken from the three.js examples; the project docs describe them as Blue Marble imagery; confirm their licence terms before reuse).

## Checking these statements yourself

```bash
grep -rn "api.groq.com\|VITE_GROQ_API_KEY" src          # the only AI call in the app
npm run build && grep -rl "gsk_" dist || echo "no Groq key in the build"
npm run lint && npm test                                 # the checks run before every commit
ls docs                                                  # the AI-written plans, audits and reports
```

If something here is out of date or wrong, fix it in the same pull request as the change that made it wrong.
