# Restaurant API Contract

**Module:** `src/app/restaurant`
**Router mount:** `routes.use("/restaurants", restaurantRouter)` — `src/routes.ts:26`
**Global prefix:** `app.use("/api", routes)` — `src/app.ts:19`

---

## Conventions

### Base URL

```
http://localhost:<PORT>/api/restaurants
```

### Authentication

Authenticated routes read the **`access_token` HTTP-only cookie**, not an `Authorization` header (`src/lib/auth/guard.ts:5`).

```http
Cookie: access_token=<jwt>
```

| Guard | Meaning |
|---|---|
| `authentication` | Valid `access_token` cookie required, else `403`. |
| `requireRestaurantMember('restaurantId')` | Caller's JWT `restaurantId` must equal `:restaurantId`, unless `system_admin`. |
| `rbac({ resource, action })` | `system_admin` bypasses; `restaurant_user` must hold `"<resource>:<action>"`; any other role is denied. |

### Response envelopes

This module does **not** use one envelope — each route's real shape is documented below. For reference, `sendSuccess` produces `{ "success": true, "data": ... }` and `sendPaginated` produces `{ "success": true, "data": [...], "meta": { ... } }` (`src/lib/http/response.ts`).

### Error shape

Every operational error is `{"error": "<message>"}`. Unknown/non-operational errors are `500 {"error": "Something went wrong"}` (`src/lib/error/errorHandler.ts`).

---

## Data model

### `Restaurant`

```json
{
  "id": 12,
  "ownerId": 4,
  "name": "Quick Bite",
  "logoURL": "https://cdn.quickbite.com/logo.png",
  "status": "active",
  "statusUpdatedAt": "2026-08-02T15:32:23.000Z",
  "primaryCountry": "EG",
  "createdAt": "2026-08-02T15:32:23.000Z",
  "updatedAt": "2026-08-02T15:32:23.000Z"
}
```

### `RestaurantStatus`

| Value | Meaning |
|---|---|
| `active` | Live. |
| `disabled` | Disabled by the owner. |
| `suspended` | Suspended by a system admin. |
| `pending` | Awaiting approval. |

Source: `src/app/restaurant/entity/enums.ts`.

---

## Endpoints

### `GET /restaurants`

List restaurants with cursor pagination. **Public** — no authentication.

#### Query parameters

Pagination (`src/lib/http/pagination/base-query.dto.ts`):

| Name | Type | Rules | Default |
|---|---|---|---|
| `cursor` | string | Opaque base64 `{ id, value }` from the previous page's `meta.nextCursor`. Malformed value → `400`. | — |
| `limit` | integer | `1`–`100`. | `20` |
| `sortBy` | enum | `createdAt`, `name`, `status`. | `createdAt` |
| `sortOrder` | enum | `asc`, `desc`. | `asc` |

Filters — allowlisted fields `id`, `status`, `name`, applied as `filter[<field>][<operator>]=<value>`:

| Field | Operators | Notes |
|---|---|---|
| `id` | `eq`, `gt`, `lt`, `gte`, `lte`, `in`, `nin`, `between`, `nbetween` | `in`/`nin`/`between`/`nbetween` take CSV. `between`/`nbetween` need exactly 2 values. |
| `status` | `eq`, `in`, `nin` | Must be a valid `RestaurantStatus`. CSV for `in`/`nin`. |
| `name` | `eq`, `like`, `nlike`, `in`, `nin` | CSV for `in`/`nin`. |

All query input is parsed, cast and validated by `ListRestaurantsQueryDTO` in the controller *before* the service is reached (`src/app/restaurant/dto/restaurant.query.dto.ts`, `controller/restaurant.controller.ts:36`).

#### Request

```http
GET /api/restaurants?limit=25&sortBy=name&sortOrder=asc&filter[status][eq]=active&filter[id][in]=1,2,3
```

#### Response `200`

```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "ownerId": 4,
      "name": "Quick Bite",
      "logoURL": "https://cdn.quickbite.com/logo.png",
      "status": "active",
      "statusUpdatedAt": "2026-08-02T15:32:23.000Z",
      "primaryCountry": "EG",
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-02T15:32:23.000Z"
    },
    {
      "id": 13,
      "ownerId": 9,
      "name": "Nile Grill",
      "logoURL": "",
      "status": "pending",
      "statusUpdatedAt": "2026-08-03T09:10:00.000Z",
      "primaryCountry": "EG",
      "createdAt": "2026-08-03T09:10:00.000Z",
      "updatedAt": "2026-08-03T09:10:00.000Z"
    }
  ],
  "meta": {
    "nextCursor": "eyJpZCI6MTMsInZhbHVlIjoiTmlsZSBHcmlsbCJ9",
    "hasMore": true,
    "count": 25
  }
}
```

| Meta field | Type | Meaning |
|---|---|---|
| `nextCursor` | string \| null | Pass back as `cursor` to get the next page. `null` on the last page. |
| `hasMore` | boolean | Whether another page exists. |
| `count` | integer | Rows in this page. |

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Invalid `limit`, `sortBy`, `sortOrder`, filter field/operator, or malformed `cursor`. |

---

### `GET /restaurants/:restaurantId`

Fetch one restaurant. **Public**.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | Cast with `Number(...)`; a non-numeric value simply matches nothing → `404`. |

#### Request

```http
GET /api/restaurants/12
```

#### Response `200`

