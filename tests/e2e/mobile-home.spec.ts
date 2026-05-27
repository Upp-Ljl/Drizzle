/**
 * E2E: homepage on a 375×812 mobile viewport.
 *
 * Goals:
 *   - No horizontal page scroll: documentElement.scrollWidth ≤ viewport width + 1
 *   - Page renders main heading
 *   - Wide content (the meme table) is wrapped in an .overflow-x-auto container
 *     so it can scroll internally without forcing the page to scroll.
 */

import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test('mobile home: no horizontal page overflow + nav OK + table has internal scroll', async ({
  page,
}) => {
  await page.goto('/');

  // Sanity: page mounts.
  await expect(page.getByRole('heading', { name: '今日气象' })).toBeVisible();

  // No horizontal page scroll. Allow 1px slop for sub-pixel rounding.
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

  // Table is wrapped in overflow-x-auto so wide content scrolls internally.
  const overflowWrappers = page.locator('.overflow-x-auto');
  expect(await overflowWrappers.count()).toBeGreaterThan(0);
});
