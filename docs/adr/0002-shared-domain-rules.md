# ADR-0002: One set of business rules for the client and the mock server

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

The rules (working day, duration, overlaps, past) are checked twice: in the form, to show an error
immediately, and on the server, because the server has the last word (rule 8). Two copies of the rules
drift apart sooner or later.

## Decision

The rules are pure functions in `entities/booking/model` (`validateBookingDraft` and friends), independent of
React, the network and the system clock: "now" is an argument. The mock API service imports them through a
separate entry point, `@/entities/booking/model`, because the slice's main `index.ts` pulls in React Query
hooks that do not belong in a route handler. This is the only exception to the public-API rule and it is
encoded in `check-architecture.mjs`.

The domain returns violation **codes**. The client picks the wording (`violationMessage`) and branches on
`code`, never on the server's text.

## Consequences

- (+) The form and the server cannot disagree; the rule tests cover both sides.
- (+) A real backend will likely be written in another language. The client copy then stays as a fast
  pre-check and the server remains the source of truth — no client code changes.
- (−) The second entry point must be remembered; the architecture linter catches mistakes.
