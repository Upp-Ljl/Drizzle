'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { WeatherHeader } from '@/components/weather-header';
import { MemeTable } from '@/components/meme-table';
import type { Kind, MemesApiResponse } from '@/app/api/memes/route';

type Props = {
  kind: Kind;
  initial: MemesApiResponse;
};

const TABS: Array<{ kind: Kind; label: string; emoji: string }> = [
  { kind: 'meme', label: '热梗预测', emoji: '🔥' },
  { kind: 'topic', label: '热点话题', emoji: '📰' },
];

/**
 * v0.2 双板 tab 切换。点击 tab 用 router.push 切换 ?kind=...
 * server component 重新拉数据，避免 client-side cache 失配。
 */
export function BoardTabs({ kind, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchKind(next: Kind) {
    if (next === kind) return;
    startTransition(() => {
      router.push(next === 'meme' ? '/' : `/?kind=${next}`);
    });
  }

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="预测板块"
        className="flex items-center gap-6 border-b border-warmline"
      >
        {TABS.map((t) => {
          const active = t.kind === kind;
          return (
            <button
              key={t.kind}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => switchKind(t.kind)}
              className={
                active
                  ? 'relative -mb-px border-b-2 border-coral text-coral pb-2 px-1 text-sm font-medium transition-colors'
                  : 'pb-2 px-1 text-sm text-muted hover:text-ink transition-colors'
              }
            >
              <span aria-hidden className="mr-1">
                {t.emoji}
              </span>
              {t.label}
            </button>
          );
        })}
        {isPending ? (
          <span className="ml-auto text-xs text-muted italic">切换中…</span>
        ) : null}
      </div>

      <WeatherHeader
        kind={kind}
        high={initial.headerCards.high}
        low={initial.headerCards.low}
        anomaly={initial.headerCards.anomaly}
      />

      <MemeTable kind={kind} initial={initial} />
    </div>
  );
}
