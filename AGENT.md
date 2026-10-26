# AGENT.md — Working in Quick Bite `core-service`

You are in **Quick Bite `core-service`** (this repo). It is the system of record for identity, catalog, and access control: users, restaurants, branches, products, customer addresses, and RBAC. Orders, payments, deliveries, and dispatch belong to the sibling `order-service` — out of scope unless the task says otherwise.

`README.md` is written for humans. This file is yours.

## 1. Orientation (read in this order)

1. `README.md` §1–§6 — scope, stack, architecture, module map.
2. `.agent/AGENT_GUIDELINES.md` — **non-negotiable** operating rules (inspect first, minimal diffs, honest reporting).
3. `.agent/PROJECT_CONTEXT.md` — verified stack/layout/conventions plus known inconsistencies.
4. `.agent/SKILLS_INDEX.md` — pick skills by task keywords and read them **before** coding.
5. The relevant `Docs/` files (`API Contracts/`, `business-logic/`, `system-design/`).
6. The actual source: `src/routes.ts` → module router → controller → service → repository → entity, plus `src/migrations/` for schema questions.

Precedence: this file orients; it never overrides `.agent/AGENT_GUIDELINES.md`, skill rules, or source code. Distinguish **missing implementation** from **missing documentation**, and mark guesses as guesses.

## 2. Hard Rules

1. **Verify before you claim.** A handler, route, or event type existing in code is not proof it runs. Confirm a *registered, reachable* execution path.
2. **Preserve layer boundaries.** Controllers thin (validate → service → respond), services own rules and start every Knex transaction, repositories own SQL and never start transactions.
3. **Extend, don't replace.** Add no new frameworks, ORMs, or abstractions to solve a local problem.
4. **Keep diffs minimal and behavior-preserving** — including documented quirks that clients may depend on.
5. **Do not edit applied migrations**, seeds, or config unless the task asks for it.
6. **Obey explicit restrictions.** If commands (tests, builds, scripts) are forbidden, do not work around it.
7. **Never claim a check passed unless it actually ran and succeeded.** Report unverified work as unverified.
8. **If your change alters behavior, update the affected `Docs/` file in the same change.**

## 3. Verified Facts (confirmed by inspection, October 2026)

- **Stack:** Node.js + TypeScript 5.9 (`strict`, `nodenext`, decorators) · Express 5.2 · Knex 3.3 + `pg` over PostgreSQL + PostGIS · Redis (`ioredis`) · RabbitMQ (`amqp-connection-manager`) · Mailjet · `jsonwebtoken` + `bcrypt` · `class-validator` + `class-transformer` · `tsyringe` · `zod` + `dotenv` · `croner`.
- **Modules (8):** `auth`, `user`, `customer-address`, `restaurant`, `branch`, `product`, `rbac`, `health`.
- **Layering:** `src/app/` → `src/lib/` (guards, cache, events, validation, config) → `src/pkg/` (pure providers: no `lib`/`app` imports, no `process.env`). Cross-module reads go through services, never another module's repository.
- **Guard chains:** `authentication` (JWT from the `access_token` cookie) → `requireRestaurantMember` / `requireBranchAccess` → `rbac({resource, action})`. Internal routes use `requireInternalApiKey` via `X-Internal-API-Key`.
- **DI:** providers registered as `tsyringe` singletons/instances in `src/lib/di/container.ts` under `TOKENS`; routes `container.resolve()` controllers. Never `new` a provider inside a service.
- **Validation:** `validateBody` is strict; `validateParams`/`validateQuery` need explicit `@Type(() => Number)` coercion (implicit conversion does not run under `tsx`). Failures throw `ValidationError` with `errors: [{field, message}]`, status 400.
- **DTOs:** `*.request.dto.ts` (input), `*.query.dto.ts` (list endpoints — `extends BasePaginationQueryDTO`, expose `filter` + `toFilterParams()`), `*.response.dto.ts` (plain classes with `static from()`).
- **Responses:** `sendSuccess` → `{success, data, meta?}`; `sendPaginated` adds cursor `meta`. Some endpoints return raw `res.json` instead — documented per-endpoint in `Docs/API Contracts/`.
- **Money is integer minor units.** Soft deletes use `deleted_at` on users/products.
- **Env:** `.env` at repo root, validated by `zod` in `src/lib/config/env.ts`; boot fails on missing required values. **No `.env.example` ships** — required values are `DB_PASSWORD`, `DB_NAME`, `ACCESS_SECRET`, `REFRESH_SECRET`, `DB_MIGRATION_DIRECTORY`, `DB_MIGRATION_EXTENSION`, and the four `MAILJET_*` keys. See `README.md` §8 for the full table; `env.ts` is the source of truth.
- **Migrations:** 11 files in `src/migrations/`.
- **Tests:** `npm test` (`vitest run`) covers only pure functions under `src/lib/http/pagination/`. No DB-backed tests.
- **Checks:** `npm run build` (`tsc`, strict) for type safety; `npm run migrate:status` for schema state. **No lint or format configs exist** — eslint/prettier are dev dependencies with no config files. Undetermined whether they are meant to run; verify before invoking.

## 4. Known Gaps (verified — do not "fix" unasked)

- Five of six outbox event types have **no write call site** — only `PRODUCT_STOCK_CHANGED` is emitted (`src/app/product/service/product.service.ts`). `branch.updated`, `branch.deactivated`, `product.price.changed`, `restaurant.suspended`, and `rbac.permissions_changed` are declared in `src/lib/events/event-types.ts` but never written.
- `RestaurantController.getActive` exists but is **not routed** in `src/app/restaurant/restaurant.routes.ts` and serves no traffic.
- RBAC permission cache invalidation is **unwired**.
- `errorHandler` returns `err.message` only; field-level `ValidationError.errors` stay server-side.
- `INTERNAL_API_KEY` defaults to `""`, making `/api/internal/*` effectively unprotected unless set.
- **Known inconsistencies — document, don't silently normalize:**
  - `src/app/rbac/rbac.route.ts` breaks the `*.routes.ts` convention.
  - `src/app/restaurant/resraurant.errors.ts` is misspelled.
  - `src/lib/error/errorHandler.ts` imports `"./AppError"` while the file is `appError.ts` (case-sensitivity risk on Linux).
  - Request DTO naming mixes `Create*`/`Update*` with legacy lowercase (`createAddressDTO`).
  - Duplicate branch route and a double-wrapped member list in the RBAC responses.

## 5. Documentation Map

| Area | Location |
| --- | --- |
| API contracts | `Docs/API Contracts/<module>.md` |
| Business logic | `Docs/business-logic/<module>.md` |
| System design | `Docs/system-design/system-design.md`, `database-design.md`, `folder-structure.md` |
| Agent library | `.agent/README.md`, `.agent/AGENT_GUIDELINES.md`, `.agent/PROJECT_CONTEXT.md`, `.agent/SKILLS_INDEX.md`, `.agent/SOURCES.md` |
| Key skills | `.agent/Skills/general/safe-code-changes/SKILL.md`, `.agent/Skills/general/code-review/SKILL.md`, `.agent/Skills/testing/testing-strategy/SKILL.md`, `.agent/Skills/general/diagram-engineering/SKILL.md` |

`Docs/` describes intent; source code describes reality. When they disagree, the code wins — and report the discrepancy instead of editing docs to match silently.

## 6. Reporting

Finish every task with: what changed (file paths), what you assumed, what risks remain, and what you did **not** verify.
