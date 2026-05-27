/**
 * Unit tests for lib/memes/settle.ts — `settleWeek` happy paths.
 *
 * We DO NOT assert against TSPR-BUG-1 (timezone off-by-one) — that bug is
 * seeded intentionally for tspr to discover. These tests only cover the
 * verdict-decision logic for a single in-memory snapshot of memes.
 *
 * Mocking strategy: settleWeek calls `db.select().from(memes).where(...)` and
 * resolves to a Meme[]. We pass a fake db whose chain returns a hand-built
 * row set.
 */

import { describe, expect, it } from 'vitest';
import { settleWeek } from '../../lib/memes/settle';

type MemeRow = {
  id: number;
  weekId: number;
  currentN: number;
  // Other fields are not read by settleWeek but included for shape parity.
  title?: string;
  slug?: string;
};

function makeDb(rows: MemeRow[]) {
  return {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(rows),
      }),
    }),
  };
}

const baseWeekId = 47;

const rows: MemeRow[] = [
  { id: 1, weekId: baseWeekId, currentN: 750_000 }, // ≥ 500k → hard break
  { id: 2, weekId: baseWeekId, currentN: 100_000 }, // below threshold
  { id: 3, weekId: baseWeekId, currentN: 2_000_000 }, // ≥ 500k but vetoed
  { id: 4, weekId: baseWeekId, currentN: 50_000 }, // editorial pick
  { id: 5, weekId: baseWeekId, currentN: 1_000 }, // plain dead
];

describe('settleWeek', () => {
  it('hard-indicator pass → broke/hard', async () => {
    const db = makeDb([rows[0]]);
    const verdicts = await settleWeek(db as never, baseWeekId);
    expect(verdicts).toHaveLength(1);
    expect(verdicts[0]).toMatchObject({
      memeId: 1,
      outcome: 'broke',
      source: 'hard',
    });
  });

  it('below threshold + no editorial → dead/dead', async () => {
    const db = makeDb([rows[1]]);
    const verdicts = await settleWeek(db as never, baseWeekId);
    expect(verdicts).toEqual([
      { memeId: 2, outcome: 'dead', source: 'dead' },
    ]);
  });

  it('editorial pick on a non-hard meme → broke/editorial', async () => {
    const db = makeDb([rows[3]]);
    const verdicts = await settleWeek(db as never, baseWeekId, {
      editorialPicks: [4],
    });
    expect(verdicts[0]).toMatchObject({
      memeId: 4,
      outcome: 'broke',
      source: 'editorial',
    });
  });

  it('editorial veto overrides hard-indicator pass → dead/dead', async () => {
    const db = makeDb([rows[2]]);
    const verdicts = await settleWeek(db as never, baseWeekId, {
      editorialVetoes: [3],
    });
    expect(verdicts[0]).toMatchObject({
      memeId: 3,
      outcome: 'dead',
      source: 'dead',
    });
  });

  it('mixed batch produces one verdict per meme in input order', async () => {
    const db = makeDb(rows);
    const verdicts = await settleWeek(db as never, baseWeekId, {
      editorialPicks: [4],
      editorialVetoes: [3],
    });
    expect(verdicts.map((v) => v.memeId)).toEqual([1, 2, 3, 4, 5]);
    expect(verdicts.map((v) => `${v.outcome}/${v.source}`)).toEqual([
      'broke/hard',
      'dead/dead',
      'dead/dead', // vetoed despite currentN >= 500k
      'broke/editorial',
      'dead/dead',
    ]);
  });

  it('empty meme set → empty verdicts', async () => {
    const db = makeDb([]);
    const verdicts = await settleWeek(db as never, baseWeekId);
    expect(verdicts).toEqual([]);
  });
});
