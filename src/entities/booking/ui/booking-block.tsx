import { cn, toMinutes } from '@/shared/lib';
import { formatRangeDuration, formatTimeRange, UNTITLED_BOOKING } from '../lib/format';
import type { Booking } from '../model';
import { WORKDAY_END_MINUTES, WORKDAY_START_MINUTES } from '../model';

type BookingBlockProps = {
  booking: Booking;
  selected?: boolean;
  /** Started bookings are history — shown, but drawn as such. */
  past?: boolean;
  onSelect?: (booking: Booking) => void;
};

const DAY_LENGTH = WORKDAY_END_MINUTES - WORKDAY_START_MINUTES;

/**
 * How many title lines the block has room for. A 30-minute block fits the time row and one
 * title line; every further half hour adds about two lines. What still does not fit ends
 * in an ellipsis (never a half-cut glyph) and is available in full via the tooltip.
 */
function titleLines(durationMinutes: number): number {
  return Math.max(1, Math.floor(durationMinutes / 30) * 2 - 1);
}

/**
 * One booking, absolutely positioned on a day timeline by its own times. The parent only
 * has to be `relative`; the block knows where it belongs.
 */
export function BookingBlock({
  booking,
  selected = false,
  past = false,
  onSelect,
}: BookingBlockProps) {
  const top = ((toMinutes(booking.start) - WORKDAY_START_MINUTES) / DAY_LENGTH) * 100;
  const height = ((toMinutes(booking.end) - toMinutes(booking.start)) / DAY_LENGTH) * 100;
  const title = booking.title ?? UNTITLED_BOOKING;
  const range = formatTimeRange(booking);
  const lines = titleLines(toMinutes(booking.end) - toMinutes(booking.start));

  return (
    <button
      type="button"
      onClick={() => onSelect?.(booking)}
      aria-pressed={selected}
      aria-label={`${range}, ${title}${past ? ', уже началась' : ''}. Открыть бронь`}
      title={`${range} · ${title}`}
      style={{ top: `${top}%`, height: `${height}%` }}
      className={cn(
        'focus-ring absolute inset-x-1 z-10 flex min-h-0 flex-col items-start justify-start gap-0.5 overflow-hidden rounded-card border-2 border-ink px-3 py-1 text-left text-ink transition-colors',
        selected ? 'bg-hi-vis' : 'bg-bubblegum hover:bg-buttery',
        past && !selected && 'bg-bone/80 text-ink/70 hover:bg-bone',
      )}
    >
      <span className="font-mono text-xs leading-none tracking-wide">
        {range} · {formatRangeDuration(booking)}
      </span>
      <span
        className="w-full overflow-hidden font-bold text-sm leading-[1.25] [display:-webkit-box] [-webkit-box-orient:vertical]"
        style={{ WebkitLineClamp: lines }}
      >
        {title}
      </span>
    </button>
  );
}
