'use client';

import { Plus } from 'lucide-react';
import {
  type Booking,
  BookingBlock,
  buildDaySlots,
  formatTimeRange,
  hasStarted,
  type TimeRange,
  WORKDAY_END_MINUTES,
  WORKDAY_START_MINUTES,
} from '@/entities/booking';
import { cn, fromMinutes, type IsoDate, toMinutes, type ZonedNow } from '@/shared/lib';

type TimelineProps = {
  date: IsoDate;
  now: ZonedNow;
  bookings: readonly Booking[];
  selectedBookingId?: string;
  /** Range being drafted in the form — drawn as a dashed outline. */
  draft?: TimeRange | null;
  onSelectSlot: (range: TimeRange) => void;
  onSelectBooking: (booking: Booking) => void;
};

const DAY_LENGTH = WORKDAY_END_MINUTES - WORKDAY_START_MINUTES;
const HOURS = Array.from(
  { length: DAY_LENGTH / 60 + 1 },
  (_, index) => WORKDAY_START_MINUTES + index * 60,
);

const percent = (minutes: number) => `${((minutes - WORKDAY_START_MINUTES) / DAY_LENGTH) * 100}%`;

/**
 * Day calendar, 09:00 at the top, 18:00 at the bottom. Two stacked layers:
 * free half-hour cells (buttons → create) and bookings over them (buttons → open).
 * Every interactive thing is a real button with a spoken label, so the whole day is
 * reachable by keyboard and makes sense to a screen reader.
 */
export function Timeline({
  date,
  now,
  bookings,
  selectedBookingId,
  draft,
  onSelectSlot,
  onSelectBooking,
}: TimelineProps) {
  const slots = buildDaySlots(date, bookings, now);
  const showNowLine =
    date === now.date && now.minutes >= WORKDAY_START_MINUTES && now.minutes <= WORKDAY_END_MINUTES;

  return (
    <div className="grid grid-cols-[3.5rem_1fr] gap-x-2">
      {/* Hour labels */}
      <div aria-hidden className="relative h-(--timeline-height)">
        {HOURS.map((minutes) => (
          <span
            key={minutes}
            style={{ top: percent(minutes) }}
            className="absolute right-0 -translate-y-1/2 font-mono text-ink text-xs"
          >
            {fromMinutes(minutes)}
          </span>
        ))}
      </div>

      <div className="relative h-(--timeline-height) rounded-card border-2 border-ink bg-bone">
        {/* Hour lines */}
        {HOURS.slice(1, -1).map((minutes) => (
          <div
            key={minutes}
            aria-hidden
            style={{ top: percent(minutes) }}
            className="absolute inset-x-0 border-ink/15 border-t"
          />
        ))}

        {/* Free / past cells */}
        <ul aria-label="Свободное время" className="absolute inset-0 flex flex-col">
          {slots.map((slot) => (
            <li key={slot.start} className="relative flex-1">
              {slot.state === 'free' ? (
                <button
                  type="button"
                  onClick={() => onSelectSlot({ start: slot.start, end: slot.end })}
                  aria-label={`Забронировать с ${slot.start}`}
                  className="focus-ring group absolute inset-0.5 flex items-center gap-1 rounded-card px-3 font-mono text-ink/0 text-xs transition-colors hover:bg-hi-vis/40 hover:text-ink focus-visible:text-ink"
                >
                  <Plus aria-hidden className="size-3.5" />
                  {formatTimeRange(slot)}
                </button>
              ) : slot.state === 'past' ? (
                <div aria-hidden className="bg-past-stripes absolute inset-0" />
              ) : null}
            </li>
          ))}
        </ul>

        {/* Draft preview */}
        {draft && toMinutes(draft.end) > toMinutes(draft.start) ? (
          <div
            aria-hidden
            style={{
              top: percent(toMinutes(draft.start)),
              height: `${((toMinutes(draft.end) - toMinutes(draft.start)) / DAY_LENGTH) * 100}%`,
            }}
            className="pointer-events-none absolute inset-x-0.5 z-[5] rounded-card border-2 border-ink border-dashed bg-hi-vis/40"
          />
        ) : null}

        {/* Bookings */}
        <ul aria-label="Брони на этот день">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <BookingBlock
                booking={booking}
                selected={booking.id === selectedBookingId}
                past={hasStarted(booking, now)}
                onSelect={onSelectBooking}
              />
            </li>
          ))}
        </ul>

        {showNowLine ? (
          <div
            style={{ top: percent(now.minutes) }}
            className={cn(
              'pointer-events-none absolute inset-x-0 z-30 border-firecracker border-t-2',
            )}
          >
            <span className="absolute -top-2.5 right-1 rounded-pill bg-firecracker px-2 py-0.5 font-mono text-[10px] text-bone">
              сейчас {fromMinutes(now.minutes)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
