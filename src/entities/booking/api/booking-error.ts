import { ApiError } from '@/shared/api';
import type { Booking, BookingViolation, BookingViolationCode } from '../model';
import { type BookingDto, toBooking } from './booking-dto';

/**
 * Every way a booking request can fail, in terms the UI can act on. The raw `ApiError`
 * stays in the API segment; features switch on `kind`.
 */
export type BookingRequestError =
  /** 409 — someone took the time first. Expected (rule 8), not a bug. */
  | { kind: 'conflict'; conflicts: Booking[] }
  /** 422 — the server's rules said no (the client's view of the rules was stale). */
  | { kind: 'validation'; violations: BookingViolation[] }
  /** 404 — the booking was deleted elsewhere. */
  | { kind: 'not-found' }
  /** 422 `BOOKING_STARTED` — the booking has already begun and is read-only. */
  | { kind: 'locked' }
  | { kind: 'network' }
  | { kind: 'unknown'; message: string };

/** API error code for an edit/delete of a booking that has already begun. */
const BOOKING_STARTED_CODE = 'BOOKING_STARTED';

const KNOWN_CODES = new Set<BookingViolationCode>([
  'INVALID_DATE',
  'INVALID_TIME',
  'TITLE_TOO_LONG',
  'OUTSIDE_WORKING_HOURS',
  'END_NOT_AFTER_START',
  'TOO_SHORT',
  'TOO_LONG',
  'PAST_DATE',
  'PAST_TIME',
  'OVERLAP',
]);

function isBookingDto(value: unknown): value is BookingDto {
  if (typeof value !== 'object' || value === null) return false;
  const dto = value as Record<string, unknown>;
  return ['id', 'date', 'start', 'end'].every((key) => typeof dto[key] === 'string');
}

function readConflicts(value: unknown): Booking[] {
  return Array.isArray(value) ? value.filter(isBookingDto).map(toBooking) : [];
}

/** Server violations are trusted only as far as we understand them; unknown codes drop out. */
function readViolations(value: unknown): BookingViolation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): BookingViolation[] => {
    if (typeof item !== 'object' || item === null) return [];
    const { code, field } = item as { code?: unknown; field?: unknown };
    if (typeof code !== 'string' || !KNOWN_CODES.has(code as BookingViolationCode)) return [];
    if (code === 'OVERLAP') {
      return [
        {
          code,
          field: 'start',
          conflicts: readConflicts((item as { conflicts?: unknown }).conflicts),
        },
      ];
    }
    return [{ code, field } as BookingViolation];
  });
}

export function toBookingRequestError(error: unknown): BookingRequestError {
  if (!ApiError.isApiError(error)) {
    return { kind: 'unknown', message: error instanceof Error ? error.message : String(error) };
  }
  if (error.isNetworkError) return { kind: 'network' };
  if (error.code === BOOKING_STARTED_CODE) return { kind: 'locked' };

  switch (error.status) {
    case 409:
      return { kind: 'conflict', conflicts: readConflicts(error.payload.conflicts) };
    case 404:
      return { kind: 'not-found' };
    case 400:
    case 422: {
      const violations = readViolations(error.payload.violations);
      return violations.length > 0
        ? { kind: 'validation', violations }
        : { kind: 'unknown', message: error.message };
    }
    default:
      return { kind: 'unknown', message: error.message };
  }
}
