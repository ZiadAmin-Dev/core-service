# Project Context — Verified Facts about Quick Bite `core-service`

Every claim below was confirmed by repository inspection (October 2026). Anything uncertain is marked **Undetermined**.

## 1. Stack

| Layer | Technology (pinned major) |
| --- | --- |
| Runtime / language | Node.js, TypeScript 5.9 (`strict`, `noImplicitAny`, `nodenext`, `experimentalDecorators`, `emitDecoratorMetadata`) |
| HTTP | Express 5.2, `helmet`, `cors`, `cookie-parser`, JSON limit `10mb`, `/api` mount |
| DB | PostgreSQL + PostGIS via Knex 3.3 + `pg`; raw-SQL migrations under `src/migrations/` |
| Cache | Redis via `ioredis`, abstracted behind `ICacheProvider` (`src/pkg/cache/`) |
| Messaging | RabbitMQ via `amqp-connection-manager`; transactional outbox drained by `src/worker.ts` (`croner`) |
| Email | Mailjet (`node-mailjet`) behind `IEmailProvider` |
| Auth | `jsonwebtoken` (cookies), `bcrypt` (passwords) |
| Validation | `class-validator` + `class-transformer` |
| DI | `tsyringe` (`@injectable`, `@inject(TOKENS.*)`, singletons + instances in `src/lib/di/container.ts`) |
| Config | `dotenv` + `zod`-validated env (`src/lib/config/env.ts`) |
| Scripts | `build: tsc`, `dev: tsx watch src/server`, `worker`, `migrate*` via `src/lib/knex/knexfile.ts`; `test: vitest run` (covers `src/lib/http/pagination/` pure-function regression tests; no DB-backed tests) |

## 2. Module layout

`src/app/` holds 8 domain modules: `auth`, `user`, `customer-address`, `restaurant`, `branch`, `product`, `rbac`, `health`. Each (except `health`) follows:

```text
<module>/controller/ service/ repository/ entity/ dto/
        *.routes.ts  *.errors.ts  (*.utils.ts, templates/ where needed)
```

- **Controllers** are thin: `validateBody(...)` / `validateQuery(...)` → service call → `sendSuccess`/`sendPaginated` or raw `res.status().json()`. (Both response styles exist; see `Docs/API Contracts/`.)
- **Services** own business logic and start Knex transactions; repositories never start their own.
- **Repositories** export plain functions (`find*`, `create*`, `update*`), project explicit column lists, map rows to entity classes.
- **Entities** are classes with `constructor(data: Partial<T>)`; enums live beside them.
- **DTOs** are split: `*.request.dto.ts` (class-validator input), `*.response.dto.ts` (plain classes with `static from()`), and `*.query.dto.ts` for list endpoints (extend `BasePaginationQueryDTO` from `src/lib/http/pagination/`, add the module `filter` + `toFilterParams()`; validated via `validateQuery`, fail fast with 400).

## 3. Cross-cutting infrastructure (`src/lib/`)

- **Guards:** `authentication` (reads `access_token` cookie, sets `req.user`), `requireRestaurantMember(param)`, `requireBranchAccess(param)`, `rbac({resource, action})`, `requireInternalApiKey` (`X-Internal-API-Key`). Typical management chain: `authentication → scope → rbac`.
- **Validation:** `validateBody` (strict) vs `validateParams`/`validateQuery` (explicit `@Type(() => Number)` coercion — implicit conversion does not run under `tsx`); failures throw `ValidationError` with `errors: [{field, message}]`, status 400. List endpoints gate all query parsing/casting in a `*.query.dto.ts` (`extends BasePaginationQueryDTO`); services/repositories receive typed `PaginationParams`/`FilterParams` only.
- **Errors:** `AppError(message, statusCode, isOperational)`; per-module error constants in `*.errors.ts`; central `errorHandler` (note: it returns `err.message` only, not `err.errors`).
- **Responses:** `sendSuccess(res, data, status, meta?)` → `{success, data, meta?}`; `sendPaginated` adds cursor `meta`.
- **Cache:** `withCache(ttl, userScoped?)` keys on `METHOD:originalUrl[:userId]`, sets `X-Cache: HIT/MISS`, caches 2xx (and 404s for 5m), fails open.
- **Idempotency:** `idempotency({strict, userScope})` on mutating routes, header `Idempotency-Key`, Redis-backed, fails open unless `strict`.
- **Events:** `events_outbox` table + `EVENT_TYPES` (`product.*`, `branch.*`, `restaurant.suspended`, `rbac.permissions_changed`); worker claims with `FOR UPDATE SKIP LOCKED` and publishes with confirms.
- **Money:** integer minor units everywhere (`deliveryFee`, `price`, `stock` as INT); floats are prohibited on money paths.

## 4. Known inconsistencies (do not "fix" unasked)

- `src/app/rbac/rbac.route.ts` breaks the `*.routes.ts` convention; `resraurant.errors.ts` is misspelled.
- `errorHandler` imports `./AppError` while the file is `appError.ts` (casing risk on some filesystems).
- Request DTO naming mixes `Create*`/`Update*` with legacy lowercase (`createAddressDTO`).
- Some endpoints return raw `res.json` instead of the `sendSuccess` envelope — documented per-endpoint in `Docs/API Contracts/`.

## 5. Docs map

- `Docs/API Contracts/` — per-module endpoint truth.
- `Docs/business-logic/` — per-module flows and state machines.
- `Docs/system-design/` — system, database, folder-structure docs.
