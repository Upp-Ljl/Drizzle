/**
 * Heat → odds 计算。
 *
 * 公式：odds = clamp(1 + 10 / log10(N + 100), 1.2, 10.0)
 *
 * 性质：
 *   N=1k    → 4.33x
 *   N=10k   → 3.50x
 *   N=100k  → 3.00x
 *   N=1M    → 2.67x
 *   N=10M   → 2.43x
 */

export function oddsForN(currentN: number): number {
  const safeN = Math.max(0, currentN);
  const raw = 1 + 10 / Math.log10(safeN + 100);
  return clamp(round2(raw), 1.2, 10.0);
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function round2(x: number) {
  return Math.round(x * 100) / 100;
}

/**
 * Payout for a settled bet.
 *   - hard break-out:     amount * oddsAtBet
 *   - editorial-only:     amount * oddsAtBet * 0.7
 *   - dead:               0
 *   - cancelled:          amount * 0.9 (10% withdrawal fee — not implemented in v0.1)
 */
export function payout(
  amount: number,
  oddsAtBet: number,
  verdict: 'hard' | 'editorial' | 'dead' | 'cancelled',
): number {
  if (verdict === 'hard') return Math.round(amount * oddsAtBet);
  if (verdict === 'editorial') return Math.round(amount * oddsAtBet * 0.7);
  if (verdict === 'cancelled') return Math.round(amount * 0.9);
  return 0;
}
