import {
  type Booking,
  type BookingDraft,
  type BookingViolation,
  hasStarted,
  validateBookingDraft,
} from '@/entities/booking/model';
import type { ZonedNow } from '@/shared/lib';
import type { BookingRepository } from './repository';

export type ServiceError =
  | { status: 404; code: 'BOOKING_NOT_FOUND'; message: string }
  | { status: 409; code: 'BOOKING_CONFLICT'; message: string; conflicts: Booking[] }
  | { status: 422; code: 'VALIDATION_FAILED'; message: string; violations: BookingViolation[] }
  | { status: 422; code: 'BOOKING_STARTED'; message: string };

export type ServiceResult<T> = { ok: true; value: T } | { ok: false; error: ServiceError };

export type MutationOptions = {
  /** Demo: a colleague books the very same slot a moment before this request lands. */
  simulateRace?: boolean;
};

type Dependencies = {
  repository: BookingRepository;
  clock: () => ZonedNow;
  generateId: () => string;
};

const RACE_TITLE = 'Забронировал коллега';

const ok = <T>(value: T): ServiceResult<T> => ({ ok: true, value });
const fail = <T>(error: ServiceError): ServiceResult<T> => ({ ok: false, error });

const notFound = (): ServiceError => ({
  status: 404,
  code: 'BOOKING_NOT_FOUND',
  message: 'Бронь не найдена — возможно, её уже удалили',
});

const started = (): ServiceError => ({
  status: 422,
  code: 'BOOKING_STARTED',
  message: 'Бронь уже началась — изменить или удалить её нельзя',
});

/**
 * Rule violations other than an overlap are the client's mistake (422); an overlap with
 * an otherwise valid draft is the world having changed (409). Mixing them would make the
 * client's «someone was faster» message lie.
 */
function classify(violations: BookingViolation[]): ServiceError | null {
  const overlap = violations.find((violation) => violation.code === 'OVERLAP');
  const rest = violations.filter((violation) => violation.code !== 'OVERLAP');
  if (rest.length > 0) {
    return {
      status: 422,
      code: 'VALIDATION_FAILED',
      message: 'Бронь не соответствует правилам',
      violations: rest,
    };
  }
  if (overlap) {
    return {
      status: 409,
      code: 'BOOKING_CONFLICT',
      message: 'Это время уже занято',
      conflicts: overlap.conflicts,
    };
  }
  return null;
}

/**
 * Application service of the mock API: the same business rules as the UI (imported, not
 * copied), plus the things only a server can know — the authoritative list of bookings
 * and the moment the request actually arrives.
 */
export function createBookingService({ repository, clock, generateId }: Dependencies) {
  /** Books `draft` for a phantom colleague when the slot is free — see `simulateRace`. */
  function occupyAsColleague(draft: BookingDraft) {
    const bookings = repository.listByDate(draft.date);
    if (validateBookingDraft(draft, { now: clock(), bookings }).length > 0) return;
    repository.save({
      id: generateId(),
      date: draft.date,
      start: draft.start,
      end: draft.end,
      title: RACE_TITLE,
    });
  }

  function validate(draft: BookingDraft, ignoreId?: string): ServiceError | null {
    const violations = validateBookingDraft(draft, {
      now: clock(),
      bookings: repository.listByDate(draft.date),
      ignoreId,
    });
    return classify(violations);
  }

  return {
    list(date: string): Booking[] {
      return repository.listByDate(date);
    },

    create(draft: BookingDraft, options: MutationOptions = {}): ServiceResult<Booking> {
      if (options.simulateRace) occupyAsColleague(draft);
      const error = validate(draft);
      if (error) return fail(error);

      const title = draft.title?.trim();
      const booking: Booking = {
        id: generateId(),
        date: draft.date,
        start: draft.start,
        end: draft.end,
        ...(title ? { title } : {}),
      };
      repository.save(booking);
      return ok(booking);
    },

    update(
      id: string,
      patch: Partial<BookingDraft>,
      options: MutationOptions = {},
    ): ServiceResult<Booking> {
      const current = repository.findById(id);
      if (!current) return fail(notFound());
      if (hasStarted(current, clock())) return fail(started());

      const title = (patch.title ?? current.title)?.trim();
      const next: Booking = {
        id,
        date: patch.date ?? current.date,
        start: patch.start ?? current.start,
        end: patch.end ?? current.end,
        ...(title ? { title } : {}),
      };
      if (options.simulateRace) occupyAsColleague(next);
      // Rule 7: the booking is compared with everyone except itself.
      const error = validate(next, id);
      if (error) return fail(error);

      repository.save(next);
      return ok(next);
    },

    remove(id: string): ServiceResult<null> {
      const current = repository.findById(id);
      if (!current) return fail(notFound());
      if (hasStarted(current, clock())) return fail(started());
      repository.remove(id);
      return ok(null);
    },
  };
}

export type BookingService = ReturnType<typeof createBookingService>;
