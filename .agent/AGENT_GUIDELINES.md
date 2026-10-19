# Agent Guidelines — Operating Rules for Quick Bite `core-service`

These rules apply to **every** task. They outrank any single skill's advice when the two conflict.

## 1. Inspect before acting

- Read the relevant source files (controller, service, repository, entity, DTOs, routes, middleware) **before** proposing or implementing a change.
- Trace actual call chains (`routes.ts` → controller → service → repository) instead of assuming how code connects.
- Never assume a class, file, helper, or abstraction exists without opening it.

## 2. Follow the existing architecture

- Controllers stay thin (validate → service → respond); business logic lives in services; SQL lives in repositories; transactions start at the service level.
- New code must match the module layout (`controller/ service/ repository/ entity/ dto/ *.routes.ts *.errors.ts`) and the `lib` / `pkg` layering rules (see `architecture/separation-of-concerns`).
- Do not introduce new frameworks, ORMs, abstractions, or dependencies to solve a local problem.

## 3. Read skills before starting

- Select skills from `SKILLS_INDEX.md` by task keywords and read them **before** writing code.
- Combine project-specific rules with general engineering skills; project rules win on conflicts.

## 4. Keep changes minimal and behavior-preserving

- No unrelated refactoring, no "drive-by" cleanups, no speculative generality.
- Preserve existing API shapes (including documented quirks) unless the task explicitly requires changing them.
- Do not modify migrations, schemas, seed data, or configuration unless asked.

## 5. Respect explicit restrictions

- If the user forbids running commands (tests, builds, scripts), obey absolutely. Do not work around the restriction.
- Never claim tests, builds, or checks passed unless they actually ran and succeeded. Report unverified work as unverified.

## 6. Handle uncertainty honestly

- Ask for clarification when requirements, optionality, or intended behavior cannot be determined from the code.
- Mark guesses as guesses. Record assumptions, risks, and incomplete work in the final report.
- If the codebase is inconsistent (it has known inconsistencies — see `PROJECT_CONTEXT.md`), document the inconsistency instead of silently inventing a new standard.

## 7. Report truthfully

Every finished task reports: what changed (file paths), what was assumed, what risks remain, and what was **not** verified.
