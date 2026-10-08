import type { Booking } from '@/entities/booking/model';
import { addDays, type ZonedNow } from '@/shared/lib';

/** A believable first screen: a couple of meetings today and tomorrow. */
export function createSeed(now: ZonedNow): Booking[] {
  const today = now.date;
  const tomorrow = addDays(today, 1);
  return [
    { id: 'seed-1', date: today, start: '09:30', end: '10:00', title: 'Стендап команды' },
    { id: 'seed-2', date: today, start: '13:00', end: '14:30', title: 'Созвон с клиентом' },
    { id: 'seed-3', date: today, start: '16:00', end: '17:00' },
    { id: 'seed-4', date: tomorrow, start: '11:00', end: '12:00', title: 'Ретро спринта' },
    { id: 'seed-5', date: tomorrow, start: '12:00', end: '13:30', title: 'Собеседование' },
  ];
}
