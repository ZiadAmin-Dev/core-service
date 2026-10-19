# SQL and PostgreSQL

## Purpose

Write correct, readable, dialect-appropriate SQL through Knex, plus safe migrations.

## When to Use

Repository queries, migrations, PostGIS/geo work, schema questions.

## Core Principles

- The query builder is for structure; raw SQL is for what the builder cannot express (geo, triggers) — always with bound parameters.
- Migrations are append-only history: new file per change, reversible `down`, never edit applied migrations.
- Know your dialect: PostgreSQL + PostGIS here (`.returning()`, `ILIKE`, GIST, `geography`).

## Quick Bite Project Rules

- Repositories: `db("<table>")` chains, explicit `*_COLUMNS` projections (never `select *` in production paths), `toEntity(row)` mapping snake_case → camelCase with type coercion (`Number(row.lat)`).
- `create*/update*` use `.returning(COLUMNS)` and map the returned row.
- Migrations live in `src/migrations/`, run via `knex --knexfile src/lib/knex/knexfile.ts`; they use `knex.raw` DDL with `CHECK` enums, FK constraints, and targeted indexes.
- PostGIS: `restaurant_branches.location` is a generated `geography(point, 4326)` column with a GIST index; nearby search uses parameterized `ST_DWithin(..., b.delivery_radius * 1000)`.
- Money/stock are integers (`INT`/`BIGINT`); geo uses `DECIMAL(9,6)`.

## Common Mistakes

- `select *` (breaks when columns are added; leaks `password_hash`).
- Forgetting `.returning()` so create/update callers get `undefined`.
- Editing an old migration instead of adding a new one; irreversible DDL without a `down`.
- Interpolating values into `db.raw` instead of binding.

## Recommended Approach

1. Add/adjust the `*_COLUMNS` list and `toEntity` first.
2. Build the query with the builder; drop to parameterized `raw` only for geo/complex SQL.
3. Schema change → new migration file with `up` + `down`, FKs, and supporting indexes.

## Examples

```ts
const [row] = await conn("restaurants").insert({...}).returning(RESTAURANT_COLUMNS);
return toEntity(row);
```

## Verification Checklist

- [ ] Explicit column projection; rows mapped via `toEntity`.
- [ ] No interpolated user input in raw SQL.
- [ ] Migration has `up` + `down`, constraints, and indexes.

## References

- Knex query builder — https://knexjs.org/guide/query-builder ; PostgreSQL docs — https://www.postgresql.org/docs/current/ .
