# Documentation

## Purpose

Write docs that stay true to the code and stay useful over time.

## When to Use

Creating/updating `Docs/`, `Agent/`, code comments, or contract descriptions.

## Core Principles

- Docs describe what the code **does**, verified by reading it — never aspirational behavior.
- Document quirks and discrepancies instead of silently "fixing" them in prose.
- Mark anything unverifiable as **Undetermined** with a pointer to the code to check.

## Quick Bite Project Rules

- API contracts live in `Docs/API Contracts/<module>.md` (endpoints, methods, status codes, body shapes, error cases). Update the module file when a response shape changes.
- Business flows live in `Docs/business-logic/<module>.md` (mermaid `flowchart`/`stateDiagram-v2`, no nested `[]` inside node labels, no `&`/`->` inside labels, no `<br/>` in state descriptions).
- System docs live in `Docs/system-design/` (system, database `erDiagram`, folder-structure).
- Code comments stay concise; no long reasoning dumps. Business-rule comments cite the file/line (e.g. `member.service.ts:194`).

## Common Mistakes

- Inventing endpoints, fields, or optionality not present in code.
- Copying a response shape from one endpoint to a sibling with a different projection (e.g. customer `toResponse` vs internal `getById`).
- Letting contract docs drift after a DTO change.

## Recommended Approach

1. Read the controller + service + repository before writing a word.
2. Record methods, codes, and shapes exactly as coded, quirks included.
3. Keep each doc in its home (contracts vs logic vs system); cross-link instead of duplicating.
4. After any behavior change, update the matching contract/logic doc in the same task.

## Examples

Documenting `GET /internal/branches/:id`: list the explicit controller projection field-by-field; note it is **not** the full `Branch` entity.

## Verification Checklist

- [ ] Every endpoint/field claim traces to source lines.
- [ ] Quirks and gaps explicitly marked.
- [ ] No invented behavior; no stale contradictions.

## References

- Response DTOs & API Contracts skill (this library).
