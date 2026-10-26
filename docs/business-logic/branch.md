# QuickBite `core-service` — Branch Business Logic

Branches are the operational units of a restaurant: geolocation, delivery radius, ordering switches and commission. Code in `src/app/branch` (`service/branch.service.ts`, PostGIS queries in `repository/branch.repo.ts`).

## 1. Branch Operating State

```mermaid
stateDiagram-v2
    [*] --> Inactive: created inactive by default
    Inactive --> Active: system_admin activates
    Active --> Inactive: system_admin deactivates
    Active --> Paused: acceptOrders set to false
    Paused --> Active: acceptOrders set to true
```

- New branches start **inactive** — they are invisible to the storefront until an admin activates them (`branch.service.ts:30`).
- `isActive` (admin-controlled) and `acceptOrders` (operational pause) are independent switches; storefront queries require both, plus an `active` restaurant.

## 2. Endpoint Flows

### 2.1 Storefront (public)

```mermaid
flowchart TD
    NB[GET nearby branches] --> GEO[PostGIS radius search<br/>active branch and restaurant only]
    GEO --> PROJ[Branch cards with<br/>restaurant name and logo]
    AB[GET restaurant branches] --> ACT[Active branches only]
```

### 2.2 Management (auth plus RBAC)

```mermaid
flowchart TD
    CB[POST restaurant branch] --> OWN1{Owner or admin?}
    OWN1 -->|yes| NEW[Create inactive branch]
    UB[PATCH branch] --> OWN2{Owner or admin?}
    OWN2 -->|yes| UPD[Update profile fields]
    SB[PATCH branch status - admin] --> ST[Update active flag and commission]
```

### 2.3 Service-to-service (internal API key)

```mermaid
flowchart TD
    IB[GET internal branch by id] --> DET[Branch plus restaurant status<br/>region, fees and commission]
```

Rules:
1. **Nearby search is geo-fenced.** `findNearbyBranches` joins `restaurant_branches` to `restaurants` and filters `b.is_active AND r.status = 'active' AND ST_DWithin(location, point, delivery_radius * 1000)` over a GIST index (`repository/branch.repo.ts:56`).
2. **Money is minor units.** `deliveryFee` is stored in minor currency units; `commission` is a branch-level rate number updated only via the admin status endpoint.
3. **Duplicate route caveat.** `GET /restaurants/:restaurantId/branches` is registered twice; the active-only handler wins and the all-branches handler is unreachable (see API contract).
