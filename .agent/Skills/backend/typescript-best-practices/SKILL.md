# TypeScript Best Practices

## Purpose

Use the type system to prevent bugs instead of documenting around them, within this repo's `strict` + decorator setup.

## When to Use

Writing or editing any TypeScript in `src/`.

## Core Principles

- `strict` + `noImplicitAny` are on: type every boundary (function params, returns on exported functions, DTO fields). Never silence with `any` — use `unknown` + narrowing.
- Narrow `null`/`undefined` explicitly; reserve non-null `!` for cases you can prove (e.g. `req.user?.userId!` after the `authentication` guard — the codebase's established pattern).
- Prefer `interface` for shapes, `class` for entities/DTOs with behavior (`from()`, constructors), `enum` only for closed domain sets.
- Keep decorators to their established uses: class-validator on request DTOs, tsyringe on services/controllers.

## Quick Bite Project Rules

- Entities construct from `Partial<T>` with `!` assertions inside the constructor — follow that shape for new entities; validate at the DTO boundary, not in the entity.
- `strictPropertyInitialization` is effectively satisfied via `!:` on DTO/entity fields — keep the pattern, do not add redundant initializers.
- `emitDecoratorMetadata` + `reflect-metadata` (imported in `server.ts`/`worker.ts`) are load-bearing for tsyringe — never remove the import.
- `nodenext` module resolution: use explicit `.js`-less relative imports as existing files do; match their style exactly.

## Common Mistakes

- `any` creeping in through `req.body`/`row: any` without narrowing at the boundary.
- Using `!` on genuinely nullable DB results (`find*` returns `T | undefined`) instead of an existence check + domain error.
- Adding `@IsOptional()` without understanding it skips other validators when absent — correct, but don't stack contradictory decorators.

## Recommended Approach

1. Type the boundary first (DTO/entity), let inference handle internals.
2. Handle `undefined` from repositories immediately (throw the module's not-found error).
3. Keep new decorators to the two blessed families (validation, DI).

## Examples

```ts
// Boundary: prove non-null once, then plain types flow through.
const restaurant = await findRestaurantById(id);
if (!restaurant) throw restaurantNotFoundError;
return RestaurantResponseDTO.from(restaurant);
```

## Verification Checklist

- [ ] No new `any`; `unknown` narrowed where used.
- [ ] Repository `| undefined` handled at the boundary.
- [ ] Decorator usage matches existing families.

## References

- TypeScript Handbook (Everyday Types, strict null checks) — https://www.typescriptlang.org/docs/handbook/2/everyday-types ; Decorators — https://www.typescriptlang.org/docs/handbook/decorators ; TSConfig Reference — https://www.typescriptlang.org/tsconfig/ .
