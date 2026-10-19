# Cache Invalidation

## Purpose

Keep cached data from lying longer than the business tolerates.

## When to Use

Any write path for cached data; designing TTLs; debugging stale reads.

## Core Principles

- There are only two tools: explicit invalidation on write and TTL expiry. Use both — invalidation for correctness, TTL as the backstop.
- Update the store first, then invalidate (the Microsoft-documented order); invalidating first lets a concurrent read repopulate stale data.
- Accept bounded staleness explicitly: name the window (seconds/minutes), don't discover it in production.

## Quick Bite Project Rules

- `withCache` has **no explicit invalidation call sites** — freshness currently relies on TTL expiry (1h storefront, 5m negative-cache on 404s). Treat every cached GET as potentially stale up to its TTL.
- Cross-service freshness flows through outbox domain events (`product.stock.changed`, `branch.updated/deactivated`, `restaurant.suspended`, `rbac.permissions_changed`) which order-service consumes to evict its projections.
- 404s are cached for 5 minutes: a resource created right after a miss stays invisible on that exact URL for up to 5m — known, accepted behavior; do not "fix" per-incident.
- Adding a new cached route without considering its write paths creates a staleness bug by construction.

## Common Mistakes

- Assuming a successful write is immediately visible on cached reads.
- Caching an error body long-term (here only 404s briefly — keep it that way; never cache 5xx).
- Invalidating by pattern-matching keys instead of addressing the exact key space.

## Recommended Approach

1. List the write paths for the data before caching its reads.
2. Choose TTL = worst acceptable staleness; document it at the call site.
3. If stronger freshness is needed, emit/extend an outbox event and document the consumer contract.

## Examples

Branch deactivation relies on `branch.deactivated` outbox events for downstream freshness — the local cached listing still expires by TTL.

## Verification Checklist

- [ ] Write paths enumerated; staleness window named and documented.
- [ ] No 5xx caching; 404 caching intentional and short.
- [ ] Event/consumer contract updated if invalidation flows changed.

## References

- Microsoft Cache-Aside (consistency, write ordering) — https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside .
