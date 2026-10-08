import { formatDuration, toMinutes } from '@/shared/lib';
import type { Booking, TimeRange } from '../model';

/** `10:00–11:30` — en dash, as typography wants it. */
export function formatTimeRange(range: TimeRange): string {
  return `${range.start}–${range.end}`;
}

export function formatRangeDuration(range: TimeRange): string {
  return formatDuration(toMinutes(range.end) - toMinutes(range.start));
}

/** `10:00–11:00 «Планёрка»`, or just the range for an untitled booking. */
export function formatBookingLabel(booking: Pick<Booking, 'start' | 'end' | 'title'>): string {
  return booking.title
    ? `${formatTimeRange(booking)} «${booking.title}»`
    : formatTimeRange(booking);
}

export const UNTITLED_BOOKING = 'Без названия';
