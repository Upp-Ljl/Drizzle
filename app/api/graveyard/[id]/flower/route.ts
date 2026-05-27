/**
 * POST /api/graveyard/[id]/flower — 献花
 *
 * Auth required (401 if not logged in).
 *
 * - Upserts a row in `profiles` (a freshly-OAuth'd Supabase user might not yet
 *   have a profiles row; we synthesise a handle from the OAuth metadata).
 * - Inserts a row in `flowers` keyed by (graveyardId, userId, dayKey UTC).
 *   The unique index enforces "1 献花 per user per grave per UTC day" — if the
 *   user已献过, we return 200 with `alreadyFlowered: true`.
 * - Increments `graveyard.flowersCount`.
 * - Writes an `audit_log` row.
 *
 * Body: { graveyardId: number } — must match the path param.
 *
 * Returns:
 *   401 { error: 'unauthorized' }
 *   400 { error: 'invalid input' | 'mismatch' }
 *   404 { error: 'graveyard not found' }
 *   200 { ok: true, flowersCount, alreadyFlowered }
 */

import { NextResponse } from 'next/server';
import { eq, sql as dsql } from 'drizzle-orm';
import { requireDb } from '@/lib/db/client';
import {
  auditLog,
  flowers as flowersTable,
  graveyard as graveyardTable,
  profiles as profilesTable,
} from '@/lib/db/schema';
import { FlowerInput } from '@/lib/validation';
import { getServerUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

function todayUtcDayKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function deriveHandle(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }): string {
  const md = user.user_metadata ?? {};
  const candidates = [
    md.user_name,
    md.preferred_username,
    md.name,
    user.email,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) {
      return c.trim().slice(0, 40);
    }
  }
  return `user_${user.id.slice(0, 8)}`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const pathGraveyardId = Number.parseInt(id, 10);
  if (!Number.isFinite(pathGraveyardId) || pathGraveyardId <= 0) {
    return NextResponse.json({ error: 'invalid graveyard id' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = FlowerInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (parsed.data.graveyardId !== pathGraveyardId) {
    return NextResponse.json(
      { error: 'mismatch', message: 'path id and body graveyardId differ' },
      { status: 400 },
    );
  }

  const db = requireDb();

  const [grave] = await db
    .select()
    .from(graveyardTable)
    .where(eq(graveyardTable.id, pathGraveyardId))
    .limit(1);
  if (!grave) {
    return NextResponse.json({ error: 'graveyard not found' }, { status: 404 });
  }

  // 1. Upsert profiles row BEFORE flower insert (so FK satisfied).
  const handle = deriveHandle({
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata as Record<string, unknown> | null,
  });
  await db
    .insert(profilesTable)
    .values({
      id: user.id,
      handle,
    })
    .onConflictDoNothing({ target: profilesTable.id });

  // 2. Insert flower; rely on unique index to enforce 1/day.
  const dayKey = todayUtcDayKey();
  let alreadyFlowered = false;
  let flowerInserted = false;
  try {
    const inserted = await db
      .insert(flowersTable)
      .values({
        graveyardId: pathGraveyardId,
        userId: user.id,
        dayKey,
      })
      .onConflictDoNothing({
        target: [flowersTable.graveyardId, flowersTable.userId, flowersTable.dayKey],
      })
      .returning({ id: flowersTable.id });
    flowerInserted = inserted.length > 0;
    alreadyFlowered = !flowerInserted;
  } catch {
    // Defensive: if onConflict path differs in driver, fall back to alreadyFlowered=true.
    alreadyFlowered = true;
  }

  // 3. Increment graveyard.flowersCount only if a new flower was inserted.
  let updatedFlowersCount = grave.flowersCount;
  if (flowerInserted) {
    const [updated] = await db
      .update(graveyardTable)
      .set({ flowersCount: dsql`${graveyardTable.flowersCount} + 1` })
      .where(eq(graveyardTable.id, pathGraveyardId))
      .returning({ flowersCount: graveyardTable.flowersCount });
    updatedFlowersCount = updated?.flowersCount ?? updatedFlowersCount;
  }

  // 4. Audit log (always, even on no-op so tspr sees the attempt).
  await db.insert(auditLog).values({
    userId: user.id,
    action: 'flower',
    entityType: 'graveyard',
    entityId: String(pathGraveyardId),
    payload: { dayKey, alreadyFlowered },
  });

  return NextResponse.json({
    ok: true,
    flowersCount: updatedFlowersCount,
    alreadyFlowered,
  });
}
