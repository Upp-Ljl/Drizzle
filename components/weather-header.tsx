import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { formatN } from '@/lib/utils';
import type { Kind, MemeRow } from '@/app/api/memes/route';

type Props = {
  kind: Kind;
  high: MemeRow | null;
  low: MemeRow | null;
  anomaly: MemeRow | null;
};

/**
 * 三张策展卡 — 高压区 / 低压区 / 异常涡旋。
 * 任何一张缺数据时给"暂无观测"占位，整页不崩。
 *
 * kind-aware：
 *  - meme: 二创最快 / 二创最慢 / 编辑钦点（用 derivativeCount）
 *  - topic: 讨论度最高 / 距离阈值最远 / 编辑钦点（用 currentN, 显示 / 阈值 X）
 */
export function WeatherHeader({ kind, high, low, anomaly }: Props) {
  const labels =
    kind === 'meme'
      ? {
          high: { label: '高压区', sub: '本周二创最快', emoji: '🔥' },
          low: { label: '低压区', sub: '本周二创最慢', emoji: '🌧' },
          anomaly: { label: '异常涡旋', sub: '编辑钦点 · 跨平台异动', emoji: '⚡' },
        }
      : {
          high: { label: '高压区', sub: '讨论度最高', emoji: '🔥' },
          low: { label: '低压区', sub: '距离阈值最远', emoji: '🌧' },
          anomaly: { label: '异常涡旋', sub: '编辑钦点 · 跨平台异动', emoji: '⚡' },
        };

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <HeaderCard
        emoji={labels.high.emoji}
        label={labels.high.label}
        sub={labels.high.sub}
        meme={high}
        tone="coral"
        kind={kind}
      />
      <HeaderCard
        emoji={labels.low.emoji}
        label={labels.low.label}
        sub={labels.low.sub}
        meme={low}
        tone="forest"
        kind={kind}
      />
      <HeaderCard
        emoji={labels.anomaly.emoji}
        label={labels.anomaly.label}
        sub={labels.anomaly.sub}
        meme={anomaly}
        tone="rust"
        kind={kind}
      />
    </section>
  );
}

function HeaderCard({
  emoji,
  label,
  sub,
  meme,
  tone,
  kind,
}: {
  emoji: string;
  label: string;
  sub: string;
  meme: MemeRow | null;
  tone: 'coral' | 'forest' | 'rust';
  kind: Kind;
}) {
  const toneClass =
    tone === 'coral' ? 'text-coral' : tone === 'forest' ? 'text-forest' : 'text-rust';

  const metricValue = meme ? (kind === 'meme' ? meme.derivativeCount : meme.currentN) : 0;
  const metricLabel = kind === 'meme' ? '二创数' : '讨论度';

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-xl">
          {emoji}
        </span>
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${toneClass}`}>{label}</span>
          <span className="text-xs text-muted">{sub}</span>
        </div>
      </div>
      {meme ? (
        <Link
          href={`/meme/${meme.id}`}
          className="block group"
          aria-label={`${label}: ${meme.title}`}
        >
          <div className="text-lg font-serif text-ink group-hover:text-coral transition-colors">
            {meme.title}
          </div>
          <div className="flex items-baseline gap-2 mt-2 flex-wrap">
            <span className="text-2xl font-mono text-ink">{formatN(metricValue)}</span>
            <span className="text-xs text-muted">{metricLabel}</span>
            {kind === 'topic' && meme.thresholdN !== null ? (
              <span className="text-xs text-muted">/ 阈值 {formatN(meme.thresholdN)}</span>
            ) : null}
            <span className="ml-auto text-sm text-muted">
              赔率 <span className="text-ink font-mono">{meme.oddsX.toFixed(2)}x</span>
            </span>
          </div>
        </Link>
      ) : (
        <div className="text-sm text-muted italic">暂无观测</div>
      )}
    </Card>
  );
}
