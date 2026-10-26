# Naming Conventions

## Purpose

Name things the way this codebase already does, so code looks written by one hand.

## When to Use

Naming any variable, function, class, file, DTO, enum, token, table, or column.

## Core Principles

- Consistency with the surrounding code beats any generic style guide.
- Names reveal domain intent (`branchIds`, `restaurantMemberInfo`), not mechanism (`data`, `result`, `tmp`).
- When the codebase is inconsistent, document the split — do not invent a third variant.

## Quick Bite Project Rules

Verified by inspection (October 2026):

- **Classes**: PascalCase — `*Service`, `*Controller`, entities (`User`, `Branch`), request DTOs (`CreateBranchDTO`, `UpdateUserDTO`), response DTOs (`*ResponseDTO` with `static from()`).
- **Functions/methods**: camelCase — services expose verbs (`create`, `findById`, `updateStatus`); repositories export `find*/create*/update*/delete*` plus `toEntity` mappers.
- **Files/dirs**: kebab-case (`customer-address.controller.ts`, `member-branch.entity.ts`); routes `*.routes.ts` (**exception:** `rbac.route.ts` — known inconsistency); errors `*.errors.ts`; DTOs `*.request.dto.ts` / `*.response.dto.ts` (**legacy:** `createAddressDTO` class name is camelCase — do not propagate).
- **Enums**: PascalCase type, UPPER_SNAKE members, lowercase string values (`SystemRole.RESTAURANT_USER = "restaurant_user"`, `Currency.EGP = "EGP"`).
- **DI tokens**: `TOKENS.UPPER_SNAKE` (`TOKENS.AuthService` values are symbols).
- **DB**: plural snake_case tables, snake_case columns (`restaurant_branches`, `product_id`); booleans `is_*`.
- **Variables**: camelCase; JWT payload claims (`userId`, `role`, `restaurantId`, `branchIds`); avoid generic `data/result` for domain objects.

## Common Mistakes

- Renaming `resraurant.errors.ts` or `rbac.route.ts` "while here" — unrelated breakage risk; report, don't fix unasked.
- New `snake_case` or `camelCase` DTO class names that fit neither the `Create/Update` nor legacy style.
- `SELECT *` aliases that drift from entity fields (`name` vs `restaurant_name` caused a real bug shape).

## Recommended Approach

1. Find the nearest sibling (same module, same artifact type) and copy its pattern exactly.
2. For new artifacts, prefer the dominant convention (`Create*DTO`, `*ResponseDTO`, `find*`).
3. If two conventions collide, follow the file's own convention and note the split in your report.

## Examples

New branch read model: `BranchInternalResponseDTO` with `static from({branch, restaurantStatus})` in `branch.response.dto.ts` — matches existing `*ResponseDTO` + `from()` style.

## Verification Checklist

- [ ] Names match the artifact's established pattern.
- [ ] No new third-variant convention introduced.
- [ ] DB identifiers snake_case; code identifiers camel/PascalCase as appropriate.

## References

- `PROJECT_CONTEXT.md` §4 (known inconsistencies).
