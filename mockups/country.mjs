import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1500, height: 900 } });
await pg.goto('http://localhost:4173/explore?c=BGD');
await pg.waitForTimeout(10000);
await pg.screenshot({ path: 'mockups/out/country-bgd.png' });
await b.close();
