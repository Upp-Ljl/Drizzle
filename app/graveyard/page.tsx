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
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif tracking-tight">梗坟场</h1>
        <p className="text-sm text-muted">
          失败梗永久档案。点墓碑展开看墓志铭与献花,献花需登录。
        </p>
      </header>

      {isLoading && (
        <Card>
          <CardBody className="text-sm text-muted text-center py-10">
            正在挖掘…
          </CardBody>
        </Card>
      )}

      {isError && (
        <Card className="border-coral/40">
          <CardBody className="text-sm text-coral">
            加载失败: {(error as Error)?.message ?? 'unknown'}
          </CardBody>
        </Card>
      )}

      {data && data.items.length === 0 && (
        <Card>
          <CardBody className="text-sm text-muted text-center py-10">
            这里安静得很 —— 还没有梗入坟。
          </CardBody>
        </Card>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((row) => (
            <div key={row.id} id={`meme-${row.memeId}`}>
              <Tombstone row={row} />
            </div>
          ))}
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
