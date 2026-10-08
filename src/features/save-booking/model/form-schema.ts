import { z } from 'zod';
import {
  type Booking,
  type BookingDraft,
  type BookingField,
  validateBookingDraft,
  violationMessage,
} from '@/entities/booking';
import type { IsoDate, ZonedNow } from '@/shared/lib';

export type BookingFormValues = {
  start: string;
  end: string;
  title: string;
};

export type BookingFormContext = {
  date: IsoDate;
  now: ZonedNow;
  bookings: readonly Booking[];
  /** Set when editing: the booking must not conflict with itself. */
  ignoreId?: string;
};

/** Where a domain violation is shown. The date is not editable here, so its problems sit on «start». */
export const FIELD_OF: Record<BookingField, keyof BookingFormValues> = {
  date: 'start',
  start: 'start',
  end: 'end',
  title: 'title',
};

export function toDraft(values: BookingFormValues, date: IsoDate): BookingDraft {
  const title = values.title.trim();
  return { date, start: values.start, end: values.end, ...(title ? { title } : {}) };
}

/**
 * The form's schema *is* the domain rules: zod checks that fields are filled, then hands
 * the draft to `validateBookingDraft` and maps each violation onto its field. No rule is
 * written twice, so the form can never drift from what the server enforces.
 */
export function createBookingFormSchema(context: BookingFormContext) {
  return z
    .object({
      start: z.string().min(1, 'Выберите время начала'),
      end: z.string().min(1, 'Выберите время окончания'),
      title: z.string(),
    })
    .superRefine((values, issues) => {
      const shown = new Set<keyof BookingFormValues>();
      for (const violation of validateBookingDraft(toDraft(values, context.date), context)) {
        const path = FIELD_OF[violation.field];
        // One message per field — the first is the most fundamental (format → hours → …).
        if (shown.has(path)) continue;
        shown.add(path);
        issues.addIssue({ code: 'custom', path: [path], message: violationMessage(violation) });
      }
    });
}
