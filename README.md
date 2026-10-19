# Quick Bite `core-service`

System of record for identity, catalog, and access control in the Quick Bite platform. It owns users, restaurants, branches, products, customer addresses, and RBAC — and serves both public clients and the sibling `order-service` (sync internal APIs plus async domain events).

> **New here?** Start with [Setup](#7-prerequisites-and-local-setup) to get it running, then read [Architecture](#4-architecture-overview) and [Key Modules](#6-key-modules-and-capabilities) to understand the code.

## 1. Project Overview

`core-service` is an Express + TypeScript HTTP API backed by PostgreSQL (PostGIS), Redis, RabbitMQ, and Mailjet. Major capabilities:

- **Identity & auth** — registration (including restaurant-owner onboarding), login, JWT cookies, OTP password recovery, member invitations.
- **Restaurant & branch management** — profiles, admin-gated status transitions, PostGIS nearby-branch search.
- **Catalog** — categories, products, per-branch price/stock/availability, atomic stock reservation for checkout.
- **Customer addresses** — owned CRUD plus an internal lookup for checkout.
- **RBAC** — restaurant members, seeded roles (`owner`, `branch_manager`, `staff`), resource:action permissions.
- **Platform services** — transactional outbox events for `order-service`, Redis caching, idempotency keys, internal service-to-service APIs.

## 2. Current Scope and Boundaries

| Owned by `core-service` | Outside scope |
| --- | --- |
| Users, auth sessions, password resets | Order lifecycle, payments, deliveries, agent dispatch → `order-service` |
| Restaurants, branches, products, categories, addresses | Real-time order tracking / driver apps backend → `order-service` |
| RBAC roles, permissions, memberships | Analytics / reporting stores (none in this repo) |
| Outbox event publishing (`core.events`) | Event consumption logic → `order-service` |

**Implemented vs gaps (verified, not aspirational):** the outbox defines six event types but only `product.stock.changed` has a write call site; `RestaurantController.getActive` exists but has no route; RBAC permission invalidation is unwired; the error handler surfaces `err.message` only (field-level `ValidationError.errors` stay server-side). See [Known Limitations](#18-known-limitations-and-implementation-gaps).

## 3. Technology Stack

| Technology | Role here |
| --- | --- |
| Node.js + TypeScript 5.9 (`strict`, decorators) | Runtime and language; `tsx` for dev, `tsc` build to `dist/` |
| Express 5.2 (+ `helmet`, `cors`, `cookie-parser`) | HTTP layer, `/api` mount, 10 MB JSON limit |
| Knex 3.3 + `pg` | SQL query builder and migrations over PostgreSQL + PostGIS |
| Redis (`ioredis`) behind `ICacheProvider` | Response caching (`withCache`), idempotency keys |
| RabbitMQ (`amqp-connection-manager`) | `core.events` exchange, fed by the outbox worker |
| Mailjet (`node-mailjet`) behind `IEmailProvider` | OTP and invitation emails |
| `jsonwebtoken` / `bcrypt` | Cookie JWT sessions / password hashing |
| `class-validator` + `class-transformer` | Request DTO validation (`validateBody/Params/Query`) |
| `tsyringe` | DI: `@injectable` services/controllers, `TOKENS`, singletons in `src/lib/di/container.ts` |
| `zod` + `dotenv` | Environment validation (`src/lib/config/env.ts`) |
| `croner` | Outbox drain schedule in `src/worker.ts` |

## 4. Architecture Overview

Every request follows one path with downward-only dependencies:

```mermaid
flowchart LR
    REQ[HTTP request] --> GUARD[Guards: auth, scope, RBAC]
    GUARD --> CTL[Controller: validate, call service, respond]
    CTL --> SVC[Service: rules and transactions]
    SVC --> REPO[Repository: Knex queries, row mapping]
    REPO --> DB[(PostgreSQL + PostGIS)]
    SVC --> OB[(events_outbox, same trx)]
```

- **Controllers** (`src/app/<module>/controller/`) are thin: validate → service → `sendSuccess`/`sendPaginated` (some documented endpoints return raw `res.json` — see API Contracts).
- **Services** own business rules and start all Knex transactions; **repositories** own SQL with explicit column lists and `toEntity` mappers, and never start transactions.
- **Layering:** `src/app/` → `src/lib/` (guards, cache glue, events, validation, config) → `src/pkg/` (pure providers: no `lib`/`app` imports, no `process.env`). Cross-module reads go through services, never another module's repository.
- Auth: JWT in http-only cookies → `authentication` → scope guards → `rbac({resource, action})`; internal routes use `X-Internal-API-Key` instead.

## 5. Repository Structure

```text
core-service/
├── README.md                  # This file
├── AGENT.md                   # Entry point for AI agents working in this repo
├── agent/                     # Agent instruction library and skills
├── Docs/                      # API Contracts, business-logic, system-design
├── src/
│   ├── app.ts                 # Express factory (mounts /api)
│   ├── server.ts              # HTTP bootstrap + graceful shutdown
│   ├── worker.ts              # Outbox drain process (cron)
│   ├── routes.ts              # Master router
│   ├── app/                   # auth, user, customer-address, restaurant,
│   │                          # branch, product, rbac, health (controller/
│   │                          # service/ repository/ entity/ dto/)
│   ├── lib/                   # auth, cache, config, di, error, events,
│   │                          # http, idempotency, knex, logger, validation…
│   ├── pkg/                   # cache, email, messaging providers + utils
│   └── migrations/            # 11 PostgreSQL migrations (schema + seeds)
├── package.json / package-lock.json   # npm, scripts below
└── tsconfig.json              # strict, nodenext, decorators
```

Domain modules follow `controller/ service/ repository/ entity/ dto/*.request|response.dto.ts`, plus `*.routes.ts` and `*.errors.ts`. Details: [Docs/system-design/folder-structure.md](Docs/system-design/folder-structure.md).

## 6. Key Modules and Capabilities

| Module | Owns | Detail |
| --- | --- | --- |
| `auth` | Register, login, OTP recovery, invites, refresh | [contract](Docs/API%20Contracts/auth.md) · [logic](Docs/business-logic/auth.md) |
| `user` | Profiles, internal agent lookup | [contract](Docs/API%20Contracts/user.md) · [logic](Docs/business-logic/user.md) |
| `customer-address` | Owned addresses, internal lookup | [contract](Docs/API%20Contracts/customer-address.md) · [logic](Docs/business-logic/customer-address.md) |
| `restaurant` | Profiles, admin status flow | [contract](Docs/API%20Contracts/restaurant.md) · [logic](Docs/business-logic/restaurant.md) |
| `branch` | Geo branches, ordering switches, commission | [contract](Docs/API%20Contracts/branch.md) · [logic](Docs/business-logic/branch.md) |
| `product` | Catalog, branch stock, reservations | [contract](Docs/API%20Contracts/product.md) · [logic](Docs/business-logic/product.md) |
| `rbac` | Members, roles, permissions | [contract](Docs/API%20Contracts/rbac.md) · [logic](Docs/business-logic/rbac.md) |
| `health` | `GET /api/health/` liveness probe | [contract](Docs/API%20Contracts/health.md) · [logic](Docs/business-logic/health.md) |

## 7. Prerequisites and Local Setup

- **Node.js** (current LTS) + **npm** (repo uses `package-lock.json` — install with `npm ci` for reproducible builds).
- **PostgreSQL with PostGIS** (a migration creates the `postgis` extension; the app cannot boot its geo features without it).
- **Redis** (caching/idempotency; both middlewares fail open without it, except `strict` idempotency which 503s).
- **RabbitMQ** (outbox worker; the worker logs and retries if unreachable at boot).
- Steps: `npm ci` → create `.env` from the shipped `.env.example` (see next section) → create the database → run migrations (§10) → start (§9).

## 8. Environment Configuration

Loaded from `<root>/.env` and validated by `zod` in `src/lib/config/env.ts` (boot fails on missing required values). `.env` is git-ignored; copy `.env.example` to `.env` and fill in the blank values (secrets are left empty on purpose). Never commit real secrets.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | no | `3000` | HTTP listen port |
| `NODE_ENV` | no | `development` | Environment name |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_NAME` | host/user/name yes (`DB_PASSWORD` yes) | `localhost` / `5432` / `postgres` | PostgreSQL connection |
| `DB_PASSWORD` | **yes** | — | Database password |
| `DB_POOL_MIN` / `DB_POOL_MAX` | no | `2` / `10` | Knex pool |
| `DB_MIGRATION_DIRECTORY` / `DB_MIGRATION_EXTENSION` | **yes** | — | Where knex finds migrations (e.g. `src/migrations` / `ts`) |
| `ACCESS_SECRET` / `REFRESH_SECRET` | **yes** | — | JWT signing secrets |
| `ACCESS_EXPIRES_IN` / `REFRESH_EXPIRES_IN` | no | `3600` / `604800` (s) | Token lifetimes |
| `BCRYPT_SALT_ROUNDS` | no | `10` | Password hashing cost |
| `CORS_ORIGINS` | no | `http://localhost:3000` | Allowed origins (comma-separated) |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | no | `localhost` / `6379` / — | Redis connection |
| `MAILJET_API_KEY` / `MAILJET_SECRET_KEY` / `MAILJET_FROM_EMAIL` / `MAILJET_FROM_NAME` | **yes** | — | Outbound email (OTP, invites) |
| `INTERNAL_API_KEY` | no | `""` | Shared secret for `/api/internal/*`; empty means effectively unprotected — set it in every real environment |
| `RABBITMQ_URL` | no | `amqp://guest:guest@localhost:5672` | Broker for the outbox worker |
| `RABBITMQ_CORE_EVENTS_EXCHANGE` | no | `core.events` | Exchange the worker publishes to |
| `OUTBOX_DRAIN_CRON` / `OUTBOX_BATCH_SIZE` | no | every second / `50` | Drain schedule and batch size |

## 9. Running the Application

All commands from `package.json` (verified; run from the repo root):

```bash
npm ci                                   # install
npm run migrate                          # apply migrations (needs .env + DB)
npm run dev                              # API with live reload (tsx watch src/server)
npm run build && npm start               # compile to dist/, serve production API
npm run worker:dev                       # outbox worker with live reload
npm run worker                           # production worker (needs dist/ built)
npm run migrate:status                   # pending/applied migrations
npm run migrate:rollback                 # revert last batch (dev only, with care)
```

Order: database up → `.env` → `migrate` → `dev` (API) and, for events, `worker:dev`. API serves under `http://localhost:3000/api`.

## 10. Database and Migrations

- **PostgreSQL + PostGIS**, accessed only through Knex; schema lives in `src/migrations/` (11 files: tables, PostGIS branches table, RBAC + permission seeds, outbox, delivery fee).
- Repositories project explicit `*_COLUMNS`, map rows via `toEntity`, and use `.returning()` on writes; money is integer minor units; soft deletes (`deleted_at`) on users/products.
- Run with `npm run migrate` (knex reads directory/extension from env). New schema work = new migration file with `up` + `down`, constraints, and supporting indexes — never edit applied migrations.
- Full schema reference: [Docs/system-design/database-design.md](Docs/system-design/database-design.md).

## 11. API and Route Documentation

Routes register in `src/routes.ts` → per-module `*.routes.ts` (guard chains live there — read them first). Validation entry: `src/lib/validation/validate.ts`. Response envelopes: `src/lib/http/response.ts`.

| Module contracts |
| --- |
| [auth](Docs/API%20Contracts/auth.md) · [user](Docs/API%20Contracts/user.md) · [customer-address](Docs/API%20Contracts/customer-address.md) · [restaurant](Docs/API%20Contracts/restaurant.md) · [branch](Docs/API%20Contracts/branch.md) · [product](Docs/API%20Contracts/product.md) · [rbac](Docs/API%20Contracts/rbac.md) · [health](Docs/API%20Contracts/health.md) |

Only documented, registered routes are real — e.g. `RestaurantController.getActive` has no route and serves no traffic.

## 12. Business Logic Documentation

`Docs/business-logic/<module>.md` holds per-module flows, state machines, and rules (Mermaid `flowchart`/`stateDiagram-v2`): [auth](Docs/business-logic/auth.md) · [user](Docs/business-logic/user.md) · [customer-address](Docs/business-logic/customer-address.md) · [restaurant](Docs/business-logic/restaurant.md) · [branch](Docs/business-logic/branch.md) · [product](Docs/business-logic/product.md) · [rbac](Docs/business-logic/rbac.md) · [health](Docs/business-logic/health.md). Consult these before changing service behavior; they record known quirks (duplicate branch route, double-wrapped member list, raw-vs-envelope responses).

## 13. System Design and Data Modeling

- [system-design.md](Docs/system-design/system-design.md) — service context, request lifecycle, caching, outbox, email, scaling. Read for any cross-cutting change.
- [database-design.md](Docs/system-design/database-design.md) — ER diagrams (split per domain) + table specs derived from migrations. Read before touching repositories or schema.
- [folder-structure.md](Docs/system-design/folder-structure.md) — directory map, layering rules, conventions. Read before placing new code.

## 14. Core Engineering Concerns

- **AuthN/Z:** cookie JWTs → `authentication` → `requireRestaurantMember`/`requireBranchAccess` → `rbac({resource, action})`; services re-check ownership; internal routes use the API key. Identity failures stay generic (anti-enumeration).
- **DI:** `tsyringe` singletons/instances via `TOKENS`; routes `container.resolve()` controllers. Never `new` a provider in a service.
- **Validation/responses:** `validateBody` (strict) vs `validateParams`/`validateQuery` (explicit `@Type` coercion); request DTOs in `*.request.dto.ts`, list-query DTOs in `*.query.dto.ts` (`extends BasePaginationQueryDTO`, fail fast 400), responses via `*.response.dto.ts` + `static from()`; `sendSuccess`/`sendPaginated` except documented raw bodies.
- **Errors/logging:** `AppError` + per-module constants, central `errorHandler` (message-only responses); structured logger with `correlationId`; `X-Cache: HIT/MISS` header for cache diagnosis.
- **Caching:** `withCache` (key `METHOD:url[:userId]`, 1h, 404s 5m, fail-open); RBAC perms are in-process 1h; freshness is TTL-based — no explicit eviction wired.
- **DB:** transactions start in services only; `FOR UPDATE` + `SKIP LOCKED` patterns for races and outbox claiming.
- **Safety:** `idempotency({strict, userScope})` on mutating routes (Redis-backed, 1-day window, best-effort — back critical paths with unique constraints).

## 15. Testing and Quality Checks

- **Tests:** `npm test` (`vitest run`) covers pure-function regression tests under `src/lib/http/pagination/` (no DB). No lint/format configs ship (eslint/prettier are listed as dev dependencies but have no config files — **Undetermined: verify before invoking**).
- Available checks: `npm run build` (`tsc`, strict) for type safety; `npm run migrate:status` for schema state.
- There is no repo-level commit/PR/review instruction file; follow the host project's process.

## 16. Contributing

- Follow the layer contract (controller → service → repository), the `lib`/`pkg` import rules, and the module layout in §4–§5; extend existing abstractions instead of adding new ones.
- Keep diffs minimal and behavior-preserving — including documented quirks (misspelled keys, envelope differences) that clients may depend on.
- Update the matching `Docs/` contract/logic file in the same change whenever behavior changes.

## 17. Documentation Index

- **API contracts:** [auth](Docs/API%20Contracts/auth.md) · [user](Docs/API%20Contracts/user.md) · [customer-address](Docs/API%20Contracts/customer-address.md) · [restaurant](Docs/API%20Contracts/restaurant.md) · [branch](Docs/API%20Contracts/branch.md) · [product](Docs/API%20Contracts/product.md) · [rbac](Docs/API%20Contracts/rbac.md) · [health](Docs/API%20Contracts/health.md)
- **Business logic:** [auth](Docs/business-logic/auth.md) · [user](Docs/business-logic/user.md) · [customer-address](Docs/business-logic/customer-address.md) · [restaurant](Docs/business-logic/restaurant.md) · [branch](Docs/business-logic/branch.md) · [product](Docs/business-logic/product.md) · [rbac](Docs/business-logic/rbac.md) · [health](Docs/business-logic/health.md)
- **System design:** [system-design](Docs/system-design/system-design.md) · [database-design](Docs/system-design/database-design.md) · [folder-structure](Docs/system-design/folder-structure.md)
- **AI agent instructions:** [AGENT.md](AGENT.md) · [agent library](.agent/README.md) · [guidelines](.agent/AGENT_GUIDELINES.md) · [project context](.agent/PROJECT_CONTEXT.md) · [skills index](.agent/SKILLS_INDEX.md)

## 18. Known Limitations and Implementation Gaps

Significant, verified items only (each traced to code):

- Vitest covers pagination pure functions only; no DB-backed tests, lint, or format configs.
- `errorHandler` drops field-level validation details; clients see `"Validation failed"` only.
- Five of six outbox event types have no write call sites; RBAC cache invalidation unwired; `getActive` unrouted (§2).
- `INTERNAL_API_KEY` defaults to `""` — internal endpoints need a real secret in every environment.

## 19. Project Status and Maintenance

Active development codebase with working API, worker, migrations, docs, and agent library. No release versions, deployment targets, or production-status claims exist in the repo — none are made here. The authoritative state is the code plus `Docs/`; this README links rather than duplicates so it cannot drift from them.
