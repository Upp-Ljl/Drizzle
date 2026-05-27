/**
 * GET /api/me/profile — current user's profile + wallet usage this week.
 *
 * Auth required (401 if no user).
 *
 * Upserts a profiles row if missing (idempotent, ON CONFLICT (id) DO NOTHING).
 * `handle` derived from user_metadata.user_name → email → id.
 *
 * Returns: { user: { id, email, userName }, profile: { handle, level,
 *   weeklyCoins, coinsResetAt }, usedThisWeek }
 *
 * `usedThisWeek` = sum(bets.amount) where week.status='open' for this user.
 */

import { NextResponse } from 'next/server';
import { and, eq, sql as dsql } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb } from '@/lib/db/client';
import { bets as betsTable, memes as memesTable, profiles, weeks as weeksTable } from '@/lib/db/schema';
import { getServerUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

const ResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().nullable(),
    userName: z.string().nullable(),
  }),
  profile: z.object({
    handle: z.string(),
    level: z.number().int(),
    weeklyCoins: z.number().int(),
    coinsResetAt: z.string(),
  }),
  usedThisWeek: z.number().int(),
});

export type MyProfileApiResponse = z.infer<typeof ResponseSchema>;

function deriveHandle(user: {
  user_metadata?: Record<string, unknown> | null;
  email?: string | null;
  id: string;
}): string {
  const meta = user.user_metadata ?? {};
  const userName =
    typeof meta.user_name === 'string' && meta.user_name.length > 0
      ? (meta.user_name as string)
      : null;
  if (userName) return userName;
  if (user.email) return user.email;
  return user.id;
}

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'login required' }, { status: 401 });
  }

  const db = requireDb();
  const handle = deriveHandle(user);

  // Idempotent upsert — first-time login boot.
  await db
    .insert(profiles)
    .values({
      id: user.id,
      handle,
      level: 1,
      weeklyCoins: 100,
    })
    .onConflictDoNothing({ target: profiles.id });

  const [profile] = await db
    .select({
      handle: profiles.handle,
      level: profiles.level,
      weeklyCoins: profiles.weeklyCoins,
      coinsResetAt: profiles.coinsResetAt,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: 'profile missing' }, { status: 500 });
  }

  // Sum bets.amount across all open-week bets for this user.
  const [{ used }] = await db
    .select({ used: dsql<number>`coalesce(sum(${betsTable.amount}), 0)::int` })
    .from(betsTable)
    .innerJoin(memesTable, eq(betsTable.memeId, memesTable.id))
    .innerJoin(weeksTable, eq(memesTable.weekId, weeksTable.id))
    .where(and(eq(betsTable.userId, user.id), eq(weeksTable.status, 'open')));

  const meta = user.user_metadata ?? {};
  const userName =
    typeof meta.user_name === 'string' && meta.user_name.length > 0
      ? (meta.user_name as string)
      : null;

  const body: MyProfileApiResponse = {
    user: {
      id: user.id,
      email: user.email ?? null,
      userName,
    },
    profile: {
      handle: profile.handle,
      level: profile.level,
      weeklyCoins: profile.weeklyCoins,
      coinsResetAt: profile.coinsResetAt.toISOString(),
    },
    usedThisWeek: used ?? 0,
  };

  return NextResponse.json(ResponseSchema.parse(body));
}
