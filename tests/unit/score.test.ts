/**
 * Unit tests for lib/memes/score.ts
 *
 * Coverage:
 *   - oddsForN: snapshot table at N=100, 1k, 10k, 100k, 1M, 10M
 *   - oddsForN: clamp at lo=1.2 (huge N) and hi=10.0 (very small N)
 *   - payout: each verdict branch (hard / editorial / dead / cancelled)
 */

import { describe, expect, it } from 'vitest';
import { oddsForN, payout } from '../../lib/memes/score';

describe('oddsForN', () => {
  // Documented formula: odds = clamp(1 + 10 / log10(N + 100), 1.2, 10.0)
  // Computed once and locked as the canonical snapshot for these N values.
  // If the formula ever changes intentionally, this table must be updated.
  it('produces stable odds across N magnitudes', () => {
    const snapshot = {
      100: oddsForN(100),
      1_000: oddsForN(1_000),
      10_000: oddsForN(10_000),
      100_000: oddsForN(100_000),
      1_000_000: oddsForN(1_000_000),
      10_000_000: oddsForN(10_000_000),
    };

    // Expected values derived from the documented formula. Each ≤ 2 decimal places
    // (round2 in source). Edited to match the doc comment in score.ts.
    // Exact (after round2) values verified against the documented formula.
    expect(snapshot[100]).toBe(5.35);
    expect(snapshot[1_000]).toBe(4.29);
    expect(snapshot[10_000]).toBe(3.5);
    expect(snapshot[100_000]).toBe(3.0);
    expect(snapshot[1_000_000]).toBe(2.67);
    expect(snapshot[10_000_000]).toBe(2.43);
  });

  it('clamps at upper bound 10.0 for very small N', () => {
    // For N=0: log10(100)=2 → 1 + 10/2 = 6.0 < 10. To force the clamp we need
    // log10(N+100) such that 1 + 10/log < 10 fails — i.e. log < 10/9 ≈ 1.111.
    // That happens when N+100 < 10^1.111 ≈ 12.9, impossible since N ≥ 0 forces
    // N+100 ≥ 100. The hi-clamp is therefore dead code in practice; ensure it
    // is still numerically respected if the formula is ever tweaked.
    const odds = oddsForN(0);
    expect(odds).toBeLessThanOrEqual(10.0);
    expect(odds).toBeGreaterThanOrEqual(1.2);
  });

  it('clamps at lower bound 1.2 for huge N', () => {
    // For very large N (e.g. 1e18): log10(1e18+100) ≈ 18, 1 + 10/18 ≈ 1.555.
    // For absurd N (e.g. 1e100): log10 ≈ 100, 1 + 0.1 = 1.1 → clamped to 1.2.
    expect(oddsForN(1e100)).toBe(1.2);
  });

  it('treats negative N as 0 (safeN clamp)', () => {
    expect(oddsForN(-1000)).toBe(oddsForN(0));
  });
});

describe('payout', () => {
  it('hard break-out → amount * oddsAtBet (rounded)', () => {
    expect(payout(50, 2.5, 'hard')).toBe(125);
    expect(payout(33, 3.33, 'hard')).toBe(Math.round(33 * 3.33));
  });

  it('editorial → amount * oddsAtBet * 0.7 (rounded)', () => {
    expect(payout(100, 2.0, 'editorial')).toBe(140); // 100 * 2.0 * 0.7
    expect(payout(50, 3.0, 'editorial')).toBe(105);
  });

  it('dead → 0', () => {
    expect(payout(100, 5.0, 'dead')).toBe(0);
    expect(payout(1, 10.0, 'dead')).toBe(0);
  });

  it('cancelled → amount * 0.9 (rounded, ignores odds)', () => {
    expect(payout(100, 5.0, 'cancelled')).toBe(90);
    expect(payout(33, 9.99, 'cancelled')).toBe(Math.round(33 * 0.9));
  });
});
