import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { formatN } from '@/lib/utils';
import type { MemeRow } from '@/app/api/memes/route';

type Props = {
  high: MemeRow | null;
  low: MemeRow | null;
  anomaly: MemeRow | null;
};

/**
 * 三张策展卡 — 高压区 / 低压区 / 异常涡旋。
 * 任何一张缺数据时给"暂无观测"占位，整页不崩。
 */
export function WeatherHeader({ high, low, anomaly }: Props) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <HeaderCard
        emoji="🔥"
        label="高压区"
        sub="本周热度最高"
        meme={high}
        tone="coral"
      />
      <HeaderCard
        emoji="🌧"
        label="低压区"
        sub="冷启动观察池"
        meme={low}
        tone="forest"
      />
      <HeaderCard
        emoji="⚡"
        label="异常涡旋"
        sub="编辑钦点 · 跨平台异动"
        meme={anomaly}
        tone="rust"
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
}: {
  emoji: string;
  label: string;
  sub: string;
  meme: MemeRow | null;
  tone: 'coral' | 'forest' | 'rust';
}) {
  const toneClass =
    tone === 'coral' ? 'text-coral' : tone === 'forest' ? 'text-forest' : 'text-rust';

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
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-2xl font-mono text-ink">{formatN(meme.currentN)}</span>
            <span className="text-xs text-muted">气压 N</span>
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
