'use client';

/**
 * Demo-only time accelerator. One big button — fast-forwards the current
 * open week to settled, then jumps to /settle/<weekNumber>.
 *
 * Mounted only when DEMO_MODE=true (see ./layout.tsx).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AccelerateResponse = {
  weekId: number;
  weekNumber: number;
  brokeCount: number;
  deadCount: number;
};

export default function DemoAcceleratePage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onClick() {
    setStatus('running');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/dev/accelerate', { method: 'POST' });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) msg = body.error;
        } catch {
          // ignore parse error
        }
        setStatus('error');
        setErrorMsg(msg);
        return;
      }
      const data = (await res.json()) as AccelerateResponse;
      setStatus('done');
      router.push(`/settle/${data.weekNumber}`);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'unknown error');
    }
  }

  const label =
    status === 'running' ? '加速中…' : status === 'done' ? '已结算' : '⏩ 加速到周日结算';

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">时间加速器</h1>
      <p className="text-sm text-gray-500">
        Demo 工具：把当前开放周直接推进到结算状态，跳转到战绩页。
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={status === 'running' || status === 'done'}
        className="rounded-lg bg-black px-8 py-4 text-lg text-white shadow disabled:opacity-50"
      >
        {label}
      </button>
      <div className="min-h-[1.5rem] text-sm" role="status" aria-live="polite">
        {status === 'running' && <span className="text-gray-500">加速中…</span>}
        {status === 'done' && <span className="text-green-600">已结算，跳转中…</span>}
        {status === 'error' && <span className="text-red-600">失败：{errorMsg}</span>}
      </div>
    </main>
  );
}
