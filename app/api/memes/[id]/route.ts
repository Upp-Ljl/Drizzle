/**
 * GET /api/memes/[id]
 *
 * Returns: { meme, recentBets (last 5), backersCount }
 *
 * Public endpoint — no auth required.
 */

import { NextResponse } from 'next/server';
import { and, desc, eq, isNull, sql as dsql } from 'drizzle-orm';
import { requireDb } from '@/lib/db/client';
import { bets, memes, profiles } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memeId = Number.parseInt(id, 10);
  if (!Number.isFinite(memeId) || memeId <= 0) {
    return NextResponse.json({ error: 'invalid meme id' }, { status: 400 });
  }

  const db = requireDb();

  const [meme] = await db.select().from(memes).where(eq(memes.id, memeId)).limit(1);
  if (!meme) {
    return NextResponse.json({ error: 'meme not found' }, { status: 404 });
  }

  const recentRows = await db
    .select({
      id: bets.id,
      amount: bets.amount,
      oddsAtBet: bets.oddsAtBet,
      firstNAtBet: bets.firstNAtBet,
      certificateId: bets.certificateId,
      createdAt: bets.createdAt,
      displayName: bets.displayName,
      handle: profiles.handle,
    })
    .from(bets)
    .leftJoin(profiles, eq(bets.userId, profiles.id))
    .where(and(eq(bets.memeId, memeId), isNull(bets.cancelledAt)))
    .orderBy(desc(bets.createdAt))
    .limit(5);

  const recentBets = recentRows.map((r) => ({
    id: r.id,
    amount: r.amount,
    oddsAtBet: r.oddsAtBet,
    firstNAtBet: r.firstNAtBet,
    certificateId: r.certificateId,
    createdAt: r.createdAt,
    handle: r.handle ?? r.displayName ?? '匿名',
  }));

  const [{ count: backersCount }] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(bets)
    .where(and(eq(bets.memeId, memeId), isNull(bets.cancelledAt)));

  // Explicitly include kind-aware fields so consumers don't rely on raw row shape.
  const memePayload = {
    ...meme,
    kind: meme.kind,
    templatePattern: meme.templatePattern,
    derivativeCount: meme.derivativeCount,
    thresholdN: meme.thresholdN,
    topicQuestion: meme.topicQuestion,
  };

  return NextResponse.json({ meme: memePayload, recentBets, backersCount });
}
