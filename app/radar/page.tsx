// @screen 屏 3 — 早期信号雷达 (/radar)
//
// Server component: fetches signals directly from the DB, splits by kind
// (meme / topic), and groups each kind into three tiers (red / yellow / green).
// Each tier renders inside <SignalRadar> which is a client component
// (because the nominate button needs intent+auth).
//
// 两段式布局：
//   🔥 热梗信号 — 模板/句式扩散视角 (B站待爆 / 小红书冷启动)
//   📰 话题信号 — 娱乐事件提及量陡升视角 (微博暖搜 / 抖音上升)
//
// "当前周" 选取与 /api/memes 一致：先 open, 否则最近 settled。weekId 仅传给
// 客户端组件用于构造 nominate intent.

import { desc, eq } from 'drizzle-orm';
import { requireDb } from '@/lib/db/client';
import { signals as signalsTable, weeks as weeksTable } from '@/lib/db/schema';
import { SignalRadar } from '@/components/signal-radar';
import type { SignalRow, SignalKind } from '@/app/api/radar/route';

export const dynamic = 'force-dynamic';

type TierBuckets = { red: SignalRow[]; yellow: SignalRow[]; green: SignalRow[] };
type ByKind = Record<SignalKind, TierBuckets>;

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

function emptyBuckets(): TierBuckets {
  return { red: [], yellow: [], green: [] };
}

async function loadSignals(): Promise<ByKind> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.score));

  const grouped: ByKind = {
    meme: emptyBuckets(),
    topic: emptyBuckets(),
  };
  for (const r of rows) {
    if (r.kind !== 'meme' && r.kind !== 'topic') continue;
    if (r.tier !== 'red' && r.tier !== 'yellow' && r.tier !== 'green') continue;
    const row: SignalRow = {
      id: r.id,
      source: r.source,
      kind: r.kind,
      candidateTitle: r.candidateTitle,
      score: r.score,
      tier: r.tier,
      authorHandle: r.authorHandle,
      authorFollowers: r.authorFollowers,
      growth24h: r.growth24h,
      addedAt: r.addedAt.toISOString(),
    };
    grouped[row.kind][row.tier].push(row);
  }
  return grouped;
}

type SectionMeta = {
  kind: SignalKind;
  emoji: string;
  title: string;
  sub: string;
};

const SECTIONS: SectionMeta[] = [
  {
    kind: 'meme',
    emoji: '🔥',
    title: '热梗信号',
    sub: '还没大火但已经在边缘扩散的模板/句式 (B站待爆 / 小红书冷启动)',
  },
  {
    kind: 'topic',
    emoji: '📰',
    title: '话题信号',
    sub: '还没上热搜但提及量陡升的娱乐事件 (微博暖搜 / 抖音上升)',
  },
];

export default async function RadarPage() {
  const [weekId, byKind] = await Promise.all([
    loadCurrentWeekId(),
    loadSignals(),
  ]);
  const safeWeekId = weekId ?? 0;

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif tracking-tight">早期信号雷达</h1>
        <p className="text-sm text-muted">
          发现还没进池的早期梗。提名进本周池需登录,每人每周配额 2 次。
        </p>
      </header>

      {SECTIONS.map((sec) => {
        const buckets = byKind[sec.kind];
        return (
          <section
            key={sec.kind}
            data-testid={`radar-section-${sec.kind}`}
            className="space-y-5"
          >
            <header className="space-y-1 border-b border-warmline pb-2">
              <h2 className="text-2xl font-serif tracking-tight">
                <span aria-hidden>{sec.emoji} </span>
                {sec.title}
              </h2>
              <p className="text-xs text-muted">{sec.sub}</p>
            </header>

            <SignalRadar
              kind={sec.kind}
              tier="red"
              signals={buckets.red}
              weekId={safeWeekId}
            />
            <SignalRadar
              kind={sec.kind}
              tier="yellow"
              signals={buckets.yellow}
              weekId={safeWeekId}
            />
            <SignalRadar
              kind={sec.kind}
              tier="green"
              signals={buckets.green}
              weekId={safeWeekId}
            />
          </section>
        );
      })}
    </div>
  );
}
