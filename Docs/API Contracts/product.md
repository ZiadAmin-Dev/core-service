# Product API Contract

**Module:** `src/app/product`
**Router mount:** `routes.use("/", productRouter)` — `src/routes.ts:30`
**Global prefix:** `app.use("/api", routes)` — `src/app.ts:19`

Because the router mounts at `/`, product paths live alongside the other root-level routers.

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
| `requireBranchAccess('branchId')` | Caller must be `system_admin`, the restaurant `owner`, or have `:branchId` in their `branchIds` claim. On `PATCH /products/:id` there is no path branch id, so it reads **`?branchId=`**. |
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
| Bare object (no envelope) | `GET /products/:id` |
| `{ "message": "...", "product": {...} }` | `POST`, `PATCH` |
| `{ "success": true, "data": ... }` | internal endpoints |

### Error shape

```json
{ "error": "<message>" }
```

---

## Data model

### `Product`

```json
{
  "id": 55,
  "name": "Cheeseburger",
  "description": "Double patty with cheddar",
  "imageUrl": "https://cdn.quickbite.com/burger.png",
  "restaurantId": 12,
  "categoryId": 4,
  "createdAt": "2026-08-02T15:32:23.000Z",
  "updatedAt": "2026-08-02T15:32:23.000Z",
  "deletedAt": null
}
```

### `ProductCategory`

```json
{
  "id": 4,
  "restaurantId": 12,
  "name": "Burgers",
  "createdAt": "2026-08-02T15:32:23.000Z",
  "updatedAt": "2026-08-02T15:32:23.000Z"
}
```

### `BranchProduct` (branch menu view)

```json
{
  "id": 55,
  "name": "Cheeseburger",
  "description": "Double patty with cheddar",
  "imageURL": "https://cdn.quickbite.com/burger.png",
  "restaurantId": 12,
  "categoryId": 4,
  "categoryName": "Burgers",
  "price": 120,
  "stock": 40,
  "isAvailable": true
}
```

> Note the key `imageURL` (capital `URL`) here, versus `imageUrl` everywhere else in this module. `categoryName` is `null` when the product has no category.

### `ProductBranchDetails` (branch-level override)

```json
{
  "id": 210,
  "branchId": 3,
  "productId": 55,
  "price": 130,
  "stock": 25,
  "isAvailable": true
}
```

---

## Endpoints

### `GET /restaurants/:restaurantId/categories`

List a restaurant's product categories. **Public.**

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | Cast with `Number(...)`. |

#### Request

```http
GET /api/restaurants/12/categories
```

#### Response `200`

