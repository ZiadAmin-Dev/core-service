# Pagination

## Purpose

Return bounded, stable pages for list endpoints without deep-offset collapse or resource abuse.

## When to Use

Any listing endpoint (restaurants, members, products, future lists).

## Core Principles

- Cursor pagination beats offset for growing tables: stable under inserts, constant-time pages, no skipped/duplicated rows.
- Bound everything: max `limit`, allowlisted `sortBy`, explicit sort order. Unbounded lists are a DoS vector (OWASP API4).
- Return paging metadata so clients can walk forward deterministically.
- **A cursor is only constant-time if it is indexed.** Keyset pagination replaces a "scan and discard" cost with a range seek — but only when a B-tree index backs the exact `(WHERE cols…, ORDER BY cols…, id)` pattern. Without it, the `WHERE (sort_col, id) > ($1, $2)` predicate degrades into a full scan plus sort, which is *worse* than offset because you also pay the sort. Indexing is part of "doing pagination right", not a later optimization pass.
- Never sort by a column that is not in a supporting index. Every allowlisted `sortBy` value added to a query DTO is a promise to keep an index valid for it — add the index in the same change.

## Quick Bite Project Rules

- Query gatekeeper: list endpoints validate `req.query` with a module query DTO via `validateQuery` **before** touching service/repository layers. Module DTOs extend `BasePaginationQueryDTO` (`src/lib/http/pagination/base-query.dto.ts`: `cursor`, `limit` default 20 / max 100, `sortBy`, `sortOrder`, `toPaginationParams()`), narrow `sortBy` with their own `@IsIn` whitelist, and declare per-field filter operators (e.g. restaurant `dto/restaurant.query.dto.ts`: sort `createdAt|name|status`, filter `id|status|name`). Any invalid value fails fast with 400. Never accept arbitrary sort/filter fields.
- Casting happens in the DTO: explicit `@Type(() => Number)` on numerics (`"25"` → `25`; required because implicit conversion does not run under `tsx` — see request-validation skill), shared `@Transform(splitCsv/splitCsvToNumbers)` helpers (`src/lib/utils/query-transforms.ts`) turn CSV strings into arrays (`"1,2,3"` → `[1,2,3]`), and the generic `buildFilterParams(filter, allowedFields)` maps the validated DTO to `FilterParams[]`.
- Repositories compose SQL only: typed `applyCursorPagination` (keyset `where` on sort value + `id` tie-breaker, ordered range + `limit + 1` lookahead) and `applyFilters` assume clean input — no string splitting or casting there. Cursors are decoded in the DTO (`decodeCursor`, 400 on malformed); the encoded blob never reaches SQL. `buildPaginationResult` → `{data, meta: {nextCursor, hasMore, count}}`, `nextCursor` is base64 `{id, value}`.
- Respond with `sendPaginated(res, data, meta)`.

### Database Indexing & Query Optimization for Paginated Lists

**Composite indexing strategy.** A list endpoint that filters *and* sorts must be backed by a composite index whose column order mirrors the generated SQL exactly: `WHERE` (equality) columns first, then `ORDER BY` columns, then the `id` tie-breaker. The repository emits a fixed shape — `WHERE status = $1 AND (created_at, id) > ($2, $3) ORDER BY created_at ASC, id ASC LIMIT n` — so the index must mirror it column-for-column:

```sql
-- GET /restaurants?status=active&sortBy=createdAt&sortOrder=asc
CREATE INDEX idx_restaurants_status_created_at_id
  ON "restaurants" ("status", "created_at" ASC, "id" ASC);
```

**Column order & leftmost prefix.** PostgreSQL's B-tree Leftmost Prefix rule means a leading `status` column can only be used when the query constrains it. So equality filters (`status`, `is_active`, `restaurant_id`) come first; range/sort columns (`created_at`, `name`) follow; the `id` tie-breaker is always last so the cursor range is fully covered. Reordering breaks it: `("created_at", "status", "id")` cannot serve `WHERE status = ... ORDER BY created_at` as an index scan.

**ASC/DESC index compatibility.** An index declared `("status", "created_at" ASC, "id" ASC)` serves the matching `DESC` query through PostgreSQL's **Backward Scan** — the planner simply walks the index in reverse. Do not create duplicate `ASC` and `DESC` indexes for the same column list; only add an explicitly-directional index when a query mixes directions (`ORDER BY created_at DESC, name ASC`), which a single B-tree cannot satisfy.

