# AI chat log

Conversation with Claude Code (model: Claude Opus 5.5) that produced this repository.
The original conversation was in Russian. This is an English translation, condensed: the user's
messages are translated close to verbatim, the assistant's turns are summarised with the decisions made
and the problems found along the way. Tool output (file dumps, command logs) is omitted.

---

## 1. Kick-off

**User:**
> I'm doing a test assignment and need to start the project based on the architecture of my
> existing project. Build it in a neighbouring folder, start keeping *feature points* in a Markdown
> file, and use the UI template `DESIGN.md`. The spec is `ТЗ Frontend Engineer.pdf`. Build it properly
> and by the architecture — I will review it. The most important thing is the correct separation of
> business logic into layers. Use FSD, I think it'll be fine — do it like in my existing project.

**Assistant — research:**
- Read the spec: meeting-room booking for one working day (09:00–18:00), create/edit/delete, 8 business
  rules (bounds, start < end, 30 min – 2 h, no overlap but touching is fine, no past, no self-conflict
  when editing, server may answer 409 and the UI must handle it without losing input), API contract
  `GET/POST/PATCH/DELETE /api/bookings`, mock server allowed.
- Read `DESIGN.md` ("Flying Papers": dusk-violet stage, bone-white cards, hi-vis-yellow outlined actions,
  6px cards / 100px pills, no shadows).
- Read the reference project: `ARCHITECTURE.md` (FSD with `app-layer/` and `pages-layer/` renamed for the Next
  router), `biome.json`, `tsconfig.json`, the `shared/api` idioms (`ApiError`, centralised `queryKeys`,
  `makeQueryClient` with "4xx are answers, don't retry"), and an entity/feature pair as a style reference.

**Assistant — plan (stated before coding):**
- Same stack as the reference project: Next 16, React 19, strict TS, Tailwind v4, TanStack Query, RHF + Zod,
  Biome, Vitest.
- Business rules as pure functions in `entities/booking/model`. The mock server imports the same
  functions, so the client and the server cannot drift apart.
- Mock API on Next Route Handlers + an in-memory repository behind an interface (`src/server`),
  with an on-demand "race" scenario so the 409 path can be demonstrated deterministically.
- Docs: `docs/FEATURES.md` (feature points), `ARCHITECTURE.md`, ADRs, README, and a script that
  enforces FSD import rules.

## 2. Implementation

Built bottom-up, layer by layer:

| Layer | What was written |
|-------|------------------|
| `shared/lib` | strict date/time parsing, minutes ↔ `HH:mm`, UTC-safe `addDays`, `getZonedNow(timeZone)` |
| `shared/config` | office time zone (`Asia/Almaty`, env-overridable), mock-scenario header name |
| `shared/api` | `fetch` client that normalises every failure into `ApiError` (network = status 0), query client, query keys |
| `entities/booking/model` | `validateBookingDraft` returning violation **codes**; `rangesOverlap` (half-open intervals); `hasStarted`; schedule helpers (day slots, start/end options with disabled reasons, suggested end, first free range) |
| `entities/booking/api` | DTO ↔ domain mapping, `bookingApi` (the only module that knows URLs), `toBookingRequestError` → `conflict / validation / not-found / locked / network / unknown`, Query hooks; mutations refresh the schedule in `onSettled`, which TanStack awaits before the caller's callbacks |
| `src/server/bookings` | `BookingService` (same domain rules; overlap-only → 409, other violations → 422, started → `422 BOOKING_STARTED`, unknown id → 404), `BookingRepository` interface + in-memory impl, seed data, race simulation, artificial latency |
| `features` | `select-date` (date in the URL), `save-booking` (Zod schema whose refinement *is* the domain validator; submit hook maps server errors into form state and never resets the input), `delete-booking` (Radix alert dialog), `simulate-race` (demo toggle) |
| `widgets` | `day-schedule` (timeline + loading / empty / error-with-retry / background-refresh states), `booking-panel` (idle / create / edit / read-only, focus moves to the panel heading) |
| `pages-layer` | `BookingPage`: composition only; resets the editor when the date changes |

