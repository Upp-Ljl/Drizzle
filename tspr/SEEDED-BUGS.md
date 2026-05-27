# Seeded Bugs — for tspr to find

> This file is what tspr evaluators check against to determine whether tspr
> "found something real". Do NOT link to this from the public README.

## TSPR-BUG-1 — Settlement timezone off-by-one

**Location:** `lib/memes/settle.ts` — search `// TSPR-BUG-1`

**Symptom:** Bets placed within ~hours of a Sunday settlement boundary can be
attributed to the wrong week when settle is invoked from a timezone different
from the user's. Root cause: `new Date()` (server-local TZ) used instead of
the week's explicit `settles_at` in UTC.

**How tspr should find it:** A fixture with bets straddling UTC midnight
between two weeks, then assert that all bets within week N appear in week N's
settlement report.

---

## TSPR-BUG-2 — Bet race condition

**Location:** `app/api/memes/[id]/bet/route.ts` — search `// TSPR-BUG-2`

**Symptom:** Concurrent POST /api/memes/[id]/bet from the same user can debit
the user's wallet past zero. Root cause: read-modify-write of
`profiles.weekly_coins` without row lock or atomic update.

**How tspr should find it:** Concurrent request fixture (10 parallel POSTs
with `amount` close to the wallet ceiling) followed by an assertion that the
wallet is ≥ 0.

---

## TSPR-BUG-3 — Graveyard pagination off-by-one

**Location:** `app/api/graveyard/route.ts` — search `// TSPR-BUG-3`

**Symptom:** Records appear on both `?page=1` and `?page=2`. Root cause:
`offset = page * limit` instead of `(page - 1) * limit`.

**How tspr should find it:** Two-page fetch then set-intersection assert is
empty.

---

## How to confirm fix

Each fix PR should reference the TSPR-BUG-N tag, remove the `// TSPR-BUG-N`
comment, and add a regression test in `tests/unit/` or `tests/e2e/`.
