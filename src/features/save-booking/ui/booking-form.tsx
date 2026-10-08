'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  type Booking,
  formatBookingLabel,
  getEndOptions,
  getStartOptions,
  suggestEnd,
  TITLE_MAX_LENGTH,
  type TimeRange,
} from '@/entities/booking';
import {
  formatDuration,
  formatLongDate,
  type IsoDate,
  isClockTime,
  toMinutes,
  type ZonedNow,
} from '@/shared/lib';
import { Alert, Button, Field, fieldDescribedBy, Input, Select, Spinner } from '@/shared/ui';
import { type BookingFormValues, createBookingFormSchema } from '../model/form-schema';
import { optionLabel, withCurrentValue } from '../model/time-options';
import { type SubmitProblem, useBookingSubmit } from '../model/use-booking-submit';

type BookingFormProps = {
  date: IsoDate;
  now: ZonedNow;
  /** The day's bookings as currently known — used for instant client-side checks. */
  bookings: readonly Booking[];
  /** Present → edit mode. */
  booking?: Booking;
  initialValues?: Partial<BookingFormValues>;
  onSaved: (booking: Booking) => void;
  onCancel: () => void;
  /** Edit mode, booking deleted elsewhere: start a new one from what the user typed. */
  onRecreate?: (values: BookingFormValues) => void;
  /** Reports the range being edited so the timeline can preview it. */
  onDraftChange?: (range: TimeRange | null) => void;
};

function ProblemAlert({
  problem,
  onRecreate,
}: {
  problem: SubmitProblem;
  onRecreate?: () => void;
}) {
  switch (problem.kind) {
    case 'conflict':
      return (
        <Alert tone="warning" title="Это время только что заняли">
          {problem.conflicts.length > 0 ? (
            <p>
              Пока вы заполняли форму, появилась бронь{' '}
              {problem.conflicts.map((booking) => formatBookingLabel(booking)).join(', ')}.
            </p>
          ) : null}
          <p>Расписание обновлено, введённые данные сохранены — выберите другое время.</p>
        </Alert>
      );
    case 'not-found':
      return (
        <Alert
          tone="warning"
          title="Эту бронь уже удалили"
          action={
            onRecreate ? (
              <Button variant="outline-ink" size="sm" onClick={onRecreate}>
                Создать новую с этими данными
              </Button>
            ) : null
          }
        >
          Расписание обновлено. Ваши изменения не потеряны.
        </Alert>
      );
    case 'locked':
      return (
        <Alert tone="error" title="Бронь уже началась">
          Начавшуюся бронь нельзя изменить.
        </Alert>
      );
    case 'network':
      return (
        <Alert tone="error" title="Нет связи с сервером">
          Данные формы на месте — попробуйте отправить ещё раз.
        </Alert>
      );
    case 'unknown':
      return (
        <Alert tone="error" title="Не удалось сохранить бронь">
          {problem.message}
        </Alert>
      );
  }
}

