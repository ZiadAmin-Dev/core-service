# Concurrency and Race Conditions

## Purpose

Keep parallel requests from corrupting data or slipping past checks.

## When to Use

Check-then-write flows, counters/stock, uniqueness, status transitions, default-flag flips.

## Core Principles

- If two requests can interleave between your check and your write, the check is advisory only — enforce with locks, constraints, or atomic statements.
- Prefer row locks (`SELECT ... FOR UPDATE`) inside short transactions over broad isolation escalation.
- Name the race window explicitly; "it rarely happens" is not a fix.

## Quick Bite Project Rules

- Template to copy: `reserveStock` — transaction → `forUpdate()` row lock → verify → decrement → outbox write, all in one `trx`.
- Known advisory-only spots (documented, do not silently "fix"): email/phone pre-checks before insert (unique constraints back them), single-default-address clearing (no partial unique index), latest-OTP-wins (latest-row evaluation).
- Outbox claiming uses `FOR UPDATE SKIP LOCKED` so parallel workers never double-publish.
- PostgreSQL default is Read Committed; each statement sees a fresh snapshot — re-read inside the transaction after locking.

## Common Mistakes

- Check (`SELECT`) then write in autocommit with no lock — the classic double-insert/double-spend.
- Holding locks across network calls or user input.
- "Fixing" races with `setTimeout`/ordering assumptions.

## Recommended Approach

1. Draw the interleave: which two statements from different requests can overlap?
2. Close it with the narrowest tool: unique constraint, `FOR UPDATE` + transaction, or atomic `UPDATE ... WHERE` with affected-row check.
3. Keep the locked section short and side-effect free.

## Examples

```ts
const rows = await trx("product_branch_details")
    .where("branch_id", branchId).whereIn("product_id", productIds)
    .select("product_id", "stock", "is_available").forUpdate();
// verify, then decrement — no interleave possible
```

## Verification Checklist

- [ ] Race window named; closing mechanism (lock/constraint/atomic-write) identified.
- [ ] Locked section short, no I/O inside.
- [ ] Advisory checks still backed by a guarantee where correctness demands it.

## References

- PostgreSQL Transaction Isolation — https://www.postgresql.org/docs/current/transaction-iso.html ; Knex Transactions — https://knexjs.org/guide/transactions.html .
