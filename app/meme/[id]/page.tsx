// @screen 屏 2 — 单梗详情 (押注主战场)
//
// Server component: fetches meme + recent bets + backers count, then hands
// off to the client `<MemeDetail>` component which owns interactive state
// (bet form, intent replay, cert reveal).

import { notFound } from 'next/navigation';
import { and, desc, eq, isNull, sql as dsql } from 'drizzle-orm';
import { requireDb } from '@/lib/db/client';
import { bets, memes, profiles } from '@/lib/db/schema';
import { MemeDetail } from '@/components/meme-detail';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const memeId = Number.parseInt(id, 10);
  if (!Number.isFinite(memeId) || memeId <= 0) notFound();

  const db = requireDb();

  const [meme] = await db.select().from(memes).where(eq(memes.id, memeId)).limit(1);
  if (!meme) notFound();

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
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    handle: r.handle ?? r.displayName ?? '匿名',
  }));

  const [{ count: backersCount }] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(bets)
    .where(and(eq(bets.memeId, memeId), isNull(bets.cancelledAt)));

  return (
    <div className="container-x py-6 sm:py-10 max-w-5xl">
      <MemeDetail
        meme={{
          id: meme.id,
          title: meme.title,
          slug: meme.slug,
          sourcePlatform: meme.sourcePlatform,
          sourceUrl: meme.sourceUrl,
          currentN: meme.currentN,
          firstSeenN: meme.firstSeenN,
          oddsX: meme.oddsX,
          status: meme.status,
          kind: (meme.kind as 'meme' | 'topic') ?? 'meme',
          templatePattern: meme.templatePattern,
          derivativeCount: meme.derivativeCount,
          thresholdN: meme.thresholdN,
          topicQuestion: meme.topicQuestion,
        }}
        recentBets={recentBets}
        backersCount={backersCount}
      />
    </div>
  );
}
