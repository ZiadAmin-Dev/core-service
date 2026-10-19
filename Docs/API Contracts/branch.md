# Branch API Contract

**Module:** `src/app/branch`
**Router mount:** `routes.use("/", branchRouter)` — `src/routes.ts:27`
**Global prefix:** `app.use("/api", routes)` — `src/app.ts:19`

Because the router mounts at `/`, branch paths live alongside the other root-level routers.

---

## Conventions

### Base URL

```
http://localhost:<PORT>/api
```

### Authentication

| Guard | Meaning |
|---|---|
| `authentication` | Valid `access_token` cookie required, else `403`. |
| `requireRestaurantMember('restaurantId')` | Caller's JWT `restaurantId` must equal `:restaurantId`, unless `system_admin`. |
| `requireBranchAccess('branchId')` | Caller must be `system_admin`, the restaurant `owner`, or have `:branchId` in their `branchIds` claim. |
| `rbac({ resource, action })` | `system_admin` bypasses; `restaurant_user` must hold `"<resource>:<action>"`; any other role denied. |
| `withCache(ttl)` | Response cached for `ttl` seconds; adds an `X-Cache: HIT` / `X-Cache: MISS` header. |
| `requireInternalApiKey` | `api-key: <INTERNAL_API_KEY>` header. |

```http
Cookie: access_token=<jwt>
```

### Response envelopes

| Style | Used by |
|---|---|
| `{ "data": [...] }` | list endpoints |
| `{ "message": "...", "branch": {...} }` | `POST`, `PATCH`, `PATCH /status` |
| `{ "success": true, "data": {...} }` | `GET /internal/branches/:id` |

### Error shape

```json
{ "error": "<message>" }
```

---

## Data model

### `Branch`

```json
{
  "id": 3,
  "restaurantId": 12,
  "countryCode": "EG",
  "addressText": "15 Tahrir St, Zamalek",
  "label": "Zamalek",
  "lat": 30.0444194,
  "lng": 31.2357597,
  "isActive": true,
  "opensAt": "09:00",
  "closesAt": "23:00",
  "acceptOrders": true,
  "createdAt": "2026-08-02T15:32:23.000Z",
  "updatedAt": "2026-08-02T15:32:23.000Z",
  "deliveryRadius": 5,
  "deliveryFee": 0,
  "currency": "EGP",
  "commission": 0
}
```

> `deliveryFee` is always `0` — no `delivery_fee` column is selected by the repository, so the entity default applies.

### `Currency`

| Value |
|---|
| `EGP` |
| `SAR` |

### `NearbyBranch` (reduced projection)

```json
{
  "id": 3,
  "restaurantId": 12,
  "addressText": "15 Tahrir St, Zamalek",
  "label": "Zamalek",
  "lat": 30.0444194,
  "lng": 31.2357597,
  "isActive": true,
  "acceptOrders": true,
  "currency": "EGP"
}
```

---

## Endpoints

### `GET /branches/nearby`

Find active branches within each branch's own delivery radius. Cached for **1 hour**.

#### Query parameters

| Name | Type | Required | Notes |
|---|---|---|---|
| `lat` | number | yes | Latitude of the search point. Cast with `Number(...)`; not validated. |
| `lng` | number | yes | Longitude of the search point. Cast with `Number(...)`; not validated. |

#### Request

```http
GET /api/branches/nearby?lat=30.0444&lng=31.2357
```

Response header on every call:

```http
X-Cache: MISS
```

#### Response `200`

```json
{
  "data": [
    {
      "id": 3,
      "restaurantId": 12,
      "addressText": "15 Tahrir St, Zamalek",
      "label": "Zamalek",
      "lat": 30.0444194,
      "lng": 31.2357597,
      "isActive": true,
      "acceptOrders": true,
      "currency": "EGP"
    }
  ]
}
```

Only branches with `is_active = true` whose parent restaurant is `active` are returned.

#### Errors

| Status | Body | When |
|---|---|---|
| `500` | `{"error": "Something went wrong"}` | Invalid `lat`/`lng` propagate as `NaN` into the geo query, or any unexpected failure. There is no input validation on this route. |

---

