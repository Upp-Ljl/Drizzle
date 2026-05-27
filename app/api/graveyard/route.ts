/**
 * GET /api/graveyard?page=N&limit=M — 梗坟场 (分页列表)
 *
 * Public, no auth required.
 *
 * Query: { page (>=1, default 1), limit (1-50, default 20) } via Zod.
 *
 * Returns:
 *   {
 *     items: TombstoneRow[],
 *     page, limit, total, hasMore
 *   }
 *
 * NOTE — TSPR-BUG-3 lives in this file. See `offset` calc below.
 */

import { NextResponse } from 'next/server';
import { desc, eq, sql as dsql } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb } from '@/lib/db/client';
import {
  graveyard as graveyardTable,
  memes as memesTable,
} from '@/lib/db/schema';
import { PaginationQuery } from '@/lib/validation';

const TombstoneRowSchema = z.object({
  id: z.number().int(),
  memeId: z.number().int(),
  memeTitle: z.string(),
  memeSlug: z.string(),
  epitaph: z.string().nullable(),
  maxN: z.number().int(),
  backersCount: z.number().int(),
  flowersCount: z.number().int(),
  createdAt: z.string(),
});

const ResponseSchema = z.object({
  items: z.array(TombstoneRowSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  hasMore: z.boolean(),
});

export type TombstoneRow = z.infer<typeof TombstoneRowSchema>;
export type GraveyardApiResponse = z.infer<typeof ResponseSchema>;

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = PaginationQuery.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid pagination', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { page, limit } = parsed.data;

  const db = requireDb();

  // TSPR-BUG-3 — pagination off-by-one; pages 1 and 2 overlap.
  // Correct form would be `(page - 1) * limit`.
  const offset = page * limit;

  const rows = await db
    .select({
      id: graveyardTable.id,
      memeId: graveyardTable.memeId,
      epitaph: graveyardTable.epitaph,
      maxN: graveyardTable.maxN,
      backersCount: graveyardTable.backersCount,
      flowersCount: graveyardTable.flowersCount,
      createdAt: graveyardTable.createdAt,
      memeTitle: memesTable.title,
      memeSlug: memesTable.slug,
    })
    .from(graveyardTable)
    .innerJoin(memesTable, eq(memesTable.id, graveyardTable.memeId))
    .orderBy(desc(graveyardTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: dsql<number>`count(*)::int` })
    .from(graveyardTable);

  const items: TombstoneRow[] = rows.map((r) => ({
    id: r.id,
    memeId: r.memeId,
    memeTitle: r.memeTitle,
    memeSlug: r.memeSlug,
    epitaph: r.epitaph,
    maxN: r.maxN,
    backersCount: r.backersCount,
    flowersCount: r.flowersCount,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  }));

  const body: GraveyardApiResponse = {
    items,
    page,
    limit,
    total,
    hasMore: offset + items.length < total,
  };
  return NextResponse.json(ResponseSchema.parse(body));
}
