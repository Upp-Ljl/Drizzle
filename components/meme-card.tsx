import Link from 'next/link';
import { formatN } from '@/lib/utils';
import type { Kind, MemeRow } from '@/app/api/memes/route';

type Props = {
  meme: MemeRow;
  rank: number;
  kind?: Kind;
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
 *
 * kind-aware:
 *   meme: 显示 templatePattern 副标题 + 二创数为主指标
 *   topic: 显示 topicQuestion 副标题 + 讨论度为主指标
 */
export function MemeCard({ meme, rank, kind }: Props) {
  // 兼容：如果 kind 没传，从 meme.kind 推断
  const effectiveKind: Kind = kind ?? meme.kind ?? 'meme';

  const growth = meme.firstSeenN > 0 ? meme.currentN / meme.firstSeenN : 1;
  const growthPct = `${Math.round(growth * 100)}%`;

  const metricValue =
    effectiveKind === 'meme' ? meme.derivativeCount : meme.currentN;

  const subtitle =
    effectiveKind === 'meme' ? meme.templatePattern : meme.topicQuestion;

  const badge =
    effectiveKind === 'meme'
      ? { text: '梗', className: 'bg-coralsoft text-rust' }
      : { text: '话题', className: 'bg-forest/15 text-forest' };

  return (
    <Link
      href={`/meme/${meme.id}`}
      className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-warmline last:border-b-0 hover:bg-paper transition-colors"
      aria-label={`查看 ${meme.title} 详情`}
    >
      <span className="col-span-1 text-xs text-muted font-mono">#{rank}</span>
      <div className="col-span-5 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.className}`}
            aria-label={`类型: ${badge.text}`}
          >
            {badge.text}
          </span>
          <div className="text-sm font-medium text-ink truncate">{meme.title}</div>
        </div>
        {subtitle ? (
          <div className="text-xs text-muted italic truncate mt-0.5">{subtitle}</div>
        ) : null}
        <div className="text-xs text-muted mt-0.5">
          {PLATFORM_LABEL[meme.sourcePlatform] ?? meme.sourcePlatform}
          {meme.tickerBlurb ? <span className="ml-2">· {meme.tickerBlurb}</span> : null}
        </div>
      </div>
      <span className="col-span-2 text-right text-sm font-mono text-ink">
        {formatN(metricValue)}
        {effectiveKind === 'topic' && meme.thresholdN !== null ? (
          <span className="block text-[10px] text-muted">/ {formatN(meme.thresholdN)}</span>
        ) : null}
      </span>
      <span className="col-span-2 text-right text-sm font-mono text-coral">
        {meme.oddsX.toFixed(2)}x
      </span>
      <span className="col-span-2 text-right text-sm font-mono text-forest">{growthPct}</span>
    </Link>
  );
}