**Query plan verification (`EXPLAIN ANALYZE`).** Before a paginated list query ships, run `EXPLAIN (ANALYZE, BUFFERS)` against production-scale data and confirm an **Index Scan** or **Index Only Scan** — not a **Seq Scan** followed by a `Sort` node. Also compare estimated rows vs actual rows: a large mismatch means stale statistics or a parameter-type problem, and it usually means the planner will start choosing the wrong path under production cardinality.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM restaurants
WHERE status = 'active' AND (created_at, id) > ('2026-01-01', 412)
ORDER BY created_at ASC, id ASC
LIMIT 21;
-- want: Index Scan using idx_restaurants_status_created_at_id
-- red flag: Seq Scan + Sort node, or rows=100 vs actual rows=2
```

Keep `ORDER BY` limited to index-backed columns, avoid `SELECT *` on hot list paths (it blocks Index Only Scans and widens rows), and remember that soft-delete predicates (`deleted_at IS NULL`) must appear in the index or be a leading partial-index `WHERE` for the scan to stay selective.

## Common Mistakes

- `OFFSET`-based pages on large tables (slow + unstable under concurrent inserts).
- Letting clients sort by any column (index-less sorts, info disclosure via ordering).
- Forgetting the `limit + 1` lookahead and misreporting `hasMore`.
- Single-column indexes on a list that filters *and* sorts (`idx_restaurants_status` alone) — the planner must fetch the `status` rows, then sort them for `created_at`.
- Duplicate `ASC`/`DESC` index pairs on the same columns; the backward scan already covers both directions.
- Wrapping the cursor column in a function or cast (`WHERE DATE(created_at) > ...`, `WHERE created_at::text > ...`) — this disables the index range entirely.

## Recommended Approach

1. Validate `req.query` into the module's query DTO (`extends BasePaginationQueryDTO`) as the controller's first line — invalid input throws 400 here.
2. Pass `query.toPaginationParams()` + `query.toFilterParams()` to the service; apply cursor filter + order + `limit + 1` in the repository via the typed helpers.
3. Add the migration for the composite index matching that exact predicate + sort order (`WHERE` cols, then `ORDER BY` cols, then `id`) — ship the index with the endpoint, not after it.
4. Verify with `EXPLAIN (ANALYZE, BUFFERS)` on realistic volume: Index Scan / Index Only Scan, no `Sort` node, estimates ≈ actuals.
5. Build `{data, meta}` with the shared helper; send via `sendPaginated`.

## Examples

```ts
const query = await validateQuery(ListRestaurantsQueryDTO, req.query); // 400 on bad input
const result = await restaurantService.findAll(query.toPaginationParams(), query.toFilterParams());
sendPaginated(res, result.data, result.meta);
```

## Verification Checklist

- [ ] Query DTO (`extends BasePaginationQueryDTO`) validates the listing; limit bounded (default 20, max 100); sort/filter fields allowlisted.
- [ ] Services/repositories receive typed params only — no string splitting or casting below the controller.
- [ ] Cursor (not offset) drives paging; `hasMore` correct.
- [ ] Meta shape matches `{nextCursor, hasMore, count}`.
- [ ] Composite indexes are explicitly created for list queries combining filtering (`WHERE`) and cursor sorting (`ORDER BY ... ASC, id ASC`) — equality columns first, sort columns next, `id` tie-breaker last (Leftmost Prefix order).
- [ ] Query performance has been verified via `EXPLAIN ANALYZE` confirming an Index Scan (or Index Only Scan) rather than a Sequential Scan; estimated rows match actual rows and no `Sort` node appears above the scan.
- [ ] No redundant `ASC`/`DESC` duplicates for the same column list — the `ASC` index serves `DESC` queries via Backward Scan; a directional index exists only for genuinely mixed sort directions.
- [ ] Every allowlisted `sortBy` value in the query DTO is covered by an index; no function- or cast-wrapped cursor columns.

## References

- OWASP API4:2023 Unrestricted Resource Consumption — https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/ .
- PostgreSQL Indexes ch.11 (composite, Leftmost Prefix, Backward Scan) — https://www.postgresql.org/docs/current/indexes.html ; Using EXPLAIN §14.1 — https://www.postgresql.org/docs/current/using-explain.html .
