# Error Handling

## Purpose

Fail loudly with the right status, never leak internals, and keep error creation consistent.

## When to Use

Throwing, shaping, or handling errors; adding failure paths; editing `errorHandler`.

## Core Principles

- Operational errors (bad input, missing record, forbidden) get explicit types + status codes; programmer bugs should crash visibly, not masquerade as 400s.
- Error responses carry what the client needs to act — never stack traces, SQL, or secrets.
- Create errors once as constants/factories; throw the shared instance.

## Quick Bite Project Rules

- Base class: `AppError(message, statusCode = 500, isOperational = true)` (`src/lib/error/appError.ts`).
- Validation failures throw `ValidationError` (`{message: "Validation failed", errors: [{field, message}]`, 400). **Caveat:** central `errorHandler` serializes `err.message` only — field details stay server-side unless the handler is extended.
- Module errors are prebuilt constants in `*.errors.ts` (`userNotFoundError` 404, `incorrectCredentialsError` 401, `notAuthorisedError` 403, `outOfStockError()` factory 409). Reuse them; do not inline `new AppError` per call site.
- Controllers wrap handlers in `try/catch → next(err)`; some guards `throw` synchronously (Express 5 forwards thrown errors — do not wrap guards in responses).
- Auth/security paths return generic messages (login 401 identical for unknown email vs wrong password; forget-password succeeds even for unknown emails).

## Common Mistakes

- Throwing 500s for client mistakes or 400s for server bugs.
- Returning `err.stack` or Knex errors to clients.
- Creating a new `AppError("User not found", 404)` instead of reusing `userNotFoundError` (message drift breaks clients matching on text).
- Swallowing errors in `.catch(() => next())` without logging.

## Recommended Approach

1. Pick the existing module error constant that matches; add a new one to `*.errors.ts` only for genuinely new cases.
2. Throw early (guard clauses) with the narrowest accurate status.
3. Keep security-sensitive messages generic; put details in logs with `correlationId`.
4. If clients need field errors, extend `errorHandler` deliberately — not per-endpoint.

## Examples

```ts
const user = await findUserById(id);
if (!user) throw userNotFoundError; // 404, shared constant
```

## Verification Checklist

- [ ] Status code matches the failure class (4xx client / 5xx server).
- [ ] No internals/secrets in the response; details logged instead.
- [ ] Reused existing error constants where they fit.

## References

- Express error handling — https://expressjs.com/en/guide/error-handling.html .
