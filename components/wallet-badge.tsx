'use client';

/**
 * WalletBadge — compact pill in nav showing 余币 N/100 for logged-in users.
 *
 * Hits /api/me/profile via TanStack Query. Hidden when not logged in.
 */

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from './auth-provider';
import type { MyProfileApiResponse } from '@/app/api/me/profile/route';

export function WalletBadge() {
  const { user } = useAuth();

  const { data } = useQuery<MyProfileApiResponse>({
    queryKey: ['me', 'profile'],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch('/api/me/profile', { cache: 'no-store' });
      if (!res.ok) throw new Error('failed to fetch /api/me/profile');
      return res.json();
    },
    staleTime: 30_000,
  });

  if (!user || !data) return null;

  const remaining = data.profile.weeklyCoins;

  return (
    <Link
      href="/me"
      className="inline-flex items-center rounded-full bg-coral/10 text-coral font-mono text-xs px-2.5 py-0.5 hover:bg-coral/15 transition-colors"
      title="本周配额 · 点击查看我的预测"
      aria-label={`余币 ${remaining}/100`}
    >
      余币 {remaining}/100
    </Link>
  );
}
