/**
 * Deterministic seed — v0.2 dual board (热梗 + 热点话题).
 *
 * Usage: pnpm db:seed
 *
 * Idempotent — drops existing rows in non-Supabase-managed tables and reinserts.
 * Does NOT touch auth.users (Supabase-managed).
 *
 * Generates:
 *   - 3 weeks (45, 46, 47) — 45+46 settled, 47 open (current)
 *   - kind='meme'  current pool: 10 真梗 templates
 *   - kind='topic' current pool: 8 娱乐话题 (Y/N 类，会否破阈值)
 *   - 5 signals (radar)
 *   - 8 graveyard entries (mix of dead memes + dead topics)
 *   - ~16 mock ticker bets (denormalized display_name, null user_id)
 */

// Run with: pnpm db:seed  (uses Node --env-file=.env.local)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import {
  FAKE_MEMES_CURRENT,
  FAKE_MEMES_PRIOR_BROKE,
  FAKE_MEMES_PRIOR_DEAD,
  type FakeMeme,
} from '../memes/sources/fake-memes';
import {
  FAKE_TOPICS_CURRENT,
  FAKE_TOPICS_PRIOR_BROKE,
  FAKE_TOPICS_PRIOR_DEAD,
  type FakeTopic,
} from '../memes/sources/fake-topics';
import { oddsForN } from '../memes/score';
import { randomUUID } from 'node:crypto';
import { ALL_FAKE_SIGNALS } from '../memes/sources/fake-signals';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const sql = postgres(url, { prepare: false, max: 5 });
const db = drizzle(sql, { schema });

const FAKE_SIGNALS = ALL_FAKE_SIGNALS;

