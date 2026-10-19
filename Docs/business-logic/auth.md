# QuickBite `core-service` — Auth Business Logic

Identity, registration, login, password recovery and invitation acceptance live in `src/app/auth` (`controller/auth.controller.ts`, `service/auth.service.ts`).

## 1. Registration Flow (`POST /api/auth/register`)

```mermaid
flowchart TD
    REQ[POST /api/auth/register<br/>RegisterDTO] --> VAL[validateBody]
    VAL -->|role = system_admin| F403[403 Cannot register as system admin]
    VAL --> DUP{Email or phone<br/>already exists?}
    DUP -->|yes| F400[400 User already exists]
    DUP -->|no| TRX[BEGIN transaction]
    TRX --> CU[Create user<br/>bcrypt hash]
    CU -->|role = restaurant_user| CHK{Restaurant payload<br/>present?}
    CHK -->|no| ROLL[ROLLBACK<br/>400 Restaurant data required]
    CHK -->|yes| CR[Create restaurant<br/>status = pending]
    CR --> OW[Create owner member<br/>role = owner, active]
    CU -->|other roles| COMMIT[COMMIT]
    OW --> COMMIT
    COMMIT --> JWT[Issue access + refresh JWT<br/>payload: userId, email, role<br/>+ restaurantId, restaurantRole, branchIds]
    JWT --> RES[201 + set auth cookies]
```

Key rules (`service/auth.service.ts:31`):
1. `system_admin` can never self-register (`cannotSingUpAsSystemAdminError`).
2. Email/phone uniqueness is checked **before** the transaction to save resources.
3. Restaurant owners are created atomically: `users` → `restaurants` → `restaurant_members(owner/active)` in one `db.transaction`. Any failure rolls everything back.
4. The JWT for a `restaurant_user` embeds `restaurantId`, `restaurantRole` and `branchIds` so downstream guards (`requireRestaurantMember`, `requireBranchAccess`, `rbac`) work without extra lookups.

## 2. Login Flow (`POST /api/auth/login`)

```mermaid
flowchart TD
    REQ[POST /api/auth/login<br/>email + password] --> FIND{User found?}
    FIND -->|no| F401[401 Incorrect email or password]
    FIND -->|yes| PWD{bcrypt compare?}
    PWD -->|no| F401
    PWD -->|yes| ROLE{systemRole =<br/>restaurant_user?}
    ROLE -->|no| JWT[Issue tokens]
    ROLE -->|yes| MEM{Active membership<br/>with role?}
    MEM -->|no| F404[404 member not found]
    MEM -->|yes| BR[Load branchIds] --> JWT
    JWT --> RES[200 + set auth cookies]
```

Security notes:
- Unknown email and wrong password return the **same** 401 (`incorrectCredentialsError`) — no account enumeration (`auth.service.ts:94`).
- Restaurant users must have an `active` membership; otherwise login fails even with correct credentials.

## 3. Password Recovery (OTP) Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Requested: POST forget-password
    Requested --> Emailed: OTP row created, email sent
    Emailed --> Consumed: POST reset-password, OTP valid
    Emailed --> Expired: past expiresAt
    Emailed --> Emailed: re-request, latest wins
    Consumed --> [*]
    Expired --> [*]
```

Rules (`auth.service.ts:126`):
1. `forget-password` **always returns success**, even for unknown emails — enumeration protection.
2. OTPs are stored as hashes (`hashOTP`); only the latest row per user is evaluated (`findLatestPasswordResetByUserId`).
3. `reset-password` requires the OTP to match **and** be unexpired and unconsumed, then updates the password hash and marks the row consumed (`updatePasswordResetConsumedAt`).
4. New passwords must satisfy the strong-password policy (8+ chars, upper, lower, number).

## 4. Refresh & Invitations

```mermaid
flowchart LR
    subgraph Refresh
        C[refresh_token cookie] --> V{Valid?} -->|yes| A[New access_token cookie<br/>200 success]
        V -->|no| E401[401]
    end
    subgraph AcceptInvite
        I[POST /accept-invite<br/>email + OTP + password] --> R[resetPassword]
        R --> ACT[activateMemberByUserId<br/>inactive to active]
        ACT --> OK[200 Invite accepted]
    end
```

- Refresh only rotates the **access** token; the refresh token is long-lived and re-verified each call (`auth.service.ts:161`).
- Invited members are created with `status = inactive` and empty passwords; `accept-invite` reuses the reset-password OTP machinery, then flips the membership to `active` (`member.service.ts:46`, `auth.service.ts:168`).
