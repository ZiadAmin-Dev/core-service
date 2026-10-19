# Response DTOs and API Contracts

## Purpose

Return exactly the documented shape — no leaked internals, no accidental reshapes.

## When to Use

Creating or changing any endpoint response.

## Core Principles

- Controllers never return entities, Knex rows, or provider objects directly.
- Every response shape is an explicit DTO with a `from()` mapper — the contract is code, not convention.
- Changing a response is a breaking change: version it in docs, never sneak it.

## Quick Bite Project Rules

- Response DTOs live in `dto/*.response.dto.ts` as plain classes with `static from(...)` (see `user.response.dto.ts`, `branch.response.dto.ts`).
- Standard envelopes: `sendSuccess(res, data, status)` → `{success, data}`; `sendPaginated(res, data, meta)` → `{success, data, meta}`. **But** several endpoints intentionally return raw `res.json` (unwrapped user profile, raw product entity, `{message, address}` wrappers) — match the endpoint's documented shape in `Docs/API Contracts/`, do not "normalize".
- Never expose `passwordHash`, `deletedAt`, tokens, or provider internals; internal-only fields (`userId` on public shapes) stay internal.
- Sibling projections differ on purpose (customer address `toResponse` vs internal `getById`); copy the exact field list from the contract doc, not from a neighboring endpoint.

## Common Mistakes

- Returning the entity "because it has the same fields today" — entities gain sensitive columns; DTOs are the firewall.
- Reusing a sibling's DTO for a different projection (missing/extra fields).
- Forgetting to update `Docs/API Contracts/<module>.md` after changing a shape.

## Recommended Approach

1. Read the endpoint's contract section first.
2. Extend/add the `*ResponseDTO` with a `from()` mapper covering exactly those fields.
3. Use it in the controller; update the contract doc in the same change.

## Examples

```ts
export class AgentResponseDTO {
    id!: number; name!: string; phone!: string;
    static from(user: User): AgentResponseDTO {
        return { id: user.id, name: user.name, phone: user.phone };
    }
}
```

## Verification Checklist

- [ ] No entity/row/provider object reaches `res.json` directly.
- [ ] Field list matches the contract doc exactly.
- [ ] Contract doc updated for any shape change.

## References

- OWASP API Top 10 (API3 excessive data exposure) — https://owasp.org/API-Security/editions/2023/en/0x11-t10/ .
