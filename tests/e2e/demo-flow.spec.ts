/**
 * E2E: click through the 5 demo screens. Asserts a known heading per page.
 * Does NOT click the accelerate button — we don't want to mutate state.
 *
 * Week number 46 is the most-recently-settled seed (see lib/db/seed.ts).
 */

import { expect, test } from '@playwright/test';

test('5-screen demo click-through', async ({ page }) => {
  // 1. Home
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '今日气象' })).toBeVisible();

  // 2. Radar
  await page.goto('/radar');
  await expect(
    page.getByRole('heading', { name: '早期信号雷达' }),
  ).toBeVisible();

  // 3. Graveyard
  await page.goto('/graveyard');
  await expect(page.getByRole('heading', { name: '梗坟场' })).toBeVisible();

  // 4. Settle page for week 46 (most recently settled seeded week)
  await page.goto('/settle/46');
  // SettleSummary renders the week number prominently; assert any text match.
  await expect(page.locator('body')).toContainText('46');

  // 5. Demo accelerate page (DO NOT click the button)
  await page.goto('/demo-accelerate');
  await expect(page.getByRole('heading', { name: '时间加速器' })).toBeVisible();
});
