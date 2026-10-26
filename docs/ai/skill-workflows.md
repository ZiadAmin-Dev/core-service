# Skill Workflows — Quick Bite core-service

Which skills to use for common tasks, in what order, and when to skip. Load a skill only if the
task genuinely touches its scope; do not chain skill lists reflexively (that wastes context).

OpenCode loads project skills from `.opencode/skills/` (verified working — all skills appear in
the session's available-skills list and `skill()` invokes them). Detailed catalog:
`docs/ai/skills-catalog.md`; research and decisions: `docs/ai/skills-research-report.md`.

| # | Task | Primary skill | Supporting (load only if truly needed) | Deliverable |
| --- | --- | --- | --- | --- |
| 1 | Review code without modifying files | `code-review` | `AGENTS.md` checklists are embedded in it | must-fix vs suggestion report, unverified areas named |
| 2 | Investigate a bug before fixing | `problem-solving` | `logging-and-observability` (if prod traces needed) | reproducible root-cause, then fix via #8 |
| 3 | Implement a backend API feature | `express-api-design` | `request-validation` → `response-dtos-and-api-contracts` → `naming-conventions` | endpoint matching guard chain, DTOs, envelope, contract doc |
| 4 | Review a Postgres/Knex migration | `sql-and-postgresql` | `data-integrity-and-constraints` | append-only diff, reversible `down`, index+constraint report |
| 5 | Diagnose slow queries | `query-performance-and-indexing` | `prevent-n-plus-one-queries` | EXPLAIN (ANALYZE, BUFFERS) evidence, indexed fix |
| 6 | Design or fix caching | `cache-aside` | `cache-key-design`, `cache-invalidation`, `cache-failure-handling` (if Redis outage paths) | TTL/invalidation plan that stays idempotent under at-least-once consumers |
| 7 | Implement or review a domain event | `event-outbox-publishing` | `distributed-systems-fundamentals` (if consistency design is in question) | EVENT_TYPES + same-trx insert + updated event-driven-architecture doc |
| 8 | Review the outbox worker (read-only) | `event-outbox-publishing` | `code-review`, `concurrency-and-race-conditions` | audit report vs AGENTS.md §4 |
| 9 | Debug retries / poison messages | `retries-and-timeouts` | `event-outbox-publishing` (Known Gaps: no attempts ceiling) | root cause + backoff/ceiling plan |
| 10 | Write integration tests | `unit-and-integration-testing` | `testing-strategy` (if choosing what to test) | vitest tests; evidence actually run |
| 11 | Security review | `input-security` | `authentication-and-authorization`, `request-validation` | OWASP-mapped findings |
| 12 | Explore unfamiliar code | `repository-exploration` | `separation-of-concerns` when judging layering | call-chain map with real file paths |
| 13 | Risky refactor plan | `safe-code-changes` | `solid-principles`, `regression-prevention` | minimal-diff plan + guard tests |
| 14 | Document a module | `documentation` | `diagram-engineering` (if adding diagrams) | docs file matching existing docs style |

## Ordering rules of thumb

- In OpenCode, either the user invokes `@skill-id` explicitly, or the agent calls `skill(id)` when
  the task matches a description. Prefer explicit invocation for audits; automatic matching is fine
  for routine work.
- Sequence for #3: read contracts first (`docs/api contracts/`) → design → validate → respond → name.
  Writing code before checking the existing contract file is the most common miss.
- #1 and #8 are read-only reviews: verification is reading, tracing call chains once, and running
  the repo's 8-point checklist — never modifying files.
- Skip supporting skills when the primary skill's checklist fully covers the risk. E.g., a pure
  content-only documentation change needs no `code-review`; a cache change with no consumer path
  needs no outbox skill.

## Anti-patterns to avoid

- Loading many "architecture" skills for one small edit — the module's `AGENTS.md` already encodes
  the invariants; skills are for task-specific judgment.
- Invoking `sq`-style generic external suites (frontend, .NET) which do not exist or do not apply
  here — the library is the canonical set.
- Treating any skill claim as verified without checking it against real code (`src/**`) or real docs.
