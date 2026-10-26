# RBAC / Member API Contract

**Module:** `src/app/rbac`
**Router mount:** `routes.use("/", rbacRouter)` — `src/routes.ts:33`
**Global prefix:** `app.use("/api", routes)` — `src/app.ts:19`

Because the router mounts at `/`, these paths live alongside the other root-level routers.

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
| `rbac({ resource, action })` | `system_admin` bypasses; `restaurant_user` must hold `"<resource>:<action>"`; any other role denied. |
| `requireInternalApiKey` | `api-key: <INTERNAL_API_KEY>` header. |

```http
Cookie: access_token=<jwt>
```

### Permissions

Permission strings are `"<resource>:<action>"`. This module checks:

| Resource | Actions |
|---|---|
| `core:member` | `create`, `read`, `update`, `delete` |
| `core:branch` | `create`, `update` |
| `core:product` | `read`, `create`, `update` |
| `core:restaurant` | `update` |

### Response envelopes

| Style | Used by |
|---|---|
| `{ "result": { ... } }` | `GET` members, `PATCH` member, `DELETE` member, `PUT` branches, `GET` role permissions |
| `{ "message": "...", "result": ... }` | `POST` member |
| `{ "success": true, "data": {...} }` | `GET /internal/rbac/permissions` |

### Error shape

```json
{ "error": "<message>" }
```

---

## Data model

### `MemberStatus`

| Value |
|---|
| `active` |
| `inactive` |
| `suspended` |

### `Member` (list row)

```json
{
  "id": 88,
  "userId": 41,
  "email": "chef@quickbite.com",
  "name": "Mahmoud Hassan",
  "phone": "01000000003",
  "role": "manager",
  "roleDisplayName": "Manager",
  "status": "active"
}
```

### `RolePermissions`

```json
{
  "role": "manager",
  "permissions": [
    { "permission": "core:member:read" },
    { "permission": "core:product:create" }
  ]
}
```

### `InvitedMember` (built server-side during `POST`; **not** returned — see below)

```json
{
  "id": 88,
  "userId": 41,
  "email": "chef@quickbite.com",
  "name": "Mahmoud Hassan",
  "phone": "01000000003",
  "role": "manager",
  "status": "inactive",
  "branchIds": [3, 4]
}
```

---

## Endpoints

### `GET /roles/:role/permissions`

List the permissions attached to a role, as `{permission}` objects. **Public.**

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `role` | string | Role name, e.g. `manager`, `owner`, `chef`. |

#### Request

```http
GET /api/roles/manager/permissions
```

#### Response `200`

```json
{
  "result": {
    "role": "manager",
    "permissions": [
      {
        "permission": "core:member:read"
      },
      {
        "permission": "core:product:create"
      },
      {
        "permission": "core:product:update"
      }
    ]
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `404` | `{"error": "Role not found"}` | No role with that name. |

---

### `GET /internal/rbac/permissions`

**Internal / service-to-service.** List a role's permissions as plain strings.

#### Query parameters

| Name | Type | Required | Notes |
|---|---|---|---|
| `role` | string | yes | Role name. Missing or empty → `400`. |

#### Request

```http
GET /api/internal/rbac/permissions?role=manager
api-key: <INTERNAL_API_KEY>
```

#### Response `200`

```json
{
  "success": true,
  "data": {
    "role": "manager",
    "permissions": [
      "core:member:read",
      "core:product:create",
      "core:product:update"
    ]
  }
}
```

> Unlike the public route, an unknown role returns `200` with an empty `permissions` array rather than `404`.

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Missing role query parameter"}` | `role` absent or empty. |
| `500` | `{"error": "Internal api key not configured"}` | `INTERNAL_API_KEY` is unset on the server. |
| `401` | `{"error": "Invalid api key"}` | `api-key` header does not match. |

---

### `POST /restaurants/:restaurantId/members`

Invite a new member to a restaurant. Requires authentication, restaurant membership, and permission `core:member:create`.

**Side effects:** creates a `users` row (empty password, `systemRole: restaurant_user`), a `restaurant_members` row with `status: inactive`, and emails a 6-digit OTP valid for **1 hour**.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | `parseInt`-validated by `requireRestaurantMember`. |

#### Request body — `CreateMemberDTO`

```json
{
  "email": "chef@quickbite.com",
  "name": "Mahmoud Hassan",
  "phoneNumber": "01000000003",
  "role": "manager",
  "branchIds": [3, 4]
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | `@IsEmail()`, non-empty. |
| `name` | string | yes | Non-empty. |
| `phoneNumber` | string | yes | Non-empty. |
| `role` | string | yes | Non-empty free-form role name. Must **not** be `owner`. Must exist in the roles table. |
| `branchIds` | integer[] | no | Array. Every id must belong to `:restaurantId`. |

#### Response `200`

```json
{
  "message": "Member added succesfuly"
}
```

> Two implementation notes that are part of the current wire contract:
> - The `message` string is misspelled **in the source** (`succesfuly`).
> - The service builds a rich `InvitedMember` payload inside the transaction but does not return it, so the response body carries only `message`.

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `400` | `{"error": "Not allowed to create another owner"}` | `role` is `owner`. |
| `400` | `{"error": "User already exists"}` | Email or phone already registered. |
| `400` | `{"error": "One or more branch IDs do not belong to this restaurant"}` | Any `branchIds` entry belongs to another restaurant. |
| `400` | `{"error": "Invalid or missing restaurant ID parameter"}` | `:restaurantId` is missing or non-numeric. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `403` | `{"error": "Permission denied: Access to this restaurant is restricted"}` | Caller belongs to a different restaurant. |
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:member:create`. |
| `404` | `{"error": "Role not found"}` | `role` does not exist in the roles table. |

