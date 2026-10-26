# Health API Contract

**Module:** `src/app/health`
**Router mount:** `routes.use("/health", healthRouter)` — `src/routes.ts:14`
**Global prefix:** `app.use("/api", routes)` — `src/app.ts:19`

---

## Conventions

### Base URL

```
http://localhost:<PORT>/api/health
```

### Authentication

None. This endpoint is intentionally open for load balancers and uptime probes.

---

## Endpoints

### `GET /health`

Liveness/readiness probe. Runs `SELECT 1` against PostgreSQL; returns `200` only if the database answers.

#### Request

No body, no query parameters, no headers.

```http
GET /api/health
```

#### Response `200`

The body is a **plain-text string**, not JSON — the handler uses `res.send("OK")`.

```text
OK
```

| Property | Value |
|---|---|
| `Content-Type` | `text/html; charset=utf-8` |
| Body | `OK` |

#### Response `500`

Sent when the database ping throws. Unlike every other endpoint, the failure body uses the key **`message`**, not `error`.

```json
{
  "message": "Database connection failed"
}
```

---

## Quick reference

| Method | Path | Auth | Success | Failure |
|---|---|---|---|---|
| `GET` | `/health` | Public | `200` text `OK` | `500 {"message": "Database connection failed"}` |