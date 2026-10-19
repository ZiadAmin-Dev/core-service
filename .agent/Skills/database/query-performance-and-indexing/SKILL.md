# Query Performance and Indexing

## Purpose

Keep queries fast as tables grow: design with indexes, prove with `EXPLAIN`, avoid pessimizing patterns.

**Core Service is a read-heavy service.** The overwhelming majority of traffic is `GET` — catalog browsing, restaurant/member/product listings, availability and search reads — while writes are low-volume admin and event flows. That asymmetry is the design brief:

- **Read paths get the index budget.** Slightly redundant read indexes are cheap: they cost write throughput and storage, and this service has writes to spare. Never trade a read regression for write elegance.
- **Every read amplification is multiplied.** A missing index on a list endpoint is not one slow request; it is a slow request on every page of every scroll, from every user. N+1 (see prevent-n-plus-one skill), unindexed sorts, and `SELECT *` compound multiplicatively here.
- **Guardrails matter more than throughput.** Cache invalidation and rate limits degrade gracefully; a seq scan on a growing table degrades *linearly and silently* until it takes the service down. Prefer bounded, indexed, predictable queries.
- **Plan verification is part of done.** A read change without an `EXPLAIN (ANALYZE, BUFFERS)` on production-scale data is unverified, however correct the TypeScript looks.

## When to Use

Slow endpoints, new queries on large tables, index design, reviewing repository changes.

## Core Principles

- Every production query path needs an index that serves its `WHERE`/`JOIN`/`ORDER BY`. Unindexed filters are the #1 slow-query cause.
- **One composite index per query shape, not one index per column.** Design indexes backwards from the exact predicate + sort order the repository emits; a single-column index cannot satisfy a joint filter+sort without a `Sort` node.
- **Column order is the design, not a detail.** Equality columns first, then range/sort columns, then the `id` tie-breaker — per PostgreSQL's B-tree Leftmost Prefix rule. The index is only usable if its leading columns are all constrained by the query.
- **ASC covers DESC.** An `ASC` B-tree serves `DESC` queries through Backward Scan; do not duplicate indexes per direction unless a query mixes directions.
- Prove with `EXPLAIN (ANALYZE, BUFFERS)`: look for sequential scans on large tables, and check estimates vs actuals.
- Indexes cost writes and space — add them for real query paths, not hypothetically, but on a read-heavy service the write cost is cheap and the read benefit is multiplied.
- Small tables will seq-scan regardless; optimize for production scale, not dev fixtures.

## Quick Bite Project Rules

- Existing index coverage to preserve: `users(email, system_role)`, `restaurants(owner_id, status, primary_country)`, `restaurant_branches` GIST on `location`, products/category/PBD FK indexes, member/role-permission join indexes, partial `events_outbox` pending index.
- Cursor pagination goes through `applyCursorPagination` (ordered range filter + `limit+1`) — keep the `ORDER BY` column indexed.
- `whereNull("deleted_at")` filters ride on the `deleted_at` index (`idx_products_deleted_at`); keep that pairing when adding soft-delete filters elsewhere.
- Run `ANALYZE` so planner statistics reflect reality before trusting a plan.

### Database Indexing & Query Optimization for Paginated Lists

Core Service's hottest reads are paginated lists. Cursor pagination is only constant-time when a B-tree index backs the exact `(WHERE cols…, ORDER BY cols…, id)` pattern the repository generates — otherwise the keyset predicate degrades into a full scan plus sort, which is strictly worse than `OFFSET`.

**1. Composite indexing strategy — mirror the query exactly.** Columns in index order: `WHERE` equality columns → `ORDER BY` columns → `id` tie-breaker. For the restaurant list (`WHERE status = $1`, `ORDER BY created_at ASC, id ASC`):

```sql
CREATE INDEX idx_restaurants_status_created_at_id
  ON "restaurants" ("status", "created_at" ASC, "id" ASC);
```

The existing single-column indexes (`idx_restaurants_status`, `idx_restaurants_created_at`) are **not** a substitute: with only those, PostgreSQL must fetch every `status` match and then sort. Ship the composite index in the same migration as the endpoint.

**2. Column order & Leftmost Prefix.** B-tree indexes are usable left-to-right until a column is skipped. `("status", "created_at", "id")` serves `WHERE status = ... ORDER BY created_at, id` as a pure index scan; `("created_at", "status", "id")` cannot — `status` is unconstrained at that position. Rules of thumb for this schema:

- Equality predicates first (`status`, `is_active`, `restaurant_id`, `system_role`, `owner_id`).
- Range and sort predicates after (`created_at`, `updated_at`, `name`).
- `id` last, always — it is the cursor tie-breaker in every paginated query.
- For soft-deleted tables, either include `deleted_at` in the composite or make it a partial-index `WHERE deleted_at IS NULL` predicate so the index stays small and selective (existing pattern: `idx_products_deleted_at`).
- One leading composite supersedes its own single-column prefixes. After adding `("status", "created_at", "id")`, a standalone `("status")` index is dead weight — evaluate with `pg_stat_user_indexes` before dropping anything already in production.

