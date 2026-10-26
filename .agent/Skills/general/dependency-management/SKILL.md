# Dependency Management

## Purpose

Add, upgrade, or remove packages without breaking the build or widening the attack surface.

## When to Use

New library needs, version bumps, vulnerability fixes, removing unused packages.

## Core Principles

- Smallest change: prefer stdlib and already-installed packages over new ones.
- Pin intentionally, review changelogs and breaking changes before upgrading majors.
- Every dependency is a liability: license, maintenance, size, and CVE exposure count.

## Quick Bite Project Rules

- Stack is fixed: Express 5, Knex 3, TS 5.9, `tsyringe`, `class-validator`, `ioredis`, `amqplib`. Do not swap core pieces (e.g. no ORM, no other DI container) without explicit approval.
- New packages go in `dependencies` vs `devDependencies` correctly; `package-lock.json` must stay in sync.
- Runtime config stays behind `zod`-validated env (`src/lib/config/env.ts`); `src/pkg/` must never read `process.env` — pass options via constructors.
- No test runner exists; adding one is a separate, explicit task — not a side effect.

## Common Mistakes

- Adding a utility library for a one-liner (date math exists in `src/pkg/utils/time.ts`).
- Upgrading Express/Knex/TS majors casually — middleware and decorator behavior can shift.
- Leaving `package-lock.json` stale so installs diverge between machines.

## Recommended Approach

1. Prove stdlib/existing packages insufficient; check bundle relevance and maintenance health.
2. Install with exact intent (`-S` vs `-D`), keep the lockfile updated.
3. Wire configuration through env + constructor options, respecting `pkg` purity.
4. Report the added surface (new transitive deps, new env vars) in the final report.

## Examples

Needing an HTTP client for a new provider: check existing patterns first; if added, construct it with explicit timeout/options from env rather than reading env inside `pkg/`.

## Verification Checklist

- [ ] No existing package already covers the need.
- [ ] Correct dependency section; lockfile in sync.
- [ ] No `process.env` reads inside `src/pkg/`.
- [ ] Risks (license, maintenance, breaking changes) reported.

## References

- Node.js docs on modules/semver — https://nodejs.org/en/docs/ ; npm docs — https://docs.npmjs.com/.
