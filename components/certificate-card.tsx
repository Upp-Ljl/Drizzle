'use client';

/**
 * CertificateCard — 梗诞生证 / 话题诞生证 (PRODUCT-SPEC §5.5).
 *
 * Three visual states:
 *   - pending (settledPayout === null/undefined): muted neutral border,
 *     sparkle hidden, copy "等待周日结算 …"
 *   - gold (settledPayout > 0): gold 2px border + outer ring + rotating sparkle,
 *     animated entry (fade-in + scale up), payout amount "+ X 币"
 *   - mourn (settledPayout === 0): opacity 60%, title strikethrough, "未中 0 币"
 *
 * State may be passed explicitly via the `state` prop, or derived from
 * `settledPayout`. The component exposes `data-state` for Playwright / a11y.
 *
 * Phase 1 share: clicking 「复制为图片」 opens <SharePoster> in a modal — a
 * static-DOM 400×600 card. Real PNG export is Phase 2.
 */

import { useState } from 'react';
import { CardBody } from '@/components/ui/card';
import { SharePoster } from '@/components/share-poster';
import { formatN } from '@/lib/utils';

type CertState = 'pending' | 'gold' | 'mourn';

type Props = {
  certificateId: string;
  /** Hide/show kind-specific copy. Default 'meme'. */
  kind?: 'meme' | 'topic';
  /** Meme/topic title shown in the cert headline. */
  title: string;
  /** Snapshot of N at the moment the bet was placed. */
  firstNAtBet: number;
  /** For topic-kind certs: the threshold X. Ignored for meme kind. */
  thresholdN?: number | null;
  /** Bet amount in coins. */
  amount: number;
  /** Locked-in odds at the time of the bet. */
  oddsAtBet: number;
  /** Settlement payout. null/undefined = pending; 0 = mourn; >0 = gold. */
  settledPayout?: number | null;
  /** Explicit override. Defaults to derived-from-settledPayout. */
  state?: CertState;
  /** Optional rank: "你是第 X 个押注者". */
  backerRank?: number;
};

function deriveState(settledPayout: number | null | undefined): CertState {
  if (settledPayout === null || settledPayout === undefined) return 'pending';
  if (settledPayout > 0) return 'gold';
  return 'mourn';
}

export function CertificateCard(props: Props) {
  const {
    certificateId,
    kind = 'meme',
    title,
    firstNAtBet,
    thresholdN,
    amount,
    oddsAtBet,
    settledPayout,
    state: stateOverride,
    backerRank,
  } = props;

  const state: CertState = stateOverride ?? deriveState(settledPayout);
  const isTopic = kind === 'topic';
  const [showPoster, setShowPoster] = useState(false);

  const certLabel = isTopic ? '话题诞生证' : '梗诞生证';
  const stateBadge =
    state === 'gold' ? '金证' : state === 'mourn' ? '悼念' : '等待结算';

  const metaLine = isTopic
    ? thresholdN
      ? `押注时这个话题讨论度 ${formatN(firstNAtBet)}（阈值 ${formatN(thresholdN)}）`
      : `押注时这个话题讨论度 ${formatN(firstNAtBet)}`
    : `押注时这个格式只有 ${formatN(firstNAtBet)} 个二创`;

  const statusLine =
    state === 'pending'
      ? '等待周日结算 …'
      : state === 'gold'
        ? `+ ${settledPayout} 币 · 命中`
        : '未中 0 币';

  // Visual style hooks
  const gold = '#c9974b';
  const goldRing = '0 0 0 1px rgba(201,151,75,0.3)';

  const baseStyle: React.CSSProperties =
    state === 'gold'
      ? {
          border: `2px solid ${gold}`,
          boxShadow: goldRing,
        }
      : {};

  const animatedClass =
    state === 'gold' ? 'cert-pop' : state === 'pending' ? 'cert-pop' : '';

  return (
    <>
      <div
        className={`card relative overflow-hidden ${animatedClass}`}
        data-testid="cert-card"
        data-state={state}
        data-cert-id={certificateId}
        data-kind={kind}
        style={{
          ...baseStyle,
          opacity: state === 'mourn' ? 0.6 : 1,
        }}
      >
        {state === 'gold' && (
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="cert-sparkle"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 18,
              height: 18,
              color: gold,
              opacity: 0.85,
            }}
          >
            <path
              fill="currentColor"
              d="M12 0l1.6 7.4L21 9l-7.4 1.6L12 18l-1.6-7.4L3 9l7.4-1.6z"
            />
          </svg>
        )}

        <CardBody>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="label">{certLabel}</div>
              <div
                className="font-mono text-lg mt-0.5"
                data-testid="cert-id"
              >
                诞生证 #{certificateId}
              </div>
            </div>
            <div className="text-right">
              <div className="label">状态</div>
              <div
                className="text-sm font-medium"
                data-testid="cert-state-badge"
                style={state === 'gold' ? { color: gold } : undefined}
              >
                {stateBadge}
              </div>
            </div>
          </div>

          <h3
            className="font-serif text-xl mt-3"
            style={{
              textDecoration: state === 'mourn' ? 'line-through' : 'none',
            }}
            data-testid="cert-title"
          >
            {title}
          </h3>
          <p className="text-xs text-muted mt-1 leading-relaxed">{metaLine}</p>

          <hr className="border-warmline my-3" />

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="label">押注</div>
              <div className="font-serif text-base">{amount} 币</div>
            </div>
            <div>
              <div className="label">赔率</div>
              <div className="font-serif text-base">{oddsAtBet.toFixed(2)}x</div>
            </div>
            <div>
              <div className="label">{state === 'gold' ? '到手' : '可得'}</div>
              <div
                className="font-serif text-base"
                style={state === 'gold' ? { color: gold } : undefined}
                data-testid="cert-payout"
              >
                {state === 'gold'
                  ? `${settledPayout} 币`
                  : `${Math.round(amount * oddsAtBet)} 币`}
              </div>
            </div>
          </div>

          <p
            className="text-xs mt-3 leading-relaxed"
            style={{ color: state === 'gold' ? gold : 'inherit' }}
            data-testid="cert-status-line"
          >
            {statusLine}
            {typeof backerRank === 'number' && state !== 'pending' && (
              <span className="text-muted"> · 你是第 {backerRank} 个押注者</span>
            )}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted">
              {state === 'pending'
                ? '结算后命中即换金证'
                : state === 'gold'
                  ? '炫耀给朋友看 →'
                  : '可去坟场写一句话送别它'}
            </span>
            <button
              type="button"
              onClick={() => setShowPoster(true)}
              className="text-xs px-2.5 py-1 rounded-md border border-warmline hover:bg-paper transition-colors"
              data-testid="cert-share"
            >
              复制为图片
            </button>
          </div>
        </CardBody>
      </div>

      <SharePoster
        open={showPoster}
        onClose={() => setShowPoster(false)}
        certificateId={certificateId}
        title={title}
        firstNAtBet={firstNAtBet}
        amount={amount}
        oddsAtBet={oddsAtBet}
        settledPayout={settledPayout ?? null}
      />
    </>
  );
}
