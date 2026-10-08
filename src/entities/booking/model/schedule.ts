import { type ClockTime, fromMinutes, isClockTime, toMinutes, type ZonedNow } from '@/shared/lib';
import {
  GRID_SLOT_MINUTES,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  TIME_STEP_MINUTES,
  WORKDAY_END_MINUTES,
  WORKDAY_START_MINUTES,
} from './constants';
import { findConflicts, isPast } from './rules';
import type { Booking } from './types';

export type SlotState = 'free' | 'busy' | 'past';

export type DaySlot = {
  start: ClockTime;
  end: ClockTime;
  state: SlotState;
};

export type TimeOption = {
  value: ClockTime;
  /** Why the option cannot be picked; absent when it can. */
  disabledReason?: 'past' | 'busy';
};

const DEFAULT_DURATION_MINUTES = 60;

function range(from: number, to: number, step: number): number[] {
  const values: number[] = [];
  for (let value = from; value <= to; value += step) values.push(value);
  return values;
}

/** The working day cut into timeline cells, each marked free, busy or past. */
export function buildDaySlots(
  date: string,
  bookings: readonly Booking[],
  now: ZonedNow,
): DaySlot[] {
  return range(
    WORKDAY_START_MINUTES,
    WORKDAY_END_MINUTES - GRID_SLOT_MINUTES,
    GRID_SLOT_MINUTES,
  ).map((minutes) => {
    const slot = {
      date,
      start: fromMinutes(minutes),
      end: fromMinutes(minutes + GRID_SLOT_MINUTES),
    };
    let state: SlotState = 'free';
    if (isPast(date, minutes, now)) state = 'past';
    else if (findConflicts(slot, bookings).length > 0) state = 'busy';
    return { start: slot.start, end: slot.end, state };
  });
}

/**
 * Every time a booking could start at. Options that would break a rule stay in the list
 * but disabled, so the picker explains itself instead of silently hiding time.
 */
export function getStartOptions(
  date: string,
  bookings: readonly Booking[],
  now: ZonedNow,
  ignoreId?: string,
): TimeOption[] {
  const others = bookings.filter((booking) => booking.id !== ignoreId && booking.date === date);
  return range(
    WORKDAY_START_MINUTES,
    WORKDAY_END_MINUTES - MIN_DURATION_MINUTES,
    TIME_STEP_MINUTES,
  ).map((minutes) => {
    if (isPast(date, minutes, now)) return { value: fromMinutes(minutes), disabledReason: 'past' };
    const insideBooking = others.some(
      (booking) => toMinutes(booking.start) <= minutes && minutes < toMinutes(booking.end),
    );
    return insideBooking
      ? { value: fromMinutes(minutes), disabledReason: 'busy' }
      : { value: fromMinutes(minutes) };
  });
}

/** Every end allowed for `start` by duration and the working day; overlaps disabled. */
export function getEndOptions(
  date: string,
  start: string,
  bookings: readonly Booking[],
  ignoreId?: string,
): TimeOption[] {
  if (!isClockTime(start)) return [];
  const from = toMinutes(start) + MIN_DURATION_MINUTES;
  const to = Math.min(toMinutes(start) + MAX_DURATION_MINUTES, WORKDAY_END_MINUTES);
  return range(from, to, TIME_STEP_MINUTES).map((minutes) => {
    const end = fromMinutes(minutes);
    return findConflicts({ date, start, end }, bookings, ignoreId).length > 0
      ? { value: end, disabledReason: 'busy' }
      : { value: end };
  });
}

/** A sensible end for `start`: an hour if it fits, otherwise as long as the room is free. */
export function suggestEnd(
  date: string,
  start: string,
  bookings: readonly Booking[],
  ignoreId?: string,
): ClockTime | null {
  const enabled = getEndOptions(date, start, bookings, ignoreId).filter(
    (option) => !option.disabledReason,
  );
  if (enabled.length === 0) return null;
  const preferred = toMinutes(start) + DEFAULT_DURATION_MINUTES;
  const notLonger = enabled.filter((option) => toMinutes(option.value) <= preferred);
  return (notLonger.at(-1) ?? enabled[0])?.value ?? null;
}

/** The earliest bookable range of the day, or `null` when the day is full or over. */
export function findFirstAvailableRange(
  date: string,
  bookings: readonly Booking[],
  now: ZonedNow,
): { start: ClockTime; end: ClockTime } | null {
  for (const option of getStartOptions(date, bookings, now)) {
    if (option.disabledReason) continue;
    const end = suggestEnd(date, option.value, bookings);
    if (end) return { start: option.value, end };
  }
  return null;
}