**3. ASC/DESC index compatibility.** PostgreSQL can traverse a B-tree in either direction (Backward Scan), so a single `("status", "created_at" ASC, "id" ASC)` index serves both `sortOrder=asc` and `sortOrder=DESC` on the same column list — this is why the query DTO's `sortOrder` toggle does not require a second index. Only create an explicitly directional index when a query mixes directions (`ORDER BY created_at DESC, name ASC`), which one B-tree cannot satisfy. Note the migration style in this repo: `idx_events_outbox_pending` is a partial index on `id WHERE dispatched_at IS NULL`.

**4. Query plan verification (`EXPLAIN ANALYZE`).** Every production-bound list query is verified before shipping. The plan must show an **Index Scan** or **Index Only Scan** — never a **Seq Scan** with a `Sort` node on top — and estimated rows must line up with actual rows (a big skew means stale stats or wrong parameter types, and predicts plan flips under production cardinality).

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, status, created_at FROM restaurants
WHERE status = 'active' AND (created_at, id) > ('2026-01-01', 412)
ORDER BY created_at ASC, id ASC
LIMIT 21;
-- want: Index Scan using idx_restaurants_status_created_at_id ... Rows Removed by Filter: 0
-- red flag: Seq Scan -> Sort, "rows=1000" vs "actual rows=3", or high "shared read" in BUFFERS
```

Also reject, on read paths:

- `SELECT *` — blocks Index Only Scans and forces heap fetches on every page.
- Functions or casts on indexed/cursor columns (`WHERE DATE(created_at) > ...`, `LOWER(name) = ...`) — kills the index range.
- Leading-wildcard `LIKE '%x%'` — no B-tree can serve it; needs a trigram/full-text index.
- Deep `OFFSET` pages (use the cursor helpers) and `count(*)` on huge tables on every request (cache or approximate).
- Query count correlating with page size — one round trip per row of scroll is the N+1 pattern at list scale.

## Common Mistakes

- Adding an index per column instead of per query path (composite where the workload filters jointly).
- Wrong column order in the composite — a sort column placed before an unconstrained filter column makes the whole index unusable for that query.
- Creating parallel `ASC` and `DESC` indexes on the same column list when Backward Scan already serves both.
- Wrapping indexed columns in functions (`LOWER(email)`) which defeats the index.
- `OFFSET` deep pages (see Pagination skill) instead of cursor ranges.
- Judging plans on empty dev tables and declaring victory.

## Recommended Approach

1. Identify the query path and its filters/joins/order — write the literal SQL the repository emits.
2. Build the composite index to match that shape exactly: equality columns → sort/range columns → `id`. One index per query pattern, not one per column.
3. Confirm the direction requirement: a plain `ASC` index serves `DESC` via Backward Scan; add a directional index only for mixed-direction sorts.
4. `EXPLAIN (ANALYZE, BUFFERS)` before/after on production-scale data; confirm index (or index-only) scans, no `Sort` node above the scan, estimates ≈ actuals.
5. Watch write-path cost; drop the index if the workload doesn't use it (`pg_stat_user_indexes`) — and remember a leading composite makes its own single-column prefixes redundant.

## Examples

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM restaurant_branches
WHERE is_active AND ST_DWithin(location, ST_MakePoint(31.2, 30.0)::geography, 5000);
-- want: Bitmap/GIST index path on location, not Seq Scan
```

## Verification Checklist

- [ ] Query path covered by an index; migration includes it.
- [ ] Composite indexes are explicitly created for list queries combining filtering (`WHERE`) and cursor sorting (`ORDER BY ... ASC, id ASC`) — equality columns first, sort columns next, `id` tie-breaker last (Leftmost Prefix order).
- [ ] Query performance has been verified via `EXPLAIN ANALYZE` confirming an Index Scan (or Index Only Scan) rather than a Sequential Scan; estimated rows match actual rows and no `Sort` node sits above the scan.
- [ ] No redundant `ASC`/`DESC` duplicates for the same column list — the `ASC` index serves `DESC` queries via Backward Scan; a directional index exists only for genuinely mixed sort directions.
- [ ] Plan inspected on realistic data; no surprise seq scans.
- [ ] No function-wrapped indexed columns; no `SELECT *` on hot paths.
- [ ] Unused or prefix-shadowed indexes identified via `pg_stat_user_indexes` before adding more.

## References

- PostgreSQL Indexes ch.11 — https://www.postgresql.org/docs/current/indexes.html ; Using EXPLAIN §14.1 — https://www.postgresql.org/docs/current/using-explain.html .
