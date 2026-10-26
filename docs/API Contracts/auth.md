# Auth API Contract

**Module:** `src/app/auth`
**Router mount:** `routes.use("/auth", authRouter)` — `src/routes.ts:17`
**Global prefix:** `app.use("/api", routes)` — `src/app.ts:19`

---

## Conventions

### Base URL

```
http://localhost:<PORT>/api/auth
```

### Authentication

All auth endpoints are public. Successful register/login/refresh set **HTTP-only cookies**:

| Cookie | Lifetime | Sent to |
|---|---|---|
| `access_token` | 1 hour | Every authenticated request (read by `authentication` guard). |
| `refresh_token` | 7 days | `POST /auth/refresh` only. |

Both are `httpOnly`, `sameSite=lax`, and `secure` in production.

### Response envelopes

`sendSuccess` wraps the body: `{ "success": true, "data": { ... } }` (`src/lib/http/response.ts`).

### Error shape

```json
{ "error": "<message>" }
```

---

## Data model

### `User` (embedded in register/login responses)

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

### `POST /auth/register`

Create an account. When `role` is `restaurant_user`, the nested `restaurant` object creates the restaurant and the caller becomes its **owner** member.

#### Request body — `RegisterDTO`

```json
{
  "email": "ahmed@example.com",
  "phone": "01000000000",
  "name": "Ahmed Ali",
  "password": "Str0ng!Pass",
  "role": "customer",
  "restaurant": {
    "name": "Quick Bite",
    "logoURL": "https://cdn.quickbite.com/logo.png",
    "primaryCountry": "EG"
  }
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | `@IsEmail()` |
| `phone` | string | yes | Length 10–11. |
| `name` | string | yes | Min length 1. |
| `password` | string | yes | Min 8 chars, 1 uppercase, 1 lowercase, 1 number. Symbols optional. |
| `role` | enum | yes | One of `customer`, `restaurant_user`, `system_admin`, `delivery_agent`. |
| `restaurant` | object | conditional | **Required when `role` is `restaurant_user`.** |
| `restaurant.name` | string | yes | Min length 1. |
| `restaurant.logoURL` | string | no | Optional string. |
| `restaurant.primaryCountry` | string | yes | Min length 1. |

#### Response `201`

```json
{
  "success": true,
  "data": {
    "message": "User registered successfully",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 41,
      "email": "ahmed@example.com",
      "phone": "01000000000",
      "name": "Ahmed Ali",
      "systemRole": "restaurant_user",
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-02T15:32:23.000Z"
    },
    "restaurant": {
      "id": 12,
      "ownerId": 41,
      "name": "Quick Bite",
      "logoURL": "https://cdn.quickbite.com/logo.png",
      "status": "pending",
      "statusUpdatedAt": "2026-08-02T15:32:23.000Z",
      "primaryCountry": "EG",
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-02T15:32:23.000Z"
    }
  }
}
```

`restaurant` is omitted for non-restaurant roles. Tokens are also set as cookies on the response.

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `400` | `{"error": "User already exists"}` | Email already registered. |
| `400` | `{"error": "Restaurant data is required"}` | `role` is `restaurant_user` but `restaurant` is missing. |
| `403` | `{"error": "Cannot register as system admin"}` | Attempted to self-register as `system_admin`. |

---

### `POST /auth/login`

Exchange credentials for tokens.

#### Request body — `LoginDTO`

```json
{
  "email": "ahmed@example.com",
  "password": "Str0ng!Pass"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | `@IsEmail()` |
| `password` | string | yes | Non-empty. |

#### Response `200`

```json
{
  "success": true,
  "data": {
    "message": "User logged in successfully",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 41,
      "email": "ahmed@example.com",
      "phone": "01000000000",
      "name": "Ahmed Ali",
      "systemRole": "restaurant_user",
      "createdAt": "2026-08-02T15:32:23.000Z",
      "updatedAt": "2026-08-02T15:32:23.000Z"
    }
  }
}
```

Tokens are also set as cookies.

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `401` | `{"error": "Incorrect email or password"}` | Credentials do not match. |
| `404` | `{"error": "User not found"}` | Email not registered. |

---

### `POST /auth/forget-password`

Send a 6-digit OTP to the account's email.

**Idempotency:** protected by `idempotency({ strict: true })` — replaying the same request key returns the first response instead of re-sending mail.

#### Request body — `ForgetPasswordDTO`

```json
{
  "email": "ahmed@example.com"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | `@IsEmail()` |

#### Response `200`

```json
{
  "success": true,
  "data": {
    "message": "OTP sent to your email"
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `404` | `{"error": "User not found"}` | Email not registered. |

---

### `POST /auth/reset-password`

Complete the reset with the emailed OTP.

#### Request body — `ResetPasswordDTO`

```json
{
  "email": "ahmed@example.com",
  "otp": "123456",
  "newPassword": "Str0ng!Pass"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | `@IsEmail()` |
| `otp` | string | yes | Exactly 6 characters. |
| `newPassword` | string | yes | Min 8 chars, 1 uppercase, 1 lowercase, 1 number. Symbols optional. |

#### Response `200`

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully, Please login again"
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `400` | `{"error": "Invalid OTP"}` | OTP wrong or expired. |
| `404` | `{"error": "User not found"}` | Email not registered. |

---

### `POST /auth/refresh`

Issue a fresh access token from the `refresh_token` cookie.

#### Request

No body. The cookie is the entire input.

```http
POST /api/auth/refresh
Cookie: refresh_token=<jwt>
```

#### Response `200`

```json
{
  "success": true,
  "data": {
    "message": "success"
  }
}
```

A new `access_token` cookie is set on the response.

#### Errors

| Status | Body | When |
|---|---|---|
| `401` | `{"error": "Missing refresh token"}` | `refresh_token` cookie absent. |
| `401` | `{"error": "Incorrect email or password"}` | Token invalid or expired. |

---

### `POST /auth/accept-invite`

Redeem a staff/member invitation. Uses the same `ResetPasswordDTO` shape as password reset.

#### Request body

```json
{
  "email": "chef@quickbite.com",
  "otp": "123456",
  "newPassword": "Str0ng!Pass"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | `@IsEmail()` |
| `otp` | string | yes | Exactly 6 characters. |
| `newPassword` | string | yes | Min 8 chars, 1 uppercase, 1 lowercase, 1 number. |

#### Response `200`

```json
{
  "success": true,
  "data": {
    "message": "Invite accepted successfully, Please login again"
  }
}
```

#### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "Validation failed"}` | Body fails DTO validation. |
| `400` | `{"error": "Invalid OTP"}` | Invitation code wrong or expired. |

---

## Quick reference

| Method | Path | Body | Success |
|---|---|---|---|
| `POST` | `/auth/register` | `RegisterDTO` | `201` |
| `POST` | `/auth/login` | `LoginDTO` | `200` |
| `POST` | `/auth/forget-password` | `ForgetPasswordDTO` | `200` |
| `POST` | `/auth/reset-password` | `ResetPasswordDTO` | `200` |
| `POST` | `/auth/refresh` | — (cookie) | `200` |
| `POST` | `/auth/accept-invite` | `ResetPasswordDTO` | `200` |