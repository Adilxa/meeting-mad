# ADR-0003: Mock API on Route Handlers and office time

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

A server is needed that validates the rules and can answer 409. The network layer must be easy to replace
with a real API. The "no past" rule depends on *whose* "now" it is.

## Decision

- **Route Handlers + in-memory storage** rather than MSW. Requests go over real HTTP: the same `fetch`, the
  same statuses, visible in the Network tab. The client does not know the server is a mock. Switching to a
  real backend = `NEXT_PUBLIC_API_URL`.
- The server is structured like an application: `service` (rules, 409/422/404 classification) →
  `BookingRepository` (interface) → `InMemoryBookingRepository`.
- **409 on demand**: the `x-mock-scenario: race` header makes the server book the slot "for a colleague"
  right before handling the request. In the UI this is the "Demo" checkbox; without it a race could only be
  reproduced by luck.
- Artificial latency `MOCK_LATENCY_MS` (400 ms) so loading and submitting states are visible.
- **Office time**: `Asia/Almaty` (env `NEXT_PUBLIC_OFFICE_TIME_ZONE`). Both browser and server compute
  "today / now" in that zone via `Intl`. The first client render reuses the server render's instant, so
  hydration never mismatches.

## Consequences

- (−) On serverless (Vercel) every instance has its own memory: demo data may jump between instances and
  reset on a cold start. Fixed by a KV / Postgres `BookingRepository` — neither the service nor the client
  changes.
