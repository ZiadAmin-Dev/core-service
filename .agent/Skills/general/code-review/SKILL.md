# Code Review

## Purpose

Catch risky, incorrect, or out-of-architecture changes before they merge.

## When to Use

Reviewing any diff, PR, or agent-produced change in this repo.

## Core Principles

- Review against intent first (does it do what the task asked?), then correctness, then architecture fit.
- Comment on what must change vs what is preference; never block on style alone.
- Verify every claim in the change description against the diff.

## Quick Bite Project Rules

Check specifically for this repo:

1. **Layering**: SQL outside repositories? Business rules in controllers? `pkg` importing `lib`/`app`? Module importing another module's repository?
2. **Transactions**: multi-write flow without a service-level transaction? Repository starting its own?
3. **Responses**: new endpoint using the wrong envelope (raw vs `sendSuccess`)? Leaked `passwordHash`, tokens, or internal IDs?
4. **Validation**: new body/params/query path without `validateBody/Params/Query`? Manual `Number(...)` parsing instead of a DTO?
5. **Guards**: management route missing `authentication`/scope/`rbac`? Internal route missing `requireInternalApiKey`?
6. **Money**: floats or decimals on `price`, `deliveryFee`, `stock` paths?
7. **N+1**: looped per-row queries where a join/`whereIn` fits?
8. **Migrations**: any schema change bundled unasked?

## Common Mistakes

- Approving a "cleanup" that renames documented keys or reshapes responses.
- Missing that a shared helper change affects many callers.
- Trusting "tests pass" claims without evidence of a run.

## Recommended Approach

1. Read the task, then the diff file by file.
2. Run the checklist above; trace each new call chain once.
3. File findings as must-fix (behavior/architecture) vs suggestion.
4. Confirm the final report lists assumptions and unverified areas.

## Examples

A diff adding `res.status(200).json(userEntity)` in a controller must be flagged: entities carry `passwordHash` — use `UserResponseDTO.from()` / `toUserResponse()`.

## Verification Checklist

- [ ] Intent matched; no scope creep in diff.
- [ ] All 8 repo-specific checks applied.
- [ ] Risky areas (money, auth, transactions) explicitly passed or flagged.

## References

- `AGENT_GUIDELINES.md` §7 (truthful reporting); Safe Code Changes skill.
