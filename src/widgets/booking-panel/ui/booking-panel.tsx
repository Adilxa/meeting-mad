'use client';

import { Plus } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  type Booking,
  findFirstAvailableRange,
  formatBookingLabel,
  formatRangeDuration,
  formatTimeRange,
  hasStarted,
  isDateBookable,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  type TimeRange,
  UNTITLED_BOOKING,
  useBookings,
  WORKDAY_END,
  WORKDAY_START,
} from '@/entities/booking';
import { DeleteBookingButton } from '@/features/delete-booking';
import { BookingForm } from '@/features/save-booking';
import { formatDuration, type IsoDate, type ZonedNow } from '@/shared/lib';
import { Alert, Button, MonoTag } from '@/shared/ui';
import { type BookingEditor, startCreating } from '../model/editor';

type BookingPanelProps = {
  date: IsoDate;
  now: ZonedNow;
  editor: BookingEditor;
  onEditorChange: (editor: BookingEditor) => void;
  onDraftChange: (range: TimeRange | null) => void;
};

function Rules() {
  return (
    <ul className="flex flex-wrap gap-2 text-bone">
      <li>
        <MonoTag>
          {WORKDAY_START}–{WORKDAY_END}
        </MonoTag>
      </li>
      <li>
        <MonoTag>
          от {formatDuration(MIN_DURATION_MINUTES)} до {formatDuration(MAX_DURATION_MINUTES)}
        </MonoTag>
      </li>
    </ul>
  );
}

/**
 * The right-hand panel: an invitation to book, the create/edit form, or a read-only card
 * for a booking that has started. Composes the save and delete features.
 */
export function BookingPanel({
  date,
  now,
  editor,
  onEditorChange,
  onDraftChange,
}: BookingPanelProps) {
  const { data: bookings = [], isPending } = useBookings(date);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);
  const bookable = isDateBookable(date, now);

  const editing =
    editor.kind === 'edit'
      ? bookings.find((booking) => booking.id === editor.bookingId)
      : undefined;

  // Moving focus to the panel heading tells keyboard and screen-reader users that the
  // panel changed — and scrolls it into view on a phone, where it sits below the timeline.
  const editorKey =
    editor.kind === 'create'
      ? `create-${editor.key}`
      : editor.kind === 'edit'
        ? editor.bookingId
        : 'idle';
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (editorKey !== 'idle') headingRef.current?.focus();
  }, [editorKey]);

  const close = () => onEditorChange({ kind: 'idle' });
  const onSaved = (booking: Booking) => {
    toast.success(`Бронь ${formatBookingLabel(booking)} сохранена`);
    close();
  };

  const startNew = () => {
    const range = findFirstAvailableRange(date, bookings, now);
    if (range) onEditorChange(startCreating(range));
    else toast.info('На этот день свободного времени не осталось');
  };

  let heading = 'Новая бронь';
  let body: ReactNode;

  if (editor.kind === 'create') {
    body = bookable ? (
      <BookingForm
        key={editor.key}
        date={date}
        now={now}
        bookings={bookings}
        initialValues={editor.initial}
        onSaved={onSaved}
        onCancel={close}
        onDraftChange={onDraftChange}
      />
    ) : (
      <Alert tone="info" title="На эту дату бронировать уже нельзя" />
    );
  } else if (editor.kind === 'edit') {
    if (!editing) {
      heading = 'Бронь';
      body = isPending ? null : (
        <Alert
          tone="warning"
          title="Этой брони больше нет"
          action={
            <Button variant="outline-ink" size="sm" onClick={close}>
              Понятно
            </Button>
          }
        >
          Похоже, её удалили. Расписание обновлено.
        </Alert>
      );
    } else if (hasStarted(editing, now)) {
      heading = editing.title ?? UNTITLED_BOOKING;
      body = (
        <div className="flex flex-col gap-4 text-bone">
          <p className="font-mono text-sm">
            {formatTimeRange(editing)} · {formatRangeDuration(editing)}
          </p>
          <Alert tone="info" title="Бронь уже началась">
            Начавшиеся и прошедшие брони доступны только для просмотра.
          </Alert>
          <div className="on-dark">
            <Button variant="outline" onClick={close}>
              Закрыть
            </Button>
          </div>
        </div>
      );
    } else {
      heading = 'Изменить бронь';
      body = (
        <div className="flex flex-col gap-4">
          <BookingForm
            key={editing.id}
            date={date}
            now={now}
            bookings={bookings}
            booking={editing}
            onSaved={onSaved}
            onCancel={close}
            onRecreate={(values) => onEditorChange(startCreating(values))}
            onDraftChange={onDraftChange}
          />
          <div className="on-dark border-bone/30 border-t pt-4">
            <DeleteBookingButton booking={editing} onDeleted={close} />
          </div>
        </div>
      );
    }
  } else {
    body = bookable ? (
      <div className="on-dark flex flex-col gap-4">
        <p className="text-base text-bone leading-snug">
          Нажмите на свободное время в расписании или создайте бронь на ближайший свободный слот.
        </p>
        <Button variant="pill" className="self-start" onClick={startNew} disabled={isPending}>
          <Plus />
          Новая бронь
        </Button>
      </div>
    ) : (
      <Alert tone="info" title={date < now.date ? 'Прошедшая дата' : 'Рабочий день закончился'}>
        Можно посмотреть расписание, но новые брони на эту дату создать нельзя.
      </Alert>
    );
  }

  return (
    <section
      aria-labelledby="panel-heading"
      className="on-dark flex flex-col gap-5 rounded-card bg-lilac p-card sm:p-6"
    >
      <h2
        id="panel-heading"
        ref={headingRef}
        tabIndex={-1}
        className="focus-ring font-display font-black text-3xl text-hi-vis leading-none"
      >
        {heading}
      </h2>
      <Rules />
      {body}
    </section>
  );
}
