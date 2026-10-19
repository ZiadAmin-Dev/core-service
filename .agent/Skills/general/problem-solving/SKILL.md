# Problem Solving

## Purpose

Diagnose failures systematically and fix root causes instead of symptoms.

## When to Use

Bugs, unexpected responses, failing flows, production incidents, confusing errors.

## Core Principles

- Reproduce (or precisely describe) before theorizing.
- Separate layers: is it routing/guards, validation, service logic, SQL, cache, or events?
- One hypothesis at a time; verify each against code, not memory.

## Quick Bite Project Rules

- Suspect checklist in order: guard chain in `*.routes.ts` (order matters) → `validateBody/Params/Query` DTO constraints → service preconditions (role checks, existence checks) → repository SQL/columns → `withCache` stale HIT → outbox/worker lag for cross-service staleness.
- `X-Cache: HIT/MISS` header and `correlationId` narrow cache vs logic issues.
- `errorHandler` surfaces `err.message` only — a `ValidationError`'s field details are in `err.errors`, invisible to clients; check server logs/objects, not just HTTP bodies.

## Common Mistakes

- Blaming the service when a guard rejected the request (watch 401/403 from `authentication`, `requireRestaurantMember`, `rbac`).
- Blaming the database when `withCache` served a stale or 404-cached body.
- Treating `Number(req.params.x)` / `req.query` values as validated — they are raw strings until a DTO validates them.

## Recommended Approach

1. State expected vs actual behavior with route, inputs, and status code.
2. Walk the chain top-down (routes → guards → controller → service → repo), ruling out each layer.
3. Form one hypothesis, find the exact lines that confirm or kill it, repeat.
4. Fix the root cause minimally; note any sibling paths with the same flaw.

## Examples

`GET /restaurants/:id/branches` returning only active branches: not a service bug — the route is registered twice and Express matches the first handler (documented quirk).

## Verification Checklist

- [ ] Root cause lines identified, not just symptoms.
- [ ] Fix covers the failing path without altering sibling behavior.
- [ ] Verification status reported honestly (ran vs inspected-only).

## References

- Logging & Observability skill (this library).
