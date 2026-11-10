// Local-only: runs the repo's e2e specs with the Chromium that is already installed (the pinned Playwright build is not).
import { defineConfig, devices } from '@playwright/test';
import base from '../playwright.config';
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
export default defineConfig({
  ...base,
  testDir: process.env.PW_DIR ?? '../e2e',
  reporter: 'list',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } } }],
});
