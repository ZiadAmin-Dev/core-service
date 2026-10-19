# Cache-Aside

## Purpose

Serve hot reads from memory while keeping the database authoritative.

## When to Use

Caching storefront reads, permission sets, or any repeated read of slowly-changing data.

## Core Principles

- Lazy-load: check cache → on miss read DB → populate cache with a TTL → return. Only requested data occupies memory.
- Every entry carries a TTL bounding staleness; on writes, invalidate (delete) rather than rewriting.
- The database is always the source of truth; the cache is a performance layer that may be empty or stale.

## Quick Bite Project Rules

- `withCache(ttl, userScoped?)` middleware implements route-level cache-aside: key `METHOD:originalUrl[:userId]`, `X-Cache: HIT/MISS` header, caches 2xx bodies (and 404s briefly — see Cache Invalidation).
- Default TTL 1h (`toSec(1,'h')`); permission sets conceptually 24h. TTLs live at the call site — keep them visible, not buried.
- Cache access goes through `ICacheProvider` resolved from `TOKENS.CacheProvider` — never import the Redis client directly.
- Cache only idempotent GETs; never cache authenticated-mutating or user-specific bodies without `userScoped: true`.

## Common Mistakes

- Caching a user-scoped response under a shared key (data leaks across users).
- No TTL (stale forever) or absurd TTLs (1s = no benefit, 30d = stale month).
- Treating a cache hit as proof the record exists — always handle "record deleted but key alive" windows.

## Recommended Approach

1. Confirm the read is hot, shared (or scope it), and staleness-tolerant.
2. Wrap with `withCache` and an explicit TTL matching tolerance.
3. Plan invalidation at write time (next skill) before shipping.

## Examples

```ts
branchRouter.get('/branches/nearby', withCache(toSec(1, 'h')), branchController.findNearby);
```

## Verification Checklist

- [ ] Key includes everything varying the response (URL + user scope where needed).
- [ ] Explicit TTL matching staleness tolerance.
- [ ] Accessed via `ICacheProvider`, not the raw client.

## References

- Redis cache-aside — https://redis.io/docs/latest/develop/use-cases/cache-aside/ ; AWS caching patterns — https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html .
