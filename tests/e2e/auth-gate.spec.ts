/**
 * E2E: clicking 押 on a meme detail page while unauthed pops the GitHub
 * OAuth modal. Escape dismisses the modal. We never hit real GitHub.
 */

import { expect, test } from '@playwright/test';

test('press 押 while unauthed → GitHub modal appears + Escape dismisses', async ({
  page,
}) => {
  await page.goto('/');
  const firstHref = await page
    .locator('a[href^="/meme/"]')
    .first()
    .getAttribute('href');
  expect(firstHref, 'homepage must expose a meme link').toBeTruthy();

  await page.goto(firstHref as string);

  // Bet form is visible (server renders MemeDetail which contains BetForm)
  const submit = page.getByTestId('bet-submit');
  await expect(submit).toBeVisible();
  await submit.click();

  // Auth modal pops with the GitHub login button
  const githubBtn = page.getByTestId('auth-modal-github');
  await expect(githubBtn).toBeVisible();

  // Dismiss via Escape
  await page.keyboard.press('Escape');
  await expect(githubBtn).toBeHidden();
});
