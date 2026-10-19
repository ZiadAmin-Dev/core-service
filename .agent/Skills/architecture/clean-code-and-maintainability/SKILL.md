# Clean Code and Maintainability

## Purpose

Write code the next reader (human or agent) can understand without a archaeology dig.

## When to Use

Writing or editing any source file.

## Core Principles

- Meaningful names over comments explaining bad names.
- Small, cohesive functions with one level of abstraction per function.
- Flat control flow: guard clauses and early returns beat deep nesting.
- No duplication of business rules (single source of truth), but tolerate small duplication over wrong abstractions.
- Complexity budgets: if a function needs a paragraph to explain, split it at a real seam.

## Quick Bite Project Rules

- Follow the module's existing voice: `find*/create*/update*` repos, `toEntity`/`toResponse`/`from()` mappers, error constants in `*.errors.ts`.
- Keep controllers thin; a controller method longer than ~15 lines is a smell — the logic belongs in the service.
- Reuse `toUserResponse`-style mappers instead of hand-picking fields per call site.
- Comments cite why, not what (`// ST_DWithin over GIST index` beats `// query branches`). Business-rule comments may cite `file:line`.

## Common Mistakes

- Splitting cohesive code into fragments that must be read together (worse than one clear function).
- Clever Knex chains without intermediate names on 6-table joins.
- Copy-pasting an ownership/role check instead of reusing the guard or service check.

## Recommended Approach

1. Name things after the domain (`restaurantMemberInfo`, `branchIds`), not the mechanism (`data2`, `result`).
2. Extract only cohesive steps with clear inputs/outputs.
3. Flatten nesting with early returns/throws.
4. Re-read the final code as a stranger would.

## Examples

Prefer `if (!restaurant) throw restaurantNotFoundError;` at the top over wrapping the whole method body in `if (restaurant) { ... }`.

## Verification Checklist

- [ ] Names reveal intent; no mystery temporaries.
- [ ] No duplicated business rule across files.
- [ ] Nesting depth stays shallow; controllers thin.

## References

- *Clean Code* (R. Martin) principles summary; project conventions in `PROJECT_CONTEXT.md`.
