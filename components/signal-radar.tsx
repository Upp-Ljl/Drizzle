'use client';

import { useAuth } from './auth-provider';
import { useRequireAuth } from '@/lib/auth/use-require-auth';
import { Button } from './ui/button';
import { Card, CardBody, CardHeader } from './ui/card';
import { formatN } from '@/lib/utils';
import type { SignalRow } from '@/app/api/radar/route';

const PLATFORM_LABEL: Record<string, string> = {
  bilibili: 'B 站',
  douyin: '抖音',
  xhs: '小红书',
  weibo: '微博',
  twitter: 'X',
};

const TIER_META: Record<
  'red' | 'yellow' | 'green',
  { emoji: string; title: string; sub: string }
> = {
  red: { emoji: '🔴', title: '异常上升', sub: 'score > 80' },
  yellow: { emoji: '🟡', title: '边缘信号', sub: '50 < score ≤ 80' },
  green: { emoji: '🟢', title: '监视中', sub: '30 < score ≤ 50' },
};

type Props = {
  tier: 'red' | 'yellow' | 'green';
  signals: SignalRow[];
  weekId: number;
};

/**
 * 单档雷达 section。无信号时显示占位空状态而非整段消失。
 * 「提名」按钮走 useRequireAuth → 未登录弹模态 + 中断恢复。
 */
export function SignalRadar({ tier, signals, weekId }: Props) {
  const meta = TIER_META[tier];
  const requireAuth = useRequireAuth();
  const { user } = useAuth();

  async function postNominate(signalId: number) {
    try {
      const res = await fetch('/api/radar/nominate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId }),
      });
      // Phase 1: 501 stub is the expected happy path for a logged-in user.
      // Just surface the response status in console; UI stays calm.
      // eslint-disable-next-line no-console
      console.info('[nominate]', signalId, res.status);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[nominate] failed', e);
    }
  }

  return (
    <section aria-label={`${meta.emoji} ${meta.title}`} className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-serif">
          <span aria-hidden>{meta.emoji} </span>
          {meta.title}
        </h2>
        <span className="text-xs text-muted font-mono">{meta.sub}</span>
      </header>

      {signals.length === 0 ? (
        <Card className="border-dashed">
          <CardBody className="text-sm text-muted text-center py-6">
            目前没有 {meta.title} 信号
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {signals.map((s) => (
            <Card key={s.id} className="bg-cream border-warmline">
              <CardHeader className="flex items-center justify-between">
                <span className="truncate text-sm font-medium text-ink">
                  {s.candidateTitle}
                </span>
                <span className="text-xs font-mono text-coral shrink-0 ml-2">
                  {s.score}
                </span>
              </CardHeader>
              <CardBody className="space-y-2">
                <div className="text-xs text-muted">
                  <span className="font-medium text-ink">
                    {PLATFORM_LABEL[s.source] ?? s.source}
                  </span>
                  {s.authorHandle ? (
                    <>
                      <span className="mx-1">·</span>
                      <span>@{s.authorHandle}</span>
                    </>
                  ) : null}
                  {s.authorFollowers !== null ? (
                    <>
                      <span className="mx-1">·</span>
                      <span>{formatN(s.authorFollowers)} 粉</span>
                    </>
                  ) : null}
                </div>
                <div className="text-xs text-muted">
                  24h 增速{' '}
                  <span className="font-mono text-forest">
                    {(s.growth24h * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="pt-1">
                  <Button
                    variant="primary"
                    onClick={() =>
                      requireAuth(
                        {
                          kind: 'nominate',
                          signalId: s.id,
                          weekId,
                          returnTo: '/radar',
                        },
                        () => postNominate(s.id),
                      )
                    }
                    data-testid={`nominate-${s.id}`}
                  >
                    {user ? '提名进本周池' : '登录提名'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
