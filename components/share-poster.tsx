'use client';

/**
 * SharePoster — DOM-rendered 400×600 shareable card.
 *
 * Phase 1: static DOM render shown inside a modal. The user is hinted to
 * right-click → save image. Phase 2 will swap in html-to-canvas / OG generator.
 *
 * Composes:
 *   - 大标题：「我在 N=X 时押中了 [title]」
 *   - cert id (#xxxxxxxx)
 *   - 战绩数字 (押 amount / 赔率 / 收益)
 *   - 二维码占位 (square placeholder)
 *   - 水印：「——梗气象台 第 47 期」
 */

import { useEffect, useState, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  certificateId: string;
  title: string;
  firstNAtBet: number;
  amount: number;
  oddsAtBet: number;
  settledPayout?: number | null;
  weekNumber?: number;
};

export function SharePoster({
  open,
  onClose,
  certificateId,
  title,
  firstNAtBet,
  amount,
  oddsAtBet,
  settledPayout,
  weekNumber = 47,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const payout =
    typeof settledPayout === 'number' ? settledPayout : Math.round(amount * oddsAtBet);
  const won = typeof settledPayout === 'number' && settledPayout > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="share-poster-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col items-center gap-3 max-h-[90vh] overflow-y-auto">
        <PosterFrame
          certificateId={certificateId}
          title={title}
          firstNAtBet={firstNAtBet}
          amount={amount}
          oddsAtBet={oddsAtBet}
          payout={payout}
          won={won}
          weekNumber={weekNumber}
        />
        <div className="flex items-center gap-3">
          <p className="text-xs text-cream font-mono opacity-80">
            右键 → 存图 / 截图保存
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-cream px-3 py-1 border border-cream/40 rounded-md hover:bg-cream/10"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function PosterFrame({
  certificateId,
  title,
  firstNAtBet,
  amount,
  oddsAtBet,
  payout,
  won,
  weekNumber,
}: {
  certificateId: string;
  title: string;
  firstNAtBet: number;
  amount: number;
  oddsAtBet: number;
  payout: number;
  won: boolean;
  weekNumber: number;
}) {
  const gold = '#c9974b';
  const goldSoft = 'rgba(201,151,75,0.3)';
  return (
    <div
      data-testid="share-poster"
      className="relative font-serif"
      style={{
        width: 400,
        height: 600,
        background: '#fdfaf3',
        color: '#2d2a25',
        border: `2px solid ${gold}`,
        boxShadow: `0 0 0 6px ${goldSoft}, 0 20px 50px rgba(0,0,0,0.35)`,
        padding: '36px 28px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PosterCorner position="tl" />
      <PosterCorner position="tr" />
      <PosterCorner position="bl" />
      <PosterCorner position="br" />

      <Label>梗气象台 · 战绩海报</Label>

      <div
        style={{
          fontSize: 26,
          lineHeight: 1.25,
          fontWeight: 600,
          marginTop: 10,
          letterSpacing: '-0.01em',
        }}
      >
        我在 N=<span style={{ color: gold }}>{firstNAtBet}</span>
        <br />
        时押中了「{title}」
      </div>

      <div
        style={{
          marginTop: 18,
          padding: '12px 14px',
          background: '#fdfaf3',
          border: `1px solid ${goldSoft}`,
          borderRadius: 4,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Stat label="押注" value={`${amount} 币`} />
          <Stat label="赔率" value={`${oddsAtBet.toFixed(2)}x`} />
          <Stat label={won ? '到手' : '可得'} value={`${payout} 币`} highlight={won ? gold : undefined} />
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: '#7d756a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            诞生证编号
          </div>
          <div style={{ fontSize: 16, marginTop: 2, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            #{certificateId}
          </div>
          <div style={{ fontSize: 10, color: '#7d756a', marginTop: 10, fontStyle: 'italic' }}>
            ——梗气象台 第 {weekNumber} 期
          </div>
        </div>
        <QrPlaceholder color={gold} />
      </div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: '0.2em',
        color: '#7d756a',
        textTransform: 'uppercase',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: '#7d756a',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginTop: 2,
          color: highlight ?? '#2d2a25',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function QrPlaceholder({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      style={{
        width: 72,
        height: 72,
        background:
          `repeating-conic-gradient(${color} 0% 25%, transparent 0% 50%) 50% / 14px 14px`,
        border: `1px solid ${color}`,
        borderRadius: 2,
      }}
    />
  );
}

function PosterCorner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const gold = '#c9974b';
  const size = 12;
  const offset = 6;
  const styles: Record<string, React.CSSProperties> = {
    tl: { top: offset, left: offset, borderTop: `1px solid ${gold}`, borderLeft: `1px solid ${gold}` },
    tr: { top: offset, right: offset, borderTop: `1px solid ${gold}`, borderRight: `1px solid ${gold}` },
    bl: { bottom: offset, left: offset, borderBottom: `1px solid ${gold}`, borderLeft: `1px solid ${gold}` },
    br: { bottom: offset, right: offset, borderBottom: `1px solid ${gold}`, borderRight: `1px solid ${gold}` },
  };
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        width: size,
        height: size,
        ...styles[position],
      }}
    />
  );
}