const FAKE_EPITAPHS: Record<string, { epitaph: string; backersCount: number }> = {
  'dog-goes-to-work': { epitaph: '狗上班那天，梗也下班了。', backersCount: 1_247 },
  'morning-c-evening-a': { epitaph: '抖机灵能上热搜，扛不住一周。', backersCount: 540 },
  'x-online-challenge': { epitaph: '挑战从来是别人的事。', backersCount: 312 },
  'fashion-gala-redcarpet': { epitaph: '红毯走完，热度也归零。', backersCount: 880 },
  'kol-first-live-sale': { epitaph: '第一场没卖出去，第二场也没人看。', backersCount: 412 },
};

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

  // Three weeks
  const [w45] = await db
    .insert(schema.weeks)
    .values({
      weekNumber: 45,
      opensAt: new Date(now.getTime() - 14 * dayMs),
      settlesAt: new Date(now.getTime() - 7 * dayMs),
      status: 'settled',
    })
    .returning();
  const [w46] = await db
    .insert(schema.weeks)
    .values({
      weekNumber: 46,
      opensAt: new Date(now.getTime() - 7 * dayMs),
      settlesAt: new Date(now.getTime() - 2 * dayMs),
      status: 'settled',
      editorialNotes: {
        picks: [
          { slug: 'w46-ji-you-too-beautiful', note: '篮球视频跨圈层迁移到健身、广场舞，本质破圈' },
        ],
      },
    })
    .returning();
  const [w47] = await db
    .insert(schema.weeks)
    .values({
      weekNumber: 47,
      opensAt: new Date(now.getTime() - 1 * dayMs),
      settlesAt: new Date(now.getTime() + 5 * dayMs),
      status: 'open',
    })
    .returning();
  console.log(`[seed] weeks: 45=${w45.id} 46=${w46.id} 47=${w47.id}`);

  // ---- Helpers ----
  function memeRow(weekPrefix: string, weekId: number, m: FakeMeme, status: 'in_pool' | 'broke' | 'in_graveyard', verdictSource: 'hard' | 'editorial' | 'dead' | null) {
    return {
      weekId,
      kind: 'meme' as const,
      title: m.title,
      slug: `${weekPrefix}-${m.slug}`,
      sourcePlatform: m.sourcePlatform,
      templatePattern: m.templatePattern,
      derivativeCount: m.derivativeCount,
      thresholdN: null,
      topicQuestion: null,
      firstSeenN: m.firstSeenN,
      currentN: m.currentN,
      oddsX: oddsForN(m.firstSeenN),
      status,
      verdictSource,
      tickerBlurb: m.tickerBlurb,
    };
  }

  function topicRow(weekPrefix: string, weekId: number, t: FakeTopic, status: 'in_pool' | 'broke' | 'in_graveyard', verdictSource: 'hard' | 'editorial' | 'dead' | null) {
    return {
      weekId,
      kind: 'topic' as const,
      title: t.title,
      slug: `${weekPrefix}-${t.slug}`,
      sourcePlatform: t.sourcePlatform,
      templatePattern: null,
      derivativeCount: 0,
      thresholdN: t.thresholdN,
      topicQuestion: t.topicQuestion,
      firstSeenN: t.firstSeenN,
      currentN: t.currentN,
      oddsX: oddsForN(t.firstSeenN),
      status,
      verdictSource,
      tickerBlurb: t.tickerBlurb,
    };
  }

  // ---- Week 47 (current open) — full pool, both kinds ----
  const w47Memes = await db
    .insert(schema.memes)
    .values(FAKE_MEMES_CURRENT.map((m) => memeRow('w47', w47.id, m, 'in_pool', null)))
    .returning();
  const w47Topics = await db
    .insert(schema.memes)
    .values(FAKE_TOPICS_CURRENT.map((t) => topicRow('w47', w47.id, t, 'in_pool', null)))
    .returning();
  console.log(`[seed] w47 memes=${w47Memes.length} topics=${w47Topics.length}`);

  // ---- Week 46 (just settled) — broke + dead, both kinds ----
  const w46MemeBroke = await db
    .insert(schema.memes)
    .values(FAKE_MEMES_PRIOR_BROKE.map((m, i) => memeRow('w46', w46.id, m, 'broke', i === 0 ? 'hard' : 'editorial')))
    .returning();
  const w46MemeDead = await db
    .insert(schema.memes)
    .values(FAKE_MEMES_PRIOR_DEAD.map((m) => memeRow('w46', w46.id, m, 'in_graveyard', 'dead')))
    .returning();
  const w46TopicBroke = await db
    .insert(schema.memes)
    .values(FAKE_TOPICS_PRIOR_BROKE.map((t) => topicRow('w46', w46.id, t, 'broke', 'hard')))
    .returning();
  const w46TopicDead = await db
    .insert(schema.memes)
    .values(FAKE_TOPICS_PRIOR_DEAD.map((t) => topicRow('w46', w46.id, t, 'in_graveyard', 'dead')))
    .returning();
  console.log(
    `[seed] w46 meme broke=${w46MemeBroke.length} dead=${w46MemeDead.length}; topic broke=${w46TopicBroke.length} dead=${w46TopicDead.length}`,
  );

  // ---- Signals ----
  await db.insert(schema.signals).values(FAKE_SIGNALS);
  console.log(`[seed] signals: ${FAKE_SIGNALS.length}`);

  // ---- Graveyard ----
  const allDead = [...w46MemeDead, ...w46TopicDead];
  for (const meme of allDead) {
    const baseSlug = meme.slug.replace(/^w\d+-/, '');
    const ep = FAKE_EPITAPHS[baseSlug];
    await db.insert(schema.graveyard).values({
      memeId: meme.id,
      epitaph: ep?.epitaph ?? null,
      epitaphAuthorId: null,
      maxN: meme.currentN,
      backersCount: ep?.backersCount ?? Math.floor(meme.firstSeenN / 20),
      flowersCount: ep ? Math.floor(ep.backersCount / 4) : 0,
    });
  }
  console.log(`[seed] graveyard: ${allDead.length}`);

  // ---- Mock ticker bets — on current week, both kinds ----
  const tickerBets = [
    { slug: 'w47-city-or-not-city', displayName: '@梗象先生', amount: 50 },
    { slug: 'w47-city-or-not-city', displayName: '@早盘哥', amount: 20 },
    { slug: 'w47-city-or-not-city', displayName: '@梗预言家1号', amount: 15 },
    { slug: 'w47-you-are-right-but', displayName: '@二游研究员', amount: 25 },
    { slug: 'w47-zundu-jiadu', displayName: '@早盘哥', amount: 20 },
    { slug: 'w47-zundu-jiadu', displayName: '@表情包大佬', amount: 10 },
    { slug: 'w47-breaks-defense', displayName: '@老韭菜', amount: 30 },
    { slug: 'w47-kaiju-open', displayName: '@考公男神', amount: 25 },
    { slug: 'w47-xindong-6-finale', displayName: '@综艺观察家', amount: 40 },
    { slug: 'w47-xindong-6-finale', displayName: '@恋综看客', amount: 15 },
    { slug: 'w47-duanju-divorce', displayName: '@梗象先生', amount: 30 },
    { slug: 'w47-genshin-rerun-x', displayName: '@米家老大', amount: 20 },
    { slug: 'w47-xz-final', displayName: '@偶像分析师', amount: 35 },
    { slug: 'w47-movie-x-opening-day', displayName: '@影院前线', amount: 18 },
  ];

  const allCurrent = [...w47Memes, ...w47Topics];
  const bySlug = new Map(allCurrent.map((m) => [m.slug, m]));
  let betCount = 0;
  for (const tb of tickerBets) {
    const m = bySlug.get(tb.slug);
    if (!m) continue;
    await db.insert(schema.bets).values({
      userId: null,
      memeId: m.id,
      amount: tb.amount,
      oddsAtBet: m.oddsX,
      firstNAtBet: m.firstSeenN,
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
