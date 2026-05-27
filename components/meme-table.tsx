'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { MemeCard } from '@/components/meme-card';
import type { MemesApiResponse, MemeRow } from '@/app/api/memes/route';

type SortKey = 'heat' | 'odds' | 'growth';

type Props = {
  initial: MemesApiResponse;
};

const SORT_LABELS: Array<{ key: SortKey; label: string }> = [
  { key: 'heat', label: '按热度' },
  { key: 'odds', label: '按赔率' },
  { key: 'growth', label: '按增速' },
];

/**
 * 客户端表格 — 持 sort 状态。
 * 数据由 server component 注入 (initial)；TanStack Query 用于后续刷新（30s staleTime）。
 */
export function MemeTable({ initial }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('heat');

  const { data } = useQuery<MemesApiResponse>({
    queryKey: ['memes'],
    queryFn: async () => {
      const res = await fetch('/api/memes', { cache: 'no-store' });
      if (!res.ok) throw new Error('failed to fetch /api/memes');
      return res.json();
    },
    initialData: initial,
  });

  const memes = data?.memes ?? [];

  const sorted = useMemo(() => sortMemes(memes, sortKey), [memes, sortKey]);

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3 border-b border-warmline">
        <div className="text-sm font-medium text-ink">本周候选池</div>
        <div className="flex items-center gap-1" role="tablist" aria-label="排序方式">
          {SORT_LABELS.map((opt) => {
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
        <span className="col-span-5">梗</span>
        <span className="col-span-2 text-right">气压 N</span>
        <span className="col-span-2 text-right">赔率</span>
        <span className="col-span-2 text-right">7d 增速</span>
      </div>
      {sorted.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-muted">
          本周候选池为空 · 等待小编上料
        </div>
      ) : (
        <div>
          {sorted.map((m, idx) => (
            <MemeCard key={m.id} meme={m} rank={idx + 1} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function sortMemes(memes: MemeRow[], key: SortKey): MemeRow[] {
  const copy = [...memes];
  if (key === 'heat') return copy.sort((a, b) => b.currentN - a.currentN);
  if (key === 'odds') return copy.sort((a, b) => b.oddsX - a.oddsX);
  // growth = currentN / firstSeenN (defend against div-by-zero)
  return copy.sort((a, b) => {
    const ga = a.firstSeenN > 0 ? a.currentN / a.firstSeenN : 0;
    const gb = b.firstSeenN > 0 ? b.currentN / b.firstSeenN : 0;
    return gb - ga;
  });
}
