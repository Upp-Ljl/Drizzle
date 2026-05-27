/**
 * E2E: visiting /me while unauthed shows the empty-state card with a sign-in
 * CTA, and does not crash.
 */

import { expect, test } from '@playwright/test';

test('/me unauthed: shows empty-state copy + GitHub sign-in button', async ({
  page,
}) => {
  await page.goto('/me');

  // Heading and explainer copy.
  await expect(page.getByRole('heading', { name: '我的预测' })).toBeVisible();
  await expect(
    page.getByText('登录后这里会显示你的预测记录'),
  ).toBeVisible();

  // GitHub sign-in CTA visible (we don't click — would hit real GitHub OAuth).
  await expect(
    page.getByRole('button', { name: '用 GitHub 登录' }),
  ).toBeVisible();

  // No unhandled error: page mounted without crash. Title set by layout.
  await expect(page).toHaveTitle(/.+/);
});
