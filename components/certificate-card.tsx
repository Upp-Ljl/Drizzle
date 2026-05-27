'use client';

/**
 * CertificateCard — 梗诞生证 / 话题诞生证 (PRODUCT-SPEC §5.5)
 *
 * Renders the "pending" state immediately after a successful bet.
 * Kind-aware copy:
 *   - 'meme' kind: "押注时这个**格式**只有 N 个二创"
 *   - 'topic' kind: "押注时这个**话题**讨论度 N（阈值 X）"
 *
 * Phase 1 shows: cert id (short uuid), firstNAtBet snapshot, backer rank.
 * Status defaults to 'pending' — only after settlement does it become
 * 'gold' (won) or 'mourn' (lost). Settle UI lives on /settle/[week].
 */

import { Card, CardBody } from '@/components/ui/card';
import { formatN } from '@/lib/utils';

type Props = {
  certificateId: string;
  firstNAtBet: number;
  backerRank: number;
  memeTitle: string;
  state?: 'pending' | 'gold' | 'mourn';
  kind?: 'meme' | 'topic';
  thresholdN?: number | null;
};

export function CertificateCard({
  certificateId,
  firstNAtBet,
  backerRank,
  memeTitle,
  state = 'pending',
  kind = 'meme',
  thresholdN = null,
}: Props) {
  const stateLabel =
    state === 'gold' ? '金证' : state === 'mourn' ? '悼念' : '等待破圈';
  const stateColor =
    state === 'gold'
      ? 'border-amber-500'
      : state === 'mourn'
        ? 'border-warmline opacity-60'
        : 'border-warmline';
  const isTopic = kind === 'topic';
  const certLabel = isTopic ? '话题诞生证' : '梗诞生证';
  const nLabel = isTopic ? '押注时讨论度 N' : '押注时 N';

  const footerSentence = isTopic ? (
    <>
      押注时这个<strong>话题</strong>讨论度 {formatN(firstNAtBet)}
      {thresholdN ? `（阈值 ${formatN(thresholdN)}）` : ''}。结算后命中即换金证。
    </>
  ) : (
    <>
      押注时这个<strong>格式</strong>只有 {formatN(firstNAtBet)} 个二创。
      结算后命中即换金证。
    </>
  );

  return (
    <Card
      className={`border-2 ${stateColor}`}
      data-testid="certificate-card"
      data-cert-id={certificateId}
      data-kind={kind}
    >
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <div className="label">{certLabel}</div>
            <div className="font-serif text-xl">#{certificateId}</div>
          </div>
          <div className="text-right">
            <div className="label">状态</div>
            <div className="text-sm font-medium">{stateLabel}</div>
          </div>
        </div>
        <hr className="border-warmline my-3" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="label">{nLabel}</div>
            <div className="font-serif text-lg">{formatN(firstNAtBet)}</div>
          </div>
          <div>
            <div className="label">押注序号</div>
            <div className="font-serif text-lg">第 {backerRank} 个</div>
          </div>
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          你在「{memeTitle}」N={formatN(firstNAtBet)} 时听见了它。
        </p>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          {footerSentence}
        </p>
      </CardBody>
    </Card>
  );
}
