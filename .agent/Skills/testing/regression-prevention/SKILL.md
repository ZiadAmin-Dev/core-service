# Regression Prevention

## Purpose

Make sure fixed bugs stay fixed and documented quirks stay intact.

## When to Use

After any bug fix; when touching historically buggy areas (routes, money, guards, DTO shapes).

## Core Principles

- Every bug fix ships with a characterization of the bug: a test (or, if tests are out of scope, a contract-doc note) that fails without the fix.
- Protect quirks deliberately: if clients depend on a misspelling or shape, lock it with a test/doc entry, not just memory.
- Review checklists should include the repo's greatest-hits bug classes.

## Quick Bite Project Rules

- Known quirk inventory to protect: duplicate branch-list route (first handler wins), `resraurant` response key, raw-vs-envelope response styles per endpoint, internal address projection omitting `type`/`isDefault`, 5-minute 404 caching, `restaurantName` mapping gap. All are in `Docs/API Contracts/` — keep them there.
- Where no runner exists, the "regression test" is a contract-doc assertion plus a review checklist item; state this plainly.
- Money/auth/transaction paths deserve first coverage when a suite is commissioned (see Testing Strategy backlog).

## Common Mistakes

- Fixing the bug but not the class (same N+1/race shape elsewhere untouched and unnoted).
- "Fixing" a quirk clients depend on while fixing a nearby bug.
- Closing a bug report without recording how to recognize a recurrence.

## Recommended Approach

1. Write the failing-first characterization (test or doc assertion).
2. Apply the minimal fix; check sibling paths for the same flaw.
3. Record the quirk + guard in docs and in your final report.

## Examples

Fixing a guard-chain bug: add the route to a review checklist of "guard order verified" cases and note the correct chain in the contract doc.

## Verification Checklist

- [ ] Recurrence characterization exists (test or documented assertion).
- [ ] Siblings checked for the same flaw.
- [ ] Quirks relied upon by clients left intact and documented.

## References

- Code Review skill (greatest-hits checks); `Docs/API Contracts/` (quirk inventory).
