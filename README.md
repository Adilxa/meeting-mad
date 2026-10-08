# Meeting room booking

Frontend Engineer test assignment: booking a meeting room within one working day (09:00–18:00).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · TanStack Query · React Hook Form + Zod ·
Tailwind CSS v4 · Radix · Vitest + Testing Library · Biome. Architecture — **Feature-Sliced Design**.

## Getting started

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

```bash
pnpm verify         # type-check + Biome + FSD import rules + tests
pnpm test           # 47 tests
pnpm lint:arch      # layer rules only
pnpm build && pnpm start
```

Environment variables are listed in `.env.example` (all optional).

## What is done

- Date selection (arrows, picker, "Today"). The date lives in the URL, so a link can be shared and Back works.
- Day timeline: click a free slot to create, click a booking to edit. A "now" line; past time is hatched.
- Create, edit, delete (with confirmation).
- All 8 business rules are one pure function shared by the form and the server
  (`entities/booking/model/rules.ts`).
- Time pickers keep unavailable options (past / busy) visible but disabled; changing the start adjusts the end.
- **409**: a clear message naming who took the time; the schedule is refreshed before the error is shown;
  the user's input stays in the form; the field points at the conflict.
  To reproduce: tick **"Демо: коллега успевает раньше"** (demo: a colleague is faster) and save any booking.
- Also handled: 422 (per field), 404 (booking deleted elsewhere — "create a new one with this data"),
  a booking that has started (read-only), no network.
- States: loading (skeleton), empty day, error with retry, background refresh, form submission.
- Responsive (single column on phones) and accessible: real buttons with screen-reader labels,
  `aria-invalid` / `aria-describedby`, live regions, focus moved to the panel, visible focus, AA contrast,
  reduced motion.
- Mock API (`/api/bookings`) following the contract from the assignment, on Route Handlers + an in-memory
  repository behind an interface.

Full register with links to code and tests — **[docs/FEATURES.md](docs/FEATURES.md)**.
Architecture — **[ARCHITECTURE.md](ARCHITECTURE.md)**, decisions — `docs/adr/`.

## Structure

```
src/
├─ app/                 # Next routing + api/bookings (thin route handlers)
├─ app-layer/           # providers, design tokens, fonts
├─ pages-layer/booking  # screen composition
├─ widgets/             # day-schedule, booking-panel
├─ features/            # select-date, save-booking, delete-booking, simulate-race
├─ entities/booking     # model (domain) · api (network, DTO, errors) · lib · ui
├─ shared/              # api · config · lib · hooks · ui
└─ server/bookings      # mock backend: service → repository
```

## Decisions on ambiguities

Office time zone, rules for bookings that have started, 422 vs 409, etc. — see section 5 of
[docs/FEATURES.md](docs/FEATURES.md#5-decisions-on-ambiguities). Each one is changed in a single place.

The UI language is Russian, matching the assignment.

## Not done / next steps

- Persistent storage for deployment: on Vercel the in-memory store lives per instance (ADR-0003).
- Playwright e2e, drag-and-drop on the timeline, i18n — see the backlog in `docs/FEATURES.md`.

## Time spent

~1 hour.

## Demo and AI chat

- Deployed demo: _link after deployment_
- AI chat: [docs/AI_CHAT.md](docs/AI_CHAT.md)
