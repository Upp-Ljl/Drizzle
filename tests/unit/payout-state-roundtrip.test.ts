/**
 * Unit test: payout() formula × CertificateCard state mapping.
 *
 * Given an (amount, oddsAtBet, verdict) triple, payout() produces a settled
 * payout number. That number flows into CertificateCard which maps it to a
 * visual state. This test pins the round-trip:
 *
 *   verdict 'hard'      → payout > 0  → cert state 'gold'
 *   verdict 'editorial' → payout > 0  → cert state 'gold'
 *   verdict 'cancelled' → payout > 0  → cert state 'gold'  (since amount > 0)
 *   verdict 'dead'      → payout = 0  → cert state 'mourn'
 *   no settlement yet   → payout null → cert state 'pending'
 *
 * State derivation is documented at certificate-card.tsx (deriveState):
 *   null/undefined → pending; >0 → gold; ===0 → mourn.
 *
 * Pure-Node test (no DOM): re-derives state from payout numbers.
 */

import { describe, expect, it } from 'vitest';
import { payout } from '../../lib/memes/score';

type CertState = 'pending' | 'gold' | 'mourn';

// Mirrors deriveState() inside certificate-card.tsx. Kept in lockstep via the
// component test in cert-state.test.tsx; if that test fails, this mirror is
// stale and must be updated.
function deriveCertState(settledPayout: number | null | undefined): CertState {
  if (settledPayout === null || settledPayout === undefined) return 'pending';
  if (settledPayout > 0) return 'gold';
  return 'mourn';
}

describe('payout × cert-state round-trip', () => {
  it('hard verdict → positive payout → gold', () => {
    const p = payout(50, 2.5, 'hard');
    expect(p).toBe(125);
    expect(p).toBeGreaterThan(0);
    expect(deriveCertState(p)).toBe('gold');
  });

  it('editorial verdict → positive payout → gold (with 0.7 multiplier)', () => {
    const p = payout(100, 2.0, 'editorial');
    expect(p).toBe(140);
    expect(p).toBeGreaterThan(0);
    expect(deriveCertState(p)).toBe('gold');
  });

  it('cancelled verdict on non-zero amount → positive payout → gold', () => {
    // cancelled returns amount * 0.9; with amount > 0 this stays positive
    // so the cert visually settles as gold (refund display).
    const p = payout(100, 5.0, 'cancelled');
    expect(p).toBe(90);
    expect(p).toBeGreaterThan(0);
    expect(deriveCertState(p)).toBe('gold');
  });

  it('dead verdict → 0 payout → mourn', () => {
    const p = payout(100, 5.0, 'dead');
    expect(p).toBe(0);
    expect(deriveCertState(p)).toBe('mourn');
  });

  it('unsettled bet (null) → pending', () => {
    expect(deriveCertState(null)).toBe('pending');
    expect(deriveCertState(undefined)).toBe('pending');
  });

  it('mourn payouts are exactly 0, never negative', () => {
    // Iterate the verdict matrix; any non-cancelled losing branch should be 0.
    const cases: Array<{
      amount: number;
      odds: number;
      verdict: 'hard' | 'editorial' | 'dead' | 'cancelled';
    }> = [
      { amount: 1, odds: 1.2, verdict: 'dead' },
      { amount: 999, odds: 9.9, verdict: 'dead' },
    ];
    for (const c of cases) {
      const p = payout(c.amount, c.odds, c.verdict);
      expect(p).toBe(0);
      expect(deriveCertState(p)).toBe('mourn');
    }
  });

  it('gold payouts are strictly > 0', () => {
    const cases: Array<{
      amount: number;
      odds: number;
      verdict: 'hard' | 'editorial';
    }> = [
      { amount: 1, odds: 1.2, verdict: 'hard' },
      { amount: 33, odds: 3.33, verdict: 'editorial' },
      { amount: 1000, odds: 2.0, verdict: 'hard' },
    ];
    for (const c of cases) {
      const p = payout(c.amount, c.odds, c.verdict);
      expect(p).toBeGreaterThan(0);
      expect(deriveCertState(p)).toBe('gold');
    }
  });
});
