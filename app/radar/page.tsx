// @screen 屏 3 — 早期信号雷达 (/radar)
//
// Server component: fetches signals directly from the DB and groups by tier
// (red / yellow / green). Each tier renders inside <SignalRadar> which is a
// client component (because the nominate button needs intent+auth).
//
// "当前周" 选取与 /api/memes 一致：先 open, 否则最近 settled。weekId 仅传给
// 客户端组件用于构造 nominate intent.

import { desc, eq } from 'drizzle-orm';
import { requireDb } from '@/lib/db/client';
import { signals as signalsTable, weeks as weeksTable } from '@/lib/db/schema';
import { SignalRadar } from '@/components/signal-radar';
import type { SignalRow } from '@/app/api/radar/route';

export const dynamic = 'force-dynamic';

async function loadCurrentWeekId(): Promise<number | null> {
  const db = requireDb();
  const open = await db
    .select()
    .from(weeksTable)
    .where(eq(weeksTable.status, 'open'))
    .orderBy(desc(weeksTable.weekNumber))
    .limit(1);
  if (open[0]) return open[0].id;
  const settled = await db
    .select()
    .from(weeksTable)
    .where(eq(weeksTable.status, 'settled'))
    .orderBy(desc(weeksTable.weekNumber))
    .limit(1);
  return settled[0]?.id ?? null;
}

async function loadSignals(): Promise<{
  red: SignalRow[];
  yellow: SignalRow[];
  green: SignalRow[];
}> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.score));

  const buckets: Record<'red' | 'yellow' | 'green', SignalRow[]> = {
    red: [],
    yellow: [],
    green: [],
  };
  for (const r of rows) {
    const row: SignalRow = {
      id: r.id,
      source: r.source,
      candidateTitle: r.candidateTitle,
      score: r.score,
      tier: r.tier as 'red' | 'yellow' | 'green',
      authorHandle: r.authorHandle,
      authorFollowers: r.authorFollowers,
      growth24h: r.growth24h,
      addedAt: r.addedAt.toISOString(),
    };
    if (row.tier === 'red' || row.tier === 'yellow' || row.tier === 'green') {
      buckets[row.tier].push(row);
    }
  }
  return buckets;
}

export default async function RadarPage() {
  const [weekId, signals] = await Promise.all([
    loadCurrentWeekId(),
    loadSignals(),
  ]);
  const safeWeekId = weekId ?? 0;

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif tracking-tight">早期信号雷达</h1>
        <p className="text-sm text-muted">
          发现还没进池的早期梗。提名进池需登录,每人每周配额 2 次。
        </p>
      </header>

      <SignalRadar tier="red" signals={signals.red} weekId={safeWeekId} />
      <SignalRadar tier="yellow" signals={signals.yellow} weekId={safeWeekId} />
      <SignalRadar tier="green" signals={signals.green} weekId={safeWeekId} />
    </div>
  );
}
