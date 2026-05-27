/**
 * tspr login fixture for meme-weather.
 *
 * Contract reference: tspr B-3-17 (UI agent login fixture).
 *   - ESM module
 *   - default export: async function (page: Page) => Promise<boolean>
 *   - returns true if the page ends up logged-in; false otherwise
 *
 * Real flow (GitHub OAuth) is interactive and cannot run unattended in tspr,
 * so we take a shortcut: if TSPR_TEST_USER_JWT is provided, we inject a
 * Supabase auth session cookie directly. Otherwise we surface a warning and
 * return false so the tspr UI agent can fall back to anonymous browsing.
 *
 * The cookie name follows @supabase/ssr's project-ref-keyed convention:
 *   sb-<project-ref>-auth-token
 * where <project-ref> is derived from NEXT_PUBLIC_SUPABASE_URL.
 *
 * --- Real OAuth flow (commented out for reference) ---
 *   await page.goto('http://localhost:3000');
 *   await page.click('text=登录');
 *   await page.click('text=GitHub 登录');
 *   await page.waitForURL(/github\.com\/login/);
 *   await page.fill('input[name=login]', process.env.TSPR_GITHUB_USER!);
 *   await page.fill('input[name=password]', process.env.TSPR_GITHUB_PASSWORD!);
 *   await page.click('input[type=submit]');
 *   await page.waitForURL(/localhost:3000/);
 *   return true;
 */

// Page-like surface: we don't import @playwright/test directly so this file
// has zero compile-time deps on the tspr runtime — tspr passes its own Page.
type CookieSpec = {
  name: string;
  value: string;
  domain?: string;
  url?: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
};

type PageLike = {
  context: () => { addCookies: (cookies: CookieSpec[]) => Promise<void> };
  goto: (url: string) => Promise<unknown>;
};

function projectRefFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  // Match https://<ref>.supabase.co or http(s)://<ref>.supabase.co:port
  const m = url.match(/^https?:\/\/([^.]+)\.supabase\./i);
  return m ? m[1] : null;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default async function loginFixture(page: PageLike): Promise<boolean> {
  const jwt = process.env.TSPR_TEST_USER_JWT;

  if (!jwt) {

    console.warn(
      'tspr: provide TSPR_TEST_USER_JWT for auto-login (Supabase access token). ' +
        'Falling back to anonymous browsing — write actions will trigger the auth modal.',
    );
    return false;
  }

  const projectRef = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!projectRef) {

    console.warn(
      'tspr: NEXT_PUBLIC_SUPABASE_URL missing or non-standard; cannot derive Supabase cookie name.',
    );
    return false;
  }

  const cookieName = `sb-${projectRef}-auth-token`;
  // @supabase/ssr stores the session as a JSON-encoded array; here we mimic
  // the minimal shape it expects. For real e2e prefer real OAuth.
  const cookieValue = JSON.stringify([jwt, null, null, null, null]);

  const appUrl = new URL(APP_URL);

  await page.context().addCookies([
    {
      name: cookieName,
      value: cookieValue,
      domain: appUrl.hostname,
      path: '/',
      httpOnly: false,
      secure: appUrl.protocol === 'https:',
      sameSite: 'Lax',
    },
  ]);

  await page.goto(APP_URL);
  return true;
}
