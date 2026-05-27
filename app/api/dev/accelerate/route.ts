/**
 * POST /api/dev/accelerate
 *
 * Demo-only: fast-forward the current open week to settled.
 *
 * - In prod (DEMO_MODE=false) → 404 (route shouldn't exist).
 * - Else: find the single `open` week and settle it in-place:
 *     1) update week.settles_at = now(), week.status = 'settled'
 *     2) for every in_pool meme in that week:
 *          - currentN >= 500_000 → status='broke',  verdictSource='hard'
 *          - otherwise           → status='in_graveyard', verdictSource='dead'
 *            + INSERT into graveyard (maxN=currentN, backersCount=count(bets))
 *     3) for every bet on those memes with settledPayout IS NULL:
 *          compute payout via lib/memes/score#payout based on the new verdict
 *     4) write audit_log entry
 *
 * Returns: { weekId, weekNumber, brokeCount, deadCount }
 */

import { NextResponse } from 'next/server';
import { and, eq, isNull, sql as dsql } from 'drizzle-orm';
import { env } from '@/lib/env';
import { requireDb } from '@/lib/db/client';
import { auditLog, bets, graveyard, memes, weeks } from '@/lib/db/schema';
import { payout } from '@/lib/memes/score';

export const dynamic = 'force-dynamic';

const HARD_BREAK_N = 500_000;

export async function POST() {
  if (!env.DEMO_MODE) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const db = requireDb();

  // 1. Find the single open week.
  const [openWeek] = await db
    .select()
    .from(weeks)
    .where(eq(weeks.status, 'open'))
    .limit(1);
  if (!openWeek) {
    return NextResponse.json({ error: 'no open week' }, { status: 400 });
  }

  // 2. Settle the week.
  await db
    .update(weeks)
    .set({ settlesAt: dsql`now()`, status: 'settled', updatedAt: dsql`now()` })
    .where(eq(weeks.id, openWeek.id));

  // 3. Pull in-pool memes for this week.
  const inPoolMemes = await db
    .select()
    .from(memes)
    .where(and(eq(memes.weekId, openWeek.id), eq(memes.status, 'in_pool')));

  let brokeCount = 0;
  let deadCount = 0;

  // 4. Per-meme: decide verdict, update meme, maybe insert graveyard row, settle bets.
  for (const meme of inPoolMemes) {
    const isHardBreak = meme.currentN >= HARD_BREAK_N;
    const newStatus: 'broke' | 'in_graveyard' = isHardBreak ? 'broke' : 'in_graveyard';
    const newVerdictSource: 'hard' | 'dead' = isHardBreak ? 'hard' : 'dead';
    const verdictForPayout: 'hard' | 'dead' = isHardBreak ? 'hard' : 'dead';

    if (isHardBreak) brokeCount += 1;
    else deadCount += 1;

    await db
      .update(memes)
      .set({
        status: newStatus,
        verdictSource: newVerdictSource,
        updatedAt: dsql`now()`,
      })
      .where(eq(memes.id, meme.id));

    // Count active backers for this meme (used for graveyard.backersCount).
    const [{ count: backersCount }] = await db
      .select({ count: dsql<number>`count(*)::int` })
      .from(bets)
      .where(and(eq(bets.memeId, meme.id), isNull(bets.cancelledAt)));

    if (!isHardBreak) {
      // Insert tombstone — do nothing if a row already exists (idempotent).
      await db
        .insert(graveyard)
        .values({
          memeId: meme.id,
          maxN: meme.currentN,
          backersCount,
        })
        .onConflictDoNothing({ target: graveyard.memeId });
    }

    // Settle every unsettled bet on this meme.
    const unsettledBets = await db
      .select({
        id: bets.id,
        amount: bets.amount,
        oddsAtBet: bets.oddsAtBet,
      })
      .from(bets)
      .where(and(eq(bets.memeId, meme.id), isNull(bets.settledPayout), isNull(bets.cancelledAt)));

    for (const bet of unsettledBets) {
      const settled = payout(bet.amount, bet.oddsAtBet, verdictForPayout);
      await db.update(bets).set({ settledPayout: settled }).where(eq(bets.id, bet.id));
    }
  }

  // 5. audit.
  await db.insert(auditLog).values({
    action: 'dev.accelerate',
    entityType: 'week',
    entityId: String(openWeek.id),
    payload: {
      weekNumber: openWeek.weekNumber,
      brokeCount,
      deadCount,
      memesTouched: inPoolMemes.length,
    },
  });

  return NextResponse.json({
    weekId: openWeek.id,
    weekNumber: openWeek.weekNumber,
    brokeCount,
    deadCount,
  });
}
