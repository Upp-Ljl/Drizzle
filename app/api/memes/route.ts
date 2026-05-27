/**
 * GET /api/memes — 当前周候选池 + 头条三卡。
 *
 * Public, no auth.
 *
 * Returns: { week, memes, headerCards: { high, low, anomaly } }
 *
 * "当前周" 取 `weeks.status === 'open'` 行；若不存在，降级返回最近一期 settled 周
 * （这样早期 demo 无 open 周也不至于空白）。
 */

import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb } from '@/lib/db/client';
import { memes as memesTable, weeks as weeksTable } from '@/lib/db/schema';

const MemeRowSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  sourcePlatform: z.string(),
  firstSeenN: z.number().int(),
  currentN: z.number().int(),
  oddsX: z.number(),
  status: z.string(),
  tickerBlurb: z.string().nullable(),
  verdictSource: z.string().nullable(),
});

const WeekSchema = z.object({
  id: z.number().int(),
  weekNumber: z.number().int(),
  opensAt: z.string(),
  settlesAt: z.string(),
  status: z.string(),
});

const ResponseSchema = z.object({
  week: WeekSchema.nullable(),
  memes: z.array(MemeRowSchema),
  headerCards: z.object({
    high: MemeRowSchema.nullable(),
    low: MemeRowSchema.nullable(),
    anomaly: MemeRowSchema.nullable(),
  }),
});

export type MemeRow = z.infer<typeof MemeRowSchema>;
export type Week = z.infer<typeof WeekSchema>;
export type MemesApiResponse = z.infer<typeof ResponseSchema>;

export async function GET() {
  const db = requireDb();

  // 1. 选周：先找 open，否则最近 settled
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
    const empty: MemesApiResponse = {
      week: null,
      memes: [],
      headerCards: { high: null, low: null, anomaly: null },
    };
    return NextResponse.json(ResponseSchema.parse(empty));
  }

  const rawMemes = await db
    .select()
    .from(memesTable)
    .where(eq(memesTable.weekId, weekRow.id))
    .orderBy(desc(memesTable.currentN));

  const memeRows: MemeRow[] = rawMemes.map((m) => ({
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

  const headerCards = computeHeaderCards(memeRows);

  const week: Week = {
    id: weekRow.id,
    weekNumber: weekRow.weekNumber,
    opensAt: weekRow.opensAt.toISOString(),
    settlesAt: weekRow.settlesAt.toISOString(),
    status: weekRow.status,
  };

  const body: MemesApiResponse = { week, memes: memeRows, headerCards };
  return NextResponse.json(ResponseSchema.parse(body));
}

/** 三卡选举：
 *  - high   : currentN 最大
 *  - low    : currentN 最小但 ≥ 1000
 *  - anomaly: verdictSource === 'editorial' 或 tickerBlurb 含 "编辑"
 */
export function computeHeaderCards(rows: MemeRow[]): MemesApiResponse['headerCards'] {
  if (rows.length === 0) return { high: null, low: null, anomaly: null };

  const sortedByN = [...rows].sort((a, b) => b.currentN - a.currentN);
  const high = sortedByN[0] ?? null;

  const lowCandidates = rows.filter((r) => r.currentN >= 1000);
  const low =
    lowCandidates.length > 0
      ? lowCandidates.reduce((min, r) => (r.currentN < min.currentN ? r : min))
      : null;

  const anomaly =
    rows.find(
      (r) =>
        r.verdictSource === 'editorial' ||
        (r.tickerBlurb !== null && r.tickerBlurb.includes('编辑')),
    ) ?? null;

  return { high, low, anomaly };
}
