/* Shared helper: the Chromium to launch. Playwright's own build if it matches this playwright-core, else the newest one in the cache (any platform). */
import { chromium } from 'playwright-core'
import { existsSync, readdirSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
export function chromePath() {
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || (platform() === 'darwin' ? join(homedir(), 'Library', 'Caches', 'ms-playwright') : platform() === 'win32' ? join(homedir(), 'AppData', 'Local', 'ms-playwright') : join(homedir(), '.cache', 'ms-playwright'))
  try { const p = chromium.executablePath(); if (p && existsSync(p)) return p } catch {}
  const dir = existsSync(cache) ? readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => a.split('-')[1] - b.split('-')[1]).pop() : null
  if (!dir) return undefined
  const cands = ['chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-linux64/chrome', 'chrome-linux/chrome', 'chrome-win64/chrome.exe', 'chrome-win/chrome.exe']
  return cands.map((c) => join(cache, dir, c)).find(existsSync)
}
