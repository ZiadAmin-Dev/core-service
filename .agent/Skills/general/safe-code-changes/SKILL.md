# Safe Code Changes

## Purpose

Make edits that fix the task without breaking neighboring behavior.

## When to Use

Any edit to existing source: bug fixes, features, DTO changes, guard or route updates.

## Core Principles

- Smallest diff that solves the task. One concern per change.
- Preserve observable behavior (status codes, body shapes, error messages) unless the task requires changing it.
- Never widen scope: no unrelated cleanups, renames, or "improvements" in the same edit.

## Quick Bite Project Rules

- Keep the layer contract: controllers validate → services transact → repositories query. Do not put SQL in services or business rules in repositories.
- Keep response shapes byte-compatible; several endpoints intentionally return raw `res.json` instead of the `sendSuccess` envelope (see `Docs/API Contracts/`) — "unifying" them is a breaking change.
- Do not touch migrations, seeds, or `src/lib/config/env.ts` unless explicitly asked.
- Keep imports inside layering rules: `pkg` never imports `lib`/`app`; `lib` never imports `app` (except `di/container.ts`); modules never import another module's repository.

## Common Mistakes

- "Fixing" documented quirks (misspelled keys, double-wrapped bodies) as side effects.
- Adding a new dependency for something the stdlib or an existing package already does.
- Changing a shared helper (`toUserResponse`, `sendSuccess`) without grepping all callers.

## Recommended Approach

1. Explore the chain (see `general/repository-exploration`).
2. Grep all callers/importers of anything you will touch.
3. Make the minimal edit; keep names, shapes, and codes stable.
4. Re-read the edited region for accidental deletions or scope creep.
5. Report what changed, what was assumed, and what was not verified.

## Examples

Adding a field to a response: extend the module's `*.response.dto.ts` `from()` mapper only — do not alter the entity, repository columns, or other endpoints sharing the entity.

## Verification Checklist

- [ ] Diff touches only task-related lines.
- [ ] All callers of changed symbols checked.
- [ ] Response shapes and status codes unchanged (or the change is explicit and reported).
- [ ] Layering rules intact.

## References

- Separation of Concerns skill (this library); `PROJECT_CONTEXT.md` §2–§4.
