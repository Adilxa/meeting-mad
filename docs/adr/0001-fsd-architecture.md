# ADR-0001: Feature-Sliced Design

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

The assignment evaluates how business logic is split into layers and how the API is separated from the UI.
The structure must make those boundaries obvious to a reviewer and keep them from eroding.

## Considered options

1. **Flat structure** (`components/`, `hooks/`, `utils/`): fast to start, boundaries are invisible.
2. **Clean Architecture** (domain / application / infrastructure): clear boundaries, but an unusual idiom for a frontend.
3. **FSD**: explicit layers and import rules that can be checked automatically.

## Decision

FSD, with `app-layer/` and `pages-layer/` renamed to avoid the Next.js router folders. The domain is the
framework-free `model` segment of the `entities/booking` slice. Import rules are enforced by
`scripts/check-architecture.mjs` (`pnpm lint:arch`).

## Consequences

- (+) Business rules, network and UI are separated so each can be replaced on its own.
- (+) Layer violations are caught by a script, not only by code review.
- (−) Many folders for a single screen — a deliberate price for clarity.
