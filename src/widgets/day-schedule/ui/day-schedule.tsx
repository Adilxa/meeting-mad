'use client';

import { RefreshCw } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  type Booking,
  GRID_SLOT_MINUTES,
  type TimeRange,
  useBookings,
  WORKDAY_END_MINUTES,
  WORKDAY_START_MINUTES,
} from '@/entities/booking';
import type { IsoDate, ZonedNow } from '@/shared/lib';
import { Alert, Button, MonoTag, Skeleton, Spinner } from '@/shared/ui';
import { Timeline } from './timeline';

type DayScheduleProps = {
  date: IsoDate;
  now: ZonedNow;
  selectedBookingId?: string;
  draft?: TimeRange | null;
  onSelectSlot: (range: TimeRange) => void;
  onSelectBooking: (booking: Booking) => void;
};

/** One half-hour cell: tall enough for a 30-minute booking's time row and a title line. */
const SLOT_HEIGHT_REM = 3.5;
const SLOT_COUNT = (WORKDAY_END_MINUTES - WORKDAY_START_MINUTES) / GRID_SLOT_MINUTES;
const timelineStyle = {
  '--timeline-height': `${SLOT_COUNT * SLOT_HEIGHT_REM}rem`,
} as CSSProperties;

function ScheduleSkeleton() {
  return (
    <div className="grid grid-cols-[3.5rem_1fr] gap-x-2">
      <div />
      <div className="flex h-(--timeline-height) flex-col gap-2 rounded-card border-2 border-ink bg-bone p-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="mt-16 h-28 w-full" />
        <Skeleton className="mt-24 h-14 w-full" />
      </div>
    </div>
  );
}

/**
 * The day's schedule with all its states: loading, error, empty, refreshing. Owns the
 * query — whoever renders the widget gets the states for free.
 */
export function DaySchedule({
  date,
  now,
  selectedBookingId,
  draft,
  onSelectSlot,
  onSelectBooking,
}: DayScheduleProps) {
  const query = useBookings(date);
  const bookings = query.data ?? [];

  return (
    <section
      aria-labelledby="schedule-heading"
      aria-busy={query.isFetching}
      style={timelineStyle}
      className="flex flex-col gap-4"
    >
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
        <h2
          id="schedule-heading"
          className="font-display font-black text-3xl text-ink leading-none"
        >
          Расписание
        </h2>
        {query.isFetching && !query.isPending ? (
          <span role="status" className="inline-flex items-center gap-2 font-mono text-ink text-xs">
            <Spinner className="size-3.5" />
            Обновляем…
          </span>
        ) : query.data ? (
          <MonoTag className="text-ink">
            {query.data.length === 0 ? 'Броней нет' : `Броней: ${query.data.length}`}
          </MonoTag>
        ) : null}
      </div>

      {query.isPending ? (
        <div role="status" aria-label="Загружаем расписание">
          <ScheduleSkeleton />
        </div>
      ) : query.isError && !query.data ? (
        <Alert
          tone="error"
          title="Не удалось загрузить расписание"
          action={
            <Button variant="outline-ink" size="sm" onClick={() => void query.refetch()}>
              <RefreshCw />
              Повторить
            </Button>
          }
        >
          Проверьте подключение и попробуйте ещё раз.
        </Alert>
      ) : (
        <>
          {query.isError ? (
            <Alert tone="error" title="Не удалось обновить расписание">
              Показаны последние загруженные данные.
            </Alert>
          ) : null}
          {bookings.length === 0 ? (
            <Alert tone="info" title="На этот день броней пока нет">
              Комната свободна весь день — выберите время на шкале или в форме.
            </Alert>
          ) : null}
          <Timeline
            date={date}
            now={now}
            bookings={bookings}
            selectedBookingId={selectedBookingId}
            draft={draft}
            onSelectSlot={onSelectSlot}
            onSelectBooking={onSelectBooking}
          />
        </>
      )}
    </section>
  );
}
