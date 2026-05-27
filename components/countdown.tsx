'use client';

import { useEffect, useState } from 'react';

type Props = {
  weekNumber: number | null;
  settlesAt: string | null; // ISO string
};

/**
 * 气象播报口吻倒计时。每 60s tick 一次。
 * "本周开盘 · 第 N 期 · 还剩 X 天 Y 小时"
 */
export function Countdown({ weekNumber, settlesAt }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!weekNumber || !settlesAt) {
    return (
      <div className="text-sm text-muted">本周尚未开盘 · 等待气象局例会</div>
    );
  }

  const target = new Date(settlesAt).getTime();
  const diffMs = target - now;

  let body: string;
  if (Number.isNaN(target)) {
    body = '结算时间未定';
  } else if (diffMs <= 0) {
    body = '结算窗口已开启';
  } else {
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    body = `还剩 ${days} 天 ${hours} 小时`;
  }

  return (
    <div className="text-sm text-muted">
      本周开盘 · 第 <span className="text-ink font-medium">{weekNumber}</span> 期 · {body}
    </div>
  );
}
