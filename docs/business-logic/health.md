# QuickBite `core-service` — Health Business Logic

## Overview

`GET /api/health/` (`src/app/health/health.routes.ts`) is the service's liveness probe. It pings PostgreSQL (`pingDB`) and returns plain-text `OK` (200) or `{ message: "Database connection failed" }` (500). No auth, no DTOs, no business rules — load balancers and orchestrators use it to decide whether the instance serves traffic.
