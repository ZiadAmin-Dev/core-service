# Request Validation

## Purpose

Reject bad input at the boundary with clear field errors, before business logic runs.

## When to Use

Any endpoint reading `req.body`, `req.params`, or `req.query`.

## Core Principles

- Validate everything untrusted at the boundary; never validate halfway through business logic.
- Whitelist (strip unknown fields) and fail with per-field messages.
- Coerce deliberately: JSON bodies have real types, but params/query are always strings.

## Quick Bite Project Rules

- Use the three helpers in `src/lib/validation/validate.ts`:
  - `validateBody(DTO, req.body)` — strict, no coercion.
  - `validateParams(DTO, req.params)` / `validateQuery(DTO, req.query)` — pass `{ enableImplicitConversion: true }` to `plainToInstance`, but implicit conversion relies on `emitDecoratorMetadata`, which `tsx` (dev) does not emit — so it only coerces in `tsc` builds. Always add explicit `@Type(() => Number)` on numeric params/query fields; that works under both runners.
  - Alias `validateParamsQuery` equals `validateQuery`.
- Request DTOs live in `dto/*.request.dto.ts` with class-validator decorators (`@IsEmail()`, `@MinLength()`, `@IsEnum()`, `@ValidateNested()` + `@Type()` for nested objects).
- List-query DTOs live in `dto/*.query.dto.ts`, extend `BasePaginationQueryDTO` (`src/lib/http/pagination/base-query.dto.ts`), narrow `sortBy` with their own `@IsIn` whitelist, declare per-field filter operators, and expose `toPaginationParams()` (inherited) + `toFilterParams()` (via generic `buildFilterParams`). CSV array parsing uses the shared `@Transform(splitCsv/splitCsvToNumbers)` helpers (`src/lib/utils/query-transforms.ts`). Services/repositories must assume this input is clean and fully typed.
- Failures throw `ValidationError` (400, `errors: [{field, message}]`, nested children flattened).
- Do **not** hand-parse with `Number(req.params.x)` on new code — define a params/query DTO instead (older controllers still do this; follow the new pattern).

## Common Mistakes

- Forgetting `@Type(() => Number)` on numeric query/params fields (string `"5"` then fails `@IsInt()`).
- Adding `@IsOptional()` but still requiring the field downstream.
- Trusting `req.query.ids`-style manual splitting without DTO validation on new endpoints.

## Recommended Approach

1. Define (or extend) the request DTO with precise decorators.
2. Call the matching helper as the controller's first line.
3. Use the returned typed instance downstream — never the raw `req.*` object again.

## Examples

```ts
const params = await validateParams(IdParams, req.params); // { id: 5 } as number
const query = await validateQuery(ListRestaurantsQueryDTO, req.query); // 400 on bad input
const result = await service.findAll(query.toPaginationParams(), query.toFilterParams());
```

## Verification Checklist

- [ ] Every untrusted input flows through a DTO helper.
- [ ] Numeric params/query fields carry `@Type(() => Number)`.
- [ ] Unknown fields stripped (`whitelist: true` default path kept).

## References

- class-validator — https://github.com/typestack/class-validator ; class-transformer — https://github.com/typestack/class-transformer .
