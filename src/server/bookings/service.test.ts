import type { Booking } from '@/entities/booking/model';
import type { ZonedNow } from '@/shared/lib';
import { InMemoryBookingRepository } from './repository';
import { createBookingService } from './service';

const DAY = '2026-10-09';
const now: ZonedNow = { date: '2026-10-08', minutes: 12 * 60 };

function setup(seed: Booking[] = []) {
  let counter = 0;
  const repository = new InMemoryBookingRepository(seed);
  const service = createBookingService({
    repository,
    clock: () => now,
    generateId: () => `id-${++counter}`,
  });
  return { service, repository };
}

const planning: Booking = { id: 'p', date: DAY, start: '10:00', end: '11:00', title: 'Планёрка' };

describe('booking service (mock API)', () => {
  it('creates a valid booking and trims the title', () => {
    const { service } = setup();
    const result = service.create({ date: DAY, start: '10:00', end: '11:00', title: '  Синк  ' });
    expect(result).toEqual({
      ok: true,
      value: { id: 'id-1', date: DAY, start: '10:00', end: '11:00', title: 'Синк' },
    });
    expect(service.list(DAY)).toHaveLength(1);
  });

  it('answers 409 with the conflicting booking on overlap', () => {
    const { service } = setup([planning]);
    const result = service.create({ date: DAY, start: '10:30', end: '11:30' });
    expect(result).toMatchObject({ ok: false, error: { status: 409, conflicts: [{ id: 'p' }] } });
  });

  it('answers 422 (not 409) when the draft breaks other rules too', () => {
    const { service } = setup([planning]);
    const result = service.create({ date: DAY, start: '10:30', end: '13:00' });
    expect(result).toMatchObject({
      ok: false,
      error: { status: 422, code: 'VALIDATION_FAILED', violations: [{ code: 'TOO_LONG' }] },
    });
  });

  it('lets an edited booking overlap its own old time (rule 7)', () => {
    const { service } = setup([planning]);
    expect(service.update('p', { end: '11:30' })).toMatchObject({
      ok: true,
      value: { end: '11:30' },
    });
  });

  it('clears the title with an empty string', () => {
    const { service } = setup([planning]);
    const result = service.update('p', { title: '' });
    expect(result.ok && result.value.title).toBeUndefined();
  });

  it('refuses to touch a booking that has started', () => {
    const { service } = setup([{ ...planning, date: now.date, start: '11:00', end: '12:30' }]);
    expect(service.update('p', { title: 'x' })).toMatchObject({
      error: { code: 'BOOKING_STARTED' },
    });
    expect(service.remove('p')).toMatchObject({ error: { code: 'BOOKING_STARTED' } });
  });

  it('answers 404 for an unknown id', () => {
    const { service } = setup();
    expect(service.update('nope', {})).toMatchObject({ error: { status: 404 } });
    expect(service.remove('nope')).toMatchObject({ error: { status: 404 } });
  });

  it('simulated race: a colleague takes the slot first and the request gets 409', () => {
    const { service } = setup();
    const result = service.create(
      { date: DAY, start: '15:00', end: '16:00' },
      { simulateRace: true },
    );
    expect(result).toMatchObject({ ok: false, error: { status: 409 } });
    expect(service.list(DAY)).toEqual([
      expect.objectContaining({ start: '15:00', end: '16:00', title: 'Забронировал коллега' }),
    ]);
  });
});
