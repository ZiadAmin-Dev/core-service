# Sources — Central Bibliography

Researched October 2026. Individual `SKILL.md` files link the subset they rely on.

## Language & framework

- TypeScript Handbook — Everyday Types / strict null checks — https://www.typescriptlang.org/docs/handbook/2/everyday-types — TypeScript
- TypeScript Handbook — Decorators — https://www.typescriptlang.org/docs/handbook/decorators — decorators, tsyringe DI
- TSConfig Reference (`strict`, `noImplicitAny`, `experimentalDecorators`, `emitDecoratorMetadata`) — https://www.typescriptlang.org/tsconfig/ — compiler config
- Express 5.x API documentation — https://expressjs.com/ — routing, middleware, `res.json`
- class-validator (typestack) — https://github.com/typestack/class-validator — DTO validation decorators
- class-transformer (typestack) — https://github.com/typestack/class-transformer — `plainToInstance`, implicit conversion
- tsyringe (Microsoft) — https://github.com/microsoft/tsyringe — DI container, tokens

## Database

- Knex.js guide — Query Builder — https://knexjs.org/guide/query-builder — query building
- Knex.js guide — Transactions — https://knexjs.org/guide/transactions.html — `trx`, commit/rollback, isolation
- PostgreSQL docs — Chapter 11, Indexes — https://www.postgresql.org/docs/current/indexes.html — index design
- PostgreSQL docs — 14.1, Using EXPLAIN — https://www.postgresql.org/docs/current/using-explain.html — plans, `EXPLAIN ANALYZE`
- PostgreSQL docs — 13.2, Transaction Isolation — https://www.postgresql.org/docs/current/transaction-iso.html — isolation levels, MVCC

## Caching

- Redis — Cache-aside use case — https://redis.io/docs/latest/develop/use-cases/cache-aside/ — pattern, TTL, stampede
- Redis — Query caching how-to (Node.js) — https://redis.io/tutorials/howtos/solutions/microservices/caching/ — key hashing, expiry
- Microsoft Learn — Cache-Aside Pattern — https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside — invalidation order, staleness
- AWS Whitepaper — Database Caching Strategies Using Redis — https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html — lazy vs write-through

## Security

- OWASP API Security Top 10 (2023) — https://owasp.org/API-Security/editions/2023/en/0x11-t10/ — BOLA, auth, property-level auth
- OWASP Password Storage Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html — bcrypt work factor, salts
- OWASP JWT Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html — secrets, token handling
- OWASP Authentication Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html — enumeration, strength controls

## Diagramming

- Mermaid intro + syntax — https://mermaid.js.org/intro/ — text-to-diagram, flowchart/sequence/state/ER/C4
- Mermaid Live Editor — https://mermaid.live/ — syntax validation and preview
- Mermaid CLI — https://mermaid.js.org/config/mermaidCLI.html — local SVG/PNG rendering
- GitHub creating diagrams — https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams — fenced-block rendering
- D2 tour + documentation — https://d2lang.com/tour/intro/ — declarative diagrams, layouts, sequence/sql_table shapes
- PlantUML sequence — https://plantuml.com/sequence-diagram ; state — https://plantuml.com/state-diagram ; language reference (PDF) — https://pdf.plantuml.net/PlantUML_Language_Reference_Guide_en.pdf
- Structurizr DSL tutorial — https://docs.structurizr.com/dsl/tutorial ; language reference — https://docs.structurizr.com/dsl/language — C4 models-as-code
- Excalidraw + developer docs — https://excalidraw.com/ ; https://docs.excalidraw.com/ — whiteboard editor, JSON scenes
