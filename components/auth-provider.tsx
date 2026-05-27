'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createSupabaseBrowserClient } from '@/lib/auth/client';
import {
  consumeIntent,
  dispatchIntentReplay,
  saveIntent,
  type Intent,
} from '@/lib/auth/intent';
import type { User } from '@supabase/supabase-js';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGitHub: (returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  pendingIntentKind: Intent['kind'] | null;
  openAuthModal: (intent?: Intent) => void;
  closeAuthModal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [pendingIntentKind, setPendingIntentKind] = useState<Intent['kind'] | null>(null);
  const supabase = createSupabaseBrowserClient();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      lastUserId.current = data.user?.id ?? null;
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      const prevId = lastUserId.current;
      setUser(next);
      lastUserId.current = next?.id ?? null;
      // Fire intent replay only on transitions from unauth → auth
      if (!prevId && next) {
        const intent = consumeIntent();
        if (intent) {
          setTimeout(() => dispatchIntentReplay(intent), 0);
        }
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGitHub = useCallback(
    async (returnTo?: string) => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const nextPath =
        returnTo ??
        (typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/');
      const redirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo },
      });
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const openAuthModal = useCallback((intent?: Intent) => {
    if (intent) {
      saveIntent(intent);
      setPendingIntentKind(intent.kind);
    } else {
      setPendingIntentKind(null);
    }
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setPendingIntentKind(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGitHub,
        signOut,
        isAuthModalOpen,
        pendingIntentKind,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
