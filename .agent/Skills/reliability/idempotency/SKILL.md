# Idempotency

## Purpose

Make retried requests safe: the same operation applied twice has the effect of applying it once.

## When to Use

Mutating endpoints (POST/PUT/PATCH), webhooks, invite/OTP flows, anything clients may retry.

## Core Principles

- Distinguish transport retries (same request resent) from user intent (user clicked twice) — keys must capture the right scope.
- Check-then-act needs atomicity; a cache-only guard is a best-effort dedup, not a guarantee.
- Replays must return the original result, not re-execute side effects (no second email, no second row).

## Quick Bite Project Rules

- `idempotency({strict, userScope})` middleware (`src/lib/idempotency/idempotency.ts`): client sends `Idempotency-Key` header; key `idempotency:METHOD:url:key[:userId]`; cached response bodies replayed with 200 for 24h.
- `strict: true` (used on `POST /auth/forget-password`) requires the header (400 if missing) and fails closed (503) when Redis is down. Non-strict routes skip silently without a key.
- `userScope: true` binds the key to the authenticated user — use it where the same client key across users must not collide.
- Limits (verified): dedup is Redis-TTL-based (24h) with no durable table — after expiry or eviction a replay re-executes. OTP/email side effects inside the handler can still double-send on cross-window replays; the `strict` flag does **not** compare request bodies despite its comment — **Undetermined: verify body comparison before relying on it**.

## Common Mistakes

- Assuming the middleware makes the whole flow idempotent (DB writes still need constraints/transactions for real guarantees).
- Reusing one key across different operations (key scope includes method+URL — keep it that way).
- Returning 201-vs-200 inconsistently on replay (here replays return 200 with the original body).

## Recommended Approach

1. Decide scope: per-user or global? Which operations share a key space?
2. Apply the middleware with the narrowest correct options; keep TTL in mind as the guarantee window.
3. Back it with DB constraints (unique keys) for anything that must never duplicate.

## Examples

```ts
authRouter.post("/forget-password", idempotency({ strict: true }), authController.forgetPassword);
```

## Verification Checklist

- [ ] Key scope (user/global) matches the threat (double-click vs retry).
- [ ] Replays return the original result without side effects.
- [ ] Guarantee window (24h Redis) documented; DB constraints cover the rest.

## References

- AWS/API idempotency guidance patterns; `PROJECT_CONTEXT.md` §3 (idempotency).
