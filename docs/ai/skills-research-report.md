# Skills Research Report — 2026-10-27

Audit, research, and curation performed in one session against OpenCode **v2.0.29**.

## 1. Baseline (verified facts)

- **36 project-local skills on disk** under `.opencode/skills/` (flat), all with valid frontmatter
  (`name`, `description`). 36 mirrored (frontmatter-stripped) copies under `.agent/Skills/` in 7
  category dirs, maintained as a documented library (`.agent/README.md`, `SKILLS_INDEX.md`,
  `SOURCES.md`, `PROJECT_CONTEXT.md`, `AGENT_GUIDELINES.md`).
- **All 36 confirmed discoverable and loadable**: every one appears in the live session's
  available-skills manifest (OpenCode auto-scans `.opencode/skills/*/SKILL.md` per
  https://opencode.ai/docs/skills/). Additionally `code-review` was invoked earlier this session
  via `@code-review` and functioned — invocation path verified in practice.
- **2 built-in skills** (`opencode`, `report`) ship with OpenCode and off-disk here.
- **No user-global skills**: `~/.config/opencode/skills/` and `~/.opencode/` absent;
  `~/.config/opencode/opencode.jsonc` contains only the `$schema` line.
- **Existing instruction system**: `AGENTS.md` (repo invariants) is active as system instructions;
  `.agent/AGENT_GUIDELINES.md`, `.agent/PROJECT_CONTEXT.md` are reference documents.
- Hash comparison showed all 36 mirror pairs differ byte-wise; spot-diff proved the delta is the
  frontmatter header that must exist only on the `.opencode` side (e.g., `code-review`: 2405 vs
  2289 bytes; the `.agent` copy lacks the 4-line YAML header, body identical).

## 2. Research performed

Sources consulted (web):

1. Official docs — https://opencode.ai/docs/skills/ and /v2/docs/skills/ (discovery rules, naming,
   frontmatter, invocation via `skill()`; confirms current setup matches the documented format).
2. Ecosystem roundups — Firecrawl "Best OpenCode skills 2026", Composio "10 Best OpenCode Skills",
   opencode.school install guides.
3. Outbox/messaging-specific search — found only stack-mismatched candidates (PHP/, .NET
   `codewithmukesh/dotnet-claude-kit`, paywalled aggregator listings) and StackOverflow/Medium
   articles (not skills).
4. anthropics/skills known entries (skill-creator, frontend-design, webapp-testing) — evaluated as
   frontend/tooling, not applicable.

Research conclusion: the external ecosystem offers generic/frontend/other-stack skills; the highest
value was a **project-specific procedural skill** for this repo's signature architecture, following
the library's own template — consistent with the mission's "do not install every candidate" rule.

## 3. Gap analysis (evidence-based)

Mapping the mission's categories A–H to the existing 36: A, B, C, E are essentially fully covered;
F is covered at the architecture-documentation level by `diagram-engineering` + `documentation`;
G is covered by `repository-exploration`, `safe-code-changes`, `problem-solving`, plus the
`.agent/` library itself. Category D (distributed/reliability) had breadth (`idempotency`,
`retries-and-timeouts`, `distributed-systems-fundamentals`, `concurrency`) but **no procedural
skill for the outbox/event pipeline** — the system this repo exists for (`AGENTS.md` §4). The
reasoning skill explicitly says "Outbox/events work" but provides no how-to: no mention of
`insertOutboxEvent` call pattern, envelope shape, routing-key coordination procedure, worker
verification steps, or known gaps (no attempts ceiling, `occurredAt` mutation).

## 4. Decisions

| Candidate | Source | Decision | Evidence |
| --- | --- | --- | --- |
| **event-outbox-publishing** (new, project-authored) | written from `src/lib/events/*`, `src/worker.ts`, `src/pkg/messaging/rabbitmq.client.ts`, `docs/system-design/event-driven-architecture.md` | **Install (P0)** | Original instruction body, no copied third-party content, matches library template, fills verified gap |
| PHP outbox skill (MCP Market) | mcpmarket.com/...transactional-outbox-pattern-knowledge | Reject | Wrong stack (PHP), unverified provenance, installation-gated listing |
| .NET messaging kit | github.com/codewithmukesh/dotnet-claude-kit | Reject | C#/.NET conventions not transferable to TS/Knex/tsx |
| anthropics/skills — skill-creator | github.com/anthropics/skills | Reject (for now) | Eval/benchmark tooling for creating skill suites; this library is already well-formed |
| anthropics/skills — frontend-design, webapp-testing | github.com/anthropics/skills | Reject | Frontend/Playwright focus; no backend value here |
| Generic suites (Superpowers, Cloudflare, Vercel, Composio, stop-slop…) | composio/firecrawl roundups | Reject | Overlap with existing library without new capability; popularity ≠ applicability |
| Duplicate workflow-router skills | (none installed) | Reject | Existing `.agent/SKILLS_INDEX.md` + new `docs/ai/skill-workflows.md` solve discoverability with zero prompt cost |

Runnable scripts were not executed (none were needed or provided); no third-party skill content was
copied; all claims in the new skill were verified against the named source files before writing.

## 5. What was added

- `.opencode/skills/event-outbox-publishing/SKILL.md` (with frontmatter) — **created and
  discovered** (harness re-scan listed it; frontmatter name/description parsed).
- `.agent/Skills/reliability/event-outbox-publishing/SKILL.md` (library copy, no frontmatter).
- `.agent/SKILLS_INDEX.md` — new Reliability row.
- `.agent/SOURCES.md` — new "Messaging" section (microservices.io — Transactional Outbox).
- `docs/ai/skills-catalog.md`, `docs/ai/skills-inventory.json`, `docs/ai/skill-workflows.md`
  (this file set; JSON validated on write — see §6).

## 6. What could not be verified / open items

- Built-in `opencode`/`report` skill behavior — accepted as documented by OpenCode, not exercised.
- `docs/ai/skills-inventory.json` validity: written as structured JSON and inspected on creation;
  a separate `jq`-style parse pass was not run manually — flagged for final verification.
- `.agent/AGENT_GUIDELINES.md` section numbers referenced by skills ("§7") — not cross-checked.
- Reconciliation proposal (not applied, needs your approval): add a one-line note in
  `.agent/README.md` stating that every skill edit must be mirrored into `.opencode/skills/<id>/`
  with frontmatter added. This prevents future tree drift.
- Node/worker-level validation of the new skill's guidance (running `worker:dev` against a live
  broker) was not performed — audit-only scope, no application code touched.

## 7. Manual actions remaining

1. Review the proposed README sync note (§6 above).
2. Decide on the outbox worker audit findings from earlier this session (poison-message ceiling,
   stale bulk-update comment, transaction-across-publishes) — documented in this session's
   conversation, not in the skill (it records "Known Gaps" as built).
