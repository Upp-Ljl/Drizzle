'use client';

/**
 * Demo-only time accelerator — guided 3-step flow.
 *
 * Step 0 (intro):   explainer card + 主按钮 "⏩ 开始加速"
 * Step 1 (running): stepper + animated status line; API call fires immediately
 *                   but UI lingers ~2.5s for narrative
 * Step 2 (done):    success card showing brokeCount/deadCount + auto-redirect to
 *                   /settle/<weekNumber> after 2s + manual "查看战绩" button
 * On error:         error card with retry
 *
 * Mounted only when DEMO_MODE=true (see ./layout.tsx).
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AcceleratorStepper } from '@/components/accelerator-stepper';

type AccelerateResponse = {
  weekId: number;
  weekNumber: number;
  brokeCount: number;
  deadCount: number;
};

type Phase = 'intro' | 'running' | 'done' | 'error';

const STEPS = [
  { key: 'lock', label: '锁定周次' },
  { key: 'verdict', label: '判定 verdicts' },
  { key: 'payout', label: '计算 payout' },
];

const RUN_BEATS = [
  { ms: 0, line: '锁定本周开放周次…' },
  { ms: 900, line: '对每个 meme 判定 hard/dead verdict…' },
  { ms: 1800, line: '为每位押注用户计算 payout…' },
];

export default function DemoAcceleratePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<AccelerateResponse | null>(null);
  const [runStep, setRunStep] = useState(0); // 0..2 inside running phase

  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beatTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup any pending timers on unmount.
  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
      beatTimers.current.forEach((t) => clearTimeout(t));
      beatTimers.current = [];
    };
  }, []);

  async function start() {
    setPhase('running');
    setErrorMsg(null);
    setResult(null);
    setRunStep(0);

    // Schedule the dramatic beats. Total ~2.5s.
    beatTimers.current.forEach((t) => clearTimeout(t));
    beatTimers.current = RUN_BEATS.map((beat, idx) =>
      setTimeout(() => setRunStep(idx), beat.ms),
    );

    // Fire API immediately; race-with-timer is fine — we hold the UI until
    // both the API resolves AND the minimum-narrative-time has elapsed.
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 2500));

    try {
      const apiCall = (async (): Promise<AccelerateResponse> => {
        const res = await fetch('/api/dev/accelerate', { method: 'POST' });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const body = (await res.json()) as { error?: string };
            if (body?.error) msg = body.error;
          } catch {
            // ignore
          }
          throw new Error(msg);
        }
        return (await res.json()) as AccelerateResponse;
      })();

      const [data] = await Promise.all([apiCall, minDelay]);

      setResult(data);
      setRunStep(STEPS.length - 1);
      setPhase('done');

      // Auto-redirect after 2s; user can also click manual button.
      redirectTimer.current = setTimeout(() => {
        router.push(`/settle/${data.weekNumber}`);
      }, 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'unknown error');
      setPhase('error');
    }
  }

  function goToSettle() {
    if (!result) return;
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
    router.push(`/settle/${result.weekNumber}`);
  }

  return (
    <main className="container-x flex min-h-[70vh] flex-col items-center justify-center gap-6 py-10">
      <header className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-ink">
          时间加速器
        </h1>
        <p className="text-sm text-muted">
          Demo 工具 · 跳到周日 21:00 结算 · 看本周战绩
        </p>
      </header>

      <div className="w-full max-w-xl">
        <AcceleratorStepper
          steps={STEPS}
          current={phase === 'intro' ? -1 : phase === 'done' ? STEPS.length - 1 : runStep}
          done={phase === 'done'}
        />
      </div>

      {phase === 'intro' && (
        <Card className="w-full max-w-xl">
          <CardBody className="space-y-4 text-center py-8">
            <div aria-hidden className="text-4xl">
              ⏩
            </div>
            <h2 className="text-lg font-serif text-ink">现在跳到周日 21:00 结算</h2>
            <p className="text-sm text-muted max-w-md mx-auto">
              系统会把本周开放的梗判定 hard/dead，结算所有押注，然后带你看战绩页。
              真实跑一周需要 7 天，demo 里只要 3 秒。
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={start}
                className="px-8 py-3 text-base"
                data-testid="accelerator-start"
              >
                ⏩ 开始加速
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {phase === 'running' && (
        <Card className="w-full max-w-xl">
          <CardBody className="space-y-4 text-center py-8" aria-live="polite">
            <div aria-hidden className="text-4xl animate-pulse">
              ⏳
            </div>
            <h2 className="text-lg font-serif text-ink">加速中…</h2>
            <p className="text-sm text-muted font-mono min-h-[1.5rem]">
              {RUN_BEATS[runStep]?.line ?? '准备中…'}
            </p>
            <div
              className="h-1 w-full bg-warmline rounded-full overflow-hidden"
              aria-label="progress"
            >
              <div
                className="h-full bg-coral transition-all duration-700 ease-out"
                style={{ width: `${((runStep + 1) / RUN_BEATS.length) * 100}%` }}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {phase === 'done' && result && (
        <Card className="w-full max-w-xl border-forest/40">
          <CardBody className="space-y-4 text-center py-8" data-testid="accelerator-done">
            <div aria-hidden className="text-4xl">
              ✅
            </div>
            <h2 className="text-lg font-serif text-forest">第 {result.weekNumber} 周已结算</h2>
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <div className="card p-3">
                <div className="label">破圈</div>
                <div className="text-2xl font-mono text-coral">{result.brokeCount}</div>
              </div>
              <div className="card p-3">
                <div className="label">入坟</div>
                <div className="text-2xl font-mono text-rust">{result.deadCount}</div>
              </div>
            </div>
            <p className="text-xs text-muted">2 秒后自动跳转到战绩页…</p>
            <div className="pt-1">
              <Button variant="primary" onClick={goToSettle} data-testid="accelerator-goto-settle">
                查看战绩 →
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {phase === 'error' && (
        <Card className="w-full max-w-xl border-coral/40">
          <CardBody className="space-y-4 text-center py-8" data-testid="accelerator-error">
            <div aria-hidden className="text-4xl">
              ⚠️
            </div>
            <h2 className="text-lg font-serif text-coral">加速失败</h2>
            <p className="text-sm text-muted font-mono break-words">{errorMsg}</p>
            <div className="pt-1 flex items-center justify-center gap-2">
              <Button variant="secondary" onClick={() => setPhase('intro')}>
                返回
              </Button>
              <Button variant="primary" onClick={start}>
                重试
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
