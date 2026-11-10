import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { offline, open } from './helpers';

const MORE = ['Earth DJ studio', 'Free Roam', 'Kids Zone', 'Blind Explorer', 'Time Machine', 'Science Lab', 'Co-Op', 'Earth Passport'];
test('Quest hub and every sub-screen: no axe violations', async ({ page }) => {
  test.setTimeout(240_000);
  await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  const found: string[] = [];
  const scan = async (label: string) => {
    await page.waitForTimeout(500);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
    for (const v of r.violations) found.push(`${label} · ${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 2).join(' | ')}`);
  };
  await open(page, 'track=quest');
  await scan('hub');
  for (const name of MORE) {
    await page.getByRole('button', { name, exact: true }).click();
    await scan(name);
    await page.getByRole('button', { name: /Back to Quest home/i }).click();
  }
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: /Deploy|Replay/ }).nth(i).click();
    await scan(`mission ${i + 1}`);
    await page.getByRole('button', { name: /Back to Quest home/i }).click();
  }
  console.log(found.join('\n') || 'no violations');
  expect(found).toEqual([]);
});
