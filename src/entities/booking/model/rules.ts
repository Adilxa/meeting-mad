import { isClockTime, isIsoDate, toMinutes, type ZonedNow } from '@/shared/lib';
import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  TITLE_MAX_LENGTH,
  WORKDAY_END_MINUTES,
  WORKDAY_START_MINUTES,
} from './constants';
import type { Booking, BookingDraft, BookingViolation, TimeRange } from './types';

export type ValidationContext = {
  now: ZonedNow;
  /** Bookings already known for the day (or more — other dates are ignored). */
  bookings: readonly Booking[];
  /** The booking being edited: it must not conflict with itself (rule 7). */
  ignoreId?: string;
};

/**
 * Half-open intervals: touching is not overlapping — `10:00–11:00` and `11:00–12:00`
 * share a boundary, not a minute (rule 5).
 */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

export function findConflicts(
  draft: TimeRange & { date: string },
  bookings: readonly Booking[],
  ignoreId?: string,
): Booking[] {
  return bookings.filter(
    (booking) =>
      booking.id !== ignoreId && booking.date === draft.date && rangesOverlap(draft, booking),
  );
}

/** Rule 6: a date before today is closed; today is open only from the current minute on. */
export function isPast(date: string, minutes: number, now: ZonedNow): boolean {
  return date < now.date || (date === now.date && minutes < now.minutes);
}

/**
 * Checks a draft against every business rule and reports *all* violations at once, so a
 * form can mark every wrong field in one pass. An empty array means the draft is valid.
 *
 * This is the single source of truth: the form validates with it as the user types, and
 * the API validates with it again — the server's answer is what counts (rule 8).
 */
export function validateBookingDraft(
  draft: BookingDraft,
  context: ValidationContext,
): BookingViolation[] {
  const violations: BookingViolation[] = [];

  if (draft.title !== undefined && draft.title.trim().length > TITLE_MAX_LENGTH) {
    violations.push({ code: 'TITLE_TOO_LONG', field: 'title' });
  }

  const dateValid = isIsoDate(draft.date);
  const startValid = isClockTime(draft.start);
  const endValid = isClockTime(draft.end);
  if (!dateValid) violations.push({ code: 'INVALID_DATE', field: 'date' });
  if (!startValid) violations.push({ code: 'INVALID_TIME', field: 'start' });
  if (!endValid) violations.push({ code: 'INVALID_TIME', field: 'end' });
  // Nothing below means anything for a malformed value.
  if (!dateValid || !startValid || !endValid) return violations;

  const start = toMinutes(draft.start);
  const end = toMinutes(draft.end);

  // Rule 1 — inside the working day.
  if (start < WORKDAY_START_MINUTES || start >= WORKDAY_END_MINUTES) {
    violations.push({ code: 'OUTSIDE_WORKING_HOURS', field: 'start' });
  }
  if (end <= WORKDAY_START_MINUTES || end > WORKDAY_END_MINUTES) {
    violations.push({ code: 'OUTSIDE_WORKING_HOURS', field: 'end' });
  }

  // Rules 2–4 — order and duration.
  if (start >= end) {
    violations.push({ code: 'END_NOT_AFTER_START', field: 'end' });
  } else if (end - start < MIN_DURATION_MINUTES) {
    violations.push({ code: 'TOO_SHORT', field: 'end' });
  } else if (end - start > MAX_DURATION_MINUTES) {
    violations.push({ code: 'TOO_LONG', field: 'end' });
  }

  // Rule 6 — not in the past.
  if (draft.date < context.now.date) {
    violations.push({ code: 'PAST_DATE', field: 'date' });
  } else if (isPast(draft.date, start, context.now)) {
    violations.push({ code: 'PAST_TIME', field: 'start' });
  }

  // Rules 5 and 7 — no overlap with anyone but itself. Only meaningful for a real interval.
  if (start < end) {
    const conflicts = findConflicts(draft, context.bookings, context.ignoreId);
    if (conflicts.length > 0) violations.push({ code: 'OVERLAP', field: 'start', conflicts });
  }

  return violations;
}

/**
 * A booking that has already begun is history: it can be looked at, not moved or removed.
 * (An assumption — the brief only forbids booking the past; see docs/FEATURES.md.)
 */
export function hasStarted(booking: Pick<Booking, 'date' | 'start'>, now: ZonedNow): boolean {
  return (
    booking.date < now.date ||
    (booking.date === now.date && toMinutes(booking.start) <= now.minutes)
  );
}

/** Whether there is any minute left on `date` that a new booking could start at. */
export function isDateBookable(date: string, now: ZonedNow): boolean {
  if (date < now.date) return false;
  if (date > now.date) return true;
  return now.minutes <= WORKDAY_END_MINUTES - MIN_DURATION_MINUTES;
}
