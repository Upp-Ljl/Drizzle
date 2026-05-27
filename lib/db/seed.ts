/**
 * Deterministic seed for Phase 1.
 *
 * Usage: pnpm db:seed
 *
 * Idempotent — drops existing rows in non-Supabase-managed tables and reinserts.
 * Does NOT touch auth.users (Supabase-managed).
 *
 * Generates:
 *   - 3 weeks (week_number 45, 46, 47) → 45+46 settled, 47 open (current)
 *   - 30 memes (10 in each week)
 *   - 5 signals
 *   - 5 graveyard entries (from settled-dead memes)
 *   - ~20 mock bets (denormalized display_name, null user_id)
 */

// Run with: pnpm db:seed  (uses Node --env-file=.env.local)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import {
  FAKE_MEMES_CURRENT_WEEK,
  FAKE_MEMES_PRIOR_WEEK_BROKE,
  FAKE_MEMES_PRIOR_WEEK_DEAD,
  FAKE_SIGNALS,
  FAKE_GRAVEYARD,
  FAKE_TICKER_BETS,
} from '../memes/sources/fake';
import { oddsForN } from '../memes/score';
import { randomUUID } from 'node:crypto';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const sql = postgres(url, { prepare: false, max: 5 });
const db = drizzle(sql, { schema });

