# Unit and Integration Testing

## Purpose

Write tests that prove behavior at the right layer with the least flakiness.

## When to Use

Commissioned to add tests for services, repositories, validation, or endpoints.

## Core Principles

- Unit tests: pure rules and mappers with no I/O (DTO `from()`, fee math, permission checks) — fast, deterministic, many.
- Integration tests: repositories/services against a real PostgreSQL (migrations applied) — fewer, covering transactions, constraints, and locks.
- Isolate with tokens: tsyringe lets tests bind fake `ICacheProvider`/`IEmailProvider` instances without touching production wiring.

## Quick Bite Project Rules

- No runner exists yet (see Testing Strategy); new suites must state their runner assumption explicitly.
- Unit-testable seams already present: `toEntity`/`toResponse`/`from()` mappers, `validateBody/Params/Query` (assert `ValidationError.errors` shape), guard helpers with stubbed `req`, outbox payload builders.
- Integration essentials: run migrations on a scratch DB, wrap each test in a rolled-back transaction where possible, never point at shared/dev databases.
- Keep the layering rules in tests too: test services through their public methods with stubbed providers, not by reaching into repositories' internals.

## Common Mistakes

- Mocking Knex itself (tests the mock); hit a real scratch DB for repo tests.
- Time-dependent tests without frozen clocks (OTP expiry, cursor pagination).
- Committing tests that require local Redis/RabbitMQ without documenting or containerizing them.

## Recommended Approach

1. Start with unit tests for mappers/validators touched by the change.
2. Add integration tests for transactional flows (commit + rollback paths).
3. Register fakes via `container.registerInstance(TOKENS.X, fake)` in test setup; clear between tests.

## Examples

```ts
// Unit: mapper parity with the documented contract.
const dto = UserResponseDTO.from(user);
assert.deepEqual(Object.keys(dto).sort(), ["createdAt","email","id","name","phone","systemRole","updatedAt"]);
```

## Verification Checklist

- [ ] Runner + DB prerequisites documented in the test setup.
- [ ] Unit tests deterministic (no clock/network); integration tests use a scratch DB.
- [ ] DI fakes cleaned up between tests.

## References

- Node.js test runner — https://nodejs.org/api/test.html ; tsyringe — https://github.com/microsoft/tsyringe .
