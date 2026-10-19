# Cache Key Design

## Purpose

Make keys unambiguous, collision-free, and scoped to exactly the response they represent.

## When to Use

Adding cached routes, user-scoped caching, idempotency keys, debugging wrong-data-from-cache bugs.

## Core Principles

- A key must encode every input that changes the output (method, path, query, user, version). Miss one dimension and users see each other's data.
- Namespace keys (`<domain>:<entity>:<id>`) so subsystems never collide.
- Keys are code: keep the scheme in one place, deterministic and greppable.

## Quick Bite Project Rules

- Route cache: `` `${req.method}:${req.originalUrl}` `` plus `` `:${userId}` `` when `userScoped: true`. `originalUrl` includes the query string — different queries already key differently.
- Idempotency: `idempotency:METHOD:originalUrl:key[:userId:userId]` — method + full URL + client key (+ user scope).
- Cross-service projections use the `core:<entity>:<id>` shape (`core:branch:<id>`, `core:product:<id>`, `core:rbac:perms:<role>`).
- `userScoped` defaults to `false` — caching a per-user body without enabling it is a cross-user leak; verify before wrapping authenticated routes.

## Common Mistakes

- Wrapping `GET /user/me`-style routes without `userScoped: true`.
- Keying on path but ignoring query params (not an issue with `originalUrl`, but breaks if you ever key manually).
- Unbounded key cardinality (per-timestamp/per-page-token keys that never repeat) — cache that never hits.

## Recommended Approach

1. List every varying input (auth, query, body-derived filters).
2. Pick/extend the established scheme; enable `userScoped` for per-user bodies.
3. Confirm key cardinality stays proportional to the working set.

## Examples

```ts
withCache(toSec(1, 'h'), true) // per-user body: key gains :userId
```

## Verification Checklist

- [ ] All response-varying inputs present in the key.
- [ ] User data isolated (`userScoped` where needed).
- [ ] Scheme follows `domain:entity:id` namespacing.

## References

- Redis query-caching key hashing — https://redis.io/tutorials/howtos/solutions/microservices/caching/ .