Assumptions where the spec was ambiguous were recorded in `docs/FEATURES.md` §5 rather than guessed silently:
office time zone for "now", started bookings are read-only, 15-minute picker step (the API accepts any minute),
422 vs 409 classification, date fixed while editing.

## 3. Problems found and fixed during the session

1. **Display font without Cyrillic.** The first substitute for ObviouslyVariable (Archivo) has no Cyrillic
   subset — caught by the type checker on `next/font`. Switched to **Unbounded** (wide geometric, has Cyrillic).
2. **Unused constant / exhaustive-deps warning.** Removed the constant; the effect that re-validates the form
   after a 409 deliberately depends on `bookings`, documented with a `biome-ignore` reason.
3. **The FSD checker flagged the layer barrel** `pages-layer/index.ts` as a cross-slice import. Taught it that
   a layer-level barrel may re-export its slices' public APIs. Verified the checker against three deliberate
   violations (upward import, cross-slice import, UI importing the server) — all caught.
4. **Production build failed:** a route handler imported `shared/lib`, whose barrel re-exported a React hook
   (`useState` is not allowed in the server layer). Fix: React hooks moved to a separate `shared/hooks`
   segment; `shared/lib` stays framework-free. A fifth rule was added to the checker so this cannot recur:
   `shared/lib`, `shared/config`, `entities/*/model` and `src/server` must not import React / React Query.
5. **Port collision.** Port 3100 was taken by another local project; the app was started on 3417 instead.
6. **Browser check.** Walked through the main flow in Chrome: tomorrow → enable "a colleague is faster" →
   click a free slot → type a title → submit. Result: the 409 banner names the colleague's booking, the
   schedule refreshed and shows it, the typed title and times stayed in the form, and the start field points
   at the conflict. One visual nit — the draft preview covered the colleague's label — fixed by drawing the
   preview under the bookings.

Verification at the end of this step: `pnpm verify` (type-check + Biome + FSD rules + 47 tests) green,
`pnpm build` green, API smoke-tested with curl (409 / 422 / 400 / 404 bodies as documented).

## 4. UI fix: text cut off in short bookings

**User** (with a screenshot of the 30-minute block "Забронировал коллега" cut in half):
> UI fixes — the text must be displayed in full.

**Assistant:**
- Cause: a 30-minute cell was 44px tall, while a block needs ~52px for the time row plus a title line, so
  the second line was clipped mid-glyph.
- Fix: cell height raised to 3.5rem; the number of title lines now depends on duration (1 line for 30 min,
  3 for an hour, 5 for 90 min and more); anything that still does not fit ends with an ellipsis, with the
  full text in a tooltip and in the button's accessible name. The timeline height is now computed once
  from the working-day rules (CSS variable) instead of a magic number in three places.
- While checking, found that the browser was showing an old production build still running on port 3417,
  and that the user's own `pnpm dev` was on port 3000; verified there instead, without touching the user's
  server, and removed the test booking afterwards.

## 5. Publishing

**User** (pasted GitHub's "create a new repository" snippet for `Adilxa/meeting-mad`):
> Push it to GitHub.

**Assistant:** committed the project as one conventional commit and pushed to `main`. Skipped the snippet's
`echo "# meeting-mad" >> README.md`, which would have appended a stray heading to the finished README.

**User:**
> Time spent — 1 hour. Write the AI chat in English and push it.

**Assistant:** filled in the time in the README, added this log, linked it from the README, pushed.

**User:**
> Remove extra words like references to my other project, and push in English.

**Assistant:** removed references to the other project and translated the README, `ARCHITECTURE.md`,
`docs/FEATURES.md` and the ADRs into English. The UI text stays in Russian, matching the assignment.
