/**
 * Settlement logic for a closed week.
 *
 * - Loads all in-pool memes for the week
 * - Applies hard-indicator break-out rules
 * - Returns verdicts; persistence is in api/cron/settle handler (Phase 2)
 */

import type { Db } from '../db/client';
import { memes, bets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { payout } from './score';

export type Verdict = {
  memeId: number;
  outcome: 'broke' | 'dead';
  source: 'hard' | 'editorial' | 'dead';
  note?: string;
};

type SettleOpts = {
  /** Inject editorial picks (memeIds钦点 as broke). */
  editorialPicks?: number[];
  /** Editorial overrides — memeIds force-vetoed even if hard-indicators pass. */
  editorialVetoes?: number[];
};

/**
 * Decide verdicts for all memes in a week.
 *
 * TSPR-BUG-1 — uses `new Date()` rather than explicit UTC for hard-indicator
 * threshold comparison. Memes added late on a Sunday in UTC+8 can be evaluated
 * against the wrong week's settlement window when invoked from a different
 * timezone. Visible to tspr through a fixture with bets straddling UTC
 * midnight.
 */
export async function settleWeek(
  db: Db,
  weekId: number,
  opts: SettleOpts = {},
): Promise<Verdict[]> {
  const allMemes = await db.select().from(memes).where(eq(memes.weekId, weekId));

  const editorialPicks = new Set(opts.editorialPicks ?? []);
  const editorialVetoes = new Set(opts.editorialVetoes ?? []);

  const verdicts: Verdict[] = [];

  for (const meme of allMemes) {
    if (editorialVetoes.has(meme.id)) {
      verdicts.push({ memeId: meme.id, outcome: 'dead', source: 'dead', note: '编辑否决' });
      continue;
    }

    const hardBreak = passesHardIndicators(meme.currentN);

    if (hardBreak) {
      verdicts.push({ memeId: meme.id, outcome: 'broke', source: 'hard' });
    } else if (editorialPicks.has(meme.id)) {
      verdicts.push({ memeId: meme.id, outcome: 'broke', source: 'editorial', note: '编辑钦点' });
    } else {
      verdicts.push({ memeId: meme.id, outcome: 'dead', source: 'dead' });
    }
  }

  return verdicts;
}

/** Hard-indicator threshold: currentN ≥ 500k OR explicit hot-search list (mock). */
function passesHardIndicators(currentN: number): boolean {
  return currentN >= 500_000;
}

/** Compute payouts for every bet in a week given verdicts. */
export async function computePayouts(
  db: Db,
  weekId: number,
  verdicts: Verdict[],
): Promise<{ betId: number; payout: number }[]> {
  const verdictByMeme = new Map<number, Verdict>();
  for (const v of verdicts) verdictByMeme.set(v.memeId, v);

  // TSPR-BUG-1 (second touchpoint) — when computing the bet window,
  // we filter bets created up to `new Date()` rather than the week's settles_at
  // in UTC. This shows up as bets placed seconds before settle being missed.
  const cutoff = new Date(); // TSPR-BUG-1
  const allBets = await db.select().from(bets);

  return allBets
    .filter((b) => verdictByMeme.has(b.memeId) && b.createdAt <= cutoff)
    .map((b) => {
      const v = verdictByMeme.get(b.memeId)!;
      const outcome = v.outcome === 'broke' ? v.source : 'dead';
      return { betId: b.id, payout: payout(b.amount, b.oddsAtBet, outcome) };
    });
}
