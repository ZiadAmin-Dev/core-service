# Transactions and ACID

## Purpose

Keep multi-step writes atomic: all effects commit together or none do.

## When to Use

Any operation writing more than one table/row (registration, member invite, stock reservation, product+category updates).

## Core Principles

- A transaction is a single unit of work on one connection: throw → rollback, return → commit (Knex managed style).
- Keep transactions short: validate and compute before `BEGIN`, never call network/email inside.
- Default isolation (PostgreSQL Read Committed) plus explicit row locks (`FOR UPDATE`) beats escalating isolation levels for most contention.

## Quick Bite Project Rules

- Transactions start **only in services** via `db.transaction(async (trx) => {...})`; repositories accept an optional `conn/trx` (default `db`) and never start their own.
- Throwing inside the handler auto-rolls-back (Knex); the explicit `trx.commit()/rollback()` style in `restaurant.service.ts` is equivalent — do not mix styles in one method.
- Outbox writes ride in the same `trx` as the domain mutation (atomic publish intent); emails go after commit or via the invite pattern already established.
- Locking precedent: `reserveStock` selects `... .forUpdate()` inside the trx before verifying and decrementing — copy this for any check-then-write flow.

## Common Mistakes

- Forgetting to pass `trx` to one repository call so it writes outside the transaction.
- Awaiting an email/HTTP call inside the trx (holds connections, stretches lock windows).
- Catching errors inside the handler without rethrowing — silently committing partial work.
- Long transactions spanning user input or retries.

## Recommended Approach

1. Validate inputs and load preconditions before opening the transaction.
2. Open `db.transaction`, pass `trx` to every repository/outbox call.
3. Throw domain errors on any rule violation; let Knex roll back.
4. Send emails/publish side effects only after successful commit.

## Examples

```ts
return await db.transaction(async (trx) => {
    const product = await createProduct({...}, trx);
    const details = await updateProductBranchDetails(branchId, product.id, {...}, trx);
    return { product, branchDetails: details };
});
```

## Verification Checklist

- [ ] Every write in the flow receives the same `trx`.
- [ ] No network/email calls inside the transaction.
- [ ] Errors propagate (rollback), success returns (commit).

## References

- Knex Transactions — https://knexjs.org/guide/transactions.html ; PostgreSQL Transaction Isolation — https://www.postgresql.org/docs/current/transaction-iso.html .
