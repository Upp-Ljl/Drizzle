'use client';

/**
 * /me — personal predictions page.
 *
 * Shows the user's bets across all weeks, grouped by week, with cert thumbnail
 * + status badge. Empty state for logged-out users with a sign-in CTA.
 */

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CertificateCard } from '@/components/certificate-card';
import { formatN } from '@/lib/utils';
import type { MyBetsApiResponse, MyBetRow } from '@/app/api/me/bets/route';
import type { MyProfileApiResponse } from '@/app/api/me/profile/route';

type BetStatus = 'pending' | 'win' | 'loss';

function betStatus(b: MyBetRow): BetStatus {
  if (b.settledPayout === null) return 'pending';
  if (b.settledPayout > 0) return 'win';
  return 'loss';
}

function certState(s: BetStatus): 'pending' | 'gold' | 'mourn' {
  if (s === 'win') return 'gold';
  if (s === 'loss') return 'mourn';
  return 'pending';
}

export default function MePage() {
  const { user, loading, signInWithGitHub } = useAuth();

  const { data: betsData, isLoading: betsLoading } = useQuery<MyBetsApiResponse>({
    queryKey: ['me', 'bets'],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch('/api/me/bets', { cache: 'no-store' });
      if (!res.ok) throw new Error('failed to fetch /api/me/bets');
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: profileData } = useQuery<MyProfileApiResponse>({
    queryKey: ['me', 'profile'],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch('/api/me/profile', { cache: 'no-store' });
      if (!res.ok) throw new Error('failed to fetch /api/me/profile');
      return res.json();
    },
    staleTime: 30_000,
  });

  const stats = useMemo(() => {
    const bets = betsData?.bets ?? [];
    let hits = 0;
    let payoutTotal = 0;
    let staked = 0;
    for (const b of bets) {
      staked += b.amount;
      if (b.settledPayout !== null) {
        payoutTotal += b.settledPayout;
        if (b.settledPayout > 0) hits += 1;
      }
    }
    const netCoins = payoutTotal - staked;
    return { hits, payoutTotal, staked, netCoins, totalBets: bets.length };
  }, [betsData]);

  const groupedByWeek = useMemo(() => {
    const map = new Map<number, { week: MyBetRow['week']; bets: MyBetRow[] }>();
    for (const b of betsData?.bets ?? []) {
      const existing = map.get(b.week.id);
      if (existing) existing.bets.push(b);
      else map.set(b.week.id, { week: b.week, bets: [b] });
    }
    return Array.from(map.values()).sort((a, b) => b.week.weekNumber - a.week.weekNumber);
  }, [betsData]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-sm text-muted">加载中…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card>
          <CardBody className="text-center space-y-4 py-12">
            <h1 className="font-serif text-2xl text-ink">我的预测</h1>
            <p className="text-sm text-muted">登录后这里会显示你的预测记录、押注配额和命中战绩。</p>
            <div className="pt-2">
              <Button variant="primary" onClick={() => void signInWithGitHub('/me')}>
                用 GitHub 登录
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-2xl text-ink">我的预测</h1>
        <p className="text-sm text-muted">
          {profileData?.profile.handle ? `@${profileData.profile.handle}` : '加载中…'}
        </p>
      </header>

      {/* Stats strip */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="label">本周押注配额</div>
              <div className="font-serif text-2xl text-ink">
                {profileData ? `${profileData.profile.weeklyCoins}` : '…'}
                <span className="text-sm text-muted font-mono"> / 100</span>
              </div>
              {profileData ? (
                <div className="text-xs text-muted mt-1">
                  本周已押 {profileData.usedThisWeek} 币
                </div>
              ) : null}
            </div>
            <div>
              <div className="label">累计命中</div>
              <div className="font-serif text-2xl text-forest">{stats.hits}</div>
              <div className="text-xs text-muted mt-1">共 {stats.totalBets} 张证</div>
            </div>
            <div>
              <div className="label">累计赔率收益</div>
              <div
                className={`font-serif text-2xl ${stats.netCoins >= 0 ? 'text-forest' : 'text-rust'}`}
              >
                {stats.netCoins >= 0 ? '+' : ''}
                {stats.netCoins}
              </div>
              <div className="text-xs text-muted mt-1">
                押 {stats.staked} · 收 {stats.payoutTotal}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Bets list grouped by week */}
      {betsLoading ? (
        <div className="text-sm text-muted">加载预测记录…</div>
      ) : groupedByWeek.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-sm text-muted">还没押过 — 去 <Link href="/" className="text-coral underline">首页</Link> 挑一个梗看看？</p>
          </CardBody>
        </Card>
      ) : (
        groupedByWeek.map(({ week, bets: weekBets }) => (
          <section key={week.id} className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-warmline pb-2">
              <h2 className="font-serif text-lg text-ink">第 {week.weekNumber} 周</h2>
              <span className="text-xs text-muted font-mono">
                {week.status === 'open'
                  ? '进行中'
                  : week.status === 'settling'
                    ? '结算中'
                    : week.status === 'settled'
                      ? '已结算'
                      : week.status}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {weekBets.map((b, idx) => {
                const status = betStatus(b);
                return (
                  <div key={b.id} className="space-y-2">
                    <CertificateCard
                      certificateId={b.certificateId}
                      firstNAtBet={b.firstNAtBet}
                      backerRank={idx + 1}
                      title={b.meme.title}
                      amount={b.amount}
                      oddsAtBet={b.oddsAtBet}
                      settledPayout={b.settledPayout}
                      state={certState(status)}
                      kind={b.meme.kind}
                      thresholdN={b.meme.thresholdN}
                    />
                    <div className="flex items-center justify-between px-1 text-xs">
                      <BetStatusBadge status={status} payout={b.settledPayout} />
                      <Link
                        href={`/meme/${b.meme.id}`}
                        className="text-coral hover:underline font-mono"
                      >
                        查看「{b.meme.title}」→
                      </Link>
                    </div>
                    <div className="px-1 text-xs text-muted font-mono">
                      押 {b.amount} 币 · 锁定赔率 {b.oddsAtBet.toFixed(2)}x · N={formatN(b.firstNAtBet)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function BetStatusBadge({
  status,
  payout,
}: {
  status: BetStatus;
  payout: number | null;
}) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center rounded-full bg-warmline/30 text-muted px-2 py-0.5 font-mono">
        等待结算
      </span>
    );
  }
  if (status === 'win') {
    return (
      <span className="inline-flex items-center rounded-full bg-forest/15 text-forest px-2 py-0.5 font-mono">
        命中 +{payout ?? 0} 币
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rust/10 text-rust px-2 py-0.5 font-mono line-through">
      未中
    </span>
  );
}
