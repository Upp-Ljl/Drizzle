/**
 * Intent — short-lived "I was about to do X before login" payload.
 *
 * Saved to sessionStorage right before OAuth redirect.
 * Consumed after the user returns logged-in.
 * Has a 5-min freshness guard so stale intents don't auto-fire later.
 */

export type Intent =
  | { kind: 'bet'; memeId: number; amount: number; returnTo: string }
  | { kind: 'flower'; graveyardId: number; returnTo: string }
  | { kind: 'nominate'; signalId: number; weekId: number; returnTo: string }
  | { kind: 'epitaph'; graveyardId: number; text: string; returnTo: string };

type Wrapped = { intent: Intent; savedAt: number };

const KEY = 'mw_intent_v1';
const TTL_MS = 5 * 60 * 1000;

export function saveIntent(intent: Intent) {
  if (typeof window === 'undefined') return;
  const wrapped: Wrapped = { intent, savedAt: Date.now() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(wrapped));
  } catch {
    // ignore quota / privacy mode
  }
}

export function consumeIntent(): Intent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const wrapped = JSON.parse(raw) as Wrapped;
    if (Date.now() - wrapped.savedAt > TTL_MS) return null;
    return wrapped.intent;
  } catch {
    return null;
  }
}

export const INTENT_REPLAY_EVENT = 'mw:intent:replay';

export function dispatchIntentReplay(intent: Intent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(INTENT_REPLAY_EVENT, { detail: intent }));
}
