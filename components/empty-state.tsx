import type { ReactNode } from 'react';
import { Card, CardBody } from '@/components/ui/card';

type Props = {
  title: string;
  sub?: string;
  icon?: ReactNode; // emoji or svg
  cta?: ReactNode; // optional action (button / link)
  className?: string;
};

/**
 * Reusable empty-state card. Used on /me (logged-out), /graveyard (empty),
 * /radar (tier with no signals), etc.
 */
export function EmptyState({ title, sub, icon, cta, className }: Props) {
  return (
    <Card className={'border-dashed ' + (className ?? '')}>
      <CardBody className="flex flex-col items-center text-center gap-3 py-10 px-6">
        {icon ? (
          <div aria-hidden className="text-3xl">
            {icon}
          </div>
        ) : null}
        <div className="text-base font-serif text-ink">{title}</div>
        {sub ? <p className="text-sm text-muted max-w-sm">{sub}</p> : null}
        {cta ? <div className="pt-1">{cta}</div> : null}
      </CardBody>
    </Card>
  );
}
