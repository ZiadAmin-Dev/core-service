# Prevent N+1 Queries

## Purpose

Stop the "one query per row" pattern that silently multiplies database round trips.

## When to Use

Fetching an entity plus its relations (members + roles, products + branch details, branches + restaurants).

## Core Principles

- N+1 = 1 query for the list + N queries inside a loop. Cost grows with data, so it passes every small-scale check and fails in production.
- Fix by fetching related data in bulk: joins, `whereIn`, or aggregation — then assemble in memory.
- This project has **no ORM and no lazy loading** (verified): every query is explicit Knex, so N+1 only enters through hand-written loops — easier to spot, still easy to write.

## Quick Bite Project Rules

- Established good patterns to copy: `findMembersByRestaurantId` (single join across members/users/roles), `findProductsByBranch` (join + left join, mapped once), `findNearbyBranches` (one join + geo filter).
- `validateBranchOwnership` uses one `COUNT` query instead of per-id existence checks — the template for "verify a set" logic.
- Repositories return fully-mapped arrays; services must not loop `findById` per element.

## Common Mistakes

- `for (const m of members) await findRoleById(m.roleId)` — replace with a join or a single `whereIn`.
- Per-branch product loops instead of one `whereIn("product_id", ids)` (see `findByBranchAndIds`).
- "Fixing" N+1 with `select *` mega-joins that over-fetch; project explicit columns instead.

## Recommended Approach

1. Find the loop-then-query shape (await inside `for`/`map`).
2. Rewrite as one join or one batched `whereIn`, keeping explicit column lists.
3. Map rows to entities/DTOs in memory.
4. Sanity-check result counts against the old path on a realistic sample.

## Examples

```ts
// N+1 (avoid): for each product → select branch details.
// Batched (prefer): one query, then group in memory.
const rows = await db("product_branch_details").where("branch_id", branchId).whereIn("product_id", ids);
```

## Verification Checklist

- [ ] No `await`ed query inside a per-row loop.
- [ ] Explicit columns; no over-fetching.
- [ ] Same results as before on a multi-row sample.

## References

- Knex query builder (`join`, `whereIn`) — https://knexjs.org/guide/query-builder .
