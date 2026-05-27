/**
 * 横向滚动条 — 静态 mock ticker bets (visual flavor only).
 * Phase 2 接 supabase realtime channel 后才动起来；Phase 1 用 CSS marquee。
 */

const FAKE_TICKER = [
  { displayName: '@梗象先生', amount: 50, target: 'city 不 city' },
  { displayName: '@早盘哥', amount: 20, target: '尊嘟假嘟' },
  { displayName: '@梗预言家1号', amount: 15, target: 'city 不 city' },
  { displayName: '@二游研究员', amount: 25, target: '你说得对，但...' },
  { displayName: '@综艺观察家', amount: 40, target: '《心动的信号 6》大结局' },
  { displayName: '@老韭菜', amount: 30, target: '破防了' },
  { displayName: '@米家老大', amount: 20, target: '《原神》新角色复刻' },
  { displayName: '@考公男神', amount: 25, target: '格局打开' },
  { displayName: '@偶像分析师', amount: 35, target: '选秀总决赛' },
];

export function TickerStrip() {
  // 复制一份给 marquee 视觉无缝
  const loop = [...FAKE_TICKER, ...FAKE_TICKER];

  return (
    <div
      className="bg-cream border border-warmline rounded-md shadow-card overflow-hidden"
      aria-label="实时押注频道"
    >
      <div className="flex items-center gap-4 px-3 py-2 border-b border-warmline">
        <span className="text-xs uppercase tracking-wider text-muted">实时频道</span>
        <span className="text-xs text-muted">观测站 · 一线播报</span>
      </div>
      <div className="relative overflow-hidden whitespace-nowrap py-2">
        <div className="inline-flex gap-8 animate-[ticker_40s_linear_infinite] px-4 will-change-transform">
          {loop.map((bet, i) => (
            <span key={i} className="text-sm text-ink">
              <span className="text-coral font-medium">{bet.displayName}</span>
              <span className="text-muted"> 押 </span>
              <span className="font-mono">{bet.amount}</span>
              <span className="text-muted"> 币 → </span>
              <span className="text-ink">「{bet.target}」</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