/** Create or edit a booking. Mode is decided by the presence of `booking`. */
export function BookingForm({
  date,
  now,
  bookings,
  booking,
  initialValues,
  onSaved,
  onCancel,
  onRecreate,
  onDraftChange,
}: BookingFormProps) {
  const id = useId();
  const isEdit = Boolean(booking);
  const ignoreId = booking?.id;

  // Rebuilt whenever the day or the clock changes; RHF always validates with the latest one.
  const schema = useMemo(
    () => createBookingFormSchema({ date, now, bookings, ignoreId }),
    [date, now, bookings, ignoreId],
  );

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      start: booking?.start ?? initialValues?.start ?? '',
      end: booking?.end ?? initialValues?.end ?? '',
      title: booking?.title ?? initialValues?.title ?? '',
    },
  });
  const { errors } = form.formState;

  const { submit, isSubmitting, problem } = useBookingSubmit({
    date,
    bookingId: booking?.id,
    form,
    onSaved,
  });

  // After a 409 the refreshed schedule arrives as new `bookings`: re-check the fields so
  // the conflict is also pointed at where it is, not only described in the banner.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `bookings` is the trigger, not an input — the resolver reads it.
  useEffect(() => {
    if (problem?.kind === 'conflict') void form.trigger();
  }, [problem, bookings, form]);

  const start = form.watch('start');
  const end = form.watch('end');

  useEffect(() => {
    onDraftChange?.(isClockTime(start) && isClockTime(end) ? { start, end } : null);
  }, [start, end, onDraftChange]);
  useEffect(() => () => onDraftChange?.(null), [onDraftChange]);

  const startOptions = withCurrentValue(getStartOptions(date, bookings, now, ignoreId), start);
  const endOptions = withCurrentValue(getEndOptions(date, start, bookings, ignoreId), end);
  const duration =
    isClockTime(start) && isClockTime(end) && toMinutes(end) > toMinutes(start)
      ? formatDuration(toMinutes(end) - toMinutes(start))
      : null;

  const startId = `${id}-start`;
  const endId = `${id}-end`;
  const titleId = `${id}-title`;
  const titleLength = form.watch('title').length;

  return (
    <form onSubmit={submit} noValidate aria-busy={isSubmitting} className="flex flex-col gap-5">
      <p className="font-mono text-bone text-sm">{formatLongDate(date)}</p>

      {/* A disabled fieldset freezes input during the request without discarding it. */}
      <fieldset disabled={isSubmitting} className="flex flex-col gap-5">
        <legend className="sr-only">Время и название брони</legend>
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="start"
            render={({ field }) => (
              <Field id={startId} label="Начало" error={errors.start?.message}>
                <Select
                  id={startId}
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(errors.start)}
                  aria-describedby={fieldDescribedBy(startId, { error: errors.start?.message })}
                  onChange={(event) => {
                    const nextStart = event.target.value;
                    field.onChange(nextStart);
                    // Keep the end valid for the new start instead of making the user fix it.
                    const stillValid = getEndOptions(date, nextStart, bookings, ignoreId).some(
                      (option) => option.value === form.getValues('end') && !option.disabledReason,
                    );
                    if (!stillValid) {
                      form.setValue('end', suggestEnd(date, nextStart, bookings, ignoreId) ?? '', {
                        shouldValidate: form.formState.isSubmitted,
                      });
                    }
                  }}
                >
                  <option value="" disabled>
                    —
                  </option>
                  {startOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={Boolean(option.disabledReason)}
                    >
                      {optionLabel(option)}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="end"
            render={({ field }) => (
              <Field
                id={endId}
                label="Окончание"
                error={errors.end?.message}
                hint={duration ? `Длительность: ${duration}` : undefined}
              >
                <Select
                  id={endId}
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  disabled={!isClockTime(start)}
                  aria-invalid={Boolean(errors.end)}
                  aria-describedby={fieldDescribedBy(endId, {
                    error: errors.end?.message,
                    hint: duration ?? undefined,
                  })}
                >
                  <option value="" disabled>
                    —
                  </option>
                  {endOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={Boolean(option.disabledReason)}
                    >
                      {optionLabel(option)}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          />
        </div>

        <Field
          id={titleId}
          label="Название (необязательно)"
          error={errors.title?.message}
          hint={`${titleLength}/${TITLE_MAX_LENGTH}`}
        >
          <Input
            id={titleId}
            placeholder="Например, планёрка"
            autoComplete="off"
            maxLength={TITLE_MAX_LENGTH + 20}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={fieldDescribedBy(titleId, {
              error: errors.title?.message,
              hint: 'counter',
            })}
            {...form.register('title')}
          />
        </Field>
      </fieldset>

      {problem ? (
        <ProblemAlert
          problem={problem}
          onRecreate={onRecreate ? () => onRecreate(form.getValues()) : undefined}
        />
      ) : null}

      <div className="on-dark flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          {isSubmitting ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Забронировать'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
