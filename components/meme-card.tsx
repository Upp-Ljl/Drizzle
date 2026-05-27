import Link from 'next/link';
import { formatN } from '@/lib/utils';
import type { MemeRow } from '@/app/api/memes/route';

type Props = {
  meme: MemeRow;
  rank: number;
};

const PLATFORM_LABEL: Record<string, string> = {
  bilibili: 'B 站',
  douyin: '抖音',
  xhs: '小红书',
  weibo: '微博',
  twitter: 'X',
  other: '其它',
};

/**
 * 候选池单行 — 用作 `<MemeTable>` 内的一行。点击跳 `/meme/[id]`。
 * 不是 `<Card>` 包装；表格内排版 grid 让所有行对齐。
 */
export function MemeCard({ meme, rank }: Props) {
  const growth = meme.firstSeenN > 0 ? meme.currentN / meme.firstSeenN : 1;
  const growthPct = `${Math.round(growth * 100)}%`;

  return (
    <Link
      href={`/meme/${meme.id}`}
      className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-warmline last:border-b-0 hover:bg-paper transition-colors"
      aria-label={`查看 ${meme.title} 详情`}
    >
      <span className="col-span-1 text-xs text-muted font-mono">#{rank}</span>
      <div className="col-span-5 min-w-0">
        <div className="text-sm font-medium text-ink truncate">{meme.title}</div>
        <div className="text-xs text-muted">
          {PLATFORM_LABEL[meme.sourcePlatform] ?? meme.sourcePlatform}
          {meme.tickerBlurb ? <span className="ml-2">· {meme.tickerBlurb}</span> : null}
        </div>
      </div>
      <span className="col-span-2 text-right text-sm font-mono text-ink">
        {formatN(meme.currentN)}
      </span>
      <span className="col-span-2 text-right text-sm font-mono text-coral">
        {meme.oddsX.toFixed(2)}x
      </span>
      <span className="col-span-2 text-right text-sm font-mono text-forest">{growthPct}</span>
    </Link>
  );
}
