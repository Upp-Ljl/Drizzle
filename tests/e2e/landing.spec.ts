/**
 * E2E: homepage smoke
 *
 * - Loads without auth
 * - Shows the 今日气象 heading
 * - Top nav exposes a 登录 button (unauthed)
 * - At least one meme card / link is present (requires seeded DB)
 */

import { expect, test } from '@playwright/test';

test('homepage renders 今日气象 + login button + at least one meme link', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '今日气象' })).toBeVisible();

  // Top nav: unauthed users see 登录 button
  await expect(page.getByRole('button', { name: '登录' })).toBeVisible();

  // At least one meme detail link exists (seeded fixtures provide ≥1)
  const firstMemeLink = page.locator('a[href^="/meme/"]').first();
  await expect(firstMemeLink).toBeVisible();
});
