import { OFFICE_TIME_ZONE } from '@/shared/config';
import { getZonedNow } from '@/shared/lib';
import { InMemoryBookingRepository } from './repository';
import { createSeed } from './seed';
import { type BookingService, createBookingService } from './service';

/*
 * One store per server process, kept on globalThis so Next's dev hot-reload does not wipe
 * it on every edit. On serverless hosting each instance has its own memory — fine for a
 * demo, and exactly why the repository sits behind an interface (see README).
 */
const globalStore = globalThis as typeof globalThis & { __bookingService?: BookingService };

export function getBookingService(): BookingService {
  globalStore.__bookingService ??= createBookingService({
    repository: new InMemoryBookingRepository(createSeed(getZonedNow(OFFICE_TIME_ZONE))),
    clock: () => getZonedNow(OFFICE_TIME_ZONE),
    generateId: () => crypto.randomUUID(),
  });
  return globalStore.__bookingService;
}
