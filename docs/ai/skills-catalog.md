# Skills Catalog — Quick Bite core-service

Generated 2026-10-27 against OpenCode **v2.0.29**. Machine-readable twin:
`docs/ai/skills-inventory.json`. Task routing: `docs/ai/skill-workflows.md`.
Research decisions: `docs/ai/skills-research-report.md`.

## Structure

OpenCode discovers skills from `.opencode/skills/<id>/SKILL.md` (frontmatter `name` + `description`).
The same 37 skills exist as a categorized source library in `.agent/Skills/` (without frontmatter),
maintained per `.agent/README.md`. Mirrors diverge **only** by the frontmatter header — `.opencode`
copies are byte-identical otherwise-by-design; any edit must be applied to both trees.

Two skills ship with OpenCode itself and are not on disk in this repo: `opencode` and `report`.

## Overview (37 project skills + 2 built-in)

| ID | Category | Purpose (one line) |
| --- | --- | --- |
| repository-exploration | general | Orient in unfamiliar code: find files, map call chains before edits |
| safe-code-changes | general | Minimal-diff edits that fix the task without breaking neighbors |
| problem-solving | general | Systematic bug diagnosis; root causes over symptoms |
| code-review | general | 8-point repo checklist review of any diff |
| documentation | general | Docs that stay true to code; matches `docs/` conventions |
| dependency-management | general | Add/upgrade/remove packages without breaking the build |
| diagram-engineering | general | Right diagram type/tool (Mermaid/D2), maintainable diagram sources |
| solid-principles | architecture | SOLID as design judgment, not abstraction multiplication |
| clean-code-and-maintainability | architecture | Code the next reader can understand |
| separation-of-concerns | architecture | Right layer per piece (pkg/lib/app layering) |
| naming-conventions | architecture | Names matching repo conventions (DTO/entity/token) |
| error-handling | architecture | Typed AppErrors through central middleware |
| typescript-best-practices | backend | strict + decorator TS preventing bugs |
| express-api-design | backend | Endpoints matching routing/middleware/status conventions |
| request-validation | backend | Reject bad input at the boundary via class-validator DTOs |
| response-dtos-and-api-contracts | backend | Exact documented response shape; no leaked internals |
| authentication-and-authorization | backend | Guards, scopes, RBAC on every route |
| logging-and-observability | backend | Correlated logs, explainable production behavior |
| input-security | backend | OWASP handling of untrusted input; no secret leakage |
| sql-and-postgresql | database | Correct Knex SQL, PostGIS, safe migrations |
| prevent-n-plus-one-queries | database | Batch with whereIn/joins, no per-row queries |
| query-performance-and-indexing | database | Index budget for read paths; EXPLAIN-verified changes |
| transactions-and-acid | database | Service-level transactions, explicit commit/rollback |
| data-integrity-and-constraints | database | Schema-enforced invariants (FKs, CHECK enums, uniques) |
| pagination | database | Bounded, stable list pages |
| cache-aside | caching | Hot reads from memory, DB authoritative |
| cache-key-design | caching | Unambiguous, collision-free, scoped keys |
| cache-invalidation | caching | Idempotent invalidation under at-least-once consumers |
| cache-failure-handling | caching | Redis outage/slowness without taking the API down |
| idempotency | reliability | `Idempotency-Key` middleware; retried requests safe |
| concurrency-and-race-conditions | reliability | Optimistic/conditional updates, FOR UPDATE locking |
| retries-and-timeouts | reliability | Call external systems without hanging/amplifying outages |
| distributed-systems-fundamentals | reliability | Consistency/ordering reasoning across service boundaries |
| event-outbox-publishing | reliability | **New.** Author/publish/audit events: same-trx outbox, drain, confirms, routing-key coordination |
| testing-strategy | testing | Right verification for the risk |
| unit-and-integration-testing | testing | Vitest tests at the right layer |
| regression-prevention | testing | Guard tests keeping fixes/quirks fixed |
| opencode (built-in) | tool | Questions about OpenCode itself |
| report (built-in) | tool | Report opencode issues to GitHub |

## Detailed entry — the one addition

### Event Outbox Publishing

- **ID**: `event-outbox-publishing`
- **Location**: `.opencode/skills/event-outbox-publishing/SKILL.md`
  (mirror: `.agent/Skills/reliability/event-outbox-publishing/SKILL.md`)
- **Origin**: newly added (project-specific, written against verified code; not copied from any
  external source). No external outbox skill passed quality/provenance review (see research report).
- **Purpose**: end-to-end *procedure* for domain events — add `EVENT_TYPES` constant (coordinated
  with order-service bindings), same-transaction `insertOutboxEvent(trx, …)` at service level,
  worker drain semantics (`claimBatch` FOR UPDATE SKIP LOCKED → `publishConfirmed` →
  `markDispatched`), envelope shape, consumer dedupe via `event_id`, and Known Gaps (no attempts
  ceiling, `occurredAt` regenerated per attempt, trx held across publishes).
- **When to use**: adding/auditing event emissions; any change to `src/lib/events/` or
  `src/worker.ts`; debugging "event never arrived".
- **When NOT to use**: consumer-side logic (order-service repo); pure cache concerns.
- **Invocation**: `@event-outbox-publishing` or `skill({name: "event-outbox-publishing"})`.
- **Overlap warning**: `distributed-systems-fundamentals` covers the *reasoning*; use it when the
  question is consistency design. Both reference each other; do not merge.
- **Status**: verified (frontmatter parsed, discovery confirmed live by the harness in this session).

## Availability status legend

- **verified** — file on disk, frontmatter valid, and appears in the harness's available-skills list
  (proof of discovery). Functionality per-skill is proven only where explicitly noted.
- **unverified** — present but not independently confirmed (the two built-in skills; their behavior
  is documented by OpenCode itself).
- Every project skill listed above was **discovered** in the current session's available-skills
  manifest — evidence that OpenCode v2.0.29 loads all of them.

## Known inconsistencies (documented, not silently "fixed")

1. **Dual-tree maintenance**: edits must go to both `.opencode/skills/` and `.agent/Skills/`. The
   index files live only under `.agent/` (README, SKILLS_INDEX, SOURCES, PROJECT_CONTEXT,
   AGENT_GUIDELINES). Recommend a one-line sync note in `.agent/README.md` (pending approval).
2. `.agent/AGENT_GUIDELINES.md` is referenced by skills as "§7 truthful reporting" etc. — section
   numbering should be checked if that file changes (unverified).
3. The OpenCode-loadable tree is `.gitignore`d (`.opencode/`), while `.agent/` is also ignored
   (both listed under "local agent working files — not tracked"). All skill documentation in
   `docs/ai/` **is** trackable; keep the catalogs in git, the skills untracked.