```json
{
  "data": [
    {
      "id": 4,
      "restaurantId": 12,
      "name": "Burgers",
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-02T15:32:23.000Z"
    },
    {
      "id": 5,
      "restaurantId": 12,
      "name": "Drinks",
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-02T15:32:23.000Z"
    }
  ]
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `500` | `{"error": "Something went wrong"}` | Unexpected failure; no guards on this route. |

---

### `GET /branches/:branchId/products`

List the branch's menu (products joined with branch-level price/stock). **Public.**

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `branchId` | integer | Cast with `Number(...)`. |

#### Request

```http
GET /api/branches/3/products
```

#### Response `200`

```json
{
  "data": [
    {
      "id": 55,
      "name": "Cheeseburger",
      "description": "Double patty with cheddar",
      "imageURL": "https://cdn.quickbite.com/burger.png",
      "restaurantId": 12,
      "categoryId": 4,
      "categoryName": "Burgers",
      "price": 120,
      "stock": 40,
      "isAvailable": true
    }
  ]
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `500` | `{"error": "Something went wrong"}` | Unexpected failure; no guards on this route. |

---

### `GET /products/:id`

Fetch a single product. **Public.** The entity is returned **unwrapped** — no `success` and no `data` key (`controller/product.controller.ts:51`).

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `id` | integer | Cast with `Number(...)`. |

#### Request

```http
GET /api/products/55
```

#### Response `200`

```json
{
  "id": 55,
  "name": "Cheeseburger",
  "description": "Double patty with cheddar",
  "imageUrl": "https://cdn.quickbite.com/burger.png",
  "restaurantId": 12,
  "categoryId": 4,
  "createdAt": "2026-08-02T15:32:23.000Z",
  "updatedAt": "2026-08-02T15:32:23.000Z",
  "deletedAt": null
}
```

Soft-deleted products are filtered out and return `404`.

#### Errors

| Status | Body | When |
|---|---|---|
| `404` | `{"error": "Product not found"}` | No product with that id, or it is soft-deleted. |

---

### `GET /restaurants/:restaurantId/products`

List all products of a restaurant. Requires authentication, restaurant membership, and permission `core:product:read`. Cached for **1 hour**.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | `parseInt`-validated by `requireRestaurantMember`. |

#### Request

```http
GET /api/restaurants/12/products
Cookie: access_token=<jwt>
```

Response header:

```http
X-Cache: MISS
```

#### Response `200`

```json
{
  "data": [
    {
      "id": 55,
      "name": "Cheeseburger",
      "description": "Double patty with cheddar",
      "imageUrl": "https://cdn.quickbite.com/burger.png",
      "restaurantId": 12,
      "categoryId": 4,
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-02T15:32:23.000Z",
      "deletedAt": null
    }
  ]
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Invalid or missing restaurant ID parameter"}` | `:restaurantId` is missing or non-numeric. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `403` | `{"error": "Permission denied: Access to this restaurant is restricted"}` | Caller belongs to a different restaurant. |
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:product:read`. |

---

### `POST /restaurants/:restaurantId/products`

Create a product. Requires authentication, restaurant membership, and permission `core:product:create`.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | `parseInt`-validated. |

#### Request body — `CreateProductDTO`

```json
{
  "name": "Cheeseburger",
  "description": "Double patty with cheddar",
  "imageUrl": "https://cdn.quickbite.com/burger.png",
  "categoryName": "Burgers"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | Non-empty. |
| `description` | string | no | String. |
| `imageUrl` | string | no | String. |
| `categoryName` | string | no | String; resolves to `categoryId` server-side. |

#### Response `201`

```json
{
  "message": "Product created",
  "product": {
    "id": 55,
    "name": "Cheeseburger",
    "description": "Double patty with cheddar",
    "imageUrl": "https://cdn.quickbite.com/burger.png",
    "restaurantId": 12,
    "categoryId": 4,
    "createdAt": "2026-08-02T15:32:23.000Z",
    "updatedAt": "2026-08-02T15:32:23.000Z",
    "deletedAt": null
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
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:product:create`. |
| `404` | `{"error": "restaurant not found"}` | No restaurant with that id. |

---

### `PATCH /products/:id`

Update a product and/or its branch-level overrides. Requires authentication, branch access, and permission `core:product:update`.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `id` | integer | Product id. |

#### Query parameters

| Name | Type | Required | Notes |
|---|---|---|---|
| `branchId` | integer | no | Enables the branch-level `price` / `stock` / `isAvailable` overrides. Also consumed by `requireBranchAccess`. |

> **Behaviour note:** without `?branchId=`, the service performs no write at all and the response contains only `message`.

#### Request body — `UpdateProductDTO`

All fields optional.

```json
{
  "name": "Double Cheeseburger",
  "description": "Double patty, double cheddar",
  "imageUrl": "https://cdn.quickbite.com/burger-2.png",
  "categoryName": "Burgers",
  "price": 130,
  "stock": 25,
  "isAvailable": true
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | no | Non-empty string. |
| `description` | string | no | String. |
| `imageUrl` | string | no | String. |
| `categoryName` | string | no | String. |
| `price` | number | no | Integer, min 0. Branch-level. |
| `stock` | number | no | Integer, min 0. Branch-level. |
| `isAvailable` | boolean | no | Boolean. Branch-level. |

> Body DTOs are validated without implicit conversion, so `"price": "130"` (string) fails.

#### Response `200`

```json
{
  "message": "Product updated",
  "product": {
    "id": 55,
    "name": "Double Cheeseburger",
    "description": "Double patty, double cheddar",
    "imageUrl": "https://cdn.quickbite.com/burger-2.png",
    "restaurantId": 12,
    "categoryId": 4,
    "createdAt": "2026-08-02T15:32:23.000Z",
    "updatedAt": "2026-08-05T11:02:00.000Z",
    "deletedAt": null
  },
  "branchDetails": {
    "id": 210,
    "branchId": 3,
    "productId": 55,
    "price": 130,
    "stock": 25,
    "isAvailable": true
  }
}
```

`branchDetails` is **omitted** when no `?branchId=` is supplied, or when none of `price` / `stock` / `isAvailable` was sent. Without `?branchId=`, the entire response is:

```json
{
  "message": "Product updated"
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `403` | `{"error": "Permission denied: Access to this branch is restricted"}` | Caller has no access to `?branchId=`. |
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:product:update`. |
| `404` | `{"error": "Product not found"}` | No product with that id. |
| `404` | `{"error": "branch not found"}` | No branch with that id. |

---

### `GET /internal/branches/:id/products`

**Internal / service-to-service.** Fetch specific products with their branch-level price and stock.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `id` | integer | Branch id. |

#### Query parameters

| Name | Type | Required | Rules |
|---|---|---|---|
| `ids` | string | yes | Comma-separated positive integers, e.g. `?ids=55,56,57`. Invalid entries are dropped; if nothing valid remains → `400`. |

#### Request

```http
GET /api/internal/branches/3/products?ids=55,56,57
api-key: <INTERNAL_API_KEY>
```

#### Response `200`

```json
{
  "success": true,
  "data": [
    {
      "productId": 55,
      "name": "Cheeseburger",
      "imageUrl": "https://cdn.quickbite.com/burger.png",
      "price": 120,
      "stock": 40,
      "isAvailable": true
    },
    {
      "productId": 56,
      "name": "Fries",
      "imageUrl": null,
      "price": 45,
      "stock": 0,
      "isAvailable": false
    }
  ]
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Missing product ids query parameter"}` | `ids` absent, empty, or contains no valid positive integers. |
| `500` | `{"error": "Internal api key not configured"}` | `INTERNAL_API_KEY` is unset on the server. |
| `401` | `{"error": "Invalid api key"}` | `api-key` header does not match. |

---

### `POST /internal/branches/:id/reserve-stock`

**Internal / service-to-service.** Atomically decrement branch stock for a set of products.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `id` | integer | Branch id. |

#### Request body

Not DTO-validated; shape is enforced at the service layer.

```json
{
  "items": [
    {
      "productId": 55,
      "quantity": 2
    },
    {
      "productId": 56,
      "quantity": 1
    }
  ]
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `items` | array | yes | Non-empty array. |
| `items[].productId` | integer | yes | Must be a positive integer. |
| `items[].quantity` | integer | yes | Must be a positive integer. |

#### Response `200`

```json
{
  "success": true,
  "data": {
    "ok": true,
    "applied": [
      {
        "productId": 55,
        "newStock": 38
      },
      {
        "productId": 56,
        "newStock": 0
      }
    ]
  }
}
```

`ok` is always `true` in a success response. The operation is all-or-nothing — a single insufficient line aborts the whole reservation.

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Invalid reserve items"}` | `items` missing/empty, or an entry has a non-integer `productId`/`quantity` or `quantity <= 0`. |
| `409` | `{"error": "OutOfStock: [{\"productId\":56,\"requested\":5,\"available\":1}]"}` | At least one line is unavailable, out of stock, or unknown. The array lists **every** offending line. |
| `500` | `{"error": "Internal api key not configured"}` | `INTERNAL_API_KEY` is unset on the server. |
| `401` | `{"error": "Invalid api key"}` | `api-key` header does not match. |

---

## Quick reference

| Method | Path | Auth | Success |
|---|---|---|---|
| `GET` | `/restaurants/:restaurantId/categories` | Public | `200` |
| `GET` | `/branches/:branchId/products` | Public | `200` |
| `GET` | `/products/:id` | Public | `200` |
| `GET` | `/restaurants/:restaurantId/products` | Member + `core:product:read` (cached 1h) | `200` |
| `POST` | `/restaurants/:restaurantId/products` | Member + `core:product:create` | `201` |
| `PATCH` | `/products/:id` | Branch access + `core:product:update` | `200` |
| `GET` | `/internal/branches/:id/products` | `api-key` header | `200` |
| `POST` | `/internal/branches/:id/reserve-stock` | `api-key` header | `200` |