### `GET /restaurants/:restaurantId/branches`

List the **active** branches of a restaurant. **Public.**

> Implementation note: two routes are registered on this exact method + path; Express matches the first, so only the active-only variant is reachable.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | Cast with `Number(...)`. |

#### Request

```http
GET /api/restaurants/12/branches
```

#### Response `200`

```json
{
  "data": [
    {
      "id": 3,
      "restaurantId": 12,
      "countryCode": "EG",
      "addressText": "15 Tahrir St, Zamalek",
      "label": "Zamalek",
      "lat": 30.0444194,
      "lng": 31.2357597,
      "isActive": true,
      "opensAt": "09:00",
      "closesAt": "23:00",
      "acceptOrders": true,
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-02T15:32:23.000Z",
      "deliveryRadius": 5,
      "deliveryFee": 0,
      "currency": "EGP",
      "commission": 0
    }
  ]
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `500` | `{"error": "Something went wrong"}` | Unexpected failure only; no guards on this route. |

---

### `POST /restaurants/:restaurantId/branches`

Create a branch. Requires authentication, restaurant membership, and permission `core:branch:create`.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | `parseInt`-validated by `requireRestaurantMember`. |

#### Request body — `CreateBranchDTO`

```json
{
  "countryCode": "EG",
  "addressText": "15 Tahrir St, Zamalek",
  "label": "Zamalek",
  "lat": 30.0444194,
  "lng": 31.2357597,
  "opensAt": "09:00",
  "closesAt": "23:00",
  "deliveryRadius": 5,
  "currency": "EGP"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `countryCode` | string | yes | Non-empty. |
| `addressText` | string | yes | Non-empty. |
| `label` | string | yes | Non-empty. |
| `lat` | number | yes | `@IsNumber()`. |
| `lng` | number | yes | `@IsNumber()`. |
| `opensAt` | string | yes | Non-empty. |
| `closesAt` | string | yes | Non-empty. |
| `deliveryRadius` | number | yes | Integer, min 0 (kilometres). |
| `currency` | enum | yes | `EGP` or `SAR`. |

Server-set defaults: `isActive: false`, `acceptOrders: true`, `commission: 0`.

#### Response `201`

```json
{
  "message": "Branch Added Successfully",
  "branch": {
    "id": 3,
    "restaurantId": 12,
    "countryCode": "EG",
    "addressText": "15 Tahrir St, Zamalek",
    "label": "Zamalek",
    "lat": 30.0444194,
    "lng": 31.2357597,
    "isActive": false,
    "opensAt": "09:00",
    "closesAt": "23:00",
    "acceptOrders": true,
    "createdAt": "2026-08-02T15:32:23.000Z",
    "updatedAt": "2026-08-02T15:32:23.000Z",
    "deliveryRadius": 5,
    "deliveryFee": 0,
    "currency": "EGP",
    "commission": 0
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `400` | `{"error": "Invalid or missing restaurant ID parameter"}` | `:restaurantId` is missing or non-numeric. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `403` | `{"error": "Permission denied: Access to this restaurant is restricted"}` | Caller belongs to a different restaurant. |
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:branch:create`. |
| `401` | `{"error": "User not authorised"}` | Caller is neither `system_admin` nor the restaurant owner. |
| `404` | `{"error": "restaurant not found"}` | No restaurant with that id. |

---

### `PATCH /branches/:branchId`

Update a branch. Requires authentication, branch access, and permission `core:branch:update`.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `branchId` | integer | Also read from `?branchId=` if absent from the path. |

#### Request body — `UpdateBranchDTO`

All fields optional.

```json
{
  "label": "Zamalek Main",
  "addressText": "17 Tahrir St, Zamalek",
  "lat": 30.0445000,
  "lng": 31.2360000,
  "opensAt": "10:00",
  "closesAt": "00:00",
  "deliveryRadius": 7,
  "currency": "EGP",
  "acceptOrders": false
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `label` | string | no | String. |
| `addressText` | string | no | String. |
| `lat` | number | no | `@IsNumber()`. |
| `lng` | number | no | `@IsNumber()`. |
| `opensAt` | string | no | String. |
| `closesAt` | string | no | String. |
| `deliveryRadius` | number | no | `@IsNumber()` (no minimum, unlike create). |
| `currency` | enum | no | `EGP` or `SAR`. |
| `acceptOrders` | boolean | no | `@IsBoolean()`. |

`isActive` and `commission` are **not** updatable here — use `PATCH /branches/:branchId/status`.

#### Response `200`

```json
{
  "message": "Branch Updated Successfully",
  "branch": {
    "id": 3,
    "restaurantId": 12,
    "countryCode": "EG",
    "addressText": "17 Tahrir St, Zamalek",
    "label": "Zamalek Main",
    "lat": 30.0445000,
    "lng": 31.2360000,
    "isActive": true,
    "opensAt": "10:00",
    "closesAt": "00:00",
    "acceptOrders": false,
    "createdAt": "2026-08-02T15:32:23.000Z",
    "updatedAt": "2026-08-05T11:02:00.000Z",
    "deliveryRadius": 7,
    "deliveryFee": 0,
    "currency": "EGP",
    "commission": 0
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `403` | `{"error": "Permission denied: Access to this branch is restricted"}` | Caller has no access to `:branchId`. |
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:branch:update`. |
| `401` | `{"error": "User not authorised"}` | Caller is neither `system_admin` nor the restaurant owner. |
| `404` | `{"error": "branch not found"}` | No branch with that id. |
| `404` | `{"error": "restaurant not found"}` | Parent restaurant no longer exists. |

---

### `PATCH /branches/:branchId/status`

Toggle branch activity, order acceptance, or commission. Requires authentication; **only `system_admin` may proceed** (checked in the service).

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `branchId` | integer | |

#### Request body — `UpdateBranchStatusDTO`

```json
{
  "isActive": true,
  "commission": 12.5
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `isActive` | boolean | no | `@IsBoolean()`. |
| `commission` | number | no | `@IsNumber()`, no min/max. |

#### Response `200`

A reduced projection is returned, not the full entity.

```json
{
  "message": "Branch status updated successfully",
  "branch": {
    "id": 3,
    "isActive": true,
    "acceptOrders": true,
    "commission": 12.5
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `401` | `{"error": "User not authorised"}` | Caller is not `system_admin`. |
| `404` | `{"error": "branch not found"}` | No branch with that id. |

---

### `GET /internal/branches/:id`

**Internal / service-to-service.** Fetch a branch together with its restaurant's status.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `id` | integer | Branch id. |

#### Request

```http
GET /api/internal/branches/3
api-key: <INTERNAL_API_KEY>
```

#### Response `200`

```json
{
  "success": true,
  "data": {
    "id": 3,
    "restaurantId": 12,
    "restaurantStatus": "active",
    "region": "EG",
    "isActive": true,
    "acceptOrders": true,
    "deliveryFee": 0,
    "commissionBps": 1250,
    "currency": "EGP",
    "lat": 30.0444194,
    "lng": 31.2357597,
    "name": "Zamalek",
    "addressText": "15 Tahrir St, Zamalek"
  }
}
```

> Field names are remapped relative to the entity: `region` = `countryCode`, `name` = `label`, `commissionBps` = `commission`. `restaurantStatus` falls back to the literal `"unknown"` if the restaurant cannot be read.

#### Errors

| Status | Body | When |
|---|---|---|
| `500` | `{"error": "Internal api key not configured"}` | `INTERNAL_API_KEY` is unset on the server. |
| `401` | `{"error": "Invalid api key"}` | `api-key` header does not match. |
| `404` | `{"error": "branch not found"}` | No branch with that id. |

---

## Quick reference

| Method | Path | Auth | Success |
|---|---|---|---|
| `GET` | `/branches/nearby` | Public (cached 1h) | `200` |
| `GET` | `/restaurants/:restaurantId/branches` | Public | `200` |
| `POST` | `/restaurants/:restaurantId/branches` | Member + `core:branch:create` | `201` |
| `PATCH` | `/branches/:branchId` | Branch access + `core:branch:update` | `200` |
| `PATCH` | `/branches/:branchId/status` | `system_admin` | `200` |
| `GET` | `/internal/branches/:id` | `api-key` header | `200` |