# QuickBite `core-service` — User Business Logic

Profile management lives in `src/app/user` (`controller/user.controller.ts`, `service/user.service.ts`). The `users` table is the identity root every other module references.

## 1. Endpoint Map

### 1.1 Self service (authentication required)

```mermaid
flowchart TD
    ME[GET own profile] --> G[Return profile without secrets]
    PM[PATCH own profile] --> U[Check phone unique<br/>update and return profile]
```

### 1.2 Service-to-service (internal API key)

```mermaid
flowchart TD
    AG[GET internal agent by id] --> A{User exists<br/>and role is delivery_agent?}
    A -->|yes| OK[Agent id, name and phone]
    A -->|no| NF[404 User not found]
```

## 2. Business Rules

1. **Profile reads never expose secrets.** `getByUserId` returns `toUserResponse()` (`lib/utils/utils.ts:3`) — `{ id, email, phone, name, systemRole, createdAt, updatedAt }`. `passwordHash` and `deletedAt` never leave the service.
2. **Phone changes are uniqueness-guarded.** `updateProfile` checks `findUserExistsByPhone` before writing; a taken phone returns the phone-in-use error (`user.service.ts:48`). Email is immutable — there is intentionally no endpoint to change it.
3. **Soft-deleted users are invisible.** All `find*` queries filter `deleted_at IS NULL` (`repository/users.repo.ts:34`).
4. **Agent lookup is enumeration-safe.** `getAgentById` returns 404 both when the user is missing **and** when the user exists but is not a `delivery_agent` (`user.service.ts:58`), so callers (order-service dispatch) cannot probe other user types.

## 3. System Roles

```mermaid
stateDiagram-v2
    [*] --> customer: self-register
    [*] --> restaurant_user: self-register or member invite
    [*] --> delivery_agent: created internally
    [*] --> system_admin: created internally, never self-registers
```

Roles are stored on `users.system_role` (`customer | restaurant_user | system_admin | delivery_agent`) and embedded in every JWT, driving the `authentication` guard and all RBAC checks.
