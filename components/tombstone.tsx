'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';
import { useRequireAuth } from '@/lib/auth/use-require-auth';
import { Button } from './ui/button';
import { formatN, cn } from '@/lib/utils';
import type { TombstoneRow } from '@/app/api/graveyard/route';

type Props = {
  row: TombstoneRow;
  onFlowered?: (newCount: number) => void;
};

/**
 * 单墓碑 — 拟"墓碑"风。点击展开看 epitaph + 献花按钮。
 * 「献花」按钮走 useRequireAuth → 未登录弹模态 + 中断恢复。
 */
export function Tombstone({ row, onFlowered }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowersCount, setFlowersCount] = useState(row.flowersCount);
  const [alreadyFlowered, setAlreadyFlowered] = useState(false);
  const requireAuth = useRequireAuth();
  const { user } = useAuth();

  async function postFlower() {
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/graveyard/${row.id}/flower`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graveyardId: row.id }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        flowersCount?: number;
        alreadyFlowered?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `献花失败 (${res.status})`);
        return;
      }
      if (typeof data.flowersCount === 'number') {
        setFlowersCount(data.flowersCount);
        onFlowered?.(data.flowersCount);
      }
      if (data.alreadyFlowered) setAlreadyFlowered(true);
    } catch {
      setError('网络异常,稍后再试');
    } finally {
      setPosting(false);
    }
  }

  return (
    <article
      className={cn(
        'bg-paper border border-warmline rounded-md font-serif transition-colors',
        expanded && 'shadow-card',
      )}
      data-testid={`tombstone-${row.id}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 hover:bg-cream/40 transition-colors rounded-md"
        aria-expanded={expanded}
        aria-controls={`tombstone-body-${row.id}`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {row.kind === 'topic' ? (
              <span
                className="px-2 py-0.5 rounded-sm bg-forest/15 text-forest text-[10px] font-mono uppercase tracking-wider shrink-0"
                data-testid="tombstone-kind-topic"
              >
                话题
              </span>
            ) : (
              <span
                className="px-2 py-0.5 rounded-sm bg-coral/15 text-coral text-[10px] font-mono uppercase tracking-wider shrink-0"
                data-testid="tombstone-kind-meme"
              >
                梗
              </span>
            )}
            <h3 className="text-base font-serif text-ink truncate">
              ⸺ {row.memeTitle} ⸺
            </h3>
          </div>
          <span className="text-xs text-muted font-mono shrink-0">
            #{row.id.toString().padStart(4, '0')}
          </span>
        </div>
        {row.kind === 'topic' && row.topicQuestion && (
          <p className="italic text-xs text-muted font-sans mt-1">
            {row.topicQuestion}
          </p>
        )}
        <div className="mt-1 text-xs text-muted font-sans">
          {row.kind === 'topic' ? '峰值讨论度' : '最高热度'}{' '}
          <span className="font-mono">{formatN(row.maxN)}</span>
          {row.kind === 'topic' && row.thresholdN ? (
            <>
              <span className="mx-2">·</span>
              阈值 <span className="font-mono">{formatN(row.thresholdN)}</span>
            </>
          ) : null}
          <span className="mx-2">·</span>
          看好 <span className="font-mono">{row.backersCount}</span> 人
          <span className="mx-2">·</span>
          献花 <span className="font-mono">{flowersCount}</span>
        </div>
      </button>

      {expanded && (
        <div
          id={`tombstone-body-${row.id}`}
          className="px-5 pb-5 pt-2 border-t border-warmline space-y-3"
        >
          {row.epitaph ? (
            <p className="italic text-sm text-ink leading-relaxed">
              &ldquo;{row.epitaph}&rdquo;
            </p>
          ) : (
            <p className="italic text-sm text-muted leading-relaxed">
              此处尚无墓志铭。
            </p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="primary"
              onClick={() =>
                requireAuth(
                  {
                    kind: 'flower',
                    graveyardId: row.id,
                    returnTo: '/graveyard',
                  },
                  () => postFlower(),
                )
              }
              disabled={posting}
              data-testid={`flower-${row.id}`}
            >
              {posting ? '献花中…' : user ? '献花' : '登录献花'}
            </Button>
            {alreadyFlowered && (
              <span className="text-xs text-muted font-sans">
                今日已献过花,明日再来。
              </span>
            )}
            {error && (
              <span className="text-xs text-coral font-sans">{error}</span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
