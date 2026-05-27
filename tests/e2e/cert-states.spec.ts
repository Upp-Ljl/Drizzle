/**
 * E2E: cert state visual smoke.
 *
 * Asserting won/lost cert states end-to-end requires an authenticated user
 * with bets in a settled week — that's stateful + auth-bound and best left
 * for tspr to exercise (TSPR-BUG-* coverage). Here we only do a positive
 * smoke: an unauthed visit to a meme detail page does not surface a cert
 * card (cert cards live on /me which gates on auth).
 */

import { expect, test } from '@playwright/test';

test('unauthed meme page: no cert-card rendered (cert lives on /me, gated)', async ({
  page,
}) => {
  await page.goto('/');
  const firstHref = await page
    .locator('a[href^="/meme/"]')
    .first()
    .getAttribute('href');
  expect(firstHref, 'homepage must expose a meme link').toBeTruthy();

  await page.goto(firstHref as string);
  // Page rendered (bet form is the canonical anchor on the detail page).
  await expect(page.getByTestId('bet-submit')).toBeVisible();
  // No cert card visible on the public detail view.
  expect(await page.getByTestId('cert-card').count()).toBe(0);
});

test.skip('won state (gold) — needs auth + settled bet seed; tspr can pick up', () => {
  // Intentionally skipped. Requires:
  //   - logged-in user (GitHub OAuth, real)
  //   - a settled bet with settledPayout > 0
  // The unit test cert-state.test.tsx already pins gold/mourn/pending
  // visual mapping; this skipped slot reserves the e2e coverage for
  // later infra (test fixtures or stubbed auth).
});

test.skip('lost state (mourn) — needs auth + settled bet seed; tspr can pick up', () => {
  // See note above.
});
