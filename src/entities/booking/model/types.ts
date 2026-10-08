import type { ClockTime, IsoDate } from '@/shared/lib';

/** A half-open interval `[start, end)` within one day. */
export type TimeRange = {
  start: ClockTime;
  end: ClockTime;
};

export type Booking = TimeRange & {
  id: string;
  date: IsoDate;
  title?: string;
};

/** What a user is asking for — a booking that does not exist yet (or a new shape of one). */
export type BookingDraft = TimeRange & {
  date: IsoDate;
  title?: string;
};

export type BookingField = 'date' | 'start' | 'end' | 'title';

/**
 * Why a draft is not allowed. Codes, not strings: the domain says *what* is wrong, each
 * presentation (form, server response) decides *how* to say it.
 */
export type BookingViolation =
  | { code: 'INVALID_DATE'; field: 'date' }
  | { code: 'INVALID_TIME'; field: 'start' | 'end' }
  | { code: 'TITLE_TOO_LONG'; field: 'title' }
  | { code: 'OUTSIDE_WORKING_HOURS'; field: 'start' | 'end' }
  | { code: 'END_NOT_AFTER_START'; field: 'end' }
  | { code: 'TOO_SHORT'; field: 'end' }
  | { code: 'TOO_LONG'; field: 'end' }
  | { code: 'PAST_DATE'; field: 'date' }
  | { code: 'PAST_TIME'; field: 'start' }
  | { code: 'OVERLAP'; field: 'start'; conflicts: Booking[] };

export type BookingViolationCode = BookingViolation['code'];
