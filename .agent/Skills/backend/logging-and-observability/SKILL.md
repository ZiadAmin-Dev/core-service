# Logging and Observability

## Purpose

Make production behavior explainable: trace requests, spot failures, and debug without live access to data.

## When to Use

Adding logs, debugging failures, tracing cross-request flows, reviewing observability gaps.

## Core Principles

- Log structured events with correlation, not prose dumps.
- Log at the right level: error (needs action), warn (degraded), info (lifecycle), debug (diagnostics only).
- Never log secrets, tokens, passwords, OTPs, hashes, or full PII payloads.

## Quick Bite Project Rules

- Structured JSON logger at `src/lib/logger/logger.ts`, resolved via `TOKENS.Logger`; include `correlationId` (set by `correlationId` middleware on every request) plus `statusCode`, `path`, `method` on errors (see `errorHandler`).
- Request tracing: `correlationId` middleware → `req.correlationId` → error logs. Always include it when adding error context.
- Cache visibility: `withCache` sets `X-Cache: HIT/MISS` — check it before assuming a logic bug.
- Outbox/worker visibility: log drain errors with `attempts`/`last_error` context; worker boot logs broker reachability.
- **Undetermined — inspect before applying:** no metrics/tracing backend (Prometheus/OpenTelemetry) was found in the repo; do not assume one exists.

## Common Mistakes

- `console.log`/`console.error` in request paths (used inside cache/idempotency middleware today — do not spread further; prefer the logger).
- Logging `req.body` wholesale (it can carry passwords) — log identifiers, not payloads.
- Error logs without `correlationId`, making multi-request incidents untraceable.

## Recommended Approach

1. Add context fields (ids, route, correlation) rather than longer messages.
2. Keep success paths quiet; log failures with actionable context.
3. When debugging, start from `X-Cache` + status code, then correlated logs.

## Examples

```ts
logger.error("outbox drain error", { error: err.message });
logger.info("worker: outbox drain scheduled", { pattern, batchSize });
```

## Verification Checklist

- [ ] No secrets/PII in new log statements.
- [ ] `correlationId` present on request-scoped logs.
- [ ] Level matches urgency; no noisy success logging.

## References

- Express debugging practices — https://expressjs.com/en/guide/debugging.html .
