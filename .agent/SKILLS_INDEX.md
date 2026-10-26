# Skills Index — Searchable Catalogue

Read `AGENT_GUIDELINES.md` first, then load the skills matching your task keywords.

## General (`Skills/general/`)

| Skill | Path | Use when | Keywords |
| --- | --- | --- | --- |
| Repository Exploration | `general/repository-exploration/SKILL.md` | Starting any unfamiliar task | explore, orient, call chain, structure |
| Safe Code Changes | `general/safe-code-changes/SKILL.md` | Editing existing code | minimal diff, preserve behavior, refactor |
| Problem Solving | `general/problem-solving/SKILL.md` | Debugging or diagnosing failures | bug, root cause, reproduce, error |
| Code Review | `general/code-review/SKILL.md` | Reviewing a change or PR | review, risk, checklist |
| Documentation | `general/documentation/SKILL.md` | Writing or updating docs | docs, contracts, comments |
| Dependency Management | `general/dependency-management/SKILL.md` | Adding/upgrading packages | npm, dependency, version, CVE |
| Diagram Engineering | `general/diagram-engineering/SKILL.md` | Choosing diagram tools, writing/maintaining diagrams | diagram, mermaid, flowchart, sequence, ER, documentation |

## Architecture (`Skills/architecture/`)

| Skill | Path | Use when | Keywords |
| --- | --- | --- | --- |
| SOLID Principles | `architecture/solid-principles/SKILL.md` | Structuring classes/services | SOLID, abstraction, interface |
| Clean Code & Maintainability | `architecture/clean-code-and-maintainability/SKILL.md` | Writing readable code | naming, functions, complexity |
| Separation of Concerns | `architecture/separation-of-concerns/SKILL.md` | Placing code in layers/modules | layering, lib, pkg, module |
| Naming Conventions | `architecture/naming-conventions/SKILL.md` | Naming anything | DTO, entity, file, enum, token |
| Error Handling | `architecture/error-handling/SKILL.md` | Throwing/handling errors | AppError, status codes, handler |

## Backend (`Skills/backend/`)

| Skill | Path | Use when | Keywords |
| --- | --- | --- | --- |
| TypeScript Best Practices | `backend/typescript-best-practices/SKILL.md` | Writing TS under `strict` | types, null, decorators, generics |
| Express API Design | `backend/express-api-design/SKILL.md` | Adding/changing endpoints | route, middleware, status code |
| Request Validation | `backend/request-validation/SKILL.md` | Validating body/params/query | class-validator, DTO, whitelist |
| Response DTOs & API Contracts | `backend/response-dtos-and-api-contracts/SKILL.md` | Shaping responses | response DTO, envelope, contract |
| Authentication & Authorization | `backend/authentication-and-authorization/SKILL.md` | Auth, guards, RBAC | JWT, cookie, permissions, scope |
| Logging & Observability | `backend/logging-and-observability/SKILL.md` | Logging, tracing, debugging prod | logger, correlation, X-Cache |
| Input Security | `backend/input-security/SKILL.md` | Handling untrusted input | OWASP, injection, secrets, XSS |

## Database (`Skills/database/`)

| Skill | Path | Use when | Keywords |
| --- | --- | --- | --- |
| SQL & PostgreSQL | `database/sql-and-postgresql/SKILL.md` | Writing SQL/Knex/migrations | knex, postgres, postgis, migration |
| Prevent N+1 Queries | `database/prevent-n-plus-one-queries/SKILL.md` | Fetching related rows | N+1, join, whereIn, batch |
| Query Performance & Indexing | `database/query-performance-and-indexing/SKILL.md` | Slow queries, index design | EXPLAIN, index, scan |
| Transactions & ACID | `database/transactions-and-acid/SKILL.md` | Multi-write operations | transaction, atomic, rollback |
| Data Integrity & Constraints | `database/data-integrity-and-constraints/SKILL.md` | Schema rules, enums, FKs | constraint, unique, FK, enum |
| Pagination | `database/pagination/SKILL.md` | Listing endpoints | cursor, limit, meta, query DTO |

## Caching (`Skills/caching/`)

| Skill | Path | Use when | Keywords |
| --- | --- | --- | --- |
| Cache-Aside | `caching/cache-aside/SKILL.md` | Caching reads | lazy load, TTL, hit, miss |
| Cache Invalidation | `caching/cache-invalidation/SKILL.md` | Data changes, staleness | invalidate, stale, outbox events |
| Cache Failure Handling | `caching/cache-failure-handling/SKILL.md` | Redis down/slow paths | fail-open, fallback, timeout |
| Cache Key Design | `caching/cache-key-design/SKILL.md` | Designing keys | key, namespace, collision, scope |

## Reliability (`Skills/reliability/`)

| Skill | Path | Use when | Keywords |
| --- | --- | --- | --- |
| Idempotency | `reliability/idempotency/SKILL.md` | Mutating endpoints, retries | idempotency-key, duplicate, replay |
| Concurrency & Race Conditions | `reliability/concurrency-and-race-conditions/SKILL.md` | Parallel writes, counters | race, lock, FOR UPDATE |
| Retries & Timeouts | `reliability/retries-and-timeouts/SKILL.md` | Calling external services | retry, backoff, timeout, circuit |
| Distributed Systems Fundamentals | `reliability/distributed-systems-fundamentals/SKILL.md` | Outbox, events, consistency | outbox, eventual consistency |

## Testing (`Skills/testing/`)

| Skill | Path | Use when | Keywords |
| --- | --- | --- | --- |
| Testing Strategy | `testing/testing-strategy/SKILL.md` | Deciding what to test | strategy, no runner, risk |
| Unit & Integration Testing | `testing/unit-and-integration-testing/SKILL.md` | Writing tests | unit, integration, knex, DI |
| Regression Prevention | `testing/regression-prevention/SKILL.md` | Preventing repeat bugs | regression, guard test, quirk lock |
