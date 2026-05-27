/**
 * GET /api/radar — 早期信号雷达 (三档分组：red / yellow / green)
 *
 * Public, no auth required (浏览不要登录).
 *
 * Returns: { signals: { red: SignalRow[], yellow: SignalRow[], green: SignalRow[] } }
 *
 * Tier 划分见 PRODUCT-SPEC §5.3:
 *   🔴 red    : score > 80
 *   🟡 yellow : 50 < score <= 80
 *   🟢 green  : 30 < score <= 50
 *
 * 这里直接信任 `signals.tier` 列的预存值 (seed 时已按 score 分档),
 * 但同时按 score desc 排序每档内部。
 */

import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb } from '@/lib/db/client';
import { signals as signalsTable } from '@/lib/db/schema';

const SignalRowSchema = z.object({
  id: z.number().int(),
  source: z.string(),
  candidateTitle: z.string(),
  score: z.number().int(),
  tier: z.enum(['red', 'yellow', 'green']),
  authorHandle: z.string().nullable(),
  authorFollowers: z.number().int().nullable(),
  growth24h: z.number(),
  addedAt: z.string(),
});

const ResponseSchema = z.object({
  signals: z.object({
    red: z.array(SignalRowSchema),
    yellow: z.array(SignalRowSchema),
    green: z.array(SignalRowSchema),
  }),
});

export type SignalRow = z.infer<typeof SignalRowSchema>;
export type RadarApiResponse = z.infer<typeof ResponseSchema>;

export const dynamic = 'force-dynamic';

export async function GET() {
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

  const body: RadarApiResponse = { signals: buckets };
  return NextResponse.json(ResponseSchema.parse(body));
}
