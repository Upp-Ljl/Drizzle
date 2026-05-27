// @screen 屏 4 — 结算战绩 (/settle/[week])
//
// Server component: fetches week + memes + (optional) user bets, renders:
//   - <SettleSummary> top card with broke/dead counts and personal战绩
//   - 三栏 grid: 金证 (broke) / 钦点解释 (editorial notes) / 翻车 (dead)
//   - 死梗 link to /graveyard 锚点
//
// Param `[week]` is the weekNumber (integer 1, 2, 3...).

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { requireDb } from '@/lib/db/client';
import {
  bets as betsTable,
  memes as memesTable,
  weeks as weeksTable,
} from '@/lib/db/schema';
import { getServerUser } from '@/lib/auth/server';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SettleSummary } from '@/components/settle-summary';
import { formatN } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ week: string }>;
};

type BrokeRow = {
  id: number;
  title: string;
  slug: string;
  firstSeenN: number;
  currentN: number;
  oddsX: number;
  verdictSource: string | null;
};

type DeadRow = {
  id: number;
  title: string;
  currentN: number;
};

type UserBet = {
  id: number;
  memeId: number;
  memeTitle: string;
  amount: number;
  oddsAtBet: number;
  settledPayout: number | null;
};

export default async function SettlePage({ params }: PageProps) {
  const { week } = await params;
  const weekNumber = Number.parseInt(week, 10);
  if (!Number.isFinite(weekNumber) || weekNumber <= 0) notFound();

  const db = requireDb();

  const [weekRow] = await db
    .select()
    .from(weeksTable)
    .where(eq(weeksTable.weekNumber, weekNumber))
    .limit(1);
  if (!weekRow) notFound();

  const memeRows = await db
    .select()
    .from(memesTable)
    .where(eq(memesTable.weekId, weekRow.id));

  const brokeMemes: BrokeRow[] = memeRows
    .filter((m) => m.status === 'broke')
    .map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      firstSeenN: m.firstSeenN,
      currentN: m.currentN,
      oddsX: m.oddsX,
      verdictSource: m.verdictSource,
    }));

  const deadMemes: DeadRow[] = memeRows
    .filter((m) => m.status === 'dead' || m.status === 'in_graveyard')
    .map((m) => ({ id: m.id, title: m.title, currentN: m.currentN }));

  const user = await getServerUser();
  let userBets: UserBet[] | null = null;
  if (user) {
    const memeIds = new Set(memeRows.map((m) => m.id));
    const memeTitle = new Map(memeRows.map((m) => [m.id, m.title]));
    const my = await db
      .select()
      .from(betsTable)
      .where(eq(betsTable.userId, user.id));
    userBets = my
      .filter((b) => memeIds.has(b.memeId))
      .map((b) => ({
        id: b.id,
        memeId: b.memeId,
        memeTitle: memeTitle.get(b.memeId) ?? '',
        amount: b.amount,
        oddsAtBet: b.oddsAtBet,
        settledPayout: b.settledPayout,
      }));
  }

  const editorialNotes = parseEditorialNotes(weekRow.editorialNotes);

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-8">
      <SettleSummary
        weekNumber={weekRow.weekNumber}
        status={weekRow.status}
        brokeCount={brokeMemes.length}
        deadCount={deadMemes.length}
        userBets={userBets}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 金证 column */}
        <Card className="bg-cream border-warmline">
          <CardHeader>金证 · 命中 {brokeMemes.length}</CardHeader>
          <CardBody>
            {brokeMemes.length === 0 ? (
              <p className="text-sm text-muted">本期暂无破圈梗。</p>
            ) : (
              <ul className="space-y-3">
                {brokeMemes.map((m) => (
                  <li
                    key={m.id}
                    className="border-2 border-coral/40 rounded-md p-3 bg-paper"
                    data-testid={`broke-${m.id}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <Link
                        href={`/meme/${m.id}`}
                        className="text-sm font-medium text-ink truncate hover:underline"
                      >
                        {m.title}
                      </Link>
                      <span className="text-xs font-mono text-coral shrink-0">
                        {m.oddsX.toFixed(2)}x
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted font-mono">
                      N₀ {formatN(m.firstSeenN)} → N {formatN(m.currentN)}
                      {m.verdictSource === 'editorial' ? (
                        <span className="ml-2 text-coral">钦点</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* 钦点解释 column */}
        <Card className="bg-cream border-warmline">
          <CardHeader>钦点解释</CardHeader>
          <CardBody>
            {editorialNotes.length === 0 ? (
              <p className="text-sm text-muted">本期无人工加分。</p>
            ) : (
              <ul className="space-y-3">
                {editorialNotes.map((n, i) => (
                  <li key={i} className="text-sm">
                    <div className="text-ink font-medium">{n.title}</div>
                    <div className="text-xs text-muted mt-0.5">{n.reason}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* 翻车 column */}
        <Card className="bg-cream border-warmline">
          <CardHeader>翻车 · {deadMemes.length}</CardHeader>
          <CardBody>
            {deadMemes.length === 0 ? (
              <p className="text-sm text-muted">本期无翻车记录。</p>
            ) : (
              <ul className="space-y-2">
                {deadMemes.map((m) => (
                  <li key={m.id} className="text-sm">
                    <Link
                      href={`/graveyard#meme-${m.id}`}
                      className="text-ink hover:underline"
                    >
                      {m.title}
                    </Link>
                    <span className="text-xs text-muted ml-2 font-mono">
                      峰值 {formatN(m.currentN)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 个人战绩明细 (仅登录) */}
      {userBets && userBets.length > 0 && (
        <Card className="bg-cream border-warmline">
          <CardHeader>你的押注明细</CardHeader>
          <CardBody>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted uppercase tracking-wider">
                  <th className="text-left pb-2 font-medium">梗</th>
                  <th className="text-right pb-2 font-medium">押注</th>
                  <th className="text-right pb-2 font-medium">赔率</th>
                  <th className="text-right pb-2 font-medium">收益</th>
                </tr>
              </thead>
              <tbody>
                {userBets.map((b) => {
                  const payout = b.settledPayout ?? 0;
                  const net = payout - b.amount;
                  return (
                    <tr key={b.id} className="border-t border-warmline">
                      <td className="py-2">
                        <Link
                          href={`/meme/${b.memeId}`}
                          className="hover:underline"
                        >
                          {b.memeTitle}
                        </Link>
                      </td>
                      <td className="py-2 text-right font-mono">
                        {b.amount}
                      </td>
                      <td className="py-2 text-right font-mono text-muted">
                        {b.oddsAtBet.toFixed(2)}x
                      </td>
                      <td
                        className={`py-2 text-right font-mono ${
                          net >= 0 ? 'text-forest' : 'text-coral'
                        }`}
                      >
                        {b.settledPayout === null
                          ? '待结'
                          : `${net >= 0 ? '+' : ''}${net}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/**
 * editorial_notes 是 jsonb,期望 shape: [{ memeId, title, reason }] 或简化的
 * [{ title, reason }]。任意类型异常都降级返回空数组,不要让结算页崩。
 */
function parseEditorialNotes(
  raw: unknown,
): Array<{ title: string; reason: string }> {
  if (!raw || !Array.isArray(raw)) return [];
  const out: Array<{ title: string; reason: string }> = [];
  for (const item of raw) {
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const title =
        typeof obj.title === 'string'
          ? obj.title
          : typeof obj.memeTitle === 'string'
          ? obj.memeTitle
          : null;
      const reason =
        typeof obj.reason === 'string'
          ? obj.reason
          : typeof obj.note === 'string'
          ? obj.note
          : '';
      if (title) out.push({ title, reason });
    }
  }
  return out;
}
