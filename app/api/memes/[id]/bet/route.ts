/**
 * POST /api/memes/[id]/bet
 *
 * Place a bet on a meme.
 *
 * Auth required: returns 401 if no logged-in user.
 *
 * Side effects:
 *   - upserts a profiles row for the authed user (first-bet boot)
 *   - inserts a bets row with certificateId + firstNAtBet snapshot
 *   - debits weekly_coins
 *   - writes audit_log entry (action='bet', entity_type='meme')
 *
 * Returns: { certificateId, bet }
 *
 * NOTE: contains TSPR-BUG-2 (non-atomic wallet read-modify-write). Do not fix
 * here without removing the // TSPR-BUG-2 marker and adding a regression test.
 */

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { and, eq, isNull, sql as dsql } from 'drizzle-orm';
import { requireDb } from '@/lib/db/client';
import { auditLog, bets, memes, profiles } from '@/lib/db/schema';
import { getServerUser } from '@/lib/auth/server';
import { BetInput } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function shortCertId() {
  return crypto.randomUUID().slice(0, 8);
}

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'login required' }, { status: 401 });
  }

  const { id } = await params;
  const memeId = Number.parseInt(id, 10);
  if (!Number.isFinite(memeId) || memeId <= 0) {
    return NextResponse.json({ error: 'invalid meme id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = BetInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid input', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { amount } = parsed.data;

  const db = requireDb();

  // Upsert profile row so first-time GitHub users have a wallet.
  // ON CONFLICT (id) DO NOTHING — handle collision is unlikely but tolerated.
  const handle = deriveHandle(user);
  await db
    .insert(profiles)
    .values({
      id: user.id,
      handle,
      level: 1,
      weeklyCoins: 100,
    })
    .onConflictDoNothing({ target: profiles.id });

  // Read user's wallet
  const [profile] = await db
    .select({ weeklyCoins: profiles.weeklyCoins })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!profile) {
    return NextResponse.json({ error: 'profile missing' }, { status: 500 });
  }

  // Read meme heat + locked-in odds
  const [meme] = await db
    .select({
      id: memes.id,
      currentN: memes.currentN,
      oddsX: memes.oddsX,
      status: memes.status,
    })
    .from(memes)
    .where(eq(memes.id, memeId))
    .limit(1);
  if (!meme) {
    return NextResponse.json({ error: 'meme not found' }, { status: 404 });
  }
  if (meme.status !== 'in_pool') {
    return NextResponse.json(
      { error: 'meme not open for bets', status: meme.status },
      { status: 409 },
    );
  }

  if (profile.weeklyCoins < amount) {
    return NextResponse.json(
      { error: 'insufficient coins', weeklyCoins: profile.weeklyCoins },
      { status: 400 },
    );
  }

  const certificateId = shortCertId();
  const firstNAtBet = meme.currentN;
  const oddsAtBet = meme.oddsX;

  const [inserted] = await db
    .insert(bets)
    .values({
      userId: user.id,
      memeId,
      amount,
      oddsAtBet,
      firstNAtBet,
      certificateId,
    })
    .returning();

  // TSPR-BUG-2 — non-atomic read-modify-write of weekly_coins; concurrent posts can overdraft.
  // Correct version would be: update profiles set weekly_coins = weekly_coins - ${amount}
  //                           where id = ${user.id} and weekly_coins >= ${amount}
  //                           inside a transaction or with a row lock.
  const newBalance = profile.weeklyCoins - amount;
  await db
    .update(profiles)
    .set({ weeklyCoins: newBalance, updatedAt: dsql`now()` })
    .where(eq(profiles.id, user.id));

  await db.insert(auditLog).values({
    userId: user.id,
    action: 'bet',
    entityType: 'meme',
    entityId: String(memeId),
    payload: {
      betId: inserted.id,
      amount,
      oddsAtBet,
      firstNAtBet,
      certificateId,
    },
  });

  // Compute backers count for cert display ("你是第 X 个押注者")
  const [{ count: backersCount }] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(bets)
    .where(and(eq(bets.memeId, memeId), isNull(bets.cancelledAt)));

  return NextResponse.json({
    certificateId,
    bet: inserted,
    backersCount,
  });
}
