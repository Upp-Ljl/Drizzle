'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { MemeCard } from '@/components/meme-card';
import type { Kind, MemesApiResponse, MemeRow } from '@/app/api/memes/route';

type SortKey = 'heat' | 'odds' | 'growth';

type Props = {
  kind: Kind;
  initial: MemesApiResponse;
};

const SORT_LABELS_BY_KIND: Record<Kind, Array<{ key: SortKey; label: string }>> = {
  meme: [
    { key: 'heat', label: '按二创数' },
    { key: 'odds', label: '按热度' },
    { key: 'growth', label: '按增速' },
  ],
  topic: [
    { key: 'heat', label: '按讨论度' },
    { key: 'odds', label: '按距离阈值' },
    { key: 'growth', label: '按增速' },
  ],
};

const HEADING: Record<Kind, string> = {
  meme: '本周热梗候选',
  topic: '本周热点话题',
};

const METRIC_LABEL: Record<Kind, string> = {
  meme: '二创 N',
  topic: '讨论度 N',
};

/**
 * 客户端表格 — 持 sort 状态，kind-aware。
 * 数据由 server component 注入 (initial)；TanStack Query 用于后续刷新（30s staleTime）。
 */
export function MemeTable({ kind, initial }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('heat');

  const { data } = useQuery<MemesApiResponse>({
    queryKey: ['memes', kind],
    queryFn: async () => {
      const res = await fetch(`/api/memes?kind=${kind}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('failed to fetch /api/memes');
      return res.json();
    },
    initialData: initial,
  });

  const memes = data?.memes ?? [];
  const sortOptions = SORT_LABELS_BY_KIND[kind];

  const sorted = useMemo(() => sortMemes(memes, sortKey, kind), [memes, sortKey, kind]);

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3 border-b border-warmline">
        <div className="text-sm font-medium text-ink">{HEADING[kind]}</div>
        <div className="flex items-center gap-1" role="tablist" aria-label="排序方式">
          {sortOptions.map((opt) => {
            const active = opt.key === sortKey;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSortKey(opt.key)}
                className={
                  active
                    ? 'px-2 py-1 text-xs rounded bg-coralsoft text-rust font-medium'
                    : 'px-2 py-1 text-xs rounded text-muted hover:text-ink'
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-muted uppercase tracking-wider border-b border-warmline bg-paper">
        <span className="col-span-1">#</span>
        <span className="col-span-5">{kind === 'meme' ? '梗' : '话题'}</span>
        <span className="col-span-2 text-right">{METRIC_LABEL[kind]}</span>
        <span className="col-span-2 text-right">赔率</span>
        <span className="col-span-2 text-right">7d 增速</span>
      </div>
      {sorted.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-muted">
          {kind === 'meme'
            ? '本周热梗候选池为空 · 等待小编上料'
            : '本周热点话题池为空 · 等待小编上料'}
        </div>
      ) : (
        <div>
          {sorted.map((m, idx) => (
            <MemeCard key={m.id} meme={m} rank={idx + 1} kind={kind} />
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Kind-aware sort:
 *   meme: heat=derivativeCount desc, odds=currentN desc (热度), growth=currentN/firstSeenN
 *   topic: heat=currentN desc (讨论度), odds=ratio to thresholdN (越接近越靠前 -> use distance asc),
 *          growth=currentN/firstSeenN
 */
export function sortMemes(memes: MemeRow[], key: SortKey, kind: Kind = 'meme'): MemeRow[] {
  const copy = [...memes];
  if (key === 'heat') {
    if (kind === 'meme') return copy.sort((a, b) => b.derivativeCount - a.derivativeCount);
    return copy.sort((a, b) => b.currentN - a.currentN);
  }
  if (key === 'odds') {
    if (kind === 'topic') {
      // 按距离阈值升序：currentN 越接近 thresholdN，越靠前
      return copy.sort((a, b) => {
        const da = a.thresholdN ? Math.abs(a.thresholdN - a.currentN) : Infinity;
        const db = b.thresholdN ? Math.abs(b.thresholdN - b.currentN) : Infinity;
        return da - db;
      });
    }
    // meme: 按热度 (currentN) 降序
    return copy.sort((a, b) => b.currentN - a.currentN);
  }
  // growth = currentN / firstSeenN (defend against div-by-zero)
  return copy.sort((a, b) => {
    const ga = a.firstSeenN > 0 ? a.currentN / a.firstSeenN : 0;
    const gb = b.firstSeenN > 0 ? b.currentN / b.firstSeenN : 0;
    return gb - ga;
  });
}
