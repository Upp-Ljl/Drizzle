'use client';

import Link from 'next/link';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';

export function TopNav() {
  const { user, loading, signInWithGitHub, signOut } = useAuth();

  return (
    <nav className="h-12 border-b border-warmline bg-cream flex items-center justify-between px-6 text-sm">
      <div className="flex items-center gap-5 font-mono">
        <Link href="/" className="font-medium text-ink hover:text-coral transition-colors">
          梗气象台
        </Link>
        <Link href="/radar" className="text-muted hover:text-ink transition-colors">
          雷达
        </Link>
        <Link href="/graveyard" className="text-muted hover:text-ink transition-colors">
          梗坟场
        </Link>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {loading ? (
          <span className="text-muted">…</span>
        ) : user ? (
          <>
            <span className="text-muted font-mono">{user.email ?? user.user_metadata?.user_name ?? '已登录'}</span>
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
