# Distributed Systems Fundamentals

## Purpose

Reason correctly about consistency, ordering, and failure across service boundaries.

## When to Use

Outbox/events work, cross-service reads, cache coordination, or any "two systems must agree" problem.

## Core Principles

- There is no distributed transaction here — design for eventual consistency with explicit convergence (events + idempotent consumers).
- At-least-once delivery is the norm: consumers must tolerate duplicates; producers must tolerate unknown outcomes (publish confirm vs timeout).
- Prefer choreography via versioned domain events over synchronous cross-service writes.

## Quick Bite Project Rules

- Source of truth split: `core-service` owns identity/catalog/RBAC; order-service consumes via sync internal APIs (reads) + `core.events` outbox events (invalidations/blocks).
- Event contract: `EVENT_TYPES` in `src/lib/events/event-types.ts` (`product.stock.changed`, `product.price.changed`, `branch.updated/deactivated`, `restaurant.suspended`, `rbac.permissions_changed`); payloads carry ids + new state, never full graphs.
- Guarantees as built: atomic intent (outbox row commits with the domain write), at-least-once publish (worker retries pending rows), ordered per aggregate only insofar as `id` order is drained — **no global ordering guarantee; consumers must be order-tolerant**.
- Sync reads (`GET /internal/...`) are point-in-time and can disagree with just-published events — callers needing freshness must handle read-your-write gaps.

## Common Mistakes

- Assuming an event means the consumer already applied it (delivery ≠ processed).
- Assuming cross-service ordering ("branch event always arrives before product event").
- Designing a flow that needs rollback across services — redesign into saga-style compensations instead.

## Recommended Approach

1. Name the consistency requirement (immediate vs eventual) and the convergence mechanism (event + consumer).
2. Make consumers idempotent and order-tolerant; key by `event_id`/aggregate version.
3. Document the contract (event names, payload fields) in `Docs/` alongside the code.

## Examples

Stock decrement commits with its `product.stock.changed` row; the worker publishes later; order-service evicts `core:product:<id>` — reads between commit and eviction are stale by design.

## Verification Checklist

- [ ] No cross-service rollback assumed; convergence path named.
- [ ] Consumer idempotent + order-tolerant.
- [ ] Event contract documented; payload minimal.

## References

- Microsoft async messaging / CQRS guidance; `Docs/system-design/system-design.md` §4 (in-repo).
