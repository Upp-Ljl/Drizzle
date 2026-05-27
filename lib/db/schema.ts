/**
 * 梗气象台 — Drizzle schema (单文件, 全部表)
 *
 * 覆盖 PRODUCT-SPEC.md §8 的全部表 + 字段补丁。
 * Phase 1 只 seed 一部分 (users/weeks/memes/bets/graveyard)；其它表 Phase 2 启用。
 */

import {
  pgTable,
  pgSchema,
  serial,
  integer,
  text,
  uuid,
  real,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  bigserial,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/* -----------------------------------------------------------------------
 * Supabase auth schema reference (read-only from app's perspective)
 * ----------------------------------------------------------------------- */
const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

/* -----------------------------------------------------------------------
 * profiles — app-level user data, FK to auth.users.id
 * ----------------------------------------------------------------------- */
export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  handle: text('handle').notNull().unique(),
  level: integer('level').notNull().default(1),
  weeklyCoins: integer('weekly_coins').notNull().default(100),
  coinsResetAt: timestamp('coins_reset_at', { withTimezone: true }).notNull().defaultNow(),
  isKol: integer('is_kol').notNull().default(0), // 0/1; opens accept-follow
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -----------------------------------------------------------------------
 * weeks — periodic open/settle epochs
 * ----------------------------------------------------------------------- */
export const weeks = pgTable(
  'weeks',
  {
    id: serial('id').primaryKey(),
    weekNumber: integer('week_number').notNull().unique(),
    opensAt: timestamp('opens_at', { withTimezone: true }).notNull(),
    settlesAt: timestamp('settles_at', { withTimezone: true }).notNull(),
    status: text('status', { enum: ['draft', 'open', 'settling', 'settled'] })
      .notNull()
      .default('draft'),
    editorialNotes: jsonb('editorial_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('weeks_status_idx').on(t.status),
  }),
);

/* -----------------------------------------------------------------------
 * memes — candidate or in-pool memes
 * ----------------------------------------------------------------------- */
export const memes = pgTable(
  'memes',
  {
    id: serial('id').primaryKey(),
    weekId: integer('week_id')
      .notNull()
      .references(() => weeks.id),
    /** Board: 'meme' = 热梗预测 (模板/格式); 'topic' = 热点话题 (娱乐事件). */
    kind: text('kind', { enum: ['meme', 'topic'] }).notNull().default('meme'),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    sourceUrl: text('source_url'),
    sourcePlatform: text('source_platform', {
      enum: ['bilibili', 'douyin', 'xhs', 'weibo', 'twitter', 'other'],
    })
      .notNull()
      .default('other'),
    /** For meme kind: 模板/句式 e.g. "X 不 X". Null for topic kind. */
    templatePattern: text('template_pattern'),
    /** For meme kind: 二创数. Mirrors meaning of currentN for topic kind. */
    derivativeCount: integer('derivative_count').notNull().default(0),
    /** For topic kind: 阈值 — the N to beat by Sunday. Null for meme kind. */
    thresholdN: integer('threshold_n'),
    /** For topic kind: 完整 Y/N 疑问句. Null for meme kind. */
    topicQuestion: text('topic_question'),
    firstSeenN: integer('first_seen_n').notNull().default(0),
    currentN: integer('current_n').notNull().default(0),
    oddsX: real('odds_x').notNull().default(2),
    status: text('status', {
      enum: ['nominated', 'in_pool', 'broke', 'dead', 'in_graveyard'],
    })
      .notNull()
      .default('in_pool'),
    verdictSource: text('verdict_source', { enum: ['hard', 'editorial', 'dead'] }),
    tickerBlurb: text('ticker_blurb'), // mock display: "@梗象先生 押 50 币"
    nominatedBy: text('nominated_by'), // display string only; FK to profiles when登录提名
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    weekIdIdx: index('memes_week_id_idx').on(t.weekId),
    statusIdx: index('memes_status_idx').on(t.status),
    kindIdx: index('memes_kind_idx').on(t.kind),
  }),
);

/* -----------------------------------------------------------------------
 * bets — user position records
 * ----------------------------------------------------------------------- */
