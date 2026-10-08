import type { ZonedNow } from '@/shared/lib';
import {
  buildDaySlots,
  findFirstAvailableRange,
  getEndOptions,
  getStartOptions,
  suggestEnd,
} from './schedule';
import type { Booking } from './types';

const DAY = '2026-10-08';
const morning: ZonedNow = { date: DAY, minutes: 10 * 60 + 5 };
const bookings: Booking[] = [{ id: 'a', date: DAY, start: '11:00', end: '12:00' }];

describe('schedule', () => {
  it('cuts the day into 18 half-hour cells marked past / busy / free', () => {
    const slots = buildDaySlots(DAY, bookings, morning);
    expect(slots).toHaveLength(18);
    expect(slots[0]).toEqual({ start: '09:00', end: '09:30', state: 'past' });
    expect(slots.find((slot) => slot.start === '10:00')?.state).toBe('past');
    expect(slots.find((slot) => slot.start === '10:30')?.state).toBe('free');
    expect(slots.find((slot) => slot.start === '11:30')?.state).toBe('busy');
    expect(slots.at(-1)).toEqual({ start: '17:30', end: '18:00', state: 'free' });
  });

  it('start options run 09:00…17:30 with past and busy disabled', () => {
    const options = getStartOptions(DAY, bookings, morning);
    expect(options[0]).toEqual({ value: '09:00', disabledReason: 'past' });
    expect(options.at(-1)).toEqual({ value: '17:30' });
    expect(options.find((option) => option.value === '11:00')?.disabledReason).toBe('busy');
    // 12:00 is when the booking ends — free again.
    expect(options.find((option) => option.value === '12:00')?.disabledReason).toBeUndefined();
  });

  it('end options respect 30 min…2 h, the end of day, and overlaps', () => {
    const values = getEndOptions(DAY, '10:00', bookings).map((option) => [
      option.value,
      option.disabledReason,
    ]);
    expect(values[0]).toEqual(['10:30', undefined]);
    expect(values).toContainEqual(['11:00', undefined]);
    expect(values).toContainEqual(['11:15', 'busy']);
    expect(values.at(-1)?.[0]).toBe('12:00');
    expect(getEndOptions(DAY, '17:00', []).map((option) => option.value)).toEqual([
      '17:30',
      '17:45',
      '18:00',
    ]);
  });

  it('suggests an hour, or as much as fits before the next booking', () => {
    expect(suggestEnd(DAY, '13:00', bookings)).toBe('14:00');
    expect(suggestEnd(DAY, '10:15', bookings)).toBe('11:00');
    expect(suggestEnd(DAY, '10:45', bookings)).toBeNull();
  });

  it('finds the first bookable range of the day', () => {
    expect(findFirstAvailableRange(DAY, bookings, morning)).toEqual({
      start: '10:15',
      end: '11:00',
    });
    expect(findFirstAvailableRange(DAY, [], { date: DAY, minutes: 17 * 60 + 45 })).toBeNull();
  });
});