```json
{
  "success": true,
  "data": {
    "id": 12,
    "ownerId": 4,
    "name": "Quick Bite",
    "logoURL": "https://cdn.quickbite.com/logo.png",
    "status": "active",
    "statusUpdatedAt": "2026-08-02T15:32:23.000Z",
    "primaryCountry": "EG",
    "createdAt": "2026-08-02T15:32:23.000Z",
    "updatedAt": "2026-08-02T15:32:23.000Z"
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `404` | `{"error": "restaurant not found"}` | No restaurant with that id. |

---

### `POST /restaurants`

Create a restaurant together with its owner account. Requires authentication; **only `system_admin` may proceed** (checked in the service, `service/restaurant.service.ts`).

#### Request body — `CreateRestaurantDTO`

```json
{
  "owner": {
    "email": "owner@quickbite.com",
    "phone": "01000000000",
    "name": "Ahmed Ali",
    "password": "Str0ng!Pass"
  },
  "name": "Quick Bite",
  "logoUrl": "https://cdn.quickbite.com/logo.png",
  "primaryCountry": "EG"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `owner` | object | yes | Nested `CreateRestaurantOwnerDTO`, validated. |
| `owner.email` | string | yes | `@IsEmail()` |
| `owner.phone` | string | yes | Length 10–11. |
| `owner.name` | string | yes | Min length 1. |
| `owner.password` | string | yes | `@IsStrongPassword` — min 8 chars, 1 lowercase, 1 uppercase, 1 number, 1 symbol. |
| `name` | string | yes | Non-empty. |
| `logoUrl` | string | no | Stored as `logoURL` in the entity. |
| `primaryCountry` | string | yes | Non-empty. |

#### Response `201`

```json
{
  "data": {
    "restaurant": {
      "id": 12,
      "ownerId": 41,
      "name": "Quick Bite",
      "logoURL": "https://cdn.quickbite.com/logo.png",
      "status": "active",
      "statusUpdatedAt": "2026-08-02T15:32:23.000Z",
      "primaryCountry": "EG",
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-02T15:32:23.000Z"
    },
    "owner": {
      "id": 41,
      "email": "owner@quickbite.com",
      "phone": "01000000000",
      "name": "Ahmed Ali",
      "systemRole": "restaurant_user"
    }
  }
}
```

> This route responds with a raw `{ "data": ... }` body — no `success` key (`controller/restaurant.controller.ts:19`).

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `403` | `{"error": "User not authenicated"}` | Missing/invalid `access_token` cookie. |
| `401` | `{"error": "User not authorised"}` | Caller is not `system_admin`. |

---

### `PATCH /restaurants/:restaurantId`

Update restaurant profile fields. Requires authentication + membership in the restaurant + permission `core:restaurant:update`.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | Membership is checked against this value. |

#### Request body — `UpdateRestaurantDTO`

All fields optional.

```json
{
  "name": "Quick Bite — Zamalek",
  "logoURL": "https://cdn.quickbite.com/logo-new.png",
  "primaryCountry": "EG"
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | Optional, max 255. |
| `logoURL` | string | Optional, max 500. Note the capital `URL` here. |
| `primaryCountry` | string | Optional, max 100. |

#### Response `200`

```json
{
  "message": "restaurant updated",
  "resraurant": {
    "restaurant": {
      "id": 12,
      "ownerId": 4,
      "name": "Quick Bite — Zamalek",
      "logoURL": "https://cdn.quickbite.com/logo-new.png",
      "status": "active",
      "statusUpdatedAt": "2026-08-02T15:32:23.000Z",
      "primaryCountry": "EG",
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-05T11:02:00.000Z"
    }
  }
}
```

> The key `resraurant` is misspelled **in the source** (`controller/restaurant.controller.ts:53`) and is part of the wire contract until it is fixed.

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `400` | `{"error": "Invalid or missing restaurant ID parameter"}` | `:restaurantId` is missing or non-numeric. |
| `403` | `{"error": "User not authenicated"}` | Missing/invalid `access_token` cookie. |
| `403` | `{"error": "Permission denied: Access to this restaurant is restricted"}` | Caller belongs to a different restaurant. |
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:restaurant:update`. |
| `404` | `{"error": "restaurant not found"}` | No restaurant with that id. |

---

### `PATCH /restaurants/:restaurantId/status`

Change restaurant status. Requires authentication; **only `system_admin` may proceed** (checked in the service).

#### Request body — `UpdateRestaurantStatusDTO`

```json
{
  "status": "suspended"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `status` | enum | yes | One of `active`, `disabled`, `suspended`, `pending`. |

#### Response `200`

Only a projection is returned — not the full entity.

```json
{
  "message": "restaurant status updated",
  "restaurant": {
    "id": 12,
    "name": "Quick Bite",
    "status": "suspended"
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | `status` missing or not a `RestaurantStatus`. |
| `403` | `{"error": "User not authenicated"}` | Missing/invalid `access_token` cookie. |
| `401` | `{"error": "User not authorised"}` | Caller is not `system_admin`. |
| `404` | `{"error": "restaurant not found"}` | No restaurant with that id. |

---

## Quick reference

| Method | Path | Auth | Success |
|---|---|---|---|
| `GET` | `/restaurants` | Public | `200` paginated |
| `GET` | `/restaurants/:restaurantId` | Public | `200` |
| `POST` | `/restaurants` | `system_admin` | `201` |
| `PATCH` | `/restaurants/:restaurantId` | Member + `core:restaurant:update` | `200` |
| `PATCH` | `/restaurants/:restaurantId/status` | `system_admin` | `200` |