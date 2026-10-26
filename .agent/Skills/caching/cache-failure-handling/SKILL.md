# Cache Failure Handling

## Purpose

Survive Redis outages and slowness without taking the API down.

## When to Use

Cache-adjacent code, reviewing `withCache`/idempotency paths, Redis incidents.

## Core Principles

- Cache is expendable: every cache failure must degrade to "database answers directly", never to an error page.
- Time-bound every cache call; a hanging cache is worse than no cache.
- Distinguish fail-open (reads: skip cache) from fail-closed (strict correctness gates where noted).

## Quick Bite Project Rules

- `withCache` is fail-open by design: unexpected cache errors log and call `next()` to the controller; cache-set failures only `console.error` without failing the response.
- `idempotency` is fail-open by default but **fail-closed in `strict` mode** (503 when Redis is unreachable) — know which mode your route uses before changing this.
- Do not add cache-dependent correctness (e.g. "if key exists, skip the write") — the cache may vanish at any time.

## Common Mistakes

- Awaiting cache writes on the response critical path (here fire-and-forget with `.catch` — keep it that way).
- Letting a Redis blip 500 checkout-adjacent reads.
- Swallowing cache errors silently with no log at all.

## Recommended Approach

1. Wrap cache interactions so throws fall through to the primary path.
2. Keep cache writes off the critical path (don't await user-visible responses on them).
3. Preserve the strict/non-strict distinction; document which routes are fail-closed.

## Examples

```ts
} catch (err) {
    console.error("Cache Middleware unexpected error, skipping cache:", err);
    next(); // controller serves from DB
}
```

## Verification Checklist

- [ ] Redis failure still yields correct (slower) responses on reads.
- [ ] Strict-mode routes intentionally fail-closed; others fail open.
- [ ] Failures logged with enough context to alert on.

## References

- Redis cache-aside expectations — https://redis.io/docs/latest/develop/use-cases/cache-aside/ .
