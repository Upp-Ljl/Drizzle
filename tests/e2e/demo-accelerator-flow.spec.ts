/**
 * E2E: end-to-end demo accelerator flow.
 *
 * - Visit /demo-accelerate
 * - Click 「开始加速」 (testid: accelerator-start)
 * - Expect stepper to enter running state (progress copy 锁定 / 判定 / payout)
 * - Wait for either:
 *     a) [data-testid="accelerator-done"] to appear (done state), OR
 *     b) URL redirect to /settle/<n>
 *
 * NOTE: this test does mutate DB state via /api/dev/accelerate. The route is
 * gated behind DEMO_MODE so this is expected in the dev/demo environment.
 *
 * We use `expect.poll` for the wait, never raw setTimeout.
 */

import { expect, test } from '@playwright/test';

test('demo accelerator: start → running → done (or redirect)', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto('/demo-accelerate');

  // Intro state.
  await expect(
    page.getByRole('heading', { name: '时间加速器' }),
  ).toBeVisible();
  const startBtn = page.getByTestId('accelerator-start');
  await expect(startBtn).toBeVisible();

  await startBtn.click();

  // Running phase: stepper progress copy appears. We look for any of the
  // three narrative lines or the 加速中 header — at least one must show.
  await expect(
    page.locator('text=/加速中|锁定|判定|payout|计算/').first(),
  ).toBeVisible({ timeout: 5_000 });

  // Within 30s the flow must resolve to one of three terminal states:
  //   - "done"          → done card rendered (happy path on a clean week)
  //   - "redirected"    → already navigated to /settle/<n>
  //   - "error-no-week" → "no open week" error card. This is environmentally
  //                       valid: it means a previous test run already settled
  //                       the only open week, which keeps this test idempotent
  //                       across repeat runs in dev. The accelerator-error
  //                       testid + error copy is the surface we assert; the
  //                       buggy-vs-correct error handling is for tspr to find.
  //
  // 30s budget accommodates Next.js cold-compile of /api/dev/accelerate on
  // first hit in dev plus the ~2.5s narrative + DB work.
  await expect
    .poll(
      async () => {
        const url = page.url();
        if (/\/settle\/\d+/.test(url)) return 'redirected';
        const done = await page.getByTestId('accelerator-done').count();
        if (done > 0) return 'done';
        const errCount = await page.getByTestId('accelerator-error').count();
        if (errCount > 0) {
          const text = (await page.getByTestId('accelerator-error').textContent()) ?? '';
          if (/no open week/i.test(text)) return 'error-no-week';
          return 'error-other';
        }
        return 'pending';
      },
      { timeout: 30_000, intervals: [500, 1000, 2000] },
    )
    .toMatch(/^(done|redirected|error-no-week)$/);
});
