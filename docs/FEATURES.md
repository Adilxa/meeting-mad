# Feature points

A living register: what the assignment requires, where it is implemented and how it is verified.
Status: ✅ done · 🟡 partial · ⬜ not done · 💡 idea for later.

## 1. User scenarios

| # | Scenario | Status | Where | Verified by |
|---|----------|--------|-------|-------------|
| F1 | Pick a date (‹ › / picker / "Today"); the date is kept in the URL `?date=` | ✅ | `features/select-date` | manual |
| F2 | See the bookings of the date (day timeline 09:00–18:00) | ✅ | `widgets/day-schedule` | `day-schedule.test.tsx` |
| F3 | Choose start and end (15-minute selects; click on a free slot) | ✅ | `features/save-booking`, `widgets/day-schedule` | `booking-form.test.tsx` |
| F4 | Create a booking | ✅ | `features/save-booking` | `booking-form.test.tsx` |
| F5 | Edit a booking (click a booking → form) | ✅ | `features/save-booking`, `widgets/booking-panel` | `service.test.ts` |
| F6 | Delete a booking (with confirmation) | ✅ | `features/delete-booking` | `service.test.ts` |

## 2. Business rules

Every rule lives in one pure function, `validateBookingDraft` in `entities/booking/model/rules.ts`.
**Both the form and the mock server** call it, so they cannot disagree.

| # | Rule | Status | Test |
|---|------|--------|------|
| R1 | Start and end within 09:00–18:00 | ✅ | `rules.test.ts › rule 1` |
| R2 | start < end | ✅ | `rules.test.ts › rule 2` |
| R3 | At least 30 minutes | ✅ | `rules.test.ts › rules 3–4` |
| R4 | At most 2 hours | ✅ | `rules.test.ts › rules 3–4` |
| R5 | No overlaps; touching boundaries (10–11 and 11–12) is not a conflict | ✅ | `rules.test.ts › rule 5` |
| R6 | No past: past dates are closed, today only from the current minute | ✅ | `rules.test.ts › rule 6` |
| R7 | An edited booking does not conflict with itself | ✅ | `rules.test.ts › rule 7`, `service.test.ts` |
| R8 | The server may answer 409 even if the UI thought the slot was free: show a message, refresh the list, keep the input | ✅ | `booking-form.test.tsx › handles a 409` |

## 3. UI states

| # | State | Status | Where |
|---|-------|--------|-------|
| S1 | Schedule loading (skeleton, `aria-busy`) | ✅ | `DaySchedule` |
| S2 | Empty day | ✅ | `DaySchedule` |
| S3 | Load error + retry; background refresh error while data is shown | ✅ | `DaySchedule` |
| S4 | Form submission ("saving…" button, fieldset disabled, input kept) | ✅ | `BookingForm` |
| S5 | Server errors: 409 conflict / 422 rules / 404 deleted / booking started / no network | ✅ | `use-booking-submit.ts`, `booking-error.ts` |
| S6 | Past date / working day over — view only | ✅ | `BookingPanel` |
| S7 | Booking that has started — view only | ✅ | `BookingPanel` |
| S8 | Background schedule refresh (30 s polling, tab focus) | ✅ | `useBookings` |

## 4. Engineering requirements

| # | Requirement | Status | How |
|---|-------------|--------|-----|
| E1 | Network layer separated from UI and easy to replace | ✅ | `shared/api` (transport) → `entities/booking/api` (endpoints, DTO, mapping). Switching = `NEXT_PUBLIC_API_URL` |
| E2 | Mock API on the contract `GET/POST/PATCH/DELETE /api/bookings` | ✅ | Route Handlers → `src/server/bookings` (service + repository behind an interface) |
| E3 | Server validates the rules and returns 409 | ✅ | `server/bookings/service.ts` |
| E4 | FSD layers, public API, import rules enforced automatically | ✅ | `ARCHITECTURE.md`, `pnpm lint:arch` |
| E5 | Strict TypeScript | ✅ | `strict`, `noUncheckedIndexedAccess` |
| E6 | Responsive | ✅ | single column on phones, panel below the timeline with focus moved to it |
| E7 | Basic accessibility | ✅ | semantic buttons, `aria-*`, live regions, visible focus, AA contrast, `prefers-reduced-motion` |
| E8 | Tests | ✅ | 47 tests: domain, server, error mapping, components |

## 5. Decisions on ambiguities

The assignment encourages asking questions. Until answered, these decisions were taken — each one is changed
in a single place:

| # | Question | Decision | Where to change |
|---|----------|----------|-----------------|
| Q1 | Which time zone defines "now" and "today"? | The office's (`Asia/Almaty` by default, `NEXT_PUBLIC_OFFICE_TIME_ZONE`). The room is physical; browser and server (Vercel = UTC) must agree | `shared/config/office.ts` |
| Q2 | Can a started or past booking be edited / deleted? | No, view only. The server answers `422 BOOKING_STARTED` | `hasStarted` in `rules.ts` |
| Q3 | Time picker step? | 15 minutes in the UI. The API accepts any minute; no step rule was introduced | `TIME_STEP_MINUTES` |
| Q4 | Status for "rules violated" (not a conflict)? | `422 VALIDATION_FAILED` + `violations[]`. If rules are broken *and* there is an overlap — 422, not 409: 409 is reserved for "the world has changed" | `classify` in `service.ts` |
| Q5 | Moving a booking to another date while editing? | Supported by the domain and the API; the form keeps the booking's date fixed | `BookingForm` |
| Q6 | Maximum booking horizon? | Unlimited | — |

## 6. Backlog

| # | Idea | Why not now |
|---|------|-------------|
| B1 | 💡 Persistent storage (Upstash / Postgres) instead of in-memory | On serverless each instance has its own memory. Needs only a new `BookingRepository` implementation |
| B2 | 💡 Optimistic create / delete | Waiting for the server shows the 409 path honestly |
| B3 | 💡 Playwright e2e: create → 409 → another slot | The scenario is covered by a component test |
| B4 | 💡 Drag / resize bookings on the timeline | Out of the timebox; the form is the keyboard-accessible alternative |
| B5 | 💡 i18n (next-intl) | The assignment is in Russian; UI strings live in two modules, so the move is mechanical |
| B6 | 💡 Server-side prefetch of the schedule (HydrationBoundary) | It would hide the loading state the assignment asks to show |
