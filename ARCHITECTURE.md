# Architecture: Feature-Sliced Design (FSD)

The project follows [Feature-Sliced Design](https://feature-sliced.design/). The `app` and `pages` layers are
renamed to `app-layer/` and `pages-layer/` so they do not collide with the Next.js App Router.

## Layers (top to bottom)

| Layer | Folder | Here | Purpose |
|-------|--------|------|---------|
| **app** (routing) | `src/app/` | `layout.tsx`, `page.tsx`, `api/bookings/**` | Next routing only. Route handlers are thin adapters to `src/server` |
| **app-layer** | `src/app-layer/` | `Providers`, `globals.css`, fonts | App initialisation, design tokens |
| **pages** | `src/pages-layer/` | `booking` | Page composition. Holds only "what is selected / being edited" |
| **widgets** | `src/widgets/` | `day-schedule`, `booking-panel` | Self-contained UI blocks with their own states (loading / error / empty) |
| **features** | `src/features/` | `select-date`, `save-booking`, `delete-booking`, `simulate-race` | User actions |
| **entities** | `src/entities/` | `booking` | Business entity: domain model, API, base UI |
| **shared** | `src/shared/` | `api`, `config`, `lib`, `hooks`, `ui` | Infrastructure with no business meaning |

Outside FSD is **`src/server/`** — the mock backend. It is treated as a foreign system the client talks to
over HTTP only.

## The rules

Enforced automatically by `pnpm lint:arch` (`scripts/check-architecture.mjs`).

1. **A layer imports only from layers below it.** `features → entities` ✅, `entities → features` ❌.
2. **Slices of one layer do not know about each other.** `save-booking` and `delete-booking` are combined
   by the `booking-panel` widget, not by a direct import.
3. **Public API only.** Outside a slice use `@/entities/booking`, never `@/entities/booking/api/booking-dto`.
   `shared` is imported by segment: `@/shared/api`, `@/shared/lib`.
4. **`src/server` is reachable only from route handlers** (`src/app/api/**`).
5. **Server-safe modules are framework-free**: `shared/lib`, `shared/config`, `entities/*/model` and
   `src/server` import no React / React Query, because route handlers load them.

## Where the business logic lives

```
                 ┌──────────────────────────────────────────────┐
  pages-layer    │ BookingPage — date, what is being edited     │  composition
                 └───────────────┬──────────────────────────────┘
  widgets        DaySchedule (timeline + states)   BookingPanel (form | read-only | invitation)
                                 │
  features       select-date   save-booking            delete-booking
                               ├ model/form-schema   ← form schema = domain rules
                               └ model/use-booking-submit ← server answer → form state
                                 │
  entities/booking  model/  ← DOMAIN: rules, schedule, types. Pure TS, no React, no network
                    api/    ← endpoints, DTO ↔ domain, errors → BookingRequestError, Query hooks
                    lib/    ← violation wording, formatting
                    ui/     ← BookingBlock
                                 │
  shared            api/ (fetch, ApiError, QueryClient, keys)  lib/ (time, time zone)  ui/ (kit)

  src/server        service (same validateBookingDraft) → repository (interface) → in-memory
```

- The **domain** (`entities/booking/model`) answers "is this allowed?" and returns violation **codes**
  (`OVERLAP`, `TOO_LONG`, …), not strings. "Now" and the list of bookings are arguments, so the functions
  are deterministic and easy to test.
- The entity's **API segment** is the only place that knows URLs and the DTO shape. A raw `ApiError` never
  leaves it: it becomes the discriminated union `BookingRequestError`
  (`conflict | validation | not-found | locked | network | unknown`).
- The **feature** decides *what to do* with an answer: 422 is spread over fields; 409 / 404 / network become a
  banner; the input is never reset. Mutation hooks refresh the schedule *before* the form reacts to an error.
- The **UI** validates nothing by itself — it renders what the domain said.

### Why `entities/booking` has two entry points

`@/entities/booking` is the full public API (including React Query hooks). `@/entities/booking/model` is
the framework-free domain kernel for `src/server`. It is the only sanctioned exception to rule 3 — see
[ADR-0002](docs/adr/0002-shared-domain-rules.md).

## Design system

Tokens from `docs/DESIGN.md` live in `src/app-layer/styles/globals.css` (Tailwind v4 `@theme`).
Deviations for accessibility:

- Small text on the violet stage (`#8584bd`) fails AA, so interactive elements and text sit on Lilac Shadow
  (`#61609a`) or Bone White blocks, where yellow and cream text reach ≥ 4.5:1.
- Font substitutes: ObviouslyVariable → **Unbounded** (wide geometric, has Cyrillic),
  Degular → Inter, Bergen Mono → JetBrains Mono.
- No 184–341px poster type: this is a working tool. The date heading is `clamp(2.5rem, 7vw, 5.5rem)`.

## Path aliases

```ts
"@/*"             → src/*
"@/app-layer/*"   → src/app-layer/*
"@/pages-layer/*" → src/pages-layer/*
"@/widgets/*"     → src/widgets/*
"@/features/*"    → src/features/*
"@/entities/*"    → src/entities/*
"@/shared/*"      → src/shared/*
"@/server/*"      → src/server/*
```
