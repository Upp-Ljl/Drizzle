'use client';

/**
 * CertificateCard — 梗诞生证 (PRODUCT-SPEC §5.5)
 *
 * Renders the "pending" state immediately after a successful bet.
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
};

export function CertificateCard({
  certificateId,
  firstNAtBet,
  backerRank,
  memeTitle,
  state = 'pending',
}: Props) {
  const stateLabel =
    state === 'gold' ? '金证' : state === 'mourn' ? '悼念' : '等待破圈';
  const stateColor =
    state === 'gold'
      ? 'border-amber-500'
      : state === 'mourn'
        ? 'border-warmline opacity-60'
        : 'border-warmline';

  return (
    <Card
      className={`border-2 ${stateColor}`}
      data-testid="certificate-card"
      data-cert-id={certificateId}
    >
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <div className="label">梗诞生证</div>
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
            <div className="label">押注时 N</div>
            <div className="font-serif text-lg">{formatN(firstNAtBet)}</div>
          </div>
          <div>
            <div className="label">押注序号</div>
            <div className="font-serif text-lg">第 {backerRank} 个</div>
          </div>
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          你在「{memeTitle}」N={formatN(firstNAtBet)} 时听见了它。结算后命中即换金证。
        </p>
      </CardBody>
    </Card>
  );
}
