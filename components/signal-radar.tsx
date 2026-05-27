'use client';

import { useAuth } from './auth-provider';
import { useRequireAuth } from '@/lib/auth/use-require-auth';
import { Button } from './ui/button';
import { Card, CardBody, CardHeader } from './ui/card';
import { formatN } from '@/lib/utils';
import type { SignalRow, SignalKind } from '@/app/api/radar/route';

const PLATFORM_LABEL: Record<string, string> = {
  bilibili: 'B 站',
  douyin: '抖音',
  xhs: '小红书',
  weibo: '微博',
  twitter: 'X',
};

type TierKey = 'red' | 'yellow' | 'green';

const MEME_TIER_META: Record<
  TierKey,
  { emoji: string; title: string; sub: string }
> = {
  red: { emoji: '🔴', title: '二创已扩散', sub: 'score > 80' },
  yellow: { emoji: '🟡', title: '出现跨语境模仿', sub: '50 < score ≤ 80' },
  green: { emoji: '🟢', title: '监视中', sub: '30 < score ≤ 50' },
};

const TOPIC_TIER_META: Record<
  TierKey,
  { emoji: string; title: string; sub: string }
> = {
  red: { emoji: '🔴', title: '提及量陡升', sub: 'score > 80' },
  yellow: { emoji: '🟡', title: '出圈讨论', sub: '50 < score ≤ 80' },
  green: { emoji: '🟢', title: '监视中', sub: '30 < score ≤ 50' },
};

type Props = {
  kind: SignalKind;
  tier: TierKey;
  signals: SignalRow[];
  weekId: number;
};

/**
 * 单档雷达 section。无信号时显示占位空状态而非整段消失。
 * 「提名」按钮走 useRequireAuth → 未登录弹模态 + 中断恢复。
 * 文案随 kind 切换 (meme = 模板/句式扩散视角; topic = 提及量/出圈视角)。
 */
export function SignalRadar({ kind, tier, signals, weekId }: Props) {
  const meta = (kind === 'meme' ? MEME_TIER_META : TOPIC_TIER_META)[tier];
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
    <section
      aria-label={`${meta.emoji} ${meta.title}`}
      className="space-y-3"
      data-testid={`radar-${kind}-${tier}`}
    >
      <header className="flex items-baseline justify-between">
        <h3 className="text-base font-serif">
          <span aria-hidden>{meta.emoji} </span>
          {meta.title}
        </h3>
        <span className="text-xs text-muted font-mono">{meta.sub}</span>
      </header>

      {signals.length === 0 ? (
        <p
          className="text-sm text-muted italic px-1 py-2"
          data-testid={`tier-empty-${tier}`}
        >
          本档暂无信号
        </p>
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
                      <span>{s.authorHandle}</span>
                    </>
                  ) : null}
                  {s.authorFollowers !== null ? (
                    <>
                      <span className="mx-1">·</span>
                      <span>{formatN(s.authorFollowers)} 粉</span>
                    </>
                  ) : null}
                </div>
                <div className="text-xs text-muted flex items-center gap-3">
                  <span>
                    24h 增速{' '}
                    <span
                      className="font-mono text-forest"
                      data-testid={`growth24h-${s.id}`}
                    >
                      +{(s.growth24h * 100).toFixed(0)}%/24h
                    </span>
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
