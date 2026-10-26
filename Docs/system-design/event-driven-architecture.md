# Event-Driven Architecture — core-service (Publisher Side)

Source of truth for how core-service produces domain events to order-service via the
transactional outbox pattern. Every element named here exists in the code; gaps and quirks
are documented explicitly, not hidden.

- Audience: any engineer touching events, the outbox, or the worker.
- Consumer-side documentation lives in `order-service/docs/system-design/event-driven-architecture.md`. Cross-link, don't duplicate.
- Related: `system-design.md`, `database-design.md`, `business-logic/product.md` (order event call sites).

---

## 0. The one-sentence model

A domain event becomes eligible for publication **exactly when** the domain mutation that
caused it commits — because the event row is written **inside the same database
transaction**, and a separate worker process drains committed rows to RabbitMQ later.

```
HTTP mutation ─┬─> domain table update ──┐
               └─> events_outbox row ────┴── same trx (atomic)
                                    │ commit
                                    ▼
                      worker (cron) ──> RabbitMQ core.events ──> order-service consumer
```

The design point: the network is never inside the transaction. A RabbitMQ outage can
delay publication but can never desync it.

---

## 1. Participants (real files)

| Role | Code |
| --- | --- |
| Event type constants | `src/lib/events/event-types.ts` |
| Outbox row insert / claim / mark | `src/lib/events/outbox.repo.ts` |
| Drain algorithm | `src/lib/events/outbox-drain.ts` |
| Worker entry point (own process) | `src/worker.ts` |
| RabbitMQ producer client | `src/pkg/messaging/rabbitmq.client.ts` |
| Broker init / DI token | `src/lib/events/init.ts`, `src/lib/di/container.ts` |
| Outbox table DDL | `src/migrations/20261011014411_create_events_outbox.ts` |
| Call sites (who emits events) | `src/app/product/service/product.service.ts`, `src/app/branch/service/branch.service.ts`, `src/app/restaurant/service/restaurant.service.ts` |

## 1.1. Canonical event types — `src/lib/events/event-types.ts`

| Constant | Routing key |
| --- | --- |
| `PRODUCT_STOCK_CHANGED` | `product.stock.changed` |
| `PRODUCT_PRICE_CHANGED` | `product.price.changed` |
| `BRANCH_UPDATED` | `branch.updated` |
| `BRANCH_DEACTIVATED` | `branch.deactivated` |
| `RESTAURANT_SUSPENDED` | `restaurant.suspended` |
| `RBAC_PERMISSIONS_CHANGED` | `rbac.permissions_changed` |

The event type string is reused as the AMQP routing key (`outbox-drain.ts:40`), so routing
keys and bindings on the consumer side must stay in sync with this table.

## 1.2. Current emission call sites

| Service file | Event | Aggregate |
| --- | --- | --- |
| `product.service.ts:137` | `PRODUCT_PRICE_CHANGED` | `product_branch_details` |
| `product.service.ts:145` | `PRODUCT_STOCK_CHANGED` | `product_branch_details` |
| `product.service.ts:213` | `PRODUCT_STOCK_CHANGED` | `product_branch_details` |
| `branch.service.ts:66` | `BRANCH_UPDATED` | `restaurant_branches` |
| `branch.service.ts:92` | `BRANCH_DEACTIVATED` | `restaurant_branches` |
| `restaurant.service.ts:128` | `RESTAURANT_SUSPENDED` | `restaurants` |

`rbac.permissions_changed` exists as a constant but has **no emission call site yet** —
Undetermined; verify the call site exists before relying on it.

---

## 2. The outbox table

Migration: `20261011014411_create_events_outbox.ts` (raw SQL).

```sql
CREATE TABLE events_outbox (
    id             BIGSERIAL PRIMARY KEY,
    aggregate_type TEXT NOT NULL,
    aggregate_id   TEXT NOT NULL,
    event_type     TEXT NOT NULL,
    event_id       UUID NOT NULL UNIQUE,   -- generated in insertOutboxEvent via randomUUID()
    payload        JSONB NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    dispatched_at  TIMESTAMP NULL,          -- NULL = pending
    attempts       INT NOT NULL DEFAULT 0,
    last_error     TEXT NULL
);
CREATE INDEX idx_events_outbox_pending ON events_outbox (id) WHERE dispatched_at IS NULL;
```

