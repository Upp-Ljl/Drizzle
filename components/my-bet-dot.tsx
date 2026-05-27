'use client';

/**
 * MyBetDot — small coral dot rendered next to memes the current user has bet on.
 *
 * Pure presentational component. Caller resolves the betMemeIds list (via
 * `/api/me/bets`) and passes it in; if the user is not logged in, caller
 * should pass an empty array and the dot will simply not render.
 */

type Props = {
  memeId: number;
  betMemeIds: ReadonlySet<number> | number[];
};

export function MyBetDot({ memeId, betMemeIds }: Props) {
  const has = Array.isArray(betMemeIds)
    ? betMemeIds.includes(memeId)
    : betMemeIds.has(memeId);
  if (!has) return null;
  return (
    <span
      role="img"
      aria-label="你押过"
      title="你押过"
      className="inline-block h-1.5 w-1.5 rounded-full bg-coral align-middle"
      data-testid="my-bet-dot"
    />
  );
}