export const bets = pgTable(
  'bets',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
    memeId: integer('meme_id')
      .notNull()
      .references(() => memes.id),
    amount: integer('amount').notNull(),
    oddsAtBet: real('odds_at_bet').notNull(),
    firstNAtBet: integer('first_n_at_bet').notNull(), // 诞生证 snapshot
    certificateId: text('certificate_id').notNull().unique(),
    settledPayout: integer('settled_payout'),
    mirrorOfBetId: integer('mirror_of_bet_id'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    displayName: text('display_name'), // for mock seed; real bets pull from profiles.handle
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    memeIdIdx: index('bets_meme_id_idx').on(t.memeId),
    userIdIdx: index('bets_user_id_idx').on(t.userId),
    certIdx: uniqueIndex('bets_cert_idx').on(t.certificateId),
  }),
);

/* -----------------------------------------------------------------------
 * signals — radar entries (not yet in pool)
 * ----------------------------------------------------------------------- */
export const signals = pgTable(
  'signals',
  {
    id: serial('id').primaryKey(),
    source: text('source', {
      enum: ['bilibili', 'douyin', 'xhs', 'weibo', 'twitter'],
    }).notNull(),
    candidateTitle: text('candidate_title').notNull(),
    score: integer('score').notNull(),
    tier: text('tier', { enum: ['red', 'yellow', 'green'] }).notNull(),
    authorHandle: text('author_handle'),
    authorFollowers: integer('author_followers'),
    growth24h: real('growth_24h').notNull().default(0),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tierIdx: index('signals_tier_idx').on(t.tier),
  }),
);

/* -----------------------------------------------------------------------
 * graveyard — dead memes永久档案
 * ----------------------------------------------------------------------- */
export const graveyard = pgTable(
  'graveyard',
  {
    id: serial('id').primaryKey(),
    memeId: integer('meme_id')
      .notNull()
      .unique()
      .references(() => memes.id),
    epitaph: text('epitaph'),
    epitaphAuthorId: uuid('epitaph_author_id').references(() => profiles.id),
    maxN: integer('max_n').notNull(),
    backersCount: integer('backers_count').notNull().default(0),
    flowersCount: integer('flowers_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

/* -----------------------------------------------------------------------
 * nominations — user-submitted "promote signal to pool"
 * ----------------------------------------------------------------------- */
export const nominations = pgTable('nominations', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  signalId: integer('signal_id').references(() => signals.id),
  memeId: integer('meme_id').references(() => memes.id),
  weekId: integer('week_id')
    .notNull()
    .references(() => weeks.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -----------------------------------------------------------------------
 * posters — generated share posters for a user's week
 * ----------------------------------------------------------------------- */
export const posters = pgTable('posters', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  weekId: integer('week_id')
    .notNull()
    .references(() => weeks.id),
  storagePath: text('storage_path').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -----------------------------------------------------------------------
 * audit_log — every mutate writes here
 * ----------------------------------------------------------------------- */
export const auditLog = pgTable(
  'audit_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id').references(() => profiles.id),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('audit_user_idx').on(t.userId),
    actionIdx: index('audit_action_idx').on(t.action),
  }),
);

/* -----------------------------------------------------------------------
 * follows — KOL ↔ follower mirror relationship
 * ----------------------------------------------------------------------- */
export const follows = pgTable(
  'follows',
  {
    id: serial('id').primaryKey(),
    kolId: uuid('kol_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    followerId: uuid('follower_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    mirrorCap: integer('mirror_cap').notNull().default(10),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('follows_kol_follower_idx').on(t.kolId, t.followerId),
  }),
);

/* -----------------------------------------------------------------------
 * epitaph_votes — voting on graveyard墓志铭
 * ----------------------------------------------------------------------- */
export const epitaphVotes = pgTable(
  'epitaph_votes',
  {
    id: serial('id').primaryKey(),
    graveyardId: integer('graveyard_id')
      .notNull()
      .references(() => graveyard.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    voteWeight: integer('vote_weight').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('epitaph_votes_grave_user_idx').on(t.graveyardId, t.userId),
  }),
);

/* -----------------------------------------------------------------------
 * flowers — 献花 (1 per user per day per grave)
 * ----------------------------------------------------------------------- */
export const flowers = pgTable(
  'flowers',
  {
    id: serial('id').primaryKey(),
    graveyardId: integer('graveyard_id')
      .notNull()
      .references(() => graveyard.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    dayKey: text('day_key').notNull(), // 'YYYY-MM-DD' for dedup
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('flowers_grave_user_day_idx').on(t.graveyardId, t.userId, t.dayKey),
  }),
);

/* -----------------------------------------------------------------------
 * SQL helpers
 * ----------------------------------------------------------------------- */
export const now = () => sql`now()`;
