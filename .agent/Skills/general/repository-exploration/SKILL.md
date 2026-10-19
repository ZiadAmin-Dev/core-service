# Repository Exploration

## Purpose

Find the right files and understand how they connect before changing anything, so edits land in the correct layer.

## When to Use

Starting any unfamiliar task; locating where a behavior lives; tracing a request, error, or data flow.

## Core Principles

- Map first, edit later. Ten minutes of reading prevents misplaced changes.
- Follow the call chain end to end; never assume two files connect a certain way.
- Prefer project search (file names, symbol names) over guessing paths.

## Quick Bite Project Rules

- Entry points: `src/routes.ts` mounts module routers under `/api`; `src/app.ts` builds the app; `src/server.ts` / `src/worker.ts` boot processes.
- Per module (`src/app/<module>/`): `*.routes.ts` → `controller/` → `service/` → `repository/` → entity. DTOs in `dto/`, error constants in `*.errors.ts`.
- Cross-module reads go through services (e.g. `AuthService` uses `UserService`, `RestaurantService`, `MemberService`), never another module's repository.
- DI wiring lives in `src/lib/di/container.ts` + `tokens.ts`; routes files `container.resolve()` controllers.
- Behavior truth lives in `Docs/API Contracts/` and `Docs/business-logic/` — consult them alongside code.

## Common Mistakes

- Editing a service when the bug is in a guard or middleware ordering in the routes file.
- Assuming a helper exists (e.g. a "current user" util) instead of reading `req.user` typings in `src/lib/types/express.d.ts`.
- Missing the second registration of a duplicated route (known case: branch listing).

## Recommended Approach

1. Start from `src/routes.ts`, open the module router, then controller → service → repository → entity.
2. Grep for the symbol (error constant, DTO name, table name) to find every touchpoint.
3. Read the module's `Docs/API Contracts/<module>.md` and `business-logic/<module>.md` for intended behavior and known quirks.
4. Write down the chain (files + line refs) before proposing the change.

## Examples

Tracing `PATCH /api/restaurants/:id`: `src/routes.ts` → `restaurant.routes.ts` (guard chain) → `controller/restaurant.controller.ts:48` → `service/restaurant.service.ts:108` → `repository/restaurant.repo.ts`.

## Verification Checklist

- [ ] Can name every file in the call chain.
- [ ] Checked docs for known quirks on this path.
- [ ] No assumed-but-unread files remain.

## References

- Project layout: `Docs/system-design/folder-structure.md` (in-repo).
