import { chromium } from '@playwright/test';
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/explore', '/jukebox', '/quest', '/about'];
const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const r of routes) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  const reqs = [];
  pg.on('response', async (res) => { try { const u = new URL(res.url()); if (u.hostname !== 'localhost') return; const body = await res.body().catch(() => null); reqs.push([u.pathname, body ? body.length : 0, res.headers()['content-encoding'] || '']); } catch {} });
  await pg.addInitScript(() => { window.__lcp = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); window.__lt = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true }); });
  await pg.goto('http://localhost:4173' + r);
  await pg.waitForTimeout(9000);
  const m = await pg.evaluate(() => ({ lcp: Math.round(window.__lcp), tbt: Math.round(window.__lt) }));
  const sum = (f) => Math.round(reqs.filter(f).reduce((a, x) => a + x[1], 0) / 1024);
  console.log(`${r.padEnd(10)} LCP ${m.lcp}ms  longtask>50ms ${m.tbt}ms  JS ${sum((x) => x[0].endsWith('.js'))}kB  img/tex ${sum((x) => /\.(jpg|png|webp)$/.test(x[0]))}kB  fonts ${sum((x) => x[0].endsWith('.woff2'))}kB  data ${sum((x) => x[0].endsWith('.json'))}kB  reqs ${reqs.length}`);
  if (process.env.LIST) for (const x of reqs.sort((a, c) => c[1] - a[1]).slice(0, 12)) console.log('   ', Math.round(x[1] / 1024) + 'kB', x[0]);
  await ctx.close();
}
await b.close();
