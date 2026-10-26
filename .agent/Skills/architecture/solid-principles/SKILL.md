# SOLID Principles

## Purpose

Apply SOLID as design judgment — not as an excuse to multiply abstractions.

## When to Use

Structuring services, controllers, repositories, and shared helpers; reviewing designs.

## Core Principles

- **Single Responsibility:** one reason to change per unit. A service method doing validation + pricing + persistence should be split at natural seams.
- **Open/Closed:** extend via new code (new strategy/branch), not by editing working core paths.
- **Liskov Substitution:** subtypes (e.g. any `ICacheProvider` / `IEmailProvider` implementation) must honor the interface contract — same behavior, no surprises.
- **Interface Segregation:** depend on narrow interfaces (`ICacheProvider.get/set`, not a god object).
- **Dependency Inversion:** high-level services depend on abstractions (tokens + interfaces), not concrete providers — exactly what `TOKENS` + `tsyringe` already do.

## Quick Bite Project Rules

- The codebase already inverts dependencies via `TOKENS` + constructor injection; keep it — never `new` a provider inside a service.
- Do **not** create interfaces "for future flexibility" where one implementation exists; the `pkg/*interface.ts` files exist for real seams (cache, email, broker).
- Repositories are functions, not classes — do not "SOLID-ify" them into class hierarchies.
- SRP here means: controllers handle HTTP, services own rules + transactions, repositories own SQL. Moving code across those lines violates SRP even if it looks cleaner locally.

## Common Mistakes

- Abstract factories/managers around a single Knex query.
- Splitting a cohesive 30-line service method into five one-use classes.
- Depending on concretes (`new RedisCacheProvider()` in a controller) instead of `container.resolve(TOKENS.CacheProvider)`.

## Recommended Approach

1. Identify the responsibility bleed (which two reasons-to-change share a unit?).
2. Move code to the layer that already owns that responsibility.
3. Introduce an abstraction only at a proven seam (second implementation or test boundary).
4. Verify callers still resolve via tokens, and the diff stays small.

## Examples

Good: `MemberService` depends on `IEmailProvider` via token — swapping Mailjet never touches member logic. Bad: a `NotificationManagerFactory` wrapping that single call.

## Verification Checklist

- [ ] Each touched unit has one reason to change.
- [ ] No new abstraction without a second consumer or seam.
- [ ] DI tokens used; no concrete instantiation in services/controllers.

## References

- tsyringe — https://github.com/microsoft/tsyringe ; SOLID overview (R. C. Martin) — https://blog.cleancoder.com/ .
