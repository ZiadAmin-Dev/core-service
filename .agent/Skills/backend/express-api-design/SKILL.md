# Express API Design

## Purpose

Add endpoints that match this API's routing, middleware, and status-code conventions.

## When to Use

Creating or changing routes, guard chains, or response codes.

## Core Principles

- Routes declare the full access policy in one place: path → guards → controller. A reader should see authorization without opening the controller.
- Use the correct status: 200 (read/update), 201 (created), 400 (client input), 401 (unauthenticated), 403 (unauthorized), 404 (missing), 409 (conflict), 500 (server fault).
- Middleware order is behavior: authentication → scope → permission → handler.

## Quick Bite Project Rules

- Mount module routers in `src/routes.ts` under `/api` (`app.ts:19` sets the prefix).
- Management routes chain `authentication`, then `requireRestaurantMember(param)` and/or `requireBranchAccess(param)`, then `rbac({resource, action})` (see `restaurant.routes.ts`, `branch.routes.ts`, `product.routes.ts`).
- Service-to-service routes use `requireInternalApiKey`, never JWT guards.
- Controllers are `async (req, res, next)` arrow-function properties in `@injectable()` classes, wrapped in `try/catch → next(err)`; guard functions may `throw` synchronously (Express 5 forwards it).
- Public storefront reads carry no auth; mutating routes consider `idempotency(...)` (see Reliability → Idempotency).
- JSON body limit is `10mb`; query parsing is `extended`.

## Common Mistakes

- Registering two handlers on the same path (Express matches the first — a real past bug).
- Putting permission checks only in the service and leaving the route unguarded (defense in depth: keep both).
- Returning 200 for creates (use 201) or 404 bodies with 200 status.

## Recommended Approach

1. Copy the guard chain from the closest sibling route.
2. Write controller → service → repository in layer order.
3. Document the endpoint in `Docs/API Contracts/<module>.md` in the same change.

## Examples

```ts
branchRouter.post('/restaurants/:restaurantId/branches',
    authentication,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:branch", action:'create'}),
    branchController.create);
```

## Verification Checklist

- [ ] Guard chain copied from a sibling and ordered correctly.
- [ ] Status code matches the operation class.
- [ ] Contract doc updated.

## References

- Express 5.x guide (routing, middleware, error handling) — https://expressjs.com/ .
