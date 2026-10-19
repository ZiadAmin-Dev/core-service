# Separation of Concerns

## Purpose

Put every piece of code in the layer that owns it, so changes stay local.

## When to Use

Placing new code, moving code, reviewing structure, adding infrastructure.

## Core Principles

- Each layer has one job and one direction of dependencies.
- Business rules must not leak into transport (HTTP) or persistence (SQL) code, and vice versa.
- Shared code goes to the lowest layer that can own it without creating cycles.

## Quick Bite Project Rules

Layer map (dependencies point down only):

```text
src/app/  (controllers → services → repositories; DTOs, entities)
   ↓ may import lib, pkg
src/lib/  (guards, cache glue, events, DI, validation, config)
   ↓ may import pkg, env
src/pkg/  (pure providers: cache, email, messaging, utils)
```

- Controllers: HTTP only (validate → service → respond). No SQL, no transactions, no business decisions.
- Services: rules + orchestration + transactions. No `req`/`res`, no SQL strings.
- Repositories: Knex queries + row↔entity mapping. No business errors beyond not-found shapes decided by callers; never start transactions.
- `pkg` purity: no imports from `lib`/`app`, no `process.env`, no Express/Knex concepts.
- Cross-module: services may call sibling **services**; never a sibling module's repository (only `di/container.ts` may wire across).

## Common Mistakes

- `Number(req.params.x)` business defaults inside controllers instead of validated DTOs.
- Authorization logic duplicated in services when the route guard already owns it (or vice versa — dropping the guard because "service checks too").
- Importing `db` (Knex) directly into a service to run a query instead of adding a repository function.

## Recommended Approach

1. Classify the new code: transport, rule, query, or pure utility?
2. Place it in the owning layer/module; expose via the layer's existing seam (service method, repo function, provider interface).
3. Check imports point downward only.

## Examples

Reserving stock: controller parses nothing (DTO), service runs the transaction and emits the outbox event, repository runs the `FOR UPDATE` select + decrement.

## Verification Checklist

- [ ] No SQL outside repositories; no HTTP objects below controllers.
- [ ] Transactions start in services only.
- [ ] Import directions respect the layer map.

## References

- `Docs/system-design/folder-structure.md` (in-repo).
