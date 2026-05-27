/**
 * GET /api/me/bets — current user's bets across all weeks.
 *
 * Auth required (401 if no user).
 *
 * Returns: { bets: Array<{ id, certificateId, amount, oddsAtBet, firstNAtBet,
 *   settledPayout, meme, week }> }
 *
 * Sorted newest-first.
 */

import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb } from '@/lib/db/client';
import { bets as betsTable, memes as memesTable, weeks as weeksTable } from '@/lib/db/schema';
import { getServerUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

const MemeSubSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  kind: z.enum(['meme', 'topic']),
  status: z.string(),
  verdictSource: z.string().nullable(),
  currentN: z.number().int(),
  derivativeCount: z.number().int(),
  thresholdN: z.number().int().nullable(),
  topicQuestion: z.string().nullable(),
});

const WeekSubSchema = z.object({
  id: z.number().int(),
  weekNumber: z.number().int(),
  status: z.string(),
  settlesAt: z.string(),
});

const BetRowSchema = z.object({
  id: z.number().int(),
  certificateId: z.string(),
  amount: z.number().int(),
  oddsAtBet: z.number(),
  firstNAtBet: z.number().int(),
  settledPayout: z.number().int().nullable(),
  createdAt: z.string(),
  meme: MemeSubSchema,
  week: WeekSubSchema,
});

const ResponseSchema = z.object({
  bets: z.array(BetRowSchema),
});

export type MyBetRow = z.infer<typeof BetRowSchema>;
export type MyBetsApiResponse = z.infer<typeof ResponseSchema>;

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'login required' }, { status: 401 });
  }

  const db = requireDb();

  const rows = await db
    .select({
      bet: betsTable,
      meme: memesTable,
      week: weeksTable,
    })
    .from(betsTable)
    .innerJoin(memesTable, eq(betsTable.memeId, memesTable.id))
    .innerJoin(weeksTable, eq(memesTable.weekId, weeksTable.id))
    .where(eq(betsTable.userId, user.id))
    .orderBy(desc(betsTable.createdAt));

  const body: MyBetsApiResponse = {
    bets: rows.map((r) => ({
      id: r.bet.id,
      certificateId: r.bet.certificateId,
      amount: r.bet.amount,
      oddsAtBet: r.bet.oddsAtBet,
      firstNAtBet: r.bet.firstNAtBet,
      settledPayout: r.bet.settledPayout,
      createdAt: r.bet.createdAt.toISOString(),
      meme: {
        id: r.meme.id,
        slug: r.meme.slug,
        title: r.meme.title,
        kind: r.meme.kind as 'meme' | 'topic',
        status: r.meme.status,
        verdictSource: r.meme.verdictSource,
        currentN: r.meme.currentN,
        derivativeCount: r.meme.derivativeCount,
        thresholdN: r.meme.thresholdN,
        topicQuestion: r.meme.topicQuestion,
      },
      week: {
        id: r.week.id,
        weekNumber: r.week.weekNumber,
        status: r.week.status,
        settlesAt: r.week.settlesAt.toISOString(),
      },
    })),
  };

  return NextResponse.json(ResponseSchema.parse(body));
}
