# Agent — Quick Bite `core-service` Engineering Skills Library

A reusable knowledge base that helps any AI coding agent work safely and professionally in this repository.

## Structure

```text
Agent/
├── README.md               # This file: what the library is and how to use it
├── AGENT_GUIDELINES.md     # Primary operating rules — read before any task
├── PROJECT_CONTEXT.md      # Verified facts: stack, layout, conventions
├── SKILLS_INDEX.md         # Searchable index of every skill
├── SOURCES.md              # Central bibliography
└── Skills/                 # One topic per SKILL.md, grouped by category
    ├── general/            # Repo exploration, safe changes, problem-solving,
    │                       # code review, documentation, dependencies, diagram-engineering
    ├── architecture/       # SOLID, clean code, separation, naming, errors
    ├── backend/            # TypeScript, Express, validation, DTOs,
    │                       # auth, logging, input security
    ├── database/           # SQL/PostgreSQL, N+1, indexing, transactions,
    │                       # integrity, pagination
    ├── caching/            # Cache-aside, invalidation, failure, key design
    ├── reliability/        # Idempotency, concurrency, retries, distributed systems
    └── testing/            # Strategy, unit/integration, regression prevention
```

## How an agent should use this library

1. **Start with `AGENT_GUIDELINES.md`.** It defines the non-negotiable workflow for every task.
2. **Load `PROJECT_CONTEXT.md`** for shared facts (stack, module layout, guard chains, response envelopes) instead of re-discovering them.
3. **Pick skills from `SKILLS_INDEX.md`** by task keywords. Read the relevant skill files **before** writing code.
4. **Combine project-specific and general skills.** Example: a new endpoint needs `backend/express-api-design` + `backend/request-validation` + `backend/response-dtos-and-api-contracts` + `architecture/naming-conventions`.
5. **Each `SKILL.md` follows one template**: Purpose → When to Use → Core Principles → Quick Bite Project Rules → Common Mistakes → Recommended Approach → Examples → Verification Checklist → References.

## Maintenance rules

- Skills describe the repo **as it is**. Never invent classes, files, or rules; mark the uncertain as **Undetermined**.
- Cross-reference instead of duplicating. If two skills overlap, one owns the content and the other links to it.
- No application source changes belong in this directory.
