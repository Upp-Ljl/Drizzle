'use client';

/**
 * HeatChart — pure-SVG sparkline of the meme's 24h heat trend.
 *
 * Phase 1 caveat: we do NOT yet persist a real heat time-series (Phase 2
 * adds an hourly snapshots table). For now we synthesize a plausible
 * 24-point series from `currentN` using a deterministic pseudo-random
 * walk seeded by the meme id. Once `meme_heat_snapshots` exists, swap
 * this for the real series and delete the synth path.
 */

import { useMemo } from 'react';
import { formatN } from '@/lib/utils';

type Props = {
  currentN: number;
  seed?: number;
  className?: string;
};

function synthSeries(currentN: number, seed: number): number[] {
  // Mulberry32 — tiny deterministic PRNG. Same (currentN, seed) → same series.
  let s = seed || 1;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const points: number[] = [];
  // start at ~40-70% of currentN, drift upward to currentN over 24 ticks
  let value = Math.max(1, Math.round(currentN * (0.4 + rand() * 0.3)));
  for (let i = 0; i < 24; i++) {
    const targetWeight = i / 23;
    const target = Math.round(value * (1 - targetWeight) + currentN * targetWeight);
    const jitter = 1 + (rand() - 0.5) * 0.15;
    value = Math.max(1, Math.round(target * jitter));
    points.push(value);
  }
  // ensure last point sits at currentN so UI doesn't lie
  points[points.length - 1] = currentN;
  return points;
}

export function HeatChart({ currentN, seed = 1, className }: Props) {
  const series = useMemo(() => synthSeries(currentN, seed), [currentN, seed]);

  const width = 560;
  const height = 140;
  const padX = 8;
  const padY = 12;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(1, max - min);

  const stepX = (width - padX * 2) / (series.length - 1);
  const points = series.map((v, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - (v - min) / range) * (height - padY * 2);
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');

  const areaPath =
    path +
    ` L ${points[points.length - 1][0].toFixed(2)} ${height - padY}` +
    ` L ${points[0][0].toFixed(2)} ${height - padY} Z`;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={`24 小时热度趋势, 当前 ${formatN(currentN)}`}
      >
        <defs>
          <linearGradient id="heat-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.20" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#heat-fill)" className="text-coral" />
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="text-coral"
        />
        {points.map(([x, y], i) => {
          if (i !== points.length - 1) return null;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3}
              fill="currentColor"
              className="text-coral"
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-muted mt-1 px-2">
        <span>24h 前 · {formatN(series[0])}</span>
        <span>现在 · {formatN(currentN)}</span>
      </div>
    </div>
  );
}
