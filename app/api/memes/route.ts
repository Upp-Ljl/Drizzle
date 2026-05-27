/**
 * GET /api/memes — 当前周候选池 + 头条三卡。
 *
 * Public, no auth.
 *
 * Query params:
 *   - kind: 'meme' | 'topic'  (default 'meme')
 *
 * Returns: { week, memes, headerCards: { high, low, anomaly } }
 *
 * "当前周" 取 `weeks.status === 'open'` 行；若不存在，降级返回最近一期 settled 周
 * （这样早期 demo 无 open 周也不至于空白）。
 */

import { NextResponse, type NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb } from '@/lib/db/client';
import { memes as memesTable, weeks as weeksTable } from '@/lib/db/schema';

const KindSchema = z.enum(['meme', 'topic']);
export type Kind = z.infer<typeof KindSchema>;

const MemeRowSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  sourcePlatform: z.string(),
  kind: KindSchema,
  templatePattern: z.string().nullable(),
  derivativeCount: z.number().int(),
  thresholdN: z.number().int().nullable(),
  topicQuestion: z.string().nullable(),
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
  kind: KindSchema,
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

export async function GET(req: NextRequest) {
  const db = requireDb();

  const kindParam = req.nextUrl.searchParams.get('kind');
  const kindParsed = KindSchema.safeParse(kindParam ?? 'meme');
  const kind: Kind = kindParsed.success ? kindParsed.data : 'meme';

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
      kind,
      memes: [],
      headerCards: { high: null, low: null, anomaly: null },
    };
    return NextResponse.json(ResponseSchema.parse(empty));
  }

  const sortColumn = kind === 'meme' ? memesTable.derivativeCount : memesTable.currentN;

  const rawMemes = await db
    .select()
    .from(memesTable)
    .where(and(eq(memesTable.weekId, weekRow.id), eq(memesTable.kind, kind)))
    .orderBy(desc(sortColumn));

  const memeRows: MemeRow[] = rawMemes.map((m) => ({
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

  const headerCards = computeHeaderCards(memeRows, kind);

  const week: Week = {
    id: weekRow.id,
    weekNumber: weekRow.weekNumber,
    opensAt: weekRow.opensAt.toISOString(),
    settlesAt: weekRow.settlesAt.toISOString(),
    status: weekRow.status,
  };

  const body: MemesApiResponse = { week, kind, memes: memeRows, headerCards };
  return NextResponse.json(ResponseSchema.parse(body));
}

/** 三卡选举：kind-aware
 *  Memes (kind='meme')：
 *    - high   : derivativeCount 最大
 *    - low    : derivativeCount 最小但 ≥ 1000
 *  Topics (kind='topic')：
 *    - high   : currentN 最大
 *    - low    : currentN 最小但 ≥ 1000
 *  anomaly (两类共通): verdictSource === 'editorial' 或 tickerBlurb 含 "编辑"
 */
export function computeHeaderCards(
  rows: MemeRow[],
  kind: Kind,
): MemesApiResponse['headerCards'] {
  if (rows.length === 0) return { high: null, low: null, anomaly: null };

  const metric = (r: MemeRow): number =>
    kind === 'meme' ? r.derivativeCount : r.currentN;

  const sorted = [...rows].sort((a, b) => metric(b) - metric(a));
  const high = sorted[0] ?? null;

  const lowCandidates = rows.filter((r) => metric(r) >= 1000);
  const low =
    lowCandidates.length > 0
      ? lowCandidates.reduce((min, r) => (metric(r) < metric(min) ? r : min))
      : null;

  const anomaly =
    rows.find(
      (r) =>
        r.verdictSource === 'editorial' ||
        (r.tickerBlurb !== null && r.tickerBlurb.includes('编辑')),
    ) ?? null;

  return { high, low, anomaly };
}