async function main() {
  console.log('[seed] start');

  // Wipe — order matters due to FK
  await db.delete(schema.bets);
  await db.delete(schema.nominations);
  await db.delete(schema.flowers);
  await db.delete(schema.epitaphVotes);
  await db.delete(schema.graveyard);
  await db.delete(schema.memes);
  await db.delete(schema.signals);
  await db.delete(schema.weeks);
  await db.delete(schema.auditLog);
  console.log('[seed] wiped');

  const now = new Date();
  const dayMs = 24 * 3600 * 1000;
  const weekMs = 7 * dayMs;

  // Week 45 (oldest, settled)
  const [w45] = await db
    .insert(schema.weeks)
    .values({
      weekNumber: 45,
      opensAt: new Date(now.getTime() - 14 * dayMs),
      settlesAt: new Date(now.getTime() - 7 * dayMs),
      status: 'settled',
    })
    .returning();

  // Week 46 (prior, settled)
  const [w46] = await db
    .insert(schema.weeks)
    .values({
      weekNumber: 46,
      opensAt: new Date(now.getTime() - 7 * dayMs),
      settlesAt: new Date(now.getTime() - 2 * dayMs), // 2 days ago: just-settled
      status: 'settled',
      editorialNotes: {
        picks: [{ memeSlug: 'shechu-fotiaoqiang', note: '社畜文化辐射已确认' }],
      },
    })
    .returning();

  // Week 47 (current, open)
  const [w47] = await db
    .insert(schema.weeks)
    .values({
      weekNumber: 47,
      opensAt: new Date(now.getTime() - 1 * dayMs),
      settlesAt: new Date(now.getTime() + 5 * dayMs), // 5 days from now
      status: 'open',
    })
    .returning();

  console.log(`[seed] weeks: ${w45.id}, ${w46.id}, ${w47.id}`);

  // Insert memes
  // Week 45 — old memes already in graveyard (use dead set)
  const w45Memes = await db
    .insert(schema.memes)
    .values(
      FAKE_MEMES_PRIOR_WEEK_DEAD.slice(0, 3).map((m) => ({
        weekId: w45.id,
        title: m.title,
        slug: `w45-${m.slug}`,
        sourcePlatform: m.sourcePlatform,
        firstSeenN: m.firstSeenN,
        currentN: m.currentN,
        oddsX: oddsForN(m.firstSeenN),
        status: 'in_graveyard' as const,
        verdictSource: 'dead' as const,
        tickerBlurb: m.tickerBlurb,
      })),
    )
    .returning();

  // Week 46 — mix of broke + dead
  const w46BrokeMemes = await db
    .insert(schema.memes)
    .values(
      FAKE_MEMES_PRIOR_WEEK_BROKE.map((m) => ({
        weekId: w46.id,
        title: m.title,
        slug: `w46-${m.slug}`,
        sourcePlatform: m.sourcePlatform,
        firstSeenN: m.firstSeenN,
        currentN: m.currentN,
        oddsX: oddsForN(m.firstSeenN),
        status: 'broke' as const,
        verdictSource: m.slug === 'shechu-fotiaoqiang' ? ('editorial' as const) : ('hard' as const),
        tickerBlurb: m.tickerBlurb,
      })),
    )
    .returning();

  const w46DeadMemes = await db
    .insert(schema.memes)
    .values(
      FAKE_MEMES_PRIOR_WEEK_DEAD.map((m) => ({
        weekId: w46.id,
        title: m.title,
        slug: `w46-${m.slug}`,
        sourcePlatform: m.sourcePlatform,
        firstSeenN: m.firstSeenN,
        currentN: m.currentN,
        oddsX: oddsForN(m.firstSeenN),
        status: 'in_graveyard' as const,
        verdictSource: 'dead' as const,
        tickerBlurb: m.tickerBlurb,
      })),
    )
    .returning();

  // Week 47 — current pool
  const w47Memes = await db
    .insert(schema.memes)
    .values(
      FAKE_MEMES_CURRENT_WEEK.map((m) => ({
        weekId: w47.id,
        title: m.title,
        slug: `w47-${m.slug}`,
        sourcePlatform: m.sourcePlatform,
        firstSeenN: m.firstSeenN,
        currentN: m.currentN,
        oddsX: oddsForN(m.firstSeenN),
        status: 'in_pool' as const,
        verdictSource: null,
        tickerBlurb: m.tickerBlurb,
      })),
    )
    .returning();

  console.log(
    `[seed] memes: w45=${w45Memes.length}, w46=${w46BrokeMemes.length + w46DeadMemes.length}, w47=${w47Memes.length}`,
  );

  // Signals
  await db.insert(schema.signals).values(FAKE_SIGNALS);
  console.log(`[seed] signals: ${FAKE_SIGNALS.length}`);

  // Graveyard entries for prior-week dead memes
  const allDead = [...w45Memes, ...w46DeadMemes];
  for (const meme of allDead) {
    const ep = FAKE_GRAVEYARD.find((g) => meme.slug.endsWith(g.slug));
    await db.insert(schema.graveyard).values({
      memeId: meme.id,
      epitaph: ep?.epitaph ?? null,
      epitaphAuthorId: null,
      maxN: meme.currentN,
      backersCount: ep?.backersCount ?? Math.floor(meme.firstSeenN / 20),
      flowersCount: ep?.backersCount ? Math.floor(ep.backersCount / 4) : 0,
    });
  }
  console.log(`[seed] graveyard: ${allDead.length}`);

  // Mock ticker bets — null user_id, only for display
  const memeBySlug = new Map<string, number>();
  for (const m of w47Memes) {
    const baseSlug = m.slug.replace(/^w47-/, '');
    memeBySlug.set(baseSlug, m.id);
  }
  let betCount = 0;
  for (const tb of FAKE_TICKER_BETS) {
    const memeId = memeBySlug.get(tb.memeSlug);
    if (!memeId) continue;
    const meme = w47Memes.find((mm) => mm.id === memeId)!;
    await db.insert(schema.bets).values({
      userId: null,
      memeId,
      amount: tb.amount,
      oddsAtBet: meme.oddsX,
      firstNAtBet: meme.firstSeenN,
      certificateId: `mock-${randomUUID().slice(0, 8)}`,
      settledPayout: null,
      displayName: tb.displayName,
    });
    betCount++;
  }
  console.log(`[seed] bets: ${betCount}`);

  await sql.end({ timeout: 5 });
  console.log('[seed] done');
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
