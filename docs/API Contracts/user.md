# User API Contract

**Module:** `src/app/user`
**Router mount:** `routes.use("/user", userRouter)` — `src/routes.ts:20`
**Global prefix:** `app.use("/api", routes)` — `src/app.ts:19`

---

## Conventions

### Base URL

```
http://localhost:<PORT>/api/user
```

### Authentication

`/user/me` routes read the **`access_token` HTTP-only cookie** (`src/lib/auth/guard.ts:5`).

```http
Cookie: access_token=<jwt>
```

`GET /user/internal/agents/:id` is service-to-service and authenticates with a static key header instead:

```http
api-key: <INTERNAL_API_KEY>
```

### Response envelopes

This module returns **three different shapes** — each is documented per endpoint:

| Style | Used by |
|---|---|
| Bare object | `GET /user/me`, `PATCH /user/me` |
| `{ "success": true, "data": ... }` | `GET /user/internal/agents/:id` |
| `{ "message", ... }` | `PATCH /user/me` |

### Error shape

```json
{ "error": "<message>" }
```

---

## Data model

### `User` (public projection)

```json
{
  "id": 41,
  "email": "ahmed@example.com",
  "phone": "01000000000",
  "name": "Ahmed Ali",
  "systemRole": "customer",
  "createdAt": "2026-08-02T15:32:23.000Z",
  "updatedAt": "2026-08-02T15:32:23.000Z"
}
```

`passwordHash` and `deletedAt` are never exposed.

### `SystemRole`

| Value |
|---|
| `customer` |
| `restaurant_user` |
| `system_admin` |
| `delivery_agent` |

---

## Endpoints

### `GET /user/me`

Fetch the authenticated user's own profile.

#### Request

No body, no query parameters.

```http
GET /api/user/me
Cookie: access_token=<jwt>
```

#### Response `200`

The profile object is returned **unwrapped** — there is no `success` or `data` key (`controller/user.controller.ts:16`).

```json
{
  "id": 41,
  "email": "ahmed@example.com",
  "phone": "01000000000",
  "name": "Ahmed Ali",
  "systemRole": "customer",
  "createdAt": "2026-08-02T15:32:23.000Z",
  "updatedAt": "2026-08-02T15:32:23.000Z"
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `404` | `{"error": "User not found"}` | User id in the token no longer resolves (soft-deleted). |

---

### `PATCH /user/me`

Update the authenticated user's own profile.

#### Request body — `UpdateUserDTO`

All fields optional; send at least one.

```json
{
  "name": "Ahmed Ali",
  "phone": "01000000001"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | no | Optional, min length 1. |
| `phone` | string | no | Optional, length 10–11. |

#### Response `200`

```json
{
  "message": "Profile updated",
  "user": {
    "id": 41,
    "email": "ahmed@example.com",
    "phone": "01000000001",
    "name": "Ahmed Ali",
    "systemRole": "customer",
    "createdAt": "2026-08-02T15:32:23.000Z",
    "updatedAt": "2026-08-05T11:02:00.000Z"
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `401` | `{"error": "Phone Already in use"}` | The new phone belongs to another account. |
| `404` | `{"error": "User not found"}` | User id in the token no longer resolves. |

---

### `GET /user/internal/agents/:id`

**Internal / service-to-service.** Fetch a delivery agent's minimal contact card.

> Note the path: because the module is mounted at `/user`, this endpoint is `/api/user/internal/agents/:id`.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `id` | integer | User id of the delivery agent. |

#### Request

```http
GET /api/user/internal/agents/77
api-key: <INTERNAL_API_KEY>
```

#### Response `200`

```json
{
  "success": true,
  "data": {
    "id": 77,
    "name": "Mahmoud Hassan",
    "phone": "01000000002"
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `500` | `{"error": "Internal api key not configured"}` | `INTERNAL_API_KEY` is unset on the server. |
| `401` | `{"error": "Invalid api key"}` | `api-key` header does not match. |
| `404` | `{"error": "User not found"}` | No such user, **or** the user is not a `delivery_agent` (deliberate, to prevent enumerating other user types). |

---

## Quick reference

| Method | Path | Auth | Success |
|---|---|---|---|
| `GET` | `/user/me` | `access_token` cookie | `200` |
| `PATCH` | `/user/me` | `access_token` cookie | `200` |
| `GET` | `/user/internal/agents/:id` | `api-key` header | `200` |