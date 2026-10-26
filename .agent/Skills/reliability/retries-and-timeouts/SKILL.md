# Retries and Timeouts

## Purpose

Call other systems without hanging forever or amplifying their outage into yours.

## When to Use

Mailjet sends, broker publishes/connections, DB calls, any future HTTP client (e.g. a core-client equivalent).

## Core Principles

- Every outbound call gets a timeout; every retry gets a budget (max attempts + backoff + jitter).
- Retry only what is safe to repeat (idempotent reads, keyed writes); never blindly retry non-idempotent mutations.
- Fail fast and expose degradation (fail-open reads, queued work) instead of queueing unbounded in-memory retries.

## Quick Bite Project Rules

- Established patterns: `withCache`/idempotency catch-and-continue on Redis errors (fail-open); worker logs broker-unreachable at boot and retries every drain tick; cache sets are fire-and-forget with `.catch` logging.
- Email sends currently await inline in auth flows — treat as a known coupling: do not add more inline external calls, and never put them inside DB transactions.
- **Undetermined — inspect before applying:** no shared retry/backoff helper or circuit breaker was found in `core-service`; do not assume one exists. If retries are needed, add explicit attempt caps + exponential backoff at the call site.

## Common Mistakes

- `await` without timeout on an external call (one slow provider stalls the event loop's request).
- Retry storms: N instances × M retries with no jitter against a struggling dependency.
- Retrying a non-idempotent POST (double charge/double invite) — pair retries with idempotency keys.

## Recommended Approach

1. Set a timeout on the call; set attempts + backoff + jitter around it.
2. Make the operation idempotent (key/unique constraint) before enabling retries.
3. Log attempts with `correlationId`; surface degradation in the response only as documented shapes allow.

## Examples

Worker drain loop: each tick attempts publish; failures stay pending (`attempts`/`last_error`) for the next tick — bounded, observable, no in-memory backlog.

## Verification Checklist

- [ ] Timeout set; retry budget (attempts/backoff/jitter) explicit.
- [ ] Retried operation is idempotent or keyed.
- [ ] No unbounded queues; failures observable in logs/rows.

## References

- Microsoft retry guidance (transient fault handling); Redis/cache failure skill in this library.