Key properties:

- `event_id` (UUID, UNIQUE) is created here and travels unchanged to the consumer — it is
  the consumer's deduplication key (`core-events:dedupe:{event_id}`).
- The partial index only contains pending rows; dispatched rows leave the index, so it
  stays small regardless of table size.

## 2.1. Outbox row state machine

```mermaid
stateDiagram-v2
    [*] --> Pending : insertOutboxEvent, inserted inside the domain trx and committed with it
    Pending --> Dispatched : drain passes, publishConfirmed acked, markDispatched sets dispatched_at
    Pending --> Pending : publish failed, markFailed bumps attempts and stores last_error
    Dispatched --> [*]
```

Notes:

- `attempts` is incremented on every failed publish, but **there is no ceiling** — a row
  stays pending forever until a publish succeeds. See Known gaps (4.2).
- `markFailed` truncates the stored error to 2000 chars (`outbox.repo.ts:46`).

---

## 3. The worker — `src/worker.ts`

A **separate OS process and entry point**. Nothing imports it; nothing in `server.ts`
touches RabbitMQ. Run it with `npm run worker:dev` (tsx watch) or `npm run worker`
(production, `dist/worker.js`).

## 3.1. Worker boot lifecycle

```mermaid
flowchart TD
    A["main starts"] --> B["connect broker, declare core.events exchange"]
    B -->|success| C["log worker: broker connected, exchange declared"]
    B -->|throws| D["log warn: worker: broker not reachable at boot — will retry on every drain"]
    C --> E["start Cron drainCron with protect flag"]
    D --> E
    E --> F["for every scheduled tick call drainOutbox, errors logged by the tick wrapper"]
    F --> G["SIGINT or SIGTERM"]
    G --> H1["job stop"]
    H1 --> I1["broker close"]
    I1 --> I2["db destroy"]
```

- Cron schedule: `env.rabbit.drainCron` = `OUTBOX_DRAIN_CRON` (`.env` currently `* * * * * *` — every second).
- `protect: true` (Croner) — a tick that starts while the previous pass is still running is skipped.
- Caveat (verified behavior): if RabbitMQ is down at boot, `messageBroker.connect()` uses
  `amqp-connection-manager` and `waitForConnect()`, which **retries indefinitely and may
  hang silently instead of rejecting**. In that state neither the warn path nor the cron
  start is reached and the process prints nothing. See Known gaps (4.1).
- `drainOutbox` itself calls `messageBroker.connect().catch(() => {})` on every pass
  (`outbox-drain.ts:18`), so a stalled boot would self-heal only if cron had started.

---

## 4. The drain algorithm — `src/lib/events/outbox-drain.ts`

One cron tick = one pass over pending outbox rows. Safe to run from many worker
processes at once.

## 4.1. One drain pass

```mermaid
flowchart TD
    A["drainOutbox called by cron tick"] --> B["connect broker, failure swallowed"]
    B --> C["open knex transaction"]
    C --> D["claimBatch with FOR UPDATE SKIP LOCKED"]
    D --> E{"rows claimed empty?"}
    E -->|yes| F["commit, return, next tick"]
    E -->|no| G["iterate rows in id order"]
    G --> H["build wire envelope from row"]
    H --> I["publishConfirmed to core.events"]
    I -->|ack| J["markDispatched sets dispatched_at"]
    J --> K{"more rows in batch?"}
    K -->|yes| H
    I -->|rejects| L["markFailed bumps attempts, sets last_error"]
    L --> M["break out of the batch loop"]
    K -->|no| F2["commit transaction"]
    M --> F2
    C -.->|error thrown by claim or unexpected| X["rollback transaction"]
```

Why each piece exists:

- `FOR UPDATE SKIP LOCKED` (`outbox.repo.ts:32`): a claiming worker locks exactly the
  rows it fetched; a second worker skips those locked rows instead of waiting. N workers
  drain in parallel with zero duplicate publishes and zero stall.
- `ORDER BY id ASC`: FIFO in insertion order. Consequence: a permanently failing row at
  the head blocks everything behind it (no attempts ceiling — see 4.2).
