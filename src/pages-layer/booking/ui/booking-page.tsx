'use client';

import { useState } from 'react';
import type { Booking, TimeRange } from '@/entities/booking';
import { DateNavigator, useSelectedDate } from '@/features/select-date';
import { RaceSimulationToggle } from '@/features/simulate-race';
import { useOfficeNow } from '@/shared/hooks';
import { formatLongDate } from '@/shared/lib';
import { MonoTag } from '@/shared/ui';
import { type BookingEditor, BookingPanel, startCreating } from '@/widgets/booking-panel';
import { DaySchedule } from '@/widgets/day-schedule';

type BookingPageProps = {
  /** Server render time — the client starts from the same instant (no hydration mismatch). */
  initialNow: number;
};

/**
 * Composition only: the selected day, what the panel is editing and the draft preview
 * are the page's state; everything else belongs to the widgets.
 */
export function BookingPage({ initialNow }: BookingPageProps) {
  const now = useOfficeNow(initialNow);
  const [date, setDate] = useSelectedDate(now.date);
  const [editor, setEditor] = useState<BookingEditor>({ kind: 'idle' });
  const [draft, setDraft] = useState<TimeRange | null>(null);

  // A form for one day must not survive into another — its checks were for that day.
  // Adjusting state during render (not in an effect) avoids a frame with a stale form.
  const [editorDate, setEditorDate] = useState(date);
  if (editorDate !== date) {
    setEditorDate(date);
    setEditor({ kind: 'idle' });
    setDraft(null);
  }

  const dayStatus = date === now.date ? 'Сегодня' : date < now.date ? 'Прошедшая дата' : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <header className="on-dark flex flex-col gap-6 rounded-card bg-lilac p-card sm:p-6">
        <p className="font-display font-extrabold text-hi-vis text-xl tracking-[0.02em]">
          Переговорка
        </p>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            {dayStatus ? <MonoTag className="w-fit text-bone">{dayStatus}</MonoTag> : null}
            <h1 className="font-display font-black text-[clamp(2.5rem,7vw,5.5rem)] text-hi-vis leading-[0.85] tracking-[0.02em] first-letter:uppercase">
              {formatLongDate(date)}
            </h1>
          </div>
          <DateNavigator date={date} today={now.date} onChange={setDate} />
        </div>
      </header>

      <main className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <DaySchedule
          date={date}
          now={now}
          selectedBookingId={editor.kind === 'edit' ? editor.bookingId : undefined}
          draft={draft}
          onSelectSlot={(range) => setEditor(startCreating(range))}
          onSelectBooking={(booking: Booking) => setEditor({ kind: 'edit', bookingId: booking.id })}
        />
        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          <BookingPanel
            date={date}
            now={now}
            editor={editor}
            onEditorChange={setEditor}
            onDraftChange={setDraft}
          />
          <aside
            aria-label="Демо-настройки"
            className="rounded-card border-2 border-ink border-dashed p-card"
          >
            <RaceSimulationToggle />
          </aside>
        </div>
      </main>

      <footer className="font-mono text-ink text-xs">
        Время указано по часовому поясу офиса. Расписание обновляется автоматически.
      </footer>
    </div>
  );
}
