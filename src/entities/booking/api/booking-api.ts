import { httpClient } from '@/shared/api';
import type { Booking, BookingDraft } from '../model';
import { type BookingDto, toBooking, toCreateRequest, toUpdateRequest } from './booking-dto';

/**
 * The only module that knows the bookings endpoints. Hooks and UI talk to this object,
 * so swapping the mock for a real backend (or for a different transport) happens here.
 */
export const bookingApi = {
  /** `GET /bookings?date=YYYY-MM-DD` */
  list: async (date: string, signal?: AbortSignal): Promise<Booking[]> => {
    const dtos = await httpClient.get<BookingDto[]>('/bookings', { query: { date }, signal });
    return dtos.map(toBooking).sort((a, b) => a.start.localeCompare(b.start));
  },

  /** `POST /bookings` */
  create: async (draft: BookingDraft): Promise<Booking> =>
    toBooking(await httpClient.post<BookingDto>('/bookings', toCreateRequest(draft))),

  /** `PATCH /bookings/:id` */
  update: async (id: string, draft: BookingDraft): Promise<Booking> =>
    toBooking(
      await httpClient.patch<BookingDto>(
        `/bookings/${encodeURIComponent(id)}`,
        toUpdateRequest(draft),
      ),
    ),

  /** `DELETE /bookings/:id` */
  remove: (id: string): Promise<void> => httpClient.delete(`/bookings/${encodeURIComponent(id)}`),
};

export type BookingApi = typeof bookingApi;
