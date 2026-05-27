/**
 * Drizzle + postgres-js client (server-only).
 *
 * Two callers:
 *   - server actions / route handlers / cron → use `db`
 *   - migrations / seed scripts → import { db, sql } here
 *
 * We use the Supabase connection pooler (transaction mode) on port 6543 via
 * DATABASE_URL. Pooler does not support prepared statements, so disable them.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;

if (!url) {
  // Don't throw at import time during build; throw lazily when actually used.
  console.warn('[db] DATABASE_URL is not set. Calls to db will fail until .env.local is filled.');
}

export const sql = url ? postgres(url, { prepare: false, max: 5 }) : null;

export const db = sql ? drizzle(sql, { schema }) : (null as unknown as ReturnType<typeof drizzle>);

export type Db = NonNullable<typeof db>;

export function requireDb(): Db {
  if (!db) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local.');
  }
  return db;
}
