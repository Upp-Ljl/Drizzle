'use client';

/**
 * Visual 3-dot stepper for the demo accelerator.
 *
 * Step states:
 *   completed: filled forest (with check)
 *   active:    filled coral
 *   pending:   muted ring
 */

type Step = {
  key: string;
  label: string;
};

type Props = {
  steps: Step[];
  current: number; // 0-based index of active step
  done?: boolean; // if true, treat current as completed too
};

export function AcceleratorStepper({ steps, current, done = false }: Props) {
  return (
    <ol
      className="flex items-center justify-center gap-2 sm:gap-4"
      aria-label="加速进度"
    >
      {steps.map((step, idx) => {
        const isCompleted = done ? idx <= current : idx < current;
        const isActive = !done && idx === current;
        return (
          <li key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-current={isActive ? 'step' : undefined}
                className={
                  'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-mono transition-colors ' +
                  (isCompleted
                    ? 'bg-forest text-cream'
                    : isActive
                    ? 'bg-coral text-cream animate-pulse'
                    : 'bg-cream text-muted border border-warmline')
                }
              >
                {isCompleted ? '✓' : idx + 1}
              </span>
              <span
                className={
                  'text-[10px] sm:text-xs font-mono ' +
                  (isActive
                    ? 'text-coral'
                    : isCompleted
                    ? 'text-forest'
                    : 'text-muted')
                }
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 ? (
              <span
                aria-hidden
                className={
                  'h-px w-6 sm:w-12 ' +
                  (isCompleted ? 'bg-forest' : 'bg-warmline')
                }
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
