'use client';

/**
 * MemeDetail — client shell for /meme/[id].
 *
 * Kind-aware:
 *   - 'meme' kind: 二创数 / 首见 N / 押注人数; templatePattern as subtitle
 *   - 'topic' kind: 讨论度 N / 阈值 X / 押注人数; topicQuestion as subtitle + progress bar
 *
 * Composes:
 *   - meme header + heat chart
 *   - recent bets list (last 5)
 *   - bet form (handles auth, intent replay, certificate)
 */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { HeatChart } from '@/components/heat-chart';
import { BetForm, BET_SUCCESS_EVENT, type BetSuccessDetail } from '@/components/bet-form';
import { CertificateCard } from '@/components/certificate-card';
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
  kind: 'meme' | 'topic';
  templatePattern: string | null;
  derivativeCount: number;
  thresholdN: number | null;
  topicQuestion: string | null;
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
  const isTopic = meme.kind === 'topic';

  // Just-placed cert: listen for global bet-success event scoped to this meme.
  const [justBet, setJustBet] = useState<BetSuccessDetail | null>(null);
  const certAnchorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onBet(e: Event) {
      const detail = (e as CustomEvent<BetSuccessDetail>).detail;
      if (!detail || detail.memeId !== meme.id) return;
      setJustBet(detail);
      // Smooth-scroll the cert into view shortly after render.
      window.requestAnimationFrame(() => {
        certAnchorRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    }
    window.addEventListener(BET_SUCCESS_EVENT, onBet);
    return () => window.removeEventListener(BET_SUCCESS_EVENT, onBet);
  }, [meme.id]);

  const kindBadge = isTopic ? (
    <span className="px-2 py-0.5 rounded-sm bg-forest/15 text-forest text-[10px] font-mono uppercase tracking-wider">
      话题
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-sm bg-coral/15 text-coral text-[10px] font-mono uppercase tracking-wider">
      梗
    </span>
  );

  // Progress for topic kind: currentN / thresholdN
  const thresholdN = meme.thresholdN ?? 0;
  const progressPct =
    isTopic && thresholdN > 0
      ? Math.min(100, Math.round((meme.currentN / thresholdN) * 100))
      : 0;

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
          <div className="flex items-center gap-2 mt-2">
            {kindBadge}
            <h1 className="text-3xl font-serif tracking-tight">{meme.title}</h1>
          </div>
          {isTopic && meme.topicQuestion && (
            <p
              className="italic text-sm text-muted mt-1"
              data-testid="topic-question"
            >
              {meme.topicQuestion}
            </p>
          )}
          {!isTopic && meme.templatePattern && (
            <p
              className="italic font-mono text-sm text-muted mt-1"
              data-testid="template-pattern"
            >
              {meme.templatePattern}
            </p>
          )}
          {meme.sourceUrl && (
            <a
              href={meme.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs text-coral hover:underline block mt-1"
            >
              查看原始链接 ↗
            </a>
          )}
        </header>

        <Card>
          <CardHeader>24 小时热度曲线</CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              {isTopic ? (
                <>
                  <div>
                    <div className="label">讨论度 N</div>
                    <div className="font-serif text-2xl">
                      {formatN(meme.currentN)}
                    </div>
                  </div>
                  <div>
                    <div className="label">阈值 X</div>
                    <div className="font-serif text-2xl">
                      {formatN(meme.thresholdN ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div className="label">押注人数</div>
                    <div className="font-serif text-2xl">{backersCount}</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="label">二创数</div>
                    <div className="font-serif text-2xl">
                      {formatN(meme.derivativeCount)}
                    </div>
                  </div>
                  <div>
                    <div className="label">首见 N</div>
                    <div className="font-serif text-2xl">
                      {formatN(meme.firstSeenN)}
                    </div>
                  </div>
                  <div>
                    <div className="label">押注人数</div>
                    <div className="font-serif text-2xl">{backersCount}</div>
                  </div>
                </>
              )}
            </div>

            {isTopic && thresholdN > 0 && (
              <div className="mb-4" data-testid="topic-progress">
                <div className="flex items-baseline justify-between text-xs text-muted font-mono mb-1">
                  <span>
                    距阈值 {formatN(meme.currentN)} / {formatN(thresholdN)}
                  </span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 w-full bg-warmline/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

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
            {isTopic ? '这个话题已凉 → 看坟场' : '这个梗已凉 → 看坟场'}
          </Link>
        )}
      </div>

      <aside className="space-y-4">
        <BetForm
          memeId={meme.id}
          memeTitle={meme.title}
          oddsX={meme.oddsX}
          currentN={meme.currentN}
          kind={meme.kind}
          thresholdN={meme.thresholdN}
        />
        <div ref={certAnchorRef}>
          {justBet && (
            <CertificateCard
              certificateId={justBet.certificateId}
              kind={meme.kind}
              title={meme.title}
              firstNAtBet={justBet.firstNAtBet}
              thresholdN={meme.thresholdN}
              amount={justBet.amount}
              oddsAtBet={justBet.oddsAtBet}
              settledPayout={null}
              state="pending"
              backerRank={justBet.backerRank}
            />
          )}
        </div>
        <p className="text-xs text-muted leading-relaxed px-1">
          {isTopic ? (
            <>
              押此<strong>话题</strong>会在周日前突破阈值
              {meme.thresholdN ? ` ${formatN(meme.thresholdN)}` : ''}。命中可得「
              {meme.oddsX.toFixed(2)}x 押注额」。每周一刷 100 币，未用完归零。
            </>
          ) : (
            <>
              押此<strong>格式</strong>会破圈。命中可得「
              {meme.oddsX.toFixed(2)}x 押注额」。每周一刷 100 币，未用完归零。
            </>
          )}
        </p>
      </aside>
    </div>
  );
}
