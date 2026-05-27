/**
 * E2E: /radar renders both meme and topic sections, each with at least one
 * tier sub-section (red/yellow/green) rendered. The page wires
 * data-testid="radar-section-meme" and "radar-section-topic".
 */

import { expect, test } from '@playwright/test';

test('/radar shows both meme and topic dual sections', async ({ page }) => {
  await page.goto('/radar');

  // Page heading.
  await expect(
    page.getByRole('heading', { name: '早期信号雷达' }),
  ).toBeVisible();

  const memeSection = page.getByTestId('radar-section-meme');
  const topicSection = page.getByTestId('radar-section-topic');

  // Both top-level sections present and visible.
  await expect(memeSection).toBeVisible();
  await expect(topicSection).toBeVisible();

  // Each section has its bilingual emoji+title header.
  await expect(memeSection.getByText('热梗信号')).toBeVisible();
  await expect(topicSection.getByText('话题信号')).toBeVisible();

  // SignalRadar renders one block per tier — there should be ≥ 1 element
  // inside each section beyond the header (children include three radar
  // sub-blocks). We assert at minimum the section is non-empty.
  expect(await memeSection.locator('> *').count()).toBeGreaterThan(1);
  expect(await topicSection.locator('> *').count()).toBeGreaterThan(1);
});
