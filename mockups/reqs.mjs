import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
const t0 = Date.now();
pg.on('request', (r) => { const u = new URL(r.url()); if (u.hostname === 'localhost') console.log(String(Date.now() - t0).padStart(5), u.pathname); });
await pg.goto('http://localhost:4173' + (process.argv[2] || '/'));
await pg.waitForTimeout(8000);
await b.close();