---

### `GET /restaurants/:restaurantId/members`

List a restaurant's members. Requires authentication, restaurant membership, and permission `core:member:read`.

> This endpoint is **not paginated** — it returns the full member list.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | `parseInt`-validated. |

#### Request

```http
GET /api/restaurants/12/members
Cookie: access_token=<jwt>
```

#### Response `200`

Note the double nesting: `{ "result": { "data": [...] } }`.

```json
{
  "result": {
    "data": [
      {
        "id": 88,
        "userId": 41,
        "email": "chef@quickbite.com",
        "name": "Mahmoud Hassan",
        "phone": "01000000003",
        "role": "manager",
        "roleDisplayName": "Manager",
        "status": "active"
      },
      {
        "id": 89,
        "userId": 42,
        "email": "owner@quickbite.com",
        "name": "Ahmed Ali",
        "phone": "01000000000",
        "role": "owner",
        "roleDisplayName": "Owner",
        "status": "active"
      }
    ]
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Invalid or missing restaurant ID parameter"}` | `:restaurantId` is missing or non-numeric. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `403` | `{"error": "Permission denied: Access to this restaurant is restricted"}` | Caller belongs to a different restaurant. |
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:member:read`. |

---

### `PATCH /restaurants/:restaurantId/members/:memberId`

Change a member's role or status. Requires authentication, restaurant membership, and permission `core:member:update`.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | `parseInt`-validated. |
| `memberId` | integer | Must belong to `:restaurantId`. |

#### Request body — `UpdateMemberDTO`

```json
{
  "role": "chef",
  "status": "suspended"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `role` | string | no | Free-form string; must exist in the roles table if provided. |
| `status` | enum | no | One of `active`, `inactive`, `suspended`. |

#### Response `200`

```json
{
  "result": {
    "message": "Member updated successfully"
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
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:member:update`. |
| `404` | `{"error": "Member not found"}` | No such member in `:restaurantId`. |
| `404` | `{"error": "Role not found"}` | Provided `role` does not exist. |

---

### `DELETE /restaurants/:restaurantId/members/:memberId`

Remove a member from a restaurant. Requires authentication, restaurant membership, and permission `core:member:delete`.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | `parseInt`-validated. |
| `memberId` | integer | Must belong to `:restaurantId`. |

#### Request

```http
DELETE /api/restaurants/12/members/88
Cookie: access_token=<jwt>
```

#### Response `200`

```json
{
  "result": {
    "message": "Member deleted successfully"
  }
}
```

Branch assignments for that member are removed along with the membership.

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Cannot delete the restaurant owner"}` | Target member's role is `owner`. |
| `400` | `{"error": "Invalid or missing restaurant ID parameter"}` | `:restaurantId` is missing or non-numeric. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `403` | `{"error": "Permission denied: Access to this restaurant is restricted"}` | Caller belongs to a different restaurant. |
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:member:delete`. |
| `404` | `{"error": "Member not found"}` | No such member in `:restaurantId`. |

---

### `PUT /restaurants/:restaurantId/members/:memberId/branches`

Replace a member's branch assignments. Requires authentication, restaurant membership, and permission `core:member:update`.

#### Path parameters

| Name | Type | Notes |
|---|---|---|
| `restaurantId` | integer | `parseInt`-validated. |
| `memberId` | integer | Must belong to `:restaurantId`. |

#### Request body — `UpdateMemberBranchesDTO`

This is a **full replacement** — existing assignments are deleted before the new set is inserted. Send `[]` to clear all branch access.

```json
{
  "branchIds": [3, 4]
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `branchIds` | integer[] | yes | Array. Every id must belong to `:restaurantId`. |

#### Response `200`

```json
{
  "result": {
    "message": "Member branch assignments updated successfully",
    "branchIds": [3, 4]
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | `branchIds` missing or not an array. |
| `400` | `{"error": "Cannot assign branches to owners, they have access to all branches"}` | Target member's role is `owner`. |
| `400` | `{"error": "One or more branch IDs do not belong to this restaurant"}` | Any id belongs to another restaurant. |
| `400` | `{"error": "Invalid or missing restaurant ID parameter"}` | `:restaurantId` is missing or non-numeric. |
| `403` | `{"error": "User not authenicated"}` | Missing or invalid `access_token` cookie. |
| `403` | `{"error": "Permission denied: Access to this restaurant is restricted"}` | Caller belongs to a different restaurant. |
| `403` | `{"error": "Permission denied: Has not this permission"}` | Role lacks `core:member:update`. |
| `404` | `{"error": "Member not found"}` | No such member in `:restaurantId`. |

---

## Quick reference

| Method | Path | Auth | Success |
|---|---|---|---|
| `GET` | `/roles/:role/permissions` | Public | `200` |
| `GET` | `/internal/rbac/permissions` | `api-key` header | `200` |
| `POST` | `/restaurants/:restaurantId/members` | Member + `core:member:create` | `200` |
| `GET` | `/restaurants/:restaurantId/members` | Member + `core:member:read` | `200` |
| `PATCH` | `/restaurants/:restaurantId/members/:memberId` | Member + `core:member:update` | `200` |
| `DELETE` | `/restaurants/:restaurantId/members/:memberId` | Member + `core:member:delete` | `200` |
| `PUT` | `/restaurants/:restaurantId/members/:memberId/branches` | Member + `core:member:update` | `200` |