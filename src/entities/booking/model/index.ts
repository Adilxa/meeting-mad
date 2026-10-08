/**
 * Domain kernel of the booking entity — pure TypeScript, no React, no network.
 *
 * It has its own entry point (besides the slice's `index.ts`) for exactly one reason: the
 * mock API in `src/server` validates with the same rules, and must not drag React Query
 * hooks into a route handler. See docs/adr/0002-shared-domain-rules.md.
 */
export {
  GRID_SLOT_MINUTES,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  TIME_STEP_MINUTES,
  TITLE_MAX_LENGTH,
  WORKDAY_END,
  WORKDAY_END_MINUTES,
  WORKDAY_START,
  WORKDAY_START_MINUTES,
} from './constants';
export {
  findConflicts,
  hasStarted,
  isDateBookable,
  isPast,
  rangesOverlap,
  type ValidationContext,
  validateBookingDraft,
} from './rules';
export {
  buildDaySlots,
  type DaySlot,
  findFirstAvailableRange,
  getEndOptions,
  getStartOptions,
  type SlotState,
  suggestEnd,
  type TimeOption,
} from './schedule';
export type {
  Booking,
  BookingDraft,
  BookingField,
  BookingViolation,
  BookingViolationCode,
  TimeRange,
} from './types';
