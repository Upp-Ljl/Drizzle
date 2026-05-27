import { FAKE_TICKER_BETS } from '@/lib/memes/sources/fake';

/**
 * 横向滚动条 — 静态 mock ticker bets。
 * Phase 2 接 supabase realtime channel 后才动起来；Phase 1 用 CSS marquee。
 */
export function TickerStrip() {
  const items = FAKE_TICKER_BETS;
  if (items.length === 0) return null;

  // 复制一份给 marquee 视觉无缝
  const loop = [...items, ...items];

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
              <span className="text-ink">「{bet.memeSlug}」</span>
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
