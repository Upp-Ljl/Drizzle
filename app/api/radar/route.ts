/**
 * GET /api/radar — 早期信号雷达
 *
 * Public, no auth required (浏览不要登录).
 *
 * Query:
 *   ?kind=meme  → only meme signals, returned as a single tiered group
 *   ?kind=topic → only topic signals, returned as a single tiered group
 *   (none)      → both kinds returned, each grouped by tier
 *
 * Response shape (Zod-validated):
 *
 *   When kind is present:
 *     { kind: 'meme'|'topic',
 *       signals: { red: SignalRow[], yellow: SignalRow[], green: SignalRow[] } }
 *
 *   When kind is absent:
 *     { meme:  { red: SignalRow[], yellow: SignalRow[], green: SignalRow[] },
 *       topic: { red: SignalRow[], yellow: SignalRow[], green: SignalRow[] } }
 *
 * Tier 划分见 PRODUCT-SPEC §5.3:
 *   🔴 red    : score > 80
 *   🟡 yellow : 50 < score <= 80
 *   🟢 green  : 30 < score <= 50
 *
 * 这里直接信任 `signals.tier` 列的预存值 (seed 时已按 score 分档),
 * 但同时按 score desc 排序每档内部。
 */

import { NextResponse, type NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb } from '@/lib/db/client';
import { signals as signalsTable } from '@/lib/db/schema';

const KindSchema = z.enum(['meme', 'topic']);
export type SignalKind = z.infer<typeof KindSchema>;

const SignalRowSchema = z.object({
  id: z.number().int(),
  source: z.string(),
  kind: KindSchema,
  candidateTitle: z.string(),
  score: z.number().int(),
  tier: z.enum(['red', 'yellow', 'green']),
  authorHandle: z.string().nullable(),
  authorFollowers: z.number().int().nullable(),
  growth24h: z.number(),
  addedAt: z.string(),
});

const TierGroupSchema = z.object({
  red: z.array(SignalRowSchema),
  yellow: z.array(SignalRowSchema),
  green: z.array(SignalRowSchema),
});

const KindedResponseSchema = z.object({
  kind: KindSchema,
  signals: TierGroupSchema,
});

const GroupedResponseSchema = z.object({
  meme: TierGroupSchema,
  topic: TierGroupSchema,
});

export type SignalRow = z.infer<typeof SignalRowSchema>;
export type TierGroup = z.infer<typeof TierGroupSchema>;
export type RadarKindedResponse = z.infer<typeof KindedResponseSchema>;
export type RadarGroupedResponse = z.infer<typeof GroupedResponseSchema>;
export type RadarApiResponse = RadarKindedResponse | RadarGroupedResponse;

export const dynamic = 'force-dynamic';

function emptyTierGroup(): TierGroup {
  return { red: [], yellow: [], green: [] };
}

function toRow(r: {
  id: number;
  source: string;
  kind: string;
  candidateTitle: string;
  score: number;
  tier: string;
  authorHandle: string | null;
  authorFollowers: number | null;
  growth24h: number;
  addedAt: Date;
}): SignalRow | null {
  if (r.tier !== 'red' && r.tier !== 'yellow' && r.tier !== 'green') return null;
  if (r.kind !== 'meme' && r.kind !== 'topic') return null;
  return {
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
}

export async function GET(req: NextRequest) {
  const db = requireDb();
  const kindParam = req.nextUrl.searchParams.get('kind');
  const parsedKind = kindParam ? KindSchema.safeParse(kindParam) : null;

  if (parsedKind && !parsedKind.success) {
    return NextResponse.json(
      { error: 'invalid kind; expected "meme" or "topic"' },
      { status: 400 },
    );
  }

  if (parsedKind && parsedKind.success) {
    const kind = parsedKind.data;
    const rows = await db
      .select()
      .from(signalsTable)
      .where(eq(signalsTable.kind, kind))
      .orderBy(desc(signalsTable.score));

    const buckets = emptyTierGroup();
    for (const r of rows) {
      const row = toRow(r);
      if (row) buckets[row.tier].push(row);
    }
    const body: RadarKindedResponse = { kind, signals: buckets };
    return NextResponse.json(KindedResponseSchema.parse(body));
  }

  // No kind: return both kinds grouped.
  const rows = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.score));

  const grouped: RadarGroupedResponse = {
    meme: emptyTierGroup(),
    topic: emptyTierGroup(),
  };
  for (const r of rows) {
    const row = toRow(r);
    if (!row) continue;
    grouped[row.kind][row.tier].push(row);
  }
  return NextResponse.json(GroupedResponseSchema.parse(grouped));
}
