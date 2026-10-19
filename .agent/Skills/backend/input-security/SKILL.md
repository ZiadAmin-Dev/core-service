# Input Security

## Purpose

Treat every byte from outside the trust boundary as hostile until validated, escaped, or rejected.

## When to Use

Handling bodies, params, queries, headers, cookies, webhooks, file-ish input, or any external data.

## Core Principles

- Validate (shape/type/range) at the boundary; parameterize (never concatenate) at the sink; encode at the output.
- Apply allowlists over denylists; set explicit size bounds (`express.json({limit})`, string lengths, array caps).
- OWASP API Top 10 framing: broken object-level authorization, broken auth, excessive data exposure, and unrestricted resource consumption are the usual API killers.

## Quick Bite Project Rules

- class-validator DTOs are the allowlist: `whitelist: true` strips unknown fields (mass-assignment protection — e.g. a client cannot sneak `systemRole`/`isActive` through a validated body).
- All SQL goes through Knex bindings (`where("id", id)`, `whereIn`) — never string-concatenate user input into `db.raw`; PostGIS raw query binds `[lng, lat]` as parameters.
- Auth cookies are http-only; `helmet` + CORS with explicit origins are enabled in `app.ts`.
- Authorization is object-level: `requireRestaurantMember`/`requireBranchAccess` tie URL ids to JWT claims (BOLA protection); ownership re-checked in services.
- Pagination bounds come from the query-DTO gatekeeper (`BasePaginationQueryDTO`: `limit` max 100, `sortBy` allowlisted per endpoint via `@IsIn`) — a defense against resource-consumption abuse.

## Common Mistakes

- `db.raw(\`... ${userInput} ...\`)` — SQL injection; always bind.
- Trusting `req.query`/`req.params` strings as numbers/booleans without DTO coercion.
- Echoing input back into HTML/email templates without escaping (member-invitation / password-reset templates).
- Logging or returning raw Knex errors (schema disclosure).

## Recommended Approach

1. Define the DTO allowlist first (types, lengths, enums, nested `@Type`).
2. Verify the sink: Knex bindings, guarded template interpolation, bounded pagination.
3. Confirm the authorization check covers the object id in the path.

## Examples

```ts
// Safe: value bound as a parameter, never interpolated.
await db("users").select(USER_COLUMNS).where("id", id).whereNull("deleted_at").first();
```

## Verification Checklist

- [ ] DTO allowlist covers the input; unknown fields stripped.
- [ ] No interpolated user input in SQL/commands/templates.
- [ ] Object-level authorization checked for path ids.
- [ ] Errors generic; no schema/secret leakage.

## References

- OWASP API Security Top 10 2023 — https://owasp.org/API-Security/editions/2023/en/0x11-t10/ ; Knex query builder (bindings) — https://knexjs.org/guide/query-builder .
