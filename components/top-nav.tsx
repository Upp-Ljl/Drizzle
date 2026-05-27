'use client';

import Link from 'next/link';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import { WalletBadge } from './wallet-badge';

export function TopNav() {
  const { user, loading, signInWithGitHub, signOut } = useAuth();

  return (
    <nav className="min-h-12 border-b border-warmline bg-cream flex flex-wrap items-center justify-between gap-y-1 px-3 sm:px-6 text-xs sm:text-sm py-1 sm:py-0">
      <div className="flex items-center flex-wrap gap-x-3 sm:gap-x-5 gap-y-1 font-mono">
        <Link href="/" className="font-medium text-ink hover:text-coral transition-colors">
          梗气象台
        </Link>
        <Link href="/radar" className="text-muted hover:text-ink transition-colors">
          雷达
        </Link>
        <Link href="/graveyard" className="text-muted hover:text-ink transition-colors">
          梗坟场
        </Link>
        {user ? (
          <Link href="/me" className="text-muted hover:text-ink transition-colors">
            我的预测
          </Link>
        ) : null}
      </div>
      <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-[11px] sm:text-xs">
        {loading ? (
          <span className="text-muted">…</span>
        ) : user ? (
          <>
            <WalletBadge />
            <span className="text-muted font-mono">
              {user.email ?? user.user_metadata?.user_name ?? '已登录'}
            </span>
            <Button variant="ghost" onClick={() => void signOut()}>
              退出
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={() => void signInWithGitHub()}>
            登录
          </Button>
        )}
      </div>
    </nav>
  );
}
