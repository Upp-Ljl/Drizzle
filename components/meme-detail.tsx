'use client';

/**
 * MemeDetail — client shell for /meme/[id].
 *
 * Composes:
 *   - meme header + heat chart
 *   - recent bets list (last 5)
 *   - bet form (handles auth, intent replay, certificate)
 */

import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { HeatChart } from '@/components/heat-chart';
import { BetForm } from '@/components/bet-form';
import { formatN } from '@/lib/utils';

type RecentBet = {
  id: number;
  amount: number;
  oddsAtBet: number;
  firstNAtBet: number;
  certificateId: string;
  createdAt: string;
  handle: string;
};

type Meme = {
  id: number;
  title: string;
  slug: string;
  sourcePlatform: string;
  sourceUrl: string | null;
  currentN: number;
  firstSeenN: number;
  oddsX: number;
  status: string;
};

type Props = {
  meme: Meme;
  recentBets: RecentBet[];
  backersCount: number;
};

const PLATFORM_LABEL: Record<string, string> = {
  bilibili: 'B 站',
  douyin: '抖音',
  xhs: '小红书',
  weibo: '微博',
  twitter: 'Twitter',
  other: '综合',
};

export function MemeDetail({ meme, recentBets, backersCount }: Props) {
  const platform = PLATFORM_LABEL[meme.sourcePlatform] ?? meme.sourcePlatform;
  const isDead = meme.status === 'dead' || meme.status === 'in_graveyard';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <header>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-ink">
              ← 返回首页
            </Link>
            <span>·</span>
            <span>来自 {platform}</span>
            <span>·</span>
            <span>状态 {meme.status}</span>
          </div>
          <h1 className="text-3xl font-serif tracking-tight mt-2">{meme.title}</h1>
          {meme.sourceUrl && (
            <a
              href={meme.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs text-coral hover:underline"
            >
              查看原始链接 ↗
            </a>
          )}
        </header>

        <Card>
          <CardHeader>24 小时热度曲线</CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <div className="label">当前 N</div>
                <div className="font-serif text-2xl">{formatN(meme.currentN)}</div>
              </div>
              <div>
                <div className="label">首见 N</div>
                <div className="font-serif text-2xl">{formatN(meme.firstSeenN)}</div>
              </div>
              <div>
                <div className="label">押注人数</div>
                <div className="font-serif text-2xl">{backersCount}</div>
              </div>
            </div>
            <HeatChart currentN={meme.currentN} seed={meme.id} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>最近押注 (近 5 笔)</CardHeader>
          <CardBody>
            {recentBets.length === 0 ? (
              <p className="text-sm text-muted">还没有人押。要当第一个吗？</p>
            ) : (
              <ul className="divide-y divide-warmline">
                {recentBets.map((b) => (
                  <li
                    key={b.id}
                    className="py-2 flex items-center justify-between text-sm"
                    data-testid="recent-bet"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">@{b.handle}</span>
                      <span className="text-muted text-xs">#{b.certificateId}</span>
                    </div>
                    <div className="text-right">
                      <div>押 {b.amount} 币 · {b.oddsAtBet.toFixed(2)}x</div>
                      <div className="text-xs text-muted">
                        N={formatN(b.firstNAtBet)} 时入场
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {isDead && (
          <Link
            href="/graveyard"
            className="block text-sm text-muted hover:text-ink"
          >
            这个梗已凉 → 看坟场
          </Link>
        )}
      </div>

      <aside className="space-y-4">
        <BetForm
          memeId={meme.id}
          memeTitle={meme.title}
          oddsX={meme.oddsX}
          currentN={meme.currentN}
        />
        <p className="text-xs text-muted leading-relaxed px-1">
          押注会落档为你的预测记录，命中可得「{(meme.oddsX).toFixed(2)}x 押注额」。
          每周一刷 100 币，未用完归零。
        </p>
      </aside>
    </div>
  );
}
