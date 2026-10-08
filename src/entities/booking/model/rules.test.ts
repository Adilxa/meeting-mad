import type { ZonedNow } from '@/shared/lib';
import {
  findConflicts,
  hasStarted,
  isDateBookable,
  rangesOverlap,
  validateBookingDraft,
} from './rules';
import type { Booking, BookingDraft } from './types';

const TODAY = '2026-10-08';
const TOMORROW = '2026-10-09';
const YESTERDAY = '2026-10-07';
/** 10:10 in the office. */
const now: ZonedNow = { date: TODAY, minutes: 10 * 60 + 10 };

const existing: Booking[] = [
  { id: 'a', date: TOMORROW, start: '10:00', end: '11:00', title: 'Планёрка' },
];

const codes = (draft: BookingDraft, bookings: Booking[] = existing, ignoreId?: string) =>
  validateBookingDraft(draft, { now, bookings, ignoreId }).map((violation) => violation.code);

const draft = (start: string, end: string, date = TOMORROW): BookingDraft => ({ date, start, end });

describe('validateBookingDraft', () => {
  it('accepts a valid booking', () => {
    expect(codes(draft('12:00', '13:00'))).toEqual([]);
  });

  describe('rule 1 — working day 09:00–18:00', () => {
    it('accepts the exact edges of the day', () => {
      expect(codes(draft('09:00', '09:30'))).toEqual([]);
      expect(codes(draft('17:30', '18:00'))).toEqual([]);
    });
    it('rejects a start before 09:00 and an end after 18:00', () => {
      expect(codes(draft('08:30', '09:30'))).toEqual(['OUTSIDE_WORKING_HOURS']);
      expect(codes(draft('17:30', '18:15'))).toEqual(['OUTSIDE_WORKING_HOURS']);
    });
  });

  describe('rule 2 — start < end', () => {
    it('rejects equal and reversed times', () => {
      expect(codes(draft('12:00', '12:00'))).toContain('END_NOT_AFTER_START');
      expect(codes(draft('13:00', '12:00'))).toContain('END_NOT_AFTER_START');
    });
  });

  describe('rules 3–4 — duration 30 min … 2 h', () => {
    it('accepts exactly 30 minutes and exactly 2 hours', () => {
      expect(codes(draft('12:00', '12:30'))).toEqual([]);
      expect(codes(draft('12:00', '14:00'))).toEqual([]);
    });
    it('rejects 29 minutes and 2 h 1 min', () => {
      expect(codes(draft('12:00', '12:29'))).toEqual(['TOO_SHORT']);
      expect(codes(draft('12:00', '14:01'))).toEqual(['TOO_LONG']);
    });
  });

  describe('rule 5 — no overlaps, touching is fine', () => {
    it('allows back-to-back bookings', () => {
      expect(codes(draft('09:00', '10:00'))).toEqual([]);
      expect(codes(draft('11:00', '12:00'))).toEqual([]);
    });
    it('rejects partial, inner and covering overlaps and names the conflict', () => {
      expect(codes(draft('09:30', '10:30'))).toEqual(['OVERLAP']);
      expect(codes(draft('10:15', '10:45'))).toEqual(['OVERLAP']);
      expect(codes(draft('09:30', '11:30'))).toEqual(['OVERLAP']);
      const [violation] = validateBookingDraft(draft('10:30', '11:30'), {
        now,
        bookings: existing,
      });
      expect(violation).toMatchObject({ code: 'OVERLAP', conflicts: [{ id: 'a' }] });
    });
    it('ignores bookings of other days', () => {
      expect(codes(draft('10:00', '11:00', '2026-10-10'))).toEqual([]);
    });
  });

  describe('rule 6 — not in the past', () => {
    it('rejects any time on a past date', () => {
      expect(codes(draft('12:00', '13:00', YESTERDAY))).toEqual(['PAST_DATE']);
    });
    it('rejects a start before the current minute today, accepts from it on', () => {
      expect(codes(draft('10:00', '11:00', TODAY))).toEqual(['PAST_TIME']);
      expect(codes(draft('10:10', '11:00', TODAY))).toEqual([]);
    });
  });

  describe('rule 7 — editing does not conflict with itself', () => {
    it('ignores the booking being edited', () => {
      expect(codes(draft('10:00', '11:30'), existing)).toEqual(['OVERLAP']);
      expect(codes(draft('10:00', '11:30'), existing, 'a')).toEqual([]);
    });
  });

  it('reports malformed input without guessing the rest', () => {
    expect(codes({ date: '2026-13-01', start: '9:00', end: '10:00' })).toEqual([
      'INVALID_DATE',
      'INVALID_TIME',
    ]);
  });

  it('limits the title length', () => {
    expect(codes({ ...draft('12:00', '13:00'), title: 'x'.repeat(101) })).toEqual([
      'TITLE_TOO_LONG',
    ]);
  });
});

describe('helpers', () => {
  it('rangesOverlap treats intervals as half-open', () => {
    expect(rangesOverlap({ start: '10:00', end: '11:00' }, { start: '11:00', end: '12:00' })).toBe(
      false,
    );
    expect(rangesOverlap({ start: '10:00', end: '11:01' }, { start: '11:00', end: '12:00' })).toBe(
      true,
    );
  });

  it('findConflicts skips the ignored id', () => {
    expect(findConflicts(draft('10:00', '11:00'), existing, 'a')).toEqual([]);
  });

  it('hasStarted is true from the start minute on', () => {
    expect(hasStarted({ date: TODAY, start: '10:10' }, now)).toBe(true);
    expect(hasStarted({ date: TODAY, start: '10:15' }, now)).toBe(false);
    expect(hasStarted({ date: YESTERDAY, start: '17:00' }, now)).toBe(true);
  });

  it('isDateBookable closes past dates and the tail of today', () => {
    expect(isDateBookable(YESTERDAY, now)).toBe(false);
    expect(isDateBookable(TODAY, now)).toBe(true);
    expect(isDateBookable(TODAY, { date: TODAY, minutes: 17 * 60 + 31 })).toBe(false);
  });
});
