# Testing Strategy

## Purpose

Choose the right verification for the risk, especially where no test infrastructure exists yet.

## When to Use

Deciding what to test, whether to add tests, or how to verify without a runner.

## Core Principles

- Test proportionally to risk: money, auth, transactions, and concurrency first; thin glue last.
- Prefer fast deterministic unit tests for rules, integration tests for SQL/transactions, and contract checks for API shapes.
- No test is better than a flaky test that teaches the team to ignore red.

## Quick Bite Project Rules

- **No test runner is configured** (`npm test` echoes an error; no `*.test.ts`, no framework in `package.json`). Adding one (e.g. `node:test` + `tsx`, matching the sibling service's `tsx --test` pattern) is an explicit, separate task — never a side effect.
- Until a runner exists, verification = careful inspection + honest reporting (per `AGENT_GUIDELINES.md` §5). Never claim checks "passed" that did not run.
- Highest-value first targets if testing is commissioned: `reserveStock` atomicity, registration transaction, OTP lifecycle, guard chains, response-DTO field parity with contracts.
- Task instructions about executing commands outrank any testing advice here.

## Common Mistakes

- Claiming "verified" from reading code alone.
- Adding a test framework unasked inside a feature diff.
- Testing mocks instead of behavior (asserting the stub was called, not the outcome).

## Recommended Approach

1. Ask (or check the task): may I run commands? Is adding tests in scope?
2. If yes: propose the runner + the smallest valuable suite for the touched path.
3. If no: inspect rigorously, list exact unverified areas in the report.

## Examples

Risk-ranked backlog: 1) stock decrement races 2) registration rollback 3) OTP expiry/consumption 4) guard-chain regressions 5) DTO shape drift.

## Verification Checklist

- [ ] Command permissions checked before running anything.
- [ ] Highest-risk paths identified for the touched change.
- [ ] Report states exactly what ran vs what was inspected.

## References

- Node.js test runner docs — https://nodejs.org/api/test.html .
