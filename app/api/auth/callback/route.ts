/**
 * GET /api/auth/callback
 *
 * Supabase GitHub OAuth callback. Exchanges the `?code=` for a session and
 * redirects to the `?next=` path (must start with `/`, else falls back to `/`).
 *
 * Returns 400 if `code` is missing.
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/** Only allow same-origin relative paths to avoid open-redirects. */
function sanitizeNext(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  // Block protocol-relative URLs like //evil.com
  if (raw.startsWith('//')) return '/';
  return raw;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = sanitizeNext(url.searchParams.get('next'));

  if (!code) {
    return NextResponse.json({ error: 'missing code' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Surface the message but keep status conservative.
    return NextResponse.json(
      { error: 'oauth exchange failed', message: error.message },
      { status: 400 },
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
