import type { Booking } from '@/entities/booking/model';

/**
 * Storage port of the mock API. The service depends on this interface only, so moving
 * from memory to Redis/Postgres is a new implementation, not a rewrite.
 */
export interface BookingRepository {
  listByDate(date: string): Booking[];
  findById(id: string): Booking | undefined;
  save(booking: Booking): void;
  remove(id: string): boolean;
}

export class InMemoryBookingRepository implements BookingRepository {
  private readonly bookings = new Map<string, Booking>();

  constructor(seed: readonly Booking[] = []) {
    for (const booking of seed) this.bookings.set(booking.id, booking);
  }

  listByDate(date: string): Booking[] {
    return [...this.bookings.values()]
      .filter((booking) => booking.date === date)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  findById(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  save(booking: Booking): void {
    this.bookings.set(booking.id, booking);
  }

  remove(id: string): boolean {
    return this.bookings.delete(id);
  }
}
