// @screen 首页 (今日气象)
//
// Server component — 直接调 DB 拿初始数据，传给 BoardTabs (client)。
// 浏览全程零门槛，符合 PRODUCT-SPEC §1 决策 #2。
//
// v0.2 双板：?kind=meme (default) | ?kind=topic

import { and, desc, eq } from 'drizzle-orm';
import { Countdown } from '@/components/countdown';
import { BoardTabs } from '@/components/board-tabs';
import { TickerStrip } from '@/components/ticker-strip';
import { requireDb } from '@/lib/db/client';
import { memes as memesTable, weeks as weeksTable } from '@/lib/db/schema';
import {
  computeHeaderCards,
  type Kind,
  type MemesApiResponse,
  type MemeRow,
} from '@/app/api/memes/route';

export const dynamic = 'force-dynamic';

async function loadInitial(kind: Kind): Promise<MemesApiResponse> {
  const db = requireDb();

  const openWeek = await db
    .select()
    .from(weeksTable)
    .where(eq(weeksTable.status, 'open'))
    .orderBy(desc(weeksTable.weekNumber))
    .limit(1);

  let weekRow = openWeek[0];
  if (!weekRow) {
    const settled = await db
      .select()
      .from(weeksTable)
      .where(eq(weeksTable.status, 'settled'))
      .orderBy(desc(weeksTable.weekNumber))
      .limit(1);
    weekRow = settled[0];
  }

  if (!weekRow) {
    return {
      week: null,
      kind,
      memes: [],
      headerCards: { high: null, low: null, anomaly: null },
    };
  }

  const sortColumn = kind === 'meme' ? memesTable.derivativeCount : memesTable.currentN;

  const rawMemes = await db
    .select()
    .from(memesTable)
    .where(and(eq(memesTable.weekId, weekRow.id), eq(memesTable.kind, kind)))
    .orderBy(desc(sortColumn));

  const memes: MemeRow[] = rawMemes.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    sourcePlatform: m.sourcePlatform,
    kind: m.kind as Kind,
    templatePattern: m.templatePattern,
    derivativeCount: m.derivativeCount,
    thresholdN: m.thresholdN,
    topicQuestion: m.topicQuestion,
    firstSeenN: m.firstSeenN,
    currentN: m.currentN,
    oddsX: m.oddsX,
    status: m.status,
    tickerBlurb: m.tickerBlurb,
    verdictSource: m.verdictSource,
  }));

  return {
    week: {
      id: weekRow.id,
      weekNumber: weekRow.weekNumber,
      opensAt: weekRow.opensAt.toISOString(),
      settlesAt: weekRow.settlesAt.toISOString(),
      status: weekRow.status,
    },
    kind,
    memes,
    headerCards: computeHeaderCards(memes, kind),
  };
}

function parseKind(value: string | string[] | undefined): Kind {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'topic' ? 'topic' : 'meme';
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  // Next 15: searchParams is async. Support both shapes.
  const resolved = (await Promise.resolve(searchParams)) ?? {};
  const kind = parseKind(resolved.kind);

  let initial: MemesApiResponse;
  try {
    initial = await loadInitial(kind);
  } catch (err) {
    // DB 未配置时不让首页爆——给空骨架，提示用户 .env.local 未填。
    console.warn('[home] failed to load initial data:', err);
    initial = {
      week: null,
      kind,
      memes: [],
      headerCards: { high: null, low: null, anomaly: null },
    };
  }

  return (
    <div className="container-x py-6 sm:py-10 space-y-5 sm:space-y-6">
      <header className="space-y-2">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-ink">今日气象</h1>
          <Countdown
            weekNumber={initial.week?.weekNumber ?? null}
            settlesAt={initial.week?.settlesAt ?? null}
          />
        </div>
        <p className="text-sm text-muted">
          猜下周哪个梗会火 · 数据来自 mock fake source · 浏览免登录
        </p>
      </header>

      <TickerStrip />

      <BoardTabs kind={kind} initial={initial} />
    </div>
  );
}
