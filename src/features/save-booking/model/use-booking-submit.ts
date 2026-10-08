'use client';

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  type Booking,
  type BookingRequestError,
  toBookingRequestError,
  useCreateBooking,
  useUpdateBooking,
  violationMessage,
} from '@/entities/booking';
import type { IsoDate } from '@/shared/lib';
import { type BookingFormValues, FIELD_OF, toDraft } from './form-schema';

/** A failure that is about the request as a whole, not about one field. */
export type SubmitProblem = Exclude<BookingRequestError, { kind: 'validation' }>;

type Options = {
  date: IsoDate;
  /** Present when editing. */
  bookingId?: string;
  form: UseFormReturn<BookingFormValues>;
  onSaved: (booking: Booking) => void;
};

/**
 * Create-or-update with every server answer turned into form state.
 *
 * The form is never reset on failure — whatever the user typed stays put (rule 8). Field
 * problems (422) land on their fields; everything else becomes one `problem` the form
 * shows above its buttons. By the time we get here the schedule has already been
 * refetched (see `use-booking-mutations.ts`).
 */
export function useBookingSubmit({ date, bookingId, form, onSaved }: Options) {
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const [problem, setProblem] = useState<SubmitProblem | null>(null);

  const submit = form.handleSubmit(async (values) => {
    setProblem(null);
    const draft = toDraft(values, date);
    try {
      const saved = bookingId
        ? await updateBooking.mutateAsync({ id: bookingId, draft })
        : await createBooking.mutateAsync(draft);
      onSaved(saved);
    } catch (error) {
      const failure = toBookingRequestError(error);
      if (failure.kind === 'validation') {
        for (const violation of failure.violations) {
          form.setError(FIELD_OF[violation.field], {
            type: 'server',
            message: violationMessage(violation),
          });
        }
        return;
      }
      setProblem(failure);
    }
  });

  return {
    submit,
    isSubmitting: createBooking.isPending || updateBooking.isPending,
    problem,
    dismissProblem: () => setProblem(null),
  };
}
