#!/usr/bin/env bash
# One-time setup of the video workspace. Run from this folder:  bash setup.sh
set -e
cd "$(dirname "$0")"
say() { printf '\n== %s\n' "$1"; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "MISSING: $1 -> $2"; MISSING=1; }; }
say "1/5 tools"; MISSING=0
need node "install Node 18+ (https://nodejs.org or: brew install node)"
need ffmpeg "brew install ffmpeg   (Windows: winget install ffmpeg)"
need ffprobe "comes with ffmpeg"
[ "$MISSING" = 1 ] && { echo "Install the missing tools, then run setup.sh again."; exit 1; }
node -e 'process.exit(Number(process.versions.node.split(".")[0])>=18?0:1)' || { echo "Node 18+ needed (found $(node -v))"; exit 1; }
say "2/5 packages"; npm install --no-audit --no-fund
say "3/5 browser for graphics + screen recording (Chromium, one download, about 150 MB)"
npx playwright-core install chromium
say "4/5 folders and .env"
mkdir -p footage out out/audio out/graphics out/clips graphics
[ -f .env ] || { cp .env.example .env; echo "Created .env : open it and paste your ElevenLabs key + voice ID (never share this file)."; }
say "5/5 health check"; node doctor.mjs || echo "Fix the FAIL lines above (WARN lines are fine to start with)."
echo; echo "Next: read GUIDE.md, then copy story.template.json to story.json and shots.template.json to shots.json."
