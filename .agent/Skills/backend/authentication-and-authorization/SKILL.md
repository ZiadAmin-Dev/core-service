# Authentication and Authorization

## Purpose

Prove who the caller is, then prove they may do this specific action on this specific object.

## When to Use

Login/register flows, guards, role/permission checks, internal endpoints, token handling.

## Core Principles

- Authenticate first (identity), then authorize (permission + scope). Never skip either because "the service checks too" — defense in depth.
- Fail closed and generically on identity paths: identical responses for unknown user vs wrong secret.
- Tokens are opaque to clients; short-lived access, longer-lived refresh, least-privilege claims.

## Quick Bite Project Rules

- JWTs travel in http-only cookies (`access_token`, `refresh_token`); `authentication` guard verifies and sets `req.user = {userId, email, role, restaurantId?, restaurantRole?, branchIds?}`.
- Scope guards: `requireRestaurantMember(paramName)` and `requireBranchAccess(paramName)` bind URL ids to the JWT claims; `rbac({resource, action})` checks seeded permissions (`core:product:*`, `core:member:*`, `core:branch:*`, `core:restaurant:update`).
- Management chains look like `authentication → requireRestaurantMember → rbac`; service layers re-verify ownership (owner-or-admin) independently.
- Internal routes use `requireInternalApiKey` (`X-Internal-API-Key`) with no JWT.
- Passwords: bcrypt hashes only (`hashPassword`/`comparePassword`); OTPs stored hashed with 10-minute expiry; login/register errors stay generic (anti-enumeration).
- `system_admin` can never self-register; owner role can never be created/deleted via member endpoints.

## Common Mistakes

- Reading `req.user` without the `authentication` guard earlier in the chain.
- Using `requireRestaurantMember` with the wrong param name so the check passes vacuously.
- Returning distinct errors for "email unknown" vs "password wrong" (account oracle).
- Logging tokens, OTPs, or password hashes.

## Recommended Approach

1. Copy the guard chain from the closest sibling route; double-check param names.
2. Keep service-level ownership checks even when guards exist.
3. Keep all identity-failure messages generic; log details with `correlationId`.

## Examples

Invite accept: OTP verified via the reset machinery, then `activateMemberByUserId` flips `inactive → active` — two steps, one flow, generic errors throughout.

## Verification Checklist

- [ ] Guard chain present, ordered, param names correct.
- [ ] Service re-checks ownership for sensitive writes.
- [ ] No identity oracle; no secrets in logs/responses.

## References

- OWASP Authentication Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet ; OWASP JWT Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet ; OWASP Password Storage — https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html .
