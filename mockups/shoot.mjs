import { chromium } from '@playwright/test';
const pages = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const p of pages) {
  const pg = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
  pg.on('console', (m) => console.log(p, m.type(), m.text()));
  pg.on('pageerror', (e) => console.log(p, 'ERR', e.message));
  await pg.goto(`http://localhost:5199/mockups/${p}.html`);
  await pg.waitForFunction('window.__ready === true', null, { timeout: 60000 });
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: `mockups/out/${p}.png` });
  console.log('saved', p);
}
await b.close();
