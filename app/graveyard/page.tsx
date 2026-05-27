// @screen 屏 5 — 梗坟场 (/graveyard)
//
// Client component (因为分页状态在 client side, useState + TanStack Query).
// 列表用 /api/graveyard?page=N&limit=20; 单条墓碑由 <Tombstone> 渲染,
// 内含「献花」按钮 → useRequireAuth.

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Tombstone } from '@/components/tombstone';
import { SkeletonRows } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import type { GraveyardApiResponse } from '@/app/api/graveyard/route';

const LIMIT = 20;

async function fetchGraveyard(page: number): Promise<GraveyardApiResponse> {
  const res = await fetch(`/api/graveyard?page=${page}&limit=${LIMIT}`);
  if (!res.ok) {
    throw new Error(`graveyard fetch failed: ${res.status}`);
  }
  return (await res.json()) as GraveyardApiResponse;
}

export default function GraveyardPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['graveyard', page],
    queryFn: () => fetchGraveyard(page),
  });

  return (
    <div className="container-x py-6 sm:py-10 max-w-5xl space-y-5 sm:space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-serif tracking-tight">梗坟场</h1>
        <p className="text-sm text-muted">
          失败梗永久档案。点墓碑展开看墓志铭与献花,献花需登录。
        </p>
      </header>

      {isLoading && (
        <div className="space-y-3" data-testid="graveyard-loading">
          <p className="text-xs text-muted font-mono">正在挖掘…</p>
          <SkeletonRows count={4} />
        </div>
      )}

      {isError && (
        <Card className="border-coral/40">
          <CardBody className="text-sm text-coral">
            加载失败: {(error as Error)?.message ?? 'unknown'}
          </CardBody>
        </Card>
      )}

      {data && data.items.length === 0 && (
        <EmptyState
          icon="🪦"
          title="坟场空空"
          sub="本周还没人凉透 —— 周日结算后失败梗会迁入这里。"
        />
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-8">
          {(() => {
            const memeRows = data.items.filter((r) => r.kind !== 'topic');
            const topicRows = data.items.filter((r) => r.kind === 'topic');
            return (
              <>
                <section
                  className="space-y-3"
                  data-testid="graveyard-section-meme"
                >
                  <h2 className="text-lg font-serif text-ink border-b border-warmline pb-2">
                    🔥 热梗坟场
                    <span className="ml-2 text-xs text-muted font-mono">
                      {memeRows.length}
                    </span>
                  </h2>
                  {memeRows.length === 0 ? (
                    <p className="text-sm text-muted">本页无梗墓碑。</p>
                  ) : (
                    memeRows.map((row) => (
                      <div key={row.id} id={`meme-${row.memeId}`}>
                        <Tombstone row={row} />
                      </div>
                    ))
                  )}
                </section>
                <section
                  className="space-y-3"
                  data-testid="graveyard-section-topic"
                >
                  <h2 className="text-lg font-serif text-ink border-b border-warmline pb-2">
                    📰 话题坟场
                    <span className="ml-2 text-xs text-muted font-mono">
                      {topicRows.length}
                    </span>
                  </h2>
                  {topicRows.length === 0 ? (
                    <p className="text-sm text-muted">本页无话题墓碑。</p>
                  ) : (
                    topicRows.map((row) => (
                      <div key={row.id} id={`meme-${row.memeId}`}>
                        <Tombstone row={row} />
                      </div>
                    ))
                  )}
                </section>
              </>
            );
          })()}
        </div>
      )}

      {/* Pagination footer */}
      {data && (
        <footer className="flex items-center justify-between pt-4">
          <div className="text-xs text-muted font-mono">
            第 {data.page} 页 · 共 {data.total} 块墓碑
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
            >
              上一页
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasMore || isFetching}
            >
              下一页
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
