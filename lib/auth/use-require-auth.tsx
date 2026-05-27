'use client';

import { useAuth } from '@/components/auth-provider';
import type { Intent } from './intent';

/**
 * useRequireAuth — wraps an action so that an unauthenticated user is sent
 * through the OAuth flow with their intent preserved, and the same action
 * is replayed on return.
 *
 * Usage:
 *   const requireAuth = useRequireAuth();
 *   onClick={() => requireAuth(
 *     { kind: 'bet', memeId: 1, amount: 10, returnTo: '/meme/1' },
 *     () => placeBet(),
 *   )}
 */
export function useRequireAuth() {
  const { user, openAuthModal } = useAuth();
  return (intent: Intent, action: () => void | Promise<void>) => {
    if (user) {
      void action();
    } else {
      openAuthModal(intent);
    }
  };
}
