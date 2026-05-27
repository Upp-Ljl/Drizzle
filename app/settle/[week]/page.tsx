// @screen 屏 4 — 结算战绩 (/settle/[week])
//
// Server component: fetches week + memes + (optional) user bets, renders:
//   - <SettleSummary> top card with broke/dead counts and personal战绩
//   - 两个 kind-grouped sections (🔥 热梗结果 / 📰 话题结果)
//   - 每个 section 含: 命中 / 钦点 / 翻车
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
  kind: 'meme' | 'topic';
  templatePattern: string | null;
  derivativeCount: number;
  topicQuestion: string | null;
  thresholdN: number | null;
};

type DeadRow = {
  id: number;
  title: string;
  currentN: number;
  kind: 'meme' | 'topic';
  topicQuestion: string | null;
  thresholdN: number | null;
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
      kind: (m.kind as 'meme' | 'topic') ?? 'meme',
      templatePattern: m.templatePattern,
      derivativeCount: m.derivativeCount,
      topicQuestion: m.topicQuestion,
      thresholdN: m.thresholdN,
    }));

  const deadMemes: DeadRow[] = memeRows
    .filter((m) => m.status === 'dead' || m.status === 'in_graveyard')
    .map((m) => ({
      id: m.id,
      title: m.title,
      currentN: m.currentN,
      kind: (m.kind as 'meme' | 'topic') ?? 'meme',
      topicQuestion: m.topicQuestion,
      thresholdN: m.thresholdN,
    }));

  const memesBroke = brokeMemes.filter((m) => m.kind !== 'topic');
  const topicsBroke = brokeMemes.filter((m) => m.kind === 'topic');
  const memesDead = deadMemes.filter((m) => m.kind !== 'topic');
  const topicsDead = deadMemes.filter((m) => m.kind === 'topic');

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
  // For now, editorial notes aren't tagged by kind on the row. Phase 1
  // shows them shared under "热梗结果"; Phase 2 can split via memeId lookup.
  const editorialByKind = splitEditorialByKind(editorialNotes, memeRows);

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-8">
      <SettleSummary
        weekNumber={weekRow.weekNumber}
        status={weekRow.status}
        brokeCount={brokeMemes.length}
        deadCount={deadMemes.length}
        userBets={userBets}
        memeBrokeCount={memesBroke.length}
        memeDeadCount={memesDead.length}
        topicBrokeCount={topicsBroke.length}
        topicDeadCount={topicsDead.length}
      />

      <KindSection
        title="🔥 热梗结果"
        broke={memesBroke}
        dead={memesDead}
        editorialNotes={editorialByKind.meme}
        kind="meme"
        testId="settle-section-meme"
      />

      <KindSection
        title="📰 话题结果"
        broke={topicsBroke}
        dead={topicsDead}
        editorialNotes={editorialByKind.topic}
        kind="topic"
        testId="settle-section-topic"
      />

      {/* 个人战绩明细 (仅登录) */}
      {userBets && userBets.length > 0 && (
        <Card className="bg-cream border-warmline">
          <CardHeader>你的押注明细</CardHeader>
          <CardBody>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted uppercase tracking-wider">
                  <th className="text-left pb-2 font-medium">梗 / 话题</th>
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

type EditorialNote = { title: string; reason: string };

function KindSection({
  title,
  broke,
  dead,
  editorialNotes,
  kind,
  testId,
}: {
  title: string;
  broke: BrokeRow[];
  dead: DeadRow[];
  editorialNotes: EditorialNote[];
  kind: 'meme' | 'topic';
  testId: string;
}) {
  const hitLabel = kind === 'topic' ? '命中（话题）' : '命中（梗）';
  const editorialLabel = kind === 'topic' ? '钦点（话题）' : '钦点（梗）';
  const deadLabel = kind === 'topic' ? '翻车（话题）' : '翻车（梗）';
  const isTopic = kind === 'topic';

  return (
    <section className="space-y-3" data-testid={testId}>
      <h2 className="text-lg font-serif text-ink border-b border-warmline pb-2">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-cream border-warmline">
          <CardHeader>
            {hitLabel} · {broke.length}
          </CardHeader>
          <CardBody>
            {broke.length === 0 ? (
              <p className="text-sm text-muted">
                本期暂无{isTopic ? '破阈值话题' : '破圈梗'}。
              </p>
            ) : (
              <ul className="space-y-3">
                {broke.map((m) => (
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
                    {isTopic && m.topicQuestion && (
                      <p className="italic text-xs text-muted mt-1">
                        {m.topicQuestion}
                      </p>
                    )}
                    <div className="mt-1 text-xs text-muted font-mono">
                      {isTopic
                        ? `N ${formatN(m.currentN)} / 阈值 ${formatN(
                            m.thresholdN ?? 0,
                          )}`
                        : `N₀ ${formatN(m.firstSeenN)} → N ${formatN(
                            m.currentN,
                          )}`}
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

        <Card className="bg-cream border-warmline">
          <CardHeader>{editorialLabel}</CardHeader>
          <CardBody>
            {editorialNotes.length === 0 ? (
              <p className="text-sm text-muted">本{isTopic ? '版块' : '版块'}无人工加分。</p>
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

        <Card className="bg-cream border-warmline">
          <CardHeader>
            {deadLabel} · {dead.length}
          </CardHeader>
          <CardBody>
            {dead.length === 0 ? (
              <p className="text-sm text-muted">本期无翻车记录。</p>
            ) : (
              <ul className="space-y-2">
                {dead.map((m) => (
                  <li key={m.id} className="text-sm">
                    <Link
                      href={`/graveyard#meme-${m.id}`}
                      className="text-ink hover:underline"
                    >
                      {m.title}
                    </Link>
                    {isTopic && m.topicQuestion && (
                      <span className="block italic text-xs text-muted mt-0.5">
                        {m.topicQuestion}
                      </span>
                    )}
                    <span className="text-xs text-muted ml-2 font-mono">
                      {isTopic
                        ? `峰值 ${formatN(m.currentN)} / 阈值 ${formatN(
                            m.thresholdN ?? 0,
                          )}`
                        : `峰值 ${formatN(m.currentN)}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

/**
 * editorial_notes 是 jsonb,期望 shape: [{ memeId, title, reason }] 或简化的
 * [{ title, reason }]。任意类型异常都降级返回空数组,不要让结算页崩。
 */
function parseEditorialNotes(
  raw: unknown,
): Array<{ title: string; reason: string; memeId?: number }> {
  if (!raw || !Array.isArray(raw)) return [];
  const out: Array<{ title: string; reason: string; memeId?: number }> = [];
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
      const memeId =
        typeof obj.memeId === 'number' ? (obj.memeId as number) : undefined;
      if (title) out.push({ title, reason, memeId });
    }
  }
  return out;
}

/**
 * Best-effort split editorial notes by kind. Falls back to all-under-meme
 * if no memeId/title match is possible.
 */
function splitEditorialByKind(
  notes: Array<{ title: string; reason: string; memeId?: number }>,
  memeRows: Array<{
    id: number;
    title: string;
    kind: string | null;
  }>,
): { meme: EditorialNote[]; topic: EditorialNote[] } {
  const kindById = new Map(memeRows.map((m) => [m.id, m.kind ?? 'meme']));
  const kindByTitle = new Map(memeRows.map((m) => [m.title, m.kind ?? 'meme']));
  const out = { meme: [] as EditorialNote[], topic: [] as EditorialNote[] };
  for (const n of notes) {
    let kind: string | null = null;
    if (n.memeId !== undefined) kind = kindById.get(n.memeId) ?? null;
    if (!kind) kind = kindByTitle.get(n.title) ?? null;
    if (kind === 'topic') out.topic.push({ title: n.title, reason: n.reason });
    else out.meme.push({ title: n.title, reason: n.reason });
  }
  return out;
}
