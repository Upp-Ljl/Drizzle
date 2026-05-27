// @screen 首页 (今日气象)
//
// Server component — 直接调 DB 拿初始数据，传给 MemeTable (client)。
// 浏览全程零门槛，符合 PRODUCT-SPEC §1 决策 #2。

import { desc, eq } from 'drizzle-orm';
import { Countdown } from '@/components/countdown';
import { WeatherHeader } from '@/components/weather-header';
import { MemeTable } from '@/components/meme-table';
import { TickerStrip } from '@/components/ticker-strip';
import { requireDb } from '@/lib/db/client';
import { memes as memesTable, weeks as weeksTable } from '@/lib/db/schema';
import { computeHeaderCards, type MemesApiResponse, type MemeRow } from '@/app/api/memes/route';

export const dynamic = 'force-dynamic';

async function loadInitial(): Promise<MemesApiResponse> {
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
      memes: [],
      headerCards: { high: null, low: null, anomaly: null },
    };
  }

  const rawMemes = await db
    .select()
    .from(memesTable)
    .where(eq(memesTable.weekId, weekRow.id))
    .orderBy(desc(memesTable.currentN));

  const memes: MemeRow[] = rawMemes.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    sourcePlatform: m.sourcePlatform,
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
    memes,
    headerCards: computeHeaderCards(memes),
  };
}

export default async function HomePage() {
  let initial: MemesApiResponse;
  try {
    initial = await loadInitial();
  } catch (err) {
    // DB 未配置时不让首页爆——给空骨架，提示用户 .env.local 未填。
    console.warn('[home] failed to load initial data:', err);
    initial = {
      week: null,
      memes: [],
      headerCards: { high: null, low: null, anomaly: null },
    };
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h1 className="text-3xl font-serif tracking-tight text-ink">今日气象</h1>
          <Countdown
            weekNumber={initial.week?.weekNumber ?? null}
            settlesAt={initial.week?.settlesAt ?? null}
          />
        </div>
        <p className="text-sm text-muted">
          猜下周哪个梗会火 · 数据来自 mock fake source · 浏览免登录
        </p>
      </header>

      <WeatherHeader
        high={initial.headerCards.high}
        low={initial.headerCards.low}
        anomaly={initial.headerCards.anomaly}
      />

      <TickerStrip />

      <MemeTable initial={initial} />
    </div>
  );
}
