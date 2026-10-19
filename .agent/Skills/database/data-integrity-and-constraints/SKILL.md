# Data Integrity and Constraints

## Purpose

Let the database enforce invariants that application code alone cannot guarantee under concurrency.

## When to Use

Schema design, migrations, enums, unique rules, foreign keys, delete semantics.

## Core Principles

- Constraints are the last line of defense: `NOT NULL`, `UNIQUE`, `CHECK`, and FKs hold even when two requests race past application checks.
- Prefer database truth over application folklore for uniqueness and referential integrity.
- Choose delete semantics deliberately: `CASCADE` (dependents die with parent), `RESTRICT` (block), or soft-delete (history preserved).

## Quick Bite Project Rules

- Enums: `TEXT CHECK(col IN (...))` for statuses/roles, plus the `currency_enum` Postgres enum. Application enums (`SystemRole`, `RestaurantStatus`, `MemberStatus`, `AddressType`, `Currency`) must stay in sync with the migration lists.
- Uniqueness with teeth: `users(email)`, `users(phone)`, `(restaurant_id, user_id)` on members, `(restaurant_id, name)` on categories, `(branch_id, product_id)` on branch details, `event_id` on outbox. Application pre-checks (`findUserExistsByEmailOrPhone`) are fast-path UX, not guarantees — keep both.
- FKs with cascading deletes on membership/branch-assignment edges (`restaurant_members`, `member_branches`); restaurants→owner is a plain FK.
- Soft deletes: `users.deleted_at`, `products.deleted_at` with `whereNull` in every finder. Hard deletes: addresses (no recovery — intentional).
- Partial/conditional rules enforced in service code (single default address) are best-effort only — note the gap instead of claiming a guarantee.

## Common Mistakes

- Relying solely on a pre-insert existence check for uniqueness (race window).
- Adding an application enum value without a migration updating the `CHECK` list.
- `ON DELETE CASCADE` on an edge where history must survive (prefer soft-delete or `RESTRICT`).

## Recommended Approach

1. Express the invariant as a constraint first (unique/check/FK); add application checks for UX second.
2. Mirror enum changes in migration + entity + DTO in the same change.
3. State delete semantics explicitly in the migration and the docs.

## Examples

```sql
CONSTRAINT uq_pbd_branch_product UNIQUE (branch_id, product_id)
```

## Verification Checklist

- [ ] Invariant enforced by constraint, not just code.
- [ ] Enum lists match across migration, entity, and DTO.
- [ ] Delete semantics chosen deliberately and documented.

## References

- PostgreSQL DDL constraints — https://www.postgresql.org/docs/current/ddl-constraints.html .
