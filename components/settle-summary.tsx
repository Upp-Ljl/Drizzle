import { Card, CardBody } from './ui/card';
import { formatN } from '@/lib/utils';

type UserBet = {
  id: number;
  memeId: number;
  memeTitle: string;
  amount: number;
  oddsAtBet: number;
  settledPayout: number | null;
};

type Props = {
  weekNumber: number;
  status: string;
  brokeCount: number;
  deadCount: number;
  userBets: UserBet[] | null;
};

/**
 * 结算页顶部 summary card — 战绩公告气场。
 * 未登录时不显示个人战绩，仅显示该周大盘数据。
 */
export function SettleSummary({
  weekNumber,
  status,
  brokeCount,
  deadCount,
  userBets,
}: Props) {
  const totalBets = userBets?.length ?? 0;
  const hits = userBets?.filter((b) => (b.settledPayout ?? 0) > 0).length ?? 0;
  const totalStake = userBets?.reduce((s, b) => s + b.amount, 0) ?? 0;
  const totalPayout =
    userBets?.reduce((s, b) => s + (b.settledPayout ?? 0), 0) ?? 0;
  const net = totalPayout - totalStake;

  return (
    <Card className="bg-cream border-warmline">
      <CardBody className="space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-serif text-ink">
            第 {weekNumber} 期 · 结算战绩
          </h1>
          <span className="text-xs uppercase tracking-wider text-muted font-mono">
            {status}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Stat label="破圈" value={String(brokeCount)} accent="forest" />
          <Stat label="翻车" value={String(deadCount)} accent="coral" />
          {userBets !== null ? (
            <>
              <Stat
                label="你押了"
                value={`${totalBets} 笔`}
                sub={`${formatN(totalStake)} 币`}
              />
              <Stat
                label="净收益"
                value={`${net >= 0 ? '+' : ''}${formatN(net)} 币`}
                accent={net >= 0 ? 'forest' : 'coral'}
                sub={`${hits} / ${totalBets} 命中`}
              />
            </>
          ) : (
            <>
              <Stat label="个人战绩" value="登录后可见" />
              <Stat label="" value="" />
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'forest' | 'coral';
}) {
  if (!label && !value) return <div />;
  const accentClass =
    accent === 'forest'
      ? 'text-forest'
      : accent === 'coral'
      ? 'text-coral'
      : 'text-ink';
  return (
    <div>
      <div className="label">{label}</div>
      <div className={`text-xl font-mono ${accentClass}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
