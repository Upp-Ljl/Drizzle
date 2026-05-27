'use client';

/**
 * BetForm — amount input (1-100) + 押 button.
 *
 * Behavior:
 *   - User picks amount, clicks 押 X 币
 *   - If unauth: useRequireAuth() saves Intent { kind: 'bet', ... } + opens modal
 *   - After OAuth, AuthProvider fires INTENT_REPLAY_EVENT with the intent
 *   - Our effect catches it (matches by kind === 'bet' && memeId === current)
 *     and replays the bet automatically.
 *   - On success: fires toast.success and a window event
 *     `meme-weather:bet-success` so MemeDetail can render the cert.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/lib/auth/use-require-auth';
import { INTENT_REPLAY_EVENT, type Intent } from '@/lib/auth/intent';
import { useToast } from '@/components/toast';

type Props = {
  memeId: number;
  memeTitle: string;
  oddsX: number;
  currentN: number;
  kind?: 'meme' | 'topic';
  thresholdN?: number | null;
};

type BetResponse = {
  certificateId: string;
  bet: {
    firstNAtBet: number;
    amount: number;
    oddsAtBet: number;
  };
  backersCount: number;
};

export type BetSuccessDetail = {
  certificateId: string;
  firstNAtBet: number;
  amount: number;
  oddsAtBet: number;
  backerRank: number;
  memeId: number;
};

export const BET_SUCCESS_EVENT = 'meme-weather:bet-success';

async function postBet(memeId: number, amount: number): Promise<BetResponse> {
  const res = await fetch(`/api/memes/${memeId}/bet`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const j = (await res.json()) as { error?: string };
      detail = j.error ?? '';
    } catch {
      // ignore
    }
    throw new Error(detail || `bet failed (${res.status})`);
  }
  return (await res.json()) as BetResponse;
}

export function BetForm({
  memeId,
  oddsX,
  currentN,
  kind = 'meme',
  thresholdN = null,
}: Props) {
  const isTopic = kind === 'topic';
  const pathname = usePathname() ?? `/meme/${memeId}`;
  const requireAuth = useRequireAuth();
  const toast = useToast();

  const [amount, setAmount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedAmount, setPlacedAmount] = useState<number | null>(null);
  const latestAmount = useRef(amount);
  useEffect(() => {
    latestAmount.current = amount;
  }, [amount]);

  const place = useCallback(
    async (amt: number) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await postBet(memeId, amt);
        const detail: BetSuccessDetail = {
          certificateId: res.certificateId,
          firstNAtBet: res.bet.firstNAtBet,
          amount: res.bet.amount,
          oddsAtBet: res.bet.oddsAtBet,
          backerRank: res.backersCount,
          memeId,
        };
        setPlacedAmount(amt);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent<BetSuccessDetail>(BET_SUCCESS_EVENT, { detail }),
          );
        }
        toast.success('诞生证已发到你的预测面板 →');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'bet failed';
        setError(msg);
        toast.error(`押注失败：${msg}`);
      } finally {
        setSubmitting(false);
      }
    },
    [memeId, toast],
  );

  // Listen for intent replay (returning from OAuth)
  useEffect(() => {
    function onReplay(e: Event) {
      const detail = (e as CustomEvent<Intent>).detail;
      if (!detail || detail.kind !== 'bet') return;
      if (detail.memeId !== memeId) return;
      void place(detail.amount);
    }
    window.addEventListener(INTENT_REPLAY_EVENT, onReplay);
    return () => window.removeEventListener(INTENT_REPLAY_EVENT, onReplay);
  }, [memeId, place]);

  function onClickBet() {
    const amt = latestAmount.current;
    setError(null);
    requireAuth(
      { kind: 'bet', memeId, amount: amt, returnTo: pathname },
      () => place(amt),
    );
  }

  const potential = Math.round(amount * oddsX);

  const buttonLabel = submitting
    ? '押注中…'
    : placedAmount !== null
      ? '再押一笔'
      : isTopic
        ? `押 ${amount} 币 YES`
        : `押 ${amount} 币`;

  const snapshotLine = isTopic
    ? `诞生证 N 值预览：押下瞬间会快照当前讨论度 N = ${currentN.toLocaleString()}${
        thresholdN ? `（阈值 ${thresholdN.toLocaleString()}）` : ''
      }。`
    : `诞生证 N 值预览：押下瞬间会快照当前 N = ${currentN.toLocaleString()}。`;

  return (
    <div className="card p-4 space-y-4" data-testid="bet-form">
      <div>
        <div className="label">押注金额 (1-100 币)</div>
        <input
          type="number"
          min={1}
          max={100}
          value={amount}
          onChange={(e) => {
            const next = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(next)) {
              setAmount(Math.max(1, Math.min(100, next)));
            }
          }}
          className="w-full border border-warmline rounded-md px-3 py-2 bg-paper text-ink"
          data-testid="bet-amount-input"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="label">当前赔率</div>
          <div className="font-serif text-lg">{oddsX.toFixed(2)}x</div>
        </div>
        <div>
          <div className="label">命中可得</div>
          <div className="font-serif text-lg">{potential} 币</div>
        </div>
      </div>
      <div className="text-xs text-muted">{snapshotLine}</div>
      <Button
        variant="primary"
        className="w-full"
        onClick={onClickBet}
        disabled={submitting}
        data-testid="bet-submit"
      >
        {buttonLabel}
      </Button>
      {error && (
        <p className="text-sm text-rust" data-testid="bet-error">
          {error}
        </p>
      )}
      {placedAmount !== null && !error && (
        <p className="text-xs text-muted" data-testid="bet-placed-hint">
          已下注 {placedAmount} 币 · 请到右下方诞生证查看
        </p>
      )}
    </div>
  );
}
