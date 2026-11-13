# Blue Planet Radio — notes for Claude

NASA Space Apps "Earth Information Jukebox" entry. React 19 + TypeScript + Vite + three.js + Web Audio, deployed on Vercel from `main`.

## Planning documents

The roadmaps, audits and fix reports used to build the project were removed from the repository for the submission; they stay in the git history (`git log --diff-filter=D --name-only -- docs`). Work from the README and the code. Ask the user for scope before any change that is bigger than the task, and say what you checked and what you did not.

## Working rules

- Act as project manager: pick the next task and do it. Don't ask for confirmation at every step. Do stop and ask before destructive operations or architecture changes the user has not asked for.
- Never commit or push to `main`. Use a branch per task, push that branch, and open a PR against `main`.
- Before every commit run `npm run lint && npm test && npm run build`. Report actual results and never weaken tests to get a green run.
- Commit and PR messages must **not** include `Co-Authored-By: Claude` trailers or "Generated with Claude Code" lines.
- Keep existing features working (all four tracks, share links, keyboard shortcuts, বাংলা strings, reduced motion, high contrast).
- Add every new UI string in both English and বাংলা (`src/lib/strings.ts`).
- No fabricated data: label samples as samples, show source, unit, period and method, and never show a "live" badge on snapshot data.
- No new runtime dependencies without a written reason. Dev-only test tools are the ones already in `devDependencies`.
- Match the surrounding code style (dense, terse comments; existing CSS tokens and `.btn` / `.panel` / `.chip` classes).

## Commands

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
```