- `break` on first publish failure (`outbox-drain.ts:49`): the broker is presumed sick;
  the remaining rows would fail too, so give up this pass quickly and reclaim on the next tick.
- `publishConfirmed` uses a **ConfirmChannel** — the promise resolves only when the
  broker acks, so a resolved publish means the broker owns the message (at-least-once).

## 4.2. Known gaps (as of this snapshot) — read before touching

Documented in place, not fixed silently (per repo documentation rules):

1. **Silent-hang risk at worker boot.** `waitForConnect()` never rejects on a down broker,
   so the `try/catch` around boot connect is unreachable in the outage case and cron never
   starts until the broker is reachable. Verify by running `npm run worker:dev` with
   RabbitMQ stopped — no output at all.
2. **No poison-row ceiling.** `markFailed` never transitions a row to a dead state; a bad
   payload will loop forever and (with `ORDER BY id ASC`) block later rows.
3. **One trx per row pair.** `markDispatched` is a single-row `UPDATE` per event and every
   row share one transaction with the claim. The code comment (`outbox-drain.ts:51`)
   already proposes bulk updates — **not yet implemented**, Undetermined whether intended
   to be part of the same trx.
4. **Post-ack crash window.** If the process dies between publishConfirmed resolving and
   the issue of `markDispatched`, the row stays pending and is redelivered next tick.
   Expected and handled by consumer-side dedup (order-service doc, section 5.3).
5. **No native HMAC or signature on published envelopes.** Broker access control and
   network isolation are the only integrity guarantee.

---

## 5. Wire envelope format

Built per row (`outbox-drain.ts:29`), serialized with `JSON.stringify`, sent with
`contentType: application/json` implicitly and persistent delivery by the client.

```json
{
    "eventId": "a1b2...-uuid",
    "eventType": "product.price.changed",
    "occurredAt": "2026-10-26T10:00:00.000Z",
    "aggregateType": "product_branch_details",
    "aggregateId": "12",
    "payload": { "...": "..." }
}
```

- `occurredAt` is the **drain time**, not the domain mutation time — a consumer must not
  treat it as the business timestamp.
- `payload` is whatever the emitting repository stored (JSONB, passed through untouched).
- Consumer-side envelope validation (`parseEnvelope`) only enforces `eventId` and
  `eventType`. Contract drift between sides is unprotected today.

---

## 6. End-to-end journey — one `product.price.changed`

```mermaid
sequenceDiagram
    participant API as product.service.ts
    participant DB as PostgreSQL events_outbox
    participant W as worker.ts drainOutbox
    participant MQ as RabbitMQ core.events

    API->>API: open trx, UPDATE product_branch_details SET price
    API->>DB: insertOutboxEvent, INSERT event_type product.price.changed
    API-->>API: trx commit, event is now durable
    W->>DB: claimBatch FOR UPDATE SKIP LOCKED ORDER BY id LIMIT batch
    DB-->>W: pending row with new event_id
    W->>MQ: publishConfirmed routingKey = event_type, confirm channel
    MQ-->>W: broker ack
    W->>DB: markDispatched sets dispatched_at, commit
    Note over W,MQ: consumer side continues in order-service docs
    W->>DB: on publish rejection markFailed attempts plus one, break
```

Timing expectation: end-to-end latency is bounded by the cron interval (currently ≤ 1 s
in dev `.env`) plus publish round-trip. With incremental cron in production, latency budget
is cron-driven, not event-driven.

---

## 7. Configuration (from `src/lib/config/env.ts` + `.env`)

| Env var | Default / current | Meaning |
| --- | --- | --- |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | Broker endpoint |
| `RABBITMQ_CORE_EVENTS_EXCHANGE` | `core.events` | Topic exchange, declared by worker |
| `OUTBOX_DRAIN_CRON` | `* * * * * *` | Croner tick schedule |
| `OUTBOX_BATCH_SIZE` | numeric env | Rows claimed per pass (`env.rabbit.batchSize`) |

The exchange is declared **twice** (worker boot via `declareExchange`, and also re-asserted
per pass implicitly by the client's channel setup behavior). Both declarations are
idempotent asserts, so either side restarting is safe.
