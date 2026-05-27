/**
 * Generic pulse skeleton. Use for TanStack Query loading placeholders.
 *
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton className="h-24 w-full rounded-md" />
 */

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn('animate-pulse rounded bg-warmline/60', className)}
      {...rest}
    />
  );
}

/** Convenience: a stack of skeleton rows mimicking a list. */
export function SkeletonRows({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-label="loading rows">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
