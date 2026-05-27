/**
 * POST /api/radar/nominate — 提名信号进本周池
 *
 * Phase 1: STUB. Auth path is wired up correctly (401 if not logged in;
 * 501 stub response if logged in) so the UI 中断恢复 flow can be exercised
 * end-to-end. Real insert into `nominations` lands in Phase 2.
 *
 * Body: { signalId: number }
 * Returns:
 *   401 { error: 'unauthorized' }                       — not logged in
 *   400 { error: 'invalid input', details }             — body fails validation
 *   501 { stub: true, message: 'phase 2', signalId }    — auth ok, stub
 */

import { NextResponse } from 'next/server';
import { NominateInput } from '@/lib/validation';
import { getServerUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = NominateInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      stub: true,
      message: 'phase 2 — nominations table writes not yet wired',
      signalId: parsed.data.signalId,
    },
    { status: 501 },
  );
}
