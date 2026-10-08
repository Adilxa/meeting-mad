'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { addDays, type IsoDate, isIsoDate } from '@/shared/lib';
import { Button, Input } from '@/shared/ui';

type DateNavigatorProps = {
  date: IsoDate;
  today: IsoDate;
  onChange: (date: IsoDate) => void;
};

/** Previous / picker / next / today. Lives on a dark (lilac) block. */
export function DateNavigator({ date, today, onChange }: DateNavigatorProps) {
  const inputId = useId();

  return (
    <nav aria-label="Выбор даты" className="on-dark flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className="font-mono text-xs uppercase tracking-[0.05em] text-bone"
        >
          Дата
        </label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Предыдущий день"
            onClick={() => onChange(addDays(date, -1))}
          >
            <ChevronLeft />
          </Button>
          <Input
            id={inputId}
            type="date"
            value={date}
            // Clearing the native picker yields "" — ignore it rather than jump anywhere.
            onChange={(event) => {
              if (isIsoDate(event.target.value)) onChange(event.target.value);
            }}
            className="w-auto min-w-[10.5rem]"
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Следующий день"
            onClick={() => onChange(addDays(date, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <Button variant="outline" disabled={date === today} onClick={() => onChange(today)}>
        Сегодня
      </Button>
    </nav>
  );
}
