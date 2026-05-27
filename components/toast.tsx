'use client';

/**
 * Toast — minimal top-right toast stack.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('已发到你的预测面板 →');
 *   toast.error('押注失败');
 *   toast.info('登录中…');
 *
 * Mounted via <ToastProvider> in app/layout.tsx.
 * Auto-dismiss after 4s. Color tokens follow globals.css:
 *   success → coral, error → rust, info → muted.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ToastKind = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastApi = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (msg) => push('success', msg),
      error: (msg) => push('error', msg),
      info: (msg) => push('info', msg),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={(id) =>
        setItems((prev) => prev.filter((t) => t.id !== id))
      } />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Allow calls outside provider in tests / SSR-static contexts without crashing.
    return {
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      data-testid="toast-viewport"
    >
      {items.map((t) => (
        <ToastOne key={t.id} item={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastOne({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // mount fade-in next tick
    const h = setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(h);
  }, []);

  const palette =
    item.kind === 'success'
      ? { bg: '#d96846', fg: '#fdfaf3' } // coral / cream
      : item.kind === 'error'
        ? { bg: '#a64320', fg: '#fdfaf3' } // rust / cream
        : { bg: '#7d756a', fg: '#fdfaf3' }; // muted / cream

  return (
    <div
      role="status"
      data-testid="toast"
      data-kind={item.kind}
      onClick={onDismiss}
      className="card pointer-events-auto cursor-pointer px-4 py-2.5 text-sm shadow-md transition-all duration-200 ease-out"
      style={{
        background: palette.bg,
        color: palette.fg,
        borderColor: palette.bg,
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
      }}
    >
      {item.message}
    </div>
  );
}
