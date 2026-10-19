# QuickBite `core-service` — RBAC & Members Business Logic

Restaurant membership, roles and permissions live in `src/app/rbac` (`service/member.service.ts`). Three seeded roles — `owner`, `branch_manager`, `staff` — gate every management endpoint through the `rbac({ resource, action })` middleware.

## 1. Permission Model

```mermaid
flowchart LR
    U[User] --> M[restaurant_members<br/>restaurant + role + status]
    M --> R[roles: owner<br/>branch_manager, staff]
    R --> RP[role_permissions]
    RP --> P[permissions<br/>resource + action]
    M --> MB[member_branches<br/>branch scope]
    MB --> B[Branches]
```

Seeded matrix (`migrations/..._seed_rbac_data.ts`):

| Permission | owner | branch_manager | staff |
| --- | --- | --- | --- |
| `core:product:create/read/update` | ✅ | ✅ | read-only* |
| `core:member:create/update/delete` | ✅ | — | — |
| `core:member:read` | ✅ | ✅ | — |
| `core:branch:create/update` | ✅ | update only | — |
| `core:restaurant:update` | ✅ | — | — |

\* staff seeded permissions are read-oriented; owners hold all 10 permissions.

## 2. Member Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Inactive: owner invites, OTP emailed
    Inactive --> Active: member accepts invite
    Active --> Suspended: owner updates status
    Suspended --> Active: owner re-activates
    Active --> Deleted: owner deletes, owner role protected
    Inactive --> Deleted: owner deletes
```

## 3. Endpoint Flows

### 3.1 Members (auth plus member checks)

```mermaid
flowchart TD
    CM[POST restaurant member] --> INV[Validate role, uniqueness<br/>and branch ownership<br/>then invite inactive member]
    LM[GET restaurant members] --> LST[Member list with roles]
    UM[PATCH member] --> UPD[Change role or status]
    DM[DELETE member] --> DEL{Role is owner?}
    DEL -->|yes| NO[Refused - cannot delete owner]
    DEL -->|no| RM[Delete branches and member]
    BM[PUT member branches] --> BO{Owner?}
    BO -->|yes| NBO[Refused - owners cover all branches]
    BO -->|no| SET[Validate branches belong<br/>to restaurant, replace set]
```

### 3.2 Permissions (public and internal)

```mermaid
flowchart TD
    RP1[GET role permissions] --> D1[Role plus permission objects]
    RP2[GET internal role permissions] --> D2[Role plus permission strings]
```

Rules:
1. **Owners are special.** Nobody can create an `owner` member or delete/branch-scope one (`cannotCreateOwnerMember`, `cannotDeleteOwnerError`, `cannotAssignBranchesToOwners`).
2. **Branch assignments are allow-lists.** Non-owners see only assigned branches via `requireBranchAccess`; every assignment is verified with a single `COUNT` query that all `branchIds` belong to the restaurant (`member.service.ts:194`).
3. **Public vs internal permission shapes differ.** The public endpoint returns `{ permission: "resource:action" }` objects; the internal one returns plain `"resource:action"` strings for order-service.
