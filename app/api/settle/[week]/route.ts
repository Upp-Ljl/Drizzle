/**
 * GET /api/settle/[week] — 结算战绩
 *
 * Public, no auth required (浏览不要登录). If logged in, also includes
 * the caller's own bet records for that week.
 *
 * Path param `week` = weekNumber (integer, the natural number 1, 2, 3...)
 * NOT the row id.
 *
 * Returns:
 *   {
 *     week: { id, weekNumber, opensAt, settlesAt, status, editorialNotes },
 *     brokeMemes: [...],         // 命中的梗 (金证候选)
 *     deadMemes:  [...],         // 翻车的梗 (links to graveyard)
 *     editorialNotes: jsonb|null,
 *     userBets:   [...] | null,  // null if not logged in
 *   }
 */

import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { requireDb } from '@/lib/db/client';
import {
  bets as betsTable,
  graveyard as graveyardTable,
  memes as memesTable,
  weeks as weeksTable,
} from '@/lib/db/schema';
import { getServerUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ week: string }> },
) {
  const { week } = await params;
  const weekNumber = Number.parseInt(week, 10);
  if (!Number.isFinite(weekNumber) || weekNumber <= 0) {
    return NextResponse.json({ error: 'invalid week' }, { status: 400 });
  }

  const db = requireDb();

  const [weekRow] = await db
    .select()
    .from(weeksTable)
    .where(eq(weeksTable.weekNumber, weekNumber))
    .limit(1);
  if (!weekRow) {
    return NextResponse.json({ error: 'week not found' }, { status: 404 });
  }

  const memeRows = await db
    .select()
    .from(memesTable)
    .where(eq(memesTable.weekId, weekRow.id));

  const mapBroke = (m: (typeof memeRows)[number]) => ({
    id: m.id,
    title: m.title,
    slug: m.slug,
    sourcePlatform: m.sourcePlatform,
    firstSeenN: m.firstSeenN,
    currentN: m.currentN,
    oddsX: m.oddsX,
    verdictSource: m.verdictSource,
    kind: (m.kind as 'meme' | 'topic') ?? 'meme',
    templatePattern: m.templatePattern,
    derivativeCount: m.derivativeCount,
    topicQuestion: m.topicQuestion,
    thresholdN: m.thresholdN,
  });

  const brokeRows = memeRows.filter((m) => m.status === 'broke');
  const brokeMemes = brokeRows.map(mapBroke);
  const memesBroke = brokeRows.filter((m) => m.kind !== 'topic').map(mapBroke);
  const topicsBroke = brokeRows.filter((m) => m.kind === 'topic').map(mapBroke);

  // dead 梗：含 `in_graveyard` (已立碑) 也展示。LEFT JOIN graveyard for linking.
  const deadCandidates = memeRows.filter(
    (m) => m.status === 'dead' || m.status === 'in_graveyard',
  );
  const graveRows =
    deadCandidates.length > 0
      ? await db.select().from(graveyardTable)
      : [];
  const graveByMeme = new Map(graveRows.map((g) => [g.memeId, g]));

  const mapDead = (m: (typeof memeRows)[number]) => {
    const g = graveByMeme.get(m.id);
    return {
      id: m.id,
      title: m.title,
      slug: m.slug,
      currentN: m.currentN,
      graveyardId: g?.id ?? null,
      kind: (m.kind as 'meme' | 'topic') ?? 'meme',
      templatePattern: m.templatePattern,
      derivativeCount: m.derivativeCount,
      topicQuestion: m.topicQuestion,
      thresholdN: m.thresholdN,
    };
  };

  const deadMemes = deadCandidates.map(mapDead);
  const memesDead = deadCandidates
    .filter((m) => m.kind !== 'topic')
    .map(mapDead);
  const topicsDead = deadCandidates
    .filter((m) => m.kind === 'topic')
    .map(mapDead);

  // user bets (only if logged in)
  const user = await getServerUser();
  let userBets: Array<{
    id: number;
    memeId: number;
    memeTitle: string;
    amount: number;
    oddsAtBet: number;
    firstNAtBet: number;
    certificateId: string;
    settledPayout: number | null;
    createdAt: string;
  }> | null = null;

  if (user) {
    const memeIdsInWeek = memeRows.map((m) => m.id);
    if (memeIdsInWeek.length > 0) {
      const myBets = await db
        .select()
        .from(betsTable)
        .where(eq(betsTable.userId, user.id));
      const memeById = new Map(memeRows.map((m) => [m.id, m]));
      userBets = myBets
        .filter((b) => memeById.has(b.memeId))
        .map((b) => ({
          id: b.id,
          memeId: b.memeId,
          memeTitle: memeById.get(b.memeId)?.title ?? '',
          amount: b.amount,
          oddsAtBet: b.oddsAtBet,
          firstNAtBet: b.firstNAtBet,
          certificateId: b.certificateId,
          settledPayout: b.settledPayout,
          createdAt:
            b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
        }));
    } else {
      userBets = [];
    }
  }

  // Silence unused-import warning when `and` is not used; reference once.
  void and;

  return NextResponse.json({
    week: {
      id: weekRow.id,
      weekNumber: weekRow.weekNumber,
      opensAt: weekRow.opensAt.toISOString(),
      settlesAt: weekRow.settlesAt.toISOString(),
      status: weekRow.status,
      editorialNotes: weekRow.editorialNotes,
    },
    brokeMemes,
    deadMemes,
    memesBroke,
    memesDead,
    topicsBroke,
    topicsDead,
    editorialNotes: weekRow.editorialNotes,
    userBets,
  });
}
