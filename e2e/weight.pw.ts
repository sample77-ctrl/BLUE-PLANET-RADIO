import { test, expect } from '@playwright/test';
import { offline, open } from './helpers';

// Weight (roadmap Phase 9): a view only fetches the snapshots and borders it uses.
const DATA = /firms_snapshot|precip_snapshot|countries-110m/;
const fetched = async (page: import('@playwright/test').Page, hash: string) => {
  const seen = new Set<string>();
  page.on('request', (r) => { const m = r.url().match(DATA); if (m) seen.add(m[0]); });
  await open(page, hash);
  await page.waitForTimeout(1500);
  return [...seen].sort();
};

for (const [name, hash] of [['monsoon', 'track=monsoon'], ['about', 'track=about'], ['pulse', 'track=pulse'], ['frames', 'track=frames']] as const) {
  test(`${name} does not fetch the FIRMS/POWER snapshots or the country borders`, async ({ page }) => {
    await offline(page);
    expect(await fetched(page, hash)).toEqual([]);
  });
}
test('the landing loads the snapshots but not the borders', async ({ page }) => {
  await offline(page);
  expect(await fetched(page, '')).toEqual(['firms_snapshot', 'precip_snapshot']);
});
test('the Atlas loads the snapshots and the borders', async ({ page }) => {
  await offline(page);
  expect(await fetched(page, 'track=atlas')).toEqual(['countries-110m', 'firms_snapshot', 'precip_snapshot']);
});
