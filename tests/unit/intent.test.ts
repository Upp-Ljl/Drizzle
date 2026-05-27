/**
 * Unit tests for lib/auth/intent.ts
 *
 * Polyfills `globalThis.window` and `globalThis.sessionStorage` so the module
 * runs in the Node vitest environment without jsdom.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ------- polyfill sessionStorage + window before importing intent.ts -------
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
  key(i: number): string | null {
    return Array.from(this.map.keys())[i] ?? null;
  }
  get length(): number {
    return this.map.size;
  }
}

const storage = new MemoryStorage();
// Define both `window` (truthy object) and `sessionStorage` on globalThis so
// `typeof window === 'undefined'` is false and `sessionStorage.*` works.
(globalThis as unknown as { window: object }).window = {};
(globalThis as unknown as { sessionStorage: MemoryStorage }).sessionStorage = storage;

// Now import the SUT
import {
  consumeIntent,
  saveIntent,
  type Intent,
} from '../../lib/auth/intent';

const sampleIntent: Intent = {
  kind: 'bet',
  memeId: 42,
  amount: 25,
  returnTo: '/meme/42',
};

describe('intent storage', () => {
  beforeEach(() => {
    storage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saveIntent → consumeIntent roundtrip returns same intent', () => {
    saveIntent(sampleIntent);
    const got = consumeIntent();
    expect(got).toEqual(sampleIntent);
  });

  it('consumeIntent returns null when nothing is stored', () => {
    expect(consumeIntent()).toBeNull();
  });

  it('consumeIntent clears storage (one-shot)', () => {
    saveIntent(sampleIntent);
    expect(consumeIntent()).toEqual(sampleIntent);
    expect(consumeIntent()).toBeNull();
  });

  it('consumeIntent returns null when intent is older than 5 minutes', () => {
    const t0 = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now');

    nowSpy.mockReturnValue(t0);
    saveIntent(sampleIntent);

    // Jump 5 min + 1ms
    nowSpy.mockReturnValue(t0 + 5 * 60 * 1000 + 1);
    expect(consumeIntent()).toBeNull();
  });

  it('consumeIntent returns intent when within 5 min window', () => {
    const t0 = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now');

    nowSpy.mockReturnValue(t0);
    saveIntent(sampleIntent);

    // Jump 4m 59s — should still be valid
    nowSpy.mockReturnValue(t0 + 4 * 60 * 1000 + 59_000);
    expect(consumeIntent()).toEqual(sampleIntent);
  });

  it('consumeIntent returns null when stored value is malformed JSON', () => {
    storage.setItem('mw_intent_v1', '{not valid json');
    expect(consumeIntent()).toBeNull();
  });
});
