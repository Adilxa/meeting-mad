import type { Booking, BookingDraft } from '../model';

/**
 * Wire format of the bookings API — mirrors the contract from the brief. Kept apart from
 * the domain `Booking` so a backend that names things differently changes only this file.
 */
export type BookingDto = {
  id: string;
  date: string;
  start: string;
  end: string;
  title?: string | null;
};

export type CreateBookingRequest = {
  date: string;
  start: string;
  end: string;
  title?: string;
};

export type UpdateBookingRequest = Partial<CreateBookingRequest>;

export function toBooking(dto: BookingDto): Booking {
  const title = dto.title?.trim();
  return {
    id: dto.id,
    date: dto.date,
    start: dto.start,
    end: dto.end,
    ...(title ? { title } : {}),
  };
}

export function toCreateRequest(draft: BookingDraft): CreateBookingRequest {
  const title = draft.title?.trim();
  return { date: draft.date, start: draft.start, end: draft.end, ...(title ? { title } : {}) };
}

/** PATCH sends the whole editable shape; an emptied title is sent as `""` to clear it. */
export function toUpdateRequest(draft: BookingDraft): UpdateBookingRequest {
  return { date: draft.date, start: draft.start, end: draft.end, title: draft.title?.trim() ?? '' };
}
