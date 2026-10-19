# Customer Address API Contract

**Module:** `src/app/customer-address`
**Router mount:** `routes.use("/customer/addresses", customerAddressRouter)` — `src/routes.ts:23`
**Global prefix:** `app.use("/api", routes)` — `src/app.ts:19`

---

## Conventions

### Base URL

```
http://localhost:<PORT>/api/customer/addresses
```

### Authentication

| Route group | Mechanism |
|---|---|
| `/`, `/:addressId` | `access_token` HTTP-only cookie (`src/lib/auth/guard.ts:5`) |
| `/internal/:id` | `api-key: <INTERNAL_API_KEY>` header (`src/lib/auth/api-key.ts:4`) |

There is **no** RBAC or branch/branch-access guard on this module — a customer only ever sees their own addresses.

```http
Cookie: access_token=<jwt>
```

### Response envelopes

Four distinct shapes are used, each documented per endpoint below:

| Style | Used by |
|---|---|
| `{ "data": [...] }` | `GET /` |
| `{ "message": "...", "address": {...} }` | `POST`, `PATCH` |
| `{ "message": "..." }` | `DELETE` |
| `{ "success": true, "data": {...} }` | `GET /internal/:id` |

### Error shape

```json
{ "error": "<message>" }
```

### No pagination

`GET /` accepts and ignores all query parameters — it returns the user's entire address list, unbounded.

---

## Data model

### `AddressType`

| Value |
|---|
| `home` |
| `office` |
| `public_place` |

Source: `src/app/customer-address/entity/enums.ts`.

### `CustomerAddress` — write/read shape (11 keys)

```json
{
  "id": 7,
  "label": "Home",
  "country": "EG",
  "city": "Cairo",
  "street": "Tahrir St",
  "building": "B",
  "apartmentNumber": "4",
  "type": "home",
  "lat": 30.0444194,
  "lng": 31.2357597,
  "isDefault": true
}
```

### `CustomerAddress` — list shape (14 keys)

`GET /` returns the **raw entity**, which additionally includes `userId`, `createdAt` and `updatedAt`:

```json
{
  "id": 7,
  "userId": 41,
  "label": "Home",
  "country": "EG",
  "city": "Cairo",
  "street": "Tahrir St",
  "building": "B",
  "apartmentNumber": "4",
  "type": "home",
  "lat": 30.0444194,
  "lng": 31.2357597,
  "isDefault": true,
  "createdAt": "2026-08-02T15:32:23.000Z",
  "updatedAt": "2026-08-02T15:32:23.000Z"
}
```

---

## Endpoints

### `GET /customer/addresses/`

List every address belonging to the authenticated user.

#### Request

```http
GET /api/customer/addresses/
Cookie: access_token=<jwt>
```

#### Response `200`

No `success` key — this route uses a raw `{ "data": ... }` body.

```json
{
  "data": [
    {
      "id": 7,
      "userId": 41,
      "label": "Home",
      "country": "EG",
      "city": "Cairo",
      "street": "Tahrir St",
      "building": "B",
      "apartmentNumber": "4",
      "type": "home",
      "lat": 30.0444194,
      "lng": 31.2357597,
      "isDefault": true,
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-02T15:32:23.000Z"
    },
    {
      "id": 8,
      "userId": 41,
      "label": "Work",
      "country": "EG",
      "city": "Giza",
      "street": "Mohandessin St",
      "building": "",
      "apartmentNumber": "",
      "type": "office",
      "lat": 30.0429110,
      "lng": 31.2395000,
      "isDefault": false,
      "createdAt": "2026-08-04T08:10:00.000Z",
      "updatedAt": "2026-08-04T08:10:00.000Z"
    }
  ]
}
```

Empty account returns:

```json
{
  "data": []
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |

---

### `POST /customer/addresses/`

Create an address. When `isDefault` is `true`, all of the user's other addresses are demoted to `isDefault: false` first.

#### Request body — `createAddressDTO`

```json
{
  "label": "Home",
  "country": "EG",
  "city": "Cairo",
  "street": "Tahrir St",
  "building": "B",
  "apartmentNumber": "4",
  "type": "home",
  "lat": 30.0444194,
  "lng": 31.2357597,
  "isDefault": true
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `label` | string | yes | Non-empty, max 100. |
| `country` | string | yes | Non-empty, max 15. |
| `city` | string | yes | Non-empty, max 100. |
| `street` | string | yes | Non-empty, max 255. |
| `building` | string | no | Max 50. |
| `apartmentNumber` | string | no | Max 50. |
| `type` | enum | yes | `home`, `office`, `public_place`. |
| `lat` | number | yes | `@IsLatitude()` — must be a real JSON **number**. |
| `lng` | number | yes | `@IsLongitude()` — must be a real JSON **number**. |
| `isDefault` | boolean | yes | Must be a real JSON **boolean**. |

> Body DTOs are validated without implicit type conversion, so sending `"lat": "30.04"` or `"isDefault": "true"` (strings) fails validation.

#### Response `201`

```json
{
  "message": "Address added",
  "address": {
    "id": 7,
    "label": "Home",
    "country": "EG",
    "city": "Cairo",
    "street": "Tahrir St",
    "building": "B",
    "apartmentNumber": "4",
    "type": "home",
    "lat": 30.0444194,
    "lng": 31.2357597,
    "isDefault": true
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |

---

### `PATCH /customer/addresses/:addressId`

Partially update one of the caller's addresses.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `addressId` | integer | Cast with `Number(...)`; not validated beyond that. |

#### Request body — `UpdateAddressDTO`

All fields optional. An empty body `{}` is accepted and performs no change.

```json
{
  "label": "Home (updated)",
  "apartmentNumber": "9",
  "isDefault": true
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `label` | string | no | Non-empty, max 100. |
| `country` | string | no | Non-empty, max 15. |
| `city` | string | no | Non-empty, max 100. |
| `street` | string | no | Non-empty, max 255. |
| `building` | string | no | Max 50. |
| `apartmentNumber` | string | no | Max 50. |
| `type` | enum | no | `home`, `office`, `public_place`. |
| `lat` | number | no | `@IsLatitude()`. |
| `lng` | number | no | `@IsLongitude()`. |
| `isDefault` | boolean | no | Must be a real JSON boolean. |

#### Response `200`

```json
{
  "message": "Address updated",
  "address": {
    "id": 7,
    "label": "Home (updated)",
    "country": "EG",
    "city": "Cairo",
    "street": "Tahrir St",
    "building": "B",
    "apartmentNumber": "9",
    "type": "home",
    "lat": 30.0444194,
    "lng": 31.2357597,
    "isDefault": true
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `404` | `{"error": "Address not found"}` | No address with that id owned by the caller. |

---

### `DELETE /customer/addresses/:addressId`

Permanently delete one of the caller's addresses. This is a hard delete, not a soft delete.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `addressId` | integer | Must belong to the caller. |

#### Request

```http
DELETE /api/customer/addresses/7
Cookie: access_token=<jwt>
```

#### Response `200`

```json
{
  "message": "Address deleted"
}
```

No id is echoed back.

#### Errors

| Status | Body | When |
|---|---|---|
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `404` | `{"error": "Address not found"}` | No address with that id owned by the caller. |

---

### `GET /customer/addresses/internal/:id`

**Internal / service-to-service.** Fetch a single address by id regardless of owner.

> Param name here is `:id`, not `:addressId`.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `id` | integer | Address id. |

#### Request

```http
GET /api/customer/addresses/internal/7
api-key: <INTERNAL_API_KEY>
```

#### Response `200`

This route uses the `sendSuccess` envelope — the only one in the module that does.

```json
{
  "success": true,
  "data": {
    "id": 7,
    "userId": 41,
    "label": "Home",
    "country": "EG",
    "city": "Cairo",
    "street": "Tahrir St",
    "building": "B",
    "apartmentNumber": "4",
    "lat": 30.0444194,
    "lng": 31.2357597
  }
}
```

> This projection deliberately **omits** `type` and `isDefault`.

#### Errors

| Status | Body | When |
|---|---|---|
| `500` | `{"error": "Internal api key not configured"}` | `INTERNAL_API_KEY` is unset on the server. |
| `401` | `{"error": "Invalid api key"}` | `api-key` header does not match. |
| `404` | `{"error": "Address not found"}` | No address with that id. |

---

## Quick reference

| Method | Path | Auth | Success |
|---|---|---|---|
| `GET` | `/customer/addresses/` | `access_token` cookie | `200` |
| `POST` | `/customer/addresses/` | `access_token` cookie | `201` |
| `PATCH` | `/customer/addresses/:addressId` | `access_token` cookie | `200` |
| `DELETE` | `/customer/addresses/:addressId` | `access_token` cookie | `200` |
| `GET` | `/customer/addresses/internal/:id` | `api-key` header | `200` |