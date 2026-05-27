// @vitest-environment jsdom
/**
 * Unit tests for the Toast provider + useToast hook.
 *
 * Coverage:
 *   - useToast outside provider is a no-op (does not throw)
 *   - success/error/info push a toast that renders in the viewport
 *   - kind is set on data-kind attribute
 *   - auto-dismiss after AUTO_DISMISS_MS (4000ms) removes the toast
 *   - clicking a toast dismisses it immediately
 *
 * Uses vi.useFakeTimers() to drive auto-dismiss without real waits.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from '../../components/toast';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function HarnessButton({ kind, message }: { kind: 'success' | 'error' | 'info'; message: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        if (kind === 'success') toast.success(message);
        else if (kind === 'error') toast.error(message);
        else toast.info(message);
      }}
    >
      fire
    </button>
  );
}

describe('useToast outside provider', () => {
  it('returns a no-op api that does not throw and does not render a viewport', () => {
    // Render only the harness — no ToastProvider above it.
    expect(() => render(<HarnessButton kind="success" message="x" />)).not.toThrow();
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'fire' }))).not.toThrow();
    // No viewport (it lives inside the provider) and no toast was rendered.
    expect(screen.queryByTestId('toast-viewport')).toBeNull();
    expect(screen.queryByTestId('toast')).toBeNull();
  });
});

describe('ToastProvider + useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('pushes a success toast and renders it with data-kind="success"', () => {
    render(
      <ToastProvider>
        <HarnessButton kind="success" message="ok!" />
      </ToastProvider>,
    );

    expect(screen.queryByTestId('toast')).toBeNull();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    });

    const toast = screen.getByTestId('toast');
    expect(toast).toBeTruthy();
    expect(toast.getAttribute('data-kind')).toBe('success');
    expect(toast.textContent).toContain('ok!');
  });

  it('pushes an error toast with data-kind="error"', () => {
    render(
      <ToastProvider>
        <HarnessButton kind="error" message="oops" />
      </ToastProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    });
    expect(screen.getByTestId('toast').getAttribute('data-kind')).toBe('error');
  });

  it('pushes an info toast with data-kind="info"', () => {
    render(
      <ToastProvider>
        <HarnessButton kind="info" message="fyi" />
      </ToastProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    });
    expect(screen.getByTestId('toast').getAttribute('data-kind')).toBe('info');
  });

  it('auto-dismisses after 4000ms', () => {
    render(
      <ToastProvider>
        <HarnessButton kind="success" message="byebye" />
      </ToastProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    });
    expect(screen.getByTestId('toast')).toBeTruthy();

    // Tick forward just under 4s — still visible.
    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(screen.queryByTestId('toast')).toBeTruthy();

    // Cross the threshold — gone.
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('clicking a toast dismisses it immediately', () => {
    render(
      <ToastProvider>
        <HarnessButton kind="info" message="click me" />
      </ToastProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    });
    const toast = screen.getByTestId('toast');
    expect(toast).toBeTruthy();
    act(() => {
      fireEvent.click(toast);
    });
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('multiple toasts stack', () => {
    render(
      <ToastProvider>
        <HarnessButton kind="success" message="a" />
      </ToastProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'fire' }));
      fireEvent.click(screen.getByRole('button', { name: 'fire' }));
      fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    });
    expect(screen.getAllByTestId('toast').length).toBe(3);
  });
});
